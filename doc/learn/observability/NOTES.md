# Teaching notes

## Preferences (from the first session, 2026-09-27)
- Explain the concept first (what and why), then show how this repo wires it.
- About 20 minutes per lesson: one concept plus a live-cluster exercise.
- Style: the org brand (Lexend/Inter/IBM Plex Mono, navy #051367). Keep it mobile-friendly with no wide tables.
- **Every lesson ends with an "In short" note** (`.recap` in `course.css`): the 2–3 ideas to remember, a one-line fallback, and what *not* to memorise. The user asked for this after Lesson 1.
- **K8s/YAML config is hard for the user right now.** Never point at a whole manifest. Show a small excerpt of 5–10 lines, explain it line by line in plain words, and say which parts can be ignored. Consider a short "how to read a k8s manifest / Alloy config" lesson before Lesson 3 if it keeps coming up.
- The user expects to reread each lesson 2–3 times, which is normal and fine. Keep lessons rereadable: the key ideas stay visible, and detail goes in `<details>` or the reference sheet.
- **Page chrome:** every lesson and reference page loads `assets/quiz.js` (if it has quizzes), then `assets/course-map.js` and `assets/nav.js`. That gives the left course sidebar and the right panel (reading progress + "On this page", styled after hellointerview.com). A new page must be added to `course-map.js`; flip its `href` from `null` when the lesson is written. Top-level entries are `<h2>`s; sub-entries are `<h3>`s and the bold title of each `ol.steps` lab step, so give every lab step a `<strong>` title.
- **Open every session with a recall check** of the previous lesson's "In short" ideas, from memory. If they've been forgotten, give a hint first, then a 2-minute refresher, and only then move on.
- **2026-09-27, second session:** the user asked to finish all learning materials up to ticket 03 *first* and do revision afterwards, so the recall check was skipped and Lessons 3–8 were written in one go. The next sessions are **revision sessions**: open with a recall check across Lessons 1–2, then walk Lessons 3–8 at the user's pace, one per session, with the recall check covering the previous one.

## Draft curriculum for tickets 01–03 (revise as records come in)
1. A log line's journey: stdout → Alloy → Loki → Grafana; labels vs fields (ticket 02). **Written.**
2. How to read the platform config: YAML rules, the kind/spec shape, k8s labels/selectors, and Alloy components wired by `forward_to`. **Written** (added at the user's request after Lesson 1).
3. LogQL for real questions, plus redaction: what gets masked and where (ticket 02). **Written.**
4. Traces and spans: open an `auth` login in Tempo via `x-trace-id` (ticket 03). **Written.**
5. Context: what the "active span" is, `traceparent`, and why `tracing.ts` is imported first (ticket 03). **Written.**
6. Linking the pillars: log → trace and trace → logs, and why the collector being down is safe (ticket 03). **Written.**
7. Test seams: the fake AMQP channel, the in-memory span exporter, and why tests assert on observable calls (ticket 01, plus the 03 tests). **Written.**
8. Capstone: explain ADR 0001 aloud and review a planted bad diff. **Written.**

Terminology: "label" alone means a Loki label; the Kubernetes kind is always "k8s label". The glossary is `reference/0004-glossary.html`; keep every lesson consistent with it.

Interleave retrieval questions from earlier lessons from lesson 3 onward.

## Working notes
- Real finding for lesson 1: `common/src/middleware/errorHandler.ts:6` does `console.log(err)`, so every 4xx/5xx dumps a multi-line, unstructured stack trace. Alloy labels those lines `service="auth"` (the pod's app-label fallback) instead of `auth-service`. It's a good puzzle and a real gap worth raising for a later ticket.
- Loki adds `service_name` and `detected_level` on its own, so learners will see them next to our `service`/`level`.
- The cluster context is `docker-desktop`, and ingress is at https://ecom.dev.

- Components now in `assets/`: `course.css` (plus `.sorter`, `.waterfall` span diagram, `pre.diff`, `.from` retrieval tag), `quiz.js`, `sorter.js` (multi-item "sort into bins, check together" drill), `course-map.js`, `nav.js`.
- **Labs in Lessons 3–6 were NOT run against a live cluster.** It was down when they were written (2026-09-27). Their commands are checked against the code and config only. Span names in Lesson 4's waterfall are illustrative. Verify in the first revision session and fix anything that differs. Lesson 7's lab *was* run: 15 tests green, and both mutations fail exactly the tests the lesson predicts.
- Lessons teach the **committed ticket 03 state**. Ticket 04 (metrics, `mountObservability` in `common/src/observability/http.ts`, which now wraps `traceIdHeader`) was in progress in the working tree at the time. Lesson 4 mentions this in one line.
- Open questions to settle live: does ingress-nginx pass a client's `traceparent` through untouched (Lesson 5 lab)? After an Alloy outage, do the missed log lines get backfilled (Lesson 6 lab)? Record the answers as learning records.

## Ticket 04 session — 2026-09-28
- User explicitly requested teaching ticket 04; continue in this course despite the older mission’s ticket-prep exclusion. Mission unchanged.
- Lesson 9 and reference 0006 added, reusing course.css, quiz.js and navigation. Concepts first, implementation second, local test and optional cluster lab.
- Recall question sent: why trace_id stays a field rather than a Loki label. No answer yet; no mastery inferred and no new learning record.
- Common HTTP metrics test passed. Cluster connection refused. Validator could not finish because promtool was missing; auth smoke test not run. Do not treat live dashboard/exemplar acceptance as verified.
- New terminology always says “metric label” for Prometheus dimensions. Error-rate panel is 4xx + 5xx requests/sec; access logs remain info. Exemplar is latest sampled example, not p95 request or slowest request.
