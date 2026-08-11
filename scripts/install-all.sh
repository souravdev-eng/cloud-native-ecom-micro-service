#!/usr/bin/env bash
#
# install-all.sh — install dependencies for every service in one run.
#
# This is a polyrepo-style monorepo: there is no root package manager, so a
# plain `npm install` at the root does nothing. This script walks each service
# and installs it with the same package manager its Dockerfile uses (pnpm),
# plus `go mod download` for the Go service.
#
# Usage:
#   ./scripts/install-all.sh                    # install everything, in parallel
#   ./scripts/install-all.sh --serial           # one service at a time (readable logs)
#   ./scripts/install-all.sh --only auth,cart   # just these
#   ./scripts/install-all.sh --skip mfe-client  # everything except these
#   ./scripts/install-all.sh --clean            # rm -rf node_modules first
#   ./scripts/install-all.sh --frozen           # fail if a lockfile is out of date (CI)
#   ./scripts/install-all.sh --pm npm           # override the package manager
#   ./scripts/install-all.sh --no-go            # skip the Go service
#
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ---- targets -------------------------------------------------------------
# Node targets. `common` is the shared library; `mfe-client` is a pnpm
# workspace whose single install covers host/user/dashboard/shared/admin.
NODE_TARGETS=(auth product cart order notification etl-service common mfe-client)
GO_TARGETS=(review)

# ---- defaults ------------------------------------------------------------
PM="pnpm"          # every service Dockerfile does `npm i -g pnpm && pnpm install`
PARALLEL=1
CLEAN=0
FROZEN=0
WITH_GO=1
ONLY=""
SKIP=""
JOBS="$( { command -v nproc >/dev/null && nproc; } || sysctl -n hw.ncpu 2>/dev/null || echo 4 )"
[ "$JOBS" -gt 6 ] && JOBS=6   # installs are I/O bound; more just thrashes the disk

# ---- colours (disabled when not a tty) -----------------------------------
if [ -t 1 ]; then
  R=$'\033[31m'; G=$'\033[32m'; Y=$'\033[33m'; B=$'\033[34m'; DIM=$'\033[2m'; N=$'\033[0m'
else
  R=""; G=""; Y=""; B=""; DIM=""; N=""
fi

die() { printf "%serror:%s %s\n" "$R" "$N" "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
install-all.sh — install dependencies for every service in one run.

This is a polyrepo-style monorepo: there is no root package manager, so a plain
`npm install` at the root does nothing. This script walks each service and
installs it with the same package manager its Dockerfile uses (pnpm), plus
`go mod download` for the Go service.

Targets: auth product cart order notification etl-service common mfe-client review

Usage:
  ./scripts/install-all.sh                    install everything, in parallel
  ./scripts/install-all.sh --serial           one service at a time (readable logs)
  ./scripts/install-all.sh --only auth,cart   just these
  ./scripts/install-all.sh --skip mfe-client  everything except these
  ./scripts/install-all.sh --clean            rm -rf node_modules first
  ./scripts/install-all.sh --frozen           fail if a lockfile is out of date (CI)
  ./scripts/install-all.sh --pm npm           override the package manager
  ./scripts/install-all.sh --jobs 4           cap concurrent installs
  ./scripts/install-all.sh --no-go            skip the Go service

Per-service output is captured to a temp log and only printed for failures.
Exits non-zero if any target fails.
EOF
  exit 0
}

# ---- args ----------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --serial)   PARALLEL=0 ;;
    --parallel) PARALLEL=1 ;;
    --clean)    CLEAN=1 ;;
    --frozen)   FROZEN=1 ;;
    --no-go)    WITH_GO=0 ;;
    --only)     ONLY="${2:-}"; shift ;;
    --skip)     SKIP="${2:-}"; shift ;;
    --pm)       PM="${2:-}"; shift ;;
    --jobs)     JOBS="${2:-}"; shift ;;
    -h|--help)  usage ;;
    *)          die "unknown flag: $1 (try --help)" ;;
  esac
  shift
done

case "$PM" in
  pnpm|npm|yarn) ;;
  *) die "--pm must be one of: pnpm, npm, yarn (got '$PM')" ;;
esac
command -v "$PM" >/dev/null || die "$PM is not installed. Install it first: npm i -g $PM"

# ---- target filtering ----------------------------------------------------
in_csv() { case ",$1," in *",$2,"*) return 0 ;; *) return 1 ;; esac; }

selected=()
for t in "${NODE_TARGETS[@]}"; do
  [ -n "$ONLY" ] && ! in_csv "$ONLY" "$t" && continue
  [ -n "$SKIP" ] && in_csv "$SKIP" "$t" && continue
  [ -f "$t/package.json" ] || { printf "%sskip%s %-14s no package.json\n" "$Y" "$N" "$t"; continue; }
  selected+=("$t")
