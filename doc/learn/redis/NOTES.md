# Teaching notes

## Preferences (carried over from the observability course)
- Explain the concept first (what and why), then show how this repo wires it.
- Style: the org brand (Lexend/Inter/IBM Plex Mono, navy #051367). Keep it mobile-friendly with no wide tables.
- **Every lesson ends with an "In short" note** (`.recap` in `course.css`): the 2–3 ideas to remember, a one-line fallback, and what *not* to memorise.
- **Config and code excerpts stay small.** Never point at a whole file or manifest. Show 5–10 lines, explain them line by line in plain words, and say which parts can be ignored. K8s/YAML config was hard for the learner in the observability course.
- The learner expects to reread each lesson 2–3 times, which is normal and fine. Keep lessons rereadable: the key ideas stay visible, and detail goes in `<details>` or a reference sheet.
- **Open every session with a recall check** of the previous lesson's "In short" ideas, from memory. If they've been forgotten, give a hint first, then a 2-minute refresher, and only then move on.
- Interleave retrieval questions from earlier lessons from Lesson 2 on (tag them with `<p class="from">`).

## How to write a lesson (from the learner's review of Lesson 0, 2026-10-11)
The first draft of Lesson 0 was accurate but read like a reference: an abstract two-line scenario, jargon before meaning, and lab plumbing in the middle of the story. The learner asked for **a good story buildup, simple words, and a clear structure**. Every lesson follows these rules:
- **Tell one story.** Open with a concrete feature or incident in this shop (a view counter, a stale price, a checkout spike), built up in short beats: it works, then something changes, then a hidden problem. Say plainly when the feature is made up.
- **Experience first, names last.** Explain in plain words while the learner watches it happen; introduce the official terms in a "Now name it" section after the fix, each linked to the glossary. Never define a term mid-sentence inside a long paragraph.
- **One picture per lesson** that later lessons can reuse. Lesson 0's is the *whiteboard and its keeper*: Redis's memory is a whiteboard, the keeper serves one request at a time (single command thread), walking there and back is a round trip, and "please add one" is a single atomic command. Map every part of the picture to the real thing in a short list.
- **Short sentences, everyday words.** Prefer "one turn", "in between", "overwrote" to "interleave", "variant", "asserts".
- **Connect the dots before the story.** The opening line orients; it doesn't tease. Before any story, say where the learner is and why this matters here. Lesson 0 opens the course with what Redis is (in plain words, with `SET`/`GET`), why it's in our platform, why the course starts with many pods and one Redis, and how a lesson works. Later lessons open by linking to the previous lesson and to the part of our system they're about.
- **Explain the setup, not just the commands.** Whenever a lesson uses an environment (a compose profile, the live cluster), show what's running and what each piece stands for in the real system (Lesson 0's "Your lab setup" card: cluster vs laptop), say why it's set up that way, and explain each setup command line by line.
- **Keep plumbing out of the story.** Setup goes in "Before you start"; lab tricks (the barrier, called the "starting gun" on the page), safety notes and side questions go in `<details>`.
- **Order:** before you start (goals, diagnostic, setup) → the story (the question) → predict → see it break → slow motion → why (the picture) → fix → now name it → in our repo → in short → check yourself.

## This course
- About 25–30 minutes per lesson, three study days (spec: `.scratch/redis-learning-course/spec.md`). If a lesson runs over 35 minutes in practice, split it rather than cutting the lab.
- Section order is under "How to write a lesson" above. It keeps the spec's order (question, predict, break it, why, fix, in our repo, in short, check yourself) and adds "before you start", "slow motion" and "now name it". Lesson 0 also puts the diagnostic in "before you start".
- Each lesson starts from a distributed-systems question (many pods, one Redis), not from a data type. Data types are introduced only when a lesson needs one.
- **Numbering:** a lesson, its lab and its keys share one number. Lesson 0 is `lessons/0000-…`, `sandbox/redis-learning/labs/00-…` and `lab:00:*`. Reference sheets are numbered 0001–0006 as in the spec.
- **Page chrome:** every page loads `assets/quiz.js` (if it has quizzes), then `assets/course-map.js` and `assets/nav.js`. A new page must be added to `course-map.js`; flip its `href` from `null` when it's written. Give every `ol.steps` lab step a `<strong>` title (nav.js uses it for the outline).
- **Assets are copies** of the observability course's, with three additions: `quiz.js` supports quiz groups (`data-quiz-group`, own `.score`, `data-pass`) for the diagnostic; `nav.js` shows reference sheets with `href: null` as "coming"; `course.css` adds `.diagnostic` and `pre.out`. Don't sync the copies back without checking those.
- Terminology: the glossary is `reference/0005-glossary.html`. Use its terms with exactly its meanings in every lesson ("worker" for one lab process standing in for a pod, "lost update", "atomic", "round trip").
- Factual traps from the old material, never to repeat: products live in **MongoDB**, not Postgres; `redisCache.get()` is typed `string | null` but returns a parsed object (the old "double-encoding in `set`" critique is out of date); never show a lock without a TTL, `INCR` + `EXPIRE` as two calls, a Redis lock guarding inventory, or `flushDb()`; links are repo-relative.

## Curriculum
0. Shared state across pods (local, `single`). **Written.**
1. Cache-aside in `product` (live cluster).
2. Cache consistency (live cluster + local).
3. Stampede (local, `single`).
4. When Redis is down or slow (live cluster + local).
5. Locks across pods (local, `single`).
6. Rate limiting across replicas (local, `single`).
7. Replication and failover (local, `replication`).
8. Cluster and sharding (local, `cluster`).
9. Capstone: review a Redis diff.

## Working notes
- **2026-10-11, Lesson 0 written.** Lab 00 run on `redis:7.4.11-alpine` with node-redis 4.7.1: forced timing loses exactly 2,000 of 3,000 updates on every run (all three workers read the same value each round); `INCR` loses 0; `--no-barrier` lost about 1,700 in two runs, varying. `labs:verify` passes 3/3 and was confirmed to exit 1 when the fixed variant is sabotaged. The lesson's sample output is copied from these runs.
- The diagnostic hasn't been taken yet. Record the result in `learning-records/0001-diagnostic-result.md` after the first session.
- Lesson 0's repo anchor is `product/src/queues/listeners/productQuantityUpdate.ts`: an atomic conditional `$inc` in MongoDB, the same idea as `INCR`. Lesson 5 comes back to it as the right answer for inventory (no lock).
