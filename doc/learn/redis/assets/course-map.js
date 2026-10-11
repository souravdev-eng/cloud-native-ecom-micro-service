/**
 * The course outline shown in every page's left sidebar. Adding a lesson or
 * reference sheet means adding one entry here. An entry with `href: null`
 * is planned but not written yet, and shows as "coming".
 *
 * Lesson files are numbered after the lesson (Lesson 0 is 0000-…), so a
 * lesson, its lab folder (labs/00-…) and its key prefix (lab:00:) share
 * one number.
 *
 * Paths are relative to a page one folder deep (lessons/ or reference/).
 */
window.COURSE = {
  title: 'Redis for distributed systems',
  subtitle: '10 lessons · 3 days',
  home: '../lessons/0000-shared-state-across-pods.html',
  lessons: [
    { num: 0, title: 'Shared state across pods', tag: 'Day 1 · local', href: '../lessons/0000-shared-state-across-pods.html' },
    { num: 1, title: 'Cache-aside in product', tag: 'Day 1 · cluster', href: null },
    { num: 2, title: 'Cache consistency', tag: 'Day 1 · cluster + local', href: null },
    { num: 3, title: 'Stampede', tag: 'Day 1 · local', href: null },
    { num: 4, title: 'When Redis is down or slow', tag: 'Day 2 · cluster + local', href: null },
    { num: 5, title: 'Locks across pods', tag: 'Day 2 · local', href: null },
    { num: 6, title: 'Rate limiting across replicas', tag: 'Day 2 · local', href: null },
    { num: 7, title: 'Replication and failover', tag: 'Day 3 · local', href: null },
    { num: 8, title: 'Cluster and sharding', tag: 'Day 3 · local', href: null },
    { num: 9, title: 'Capstone: review a Redis diff', tag: 'Day 3', href: null },
  ],
  reference: [
    { title: 'Commands and data types', href: '../reference/0001-commands-and-data-types.html' },
    { title: 'Caching and invalidation', href: null },
    { title: 'Locks and rate limiters', href: null },
    { title: 'Operations', href: null },
    { title: 'Glossary', href: '../reference/0005-glossary.html' },
    { title: 'Review checklist', href: null },
  ],
};