done

go_selected=()
if [ "$WITH_GO" = 1 ]; then
  for t in "${GO_TARGETS[@]}"; do
    [ -n "$ONLY" ] && ! in_csv "$ONLY" "$t" && continue
    [ -n "$SKIP" ] && in_csv "$SKIP" "$t" && continue
    [ -f "$t/go.mod" ] || continue
    command -v go >/dev/null || { printf "%sskip%s %-14s go is not installed\n" "$Y" "$N" "$t"; continue; }
    go_selected+=("$t")
  done
fi

total=$(( ${#selected[@]} + ${#go_selected[@]} ))
[ "$total" -eq 0 ] && die "nothing to install (check --only/--skip)"

LOGDIR="$(mktemp -d "${TMPDIR:-/tmp}/install-all.XXXXXX")"
trap 'rm -rf "$LOGDIR"' EXIT

printf "%s==>%s installing %d target(s) with %s%s%s  %s(%s)%s\n" \
  "$B" "$N" "$total" "$B" "$PM" "$N" "$DIM" \
  "$([ "$PARALLEL" = 1 ] && echo "parallel, ${JOBS} jobs" || echo serial)" "$N"

# ---- the install itself --------------------------------------------------
# Returns 0/1 and writes all output to $LOGDIR/<target>.log
install_node() {
  # NOTE: bash 3.2 (macOS default) will not expand $dir inside the same
  # `local` statement that declares it — keep these on separate lines.
  local dir="$1"
  local log="$LOGDIR/$dir.log"
  {
    echo "### $dir ($PM) ###"
    [ "$CLEAN" = 1 ] && { echo "removing node_modules..."; rm -rf "$dir/node_modules"; }

    local args=(install)
    if [ "$FROZEN" = 1 ]; then
      case "$PM" in
        pnpm) args=(install --frozen-lockfile) ;;
        npm)  args=(ci) ;;
        yarn) args=(install --frozen-lockfile) ;;
      esac
    fi

    # --ignore-scripts mirrors the Dockerfiles: several packages ship
    # postinstall steps that fail or are unnecessary for local dev.
    [ "$PM" = "pnpm" ] && args+=(--ignore-scripts)

    ( cd "$dir" && "$PM" "${args[@]}" ) 2>&1
  } >"$log" 2>&1
}

install_go() {
  local dir="$1"
  local log="$LOGDIR/$dir.log"
  { echo "### $dir (go mod download) ###"; ( cd "$dir" && go mod download ) 2>&1; } >"$log" 2>&1
}

run_one() {
  local t="$1" start end rc
  start=$(date +%s)
  if [ -f "$t/go.mod" ] && [ ! -f "$t/package.json" ]; then install_go "$t"; else install_node "$t"; fi
  rc=$?
  end=$(date +%s)
  echo "$rc $((end - start))" >"$LOGDIR/$t.status"
  if [ "$rc" -eq 0 ]; then
    printf "  %s✓%s %-14s %s%ss%s\n" "$G" "$N" "$t" "$DIM" "$((end - start))" "$N"
  else
    printf "  %s✗%s %-14s %sfailed (see log below)%s\n" "$R" "$N" "$t" "$R" "$N"
  fi
  return $rc
}

all_targets=("${selected[@]}" ${go_selected[@]+"${go_selected[@]}"})

if [ "$PARALLEL" = 1 ]; then
  # `wait -n` needs bash 4+. macOS ships bash 3.2, where it fails and we fall
  # back to `wait`, which drains the whole batch before starting the next one.
  running=0
  for t in "${all_targets[@]}"; do
    run_one "$t" &
    running=$((running + 1))
    if [ "$running" -ge "$JOBS" ]; then
      if wait -n 2>/dev/null; then running=$((running - 1)); else wait; running=0; fi
    fi
  done
  wait
else
  for t in "${all_targets[@]}"; do run_one "$t"; done
fi

# ---- summary -------------------------------------------------------------
failed=()
for t in "${all_targets[@]}"; do
  rc="$(cut -d' ' -f1 "$LOGDIR/$t.status" 2>/dev/null || echo 1)"
  [ "$rc" != "0" ] && failed+=("$t")
done

if [ "${#failed[@]}" -gt 0 ]; then
  echo
  for t in "${failed[@]}"; do
    printf "%s─── %s failed ───%s\n" "$R" "$t" "$N"
    tail -25 "$LOGDIR/$t.log" 2>/dev/null
    echo
  done
  printf "%s==>%s %d/%d succeeded, %s%d failed:%s %s\n" \
    "$R" "$N" "$((total - ${#failed[@]}))" "$total" "$R" "${#failed[@]}" "$N" "${failed[*]}"
  exit 1
fi

printf "%s==>%s all %d target(s) installed\n" "$G" "$N" "$total"
