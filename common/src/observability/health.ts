import { Router } from "express";

export type DependencyCheck = () => void | Promise<void>;
export interface HealthRoutesOptions {
  /** Deadline for each check, in milliseconds. Defaults to 1000. */
  timeoutMs?: number;
}

type CheckStatus = "ok" | "error" | "timeout";

const MAX_TIMER_DELAY_MS = 2_147_483_647;

/** Bounds the response wait; a timeout does not cancel the dependency operation. */
async function runCheck(check: DependencyCheck, timeoutMs: number): Promise<CheckStatus> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      // Calling the check through a promise also converts synchronous throws into failures.
      Promise.resolve()
        .then(check)
        .then<CheckStatus, CheckStatus>(
          () => "ok",
          () => "error",
        ),
      new Promise<CheckStatus>((resolve) => {
        timer = setTimeout(() => resolve("timeout"), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** Mount before authentication middleware so Kubernetes can probe without credentials. */
export function createHealthRoutes(
  checks: Record<string, DependencyCheck>,
  { timeoutMs = 1000 }: HealthRoutesOptions = {},
): Router {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_TIMER_DELAY_MS) {
    throw new Error("Health check timeoutMs must be a positive timer duration");
  }

  const router = Router();

  router.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  router.get("/readyz", (_req, res, next) => {
    Promise.all(
      Object.entries(checks).map(async ([name, check]) => {
        return [name, await runCheck(check, timeoutMs)];
      }),
    )
      .then((results) => {
        const ready = results.every(([, status]) => status === "ok");
        res.status(ready ? 200 : 503).json({
          status: ready ? "ok" : "error",
          checks: Object.fromEntries(results),
        });
      })
      .catch(next);
  });
  return router;
}
