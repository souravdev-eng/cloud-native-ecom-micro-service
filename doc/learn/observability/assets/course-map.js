/**
 * The course outline shown in every page's left sidebar. Adding a lesson or
 * reference sheet means adding one entry here. An entry with `href: null`
 * is planned but not written yet, and shows as "coming".
 *
 * Paths are relative to a page one folder deep (lessons/ or reference/).
 */
window.COURSE = {
  title: 'Observability platform',
  subtitle: 'Tickets 01–03',
  home: '../lessons/0001-a-log-lines-journey.html',
  lessons: [
    { num: 1, title: "A log line's journey", tag: 'Ticket 02', href: '../lessons/0001-a-log-lines-journey.html' },
    { num: 2, title: 'How to read the platform config', tag: 'Skill', href: '../lessons/0002-reading-k8s-and-alloy-config.html' },
    { num: 3, title: 'LogQL and redaction', tag: 'Ticket 02', href: '../lessons/0003-logql-and-redaction.html' },
    { num: 4, title: 'Traces and spans', tag: 'Ticket 03', href: '../lessons/0004-traces-and-spans.html' },
    { num: 5, title: 'Context and traceparent', tag: 'Ticket 03', href: '../lessons/0005-context-and-traceparent.html' },
    { num: 6, title: 'Linking logs and traces', tag: 'Ticket 03', href: '../lessons/0006-linking-logs-and-traces.html' },
    { num: 7, title: 'Test seams', tag: 'Tickets 01, 03', href: '../lessons/0007-test-seams.html' },
    { num: 8, title: 'Capstone: explain and review', tag: 'All', href: '../lessons/0008-capstone-explain-and-review.html' },
  ],
  reference: [
    { title: 'Logs pipeline cheat sheet', href: '../reference/0001-logs-pipeline.html' },
    { title: 'LogQL and redaction', href: '../reference/0002-logql-and-redaction.html' },
    { title: 'Traces pipeline cheat sheet', href: '../reference/0003-traces-pipeline.html' },
    { title: 'Glossary', href: '../reference/0004-glossary.html' },
    { title: 'Review checklist', href: '../reference/0005-review-checklist.html' },
  ],
};
