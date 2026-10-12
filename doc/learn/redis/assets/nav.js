/**
 * Page chrome for every lesson and reference sheet:
 *
 * - Left sidebar: the whole course from `course-map.js`. The current page
 *   also expands into its sections, but only on screens too narrow for the
 *   right panel, so the two never duplicate each other.
 * - Right panel: a reading-progress bar, then an "On this page" outline.
 *   Sections (<h2>) are the top level; sub-topics are <h3>s and the bold
 *   title of each lab step (`ol.steps > li`). The entry you're reading and
 *   its section are highlighted as you scroll.
 * - Narrow screens: a top bar with a reading-progress line and a
 *   "Contents" button that opens the sidebar as a drawer.
 *
 * - Theme picker: Auto (follow the system), Light, Paper or Dark, remembered
 *   in this browser only.
 * - "Mark as read" switch at the end of each page. A read page shows a tick
 *   in the sidebar instead of its number, and the first unread lesson is
 *   tagged "next". Also remembered in this browser only.
 *
 * Pages only need <main> with <h2> sections; ids are generated when missing.
 */
(function () {
  /**
   * The theme is applied before anything else is built. Storage can throw in
   * private windows, and then the picker simply forgets between pages.
   */
  const THEME_KEY = 'redis-course-theme';
  const themes = [['auto', 'Auto'], ['light', 'Light'], ['paper', 'Paper'], ['dark', 'Dark']];
  const readTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { return 'auto'; } };
  const applyTheme = (theme) => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  };
  applyTheme(readTheme());

  /** Pages marked as read, by file name, so the list survives moving the course folder. */
  const READ_KEY = 'redis-course-read';
  const readPages = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch (e) { return new Set(); }
  })();
  const fileOf = (href) => (href ? href.split('/').pop() : '');
  const saveRead = () => {
    /** If storage is blocked the mark lasts until the page is closed. */
    try { localStorage.setItem(READ_KEY, JSON.stringify(Array.from(readPages))); } catch (e) { /** Nothing to do. */ }
  };
  const CHECK_ICON = '<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const course = window.COURSE || { title: 'Course', lessons: [], reference: [] };
  const main = document.querySelector('main');
  if (!main) return;

  const smooth = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  const pageFile = decodeURIComponent(location.pathname.split('/').pop());
  const isCurrent = (href) => href && href.split('/').pop() === pageFile;

  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
    children.forEach((child) => child && node.appendChild(child));
    return node;
  };

  /**
   * Titles like "2 · Where the line goes" drop the leading number in the
   * outlines, where position already shows the order.
   */
  const clean = (text) => text.replace(/^\s*\d+\s*·\s*/, '').replace(/[.:]\s*$/, '').trim();

  const usedIds = new Set(Array.from(document.querySelectorAll('[id]')).map((node) => node.id));
  const ensureId = (node, title) => {
    if (node.id) return node.id;
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    node.id = id;
    usedIds.add(id);
    return id;
  };

  /**
   * The outline: each <h2> with the sub-topics that follow it, up to the
   * next <h2>. A lab step's sub-topic is its first <strong>.
   */
  const headings = Array.from(main.querySelectorAll('h2'));
  const subSelector = 'h3, ol.steps > li';
  const outline = headings.map((heading, i) => {
    const title = clean(heading.textContent);
    ensureId(heading, title);
    const next = headings[i + 1];
    const children = Array.from(main.querySelectorAll(subSelector))
      .filter((node) => (heading.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING)
        && (!next || (node.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING)))
      .map((node) => {
        const label = node.matches('h3') ? node.textContent : (node.querySelector('strong') || {}).textContent;
        if (!label) return null;
        const subTitle = clean(label);
        ensureId(node, subTitle);
        return { node, title: subTitle };
      })
      .filter(Boolean);
    return { node: heading, title, children };
  });

  /** Every outline entry in page order, for scroll tracking. */
  const entries = [];
  const buildOutline = (className) => {
    const list = el('ol', { class: className });
    outline.forEach((section) => {
      const link = el('a', { href: `#${section.node.id}`, text: section.title });
      const item = el('li', {}, [link]);
      const record = { node: section.node, link, item, parent: null };
      if (section.children.length) {
        const subList = el('ol');
        section.children.forEach((child) => {
          const subLink = el('a', { href: `#${child.node.id}`, text: child.title });
          subList.appendChild(el('li', {}, [subLink]));
          entries.push({ node: child.node, link: subLink, parent: record });
        });
        item.appendChild(subList);
      }
      entries.push(record);
      list.appendChild(item);
    });
    return list;
  };
  const scrollLinks = (container) => container.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: smooth, block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
  });

  /** Left sidebar. The narrow-screen section list only shows top-level sections. */
  const toc = el('ol', { class: 'side-toc' });
  const tocLinks = outline.map((section) => {
    const link = el('a', { href: `#${section.node.id}`, text: section.title });
    toc.appendChild(el('li', {}, [link]));
    return { node: section.node, link };
  });

  /** Sidebar rows that can be ticked, refreshed whenever a page is marked or unmarked. */
  const trackedRows = [];

  const lessonList = el('ol', { class: 'side-lessons' });
  course.lessons.forEach((lesson) => {
    const current = isCurrent(lesson.href);
    const num = el('span', { class: 'side-num', text: String(lesson.num) });
    const label = [num, el('span', { class: 'side-name', text: lesson.title })];
    const item = lesson.href
      ? el('a', { href: lesson.href }, label)
      : el('span', { class: 'side-coming', title: 'Coming soon' }, label);
    const li = el('li', { class: current ? 'current' : lesson.href ? '' : 'upcoming' }, [item]);
    if (lesson.href) trackedRows.push({ li, file: fileOf(lesson.href), lesson: true, num, label: String(lesson.num) });
    if (current) {
      item.setAttribute('aria-current', 'page');
      li.appendChild(toc);
    }
    lessonList.appendChild(li);
  });

  const refList = el('ul', { class: 'side-refs' });
  (course.reference || []).forEach((ref) => {
    /** Like lessons, a sheet with `href: null` is planned but unwritten, and shows as "coming". */
    if (!ref.href) {
      const coming = el('span', { class: 'side-coming', title: 'Coming soon' }, [el('span', { class: 'side-name', text: ref.title })]);
      refList.appendChild(el('li', { class: 'upcoming' }, [coming]));
      return;
    }
    const link = el('a', { href: ref.href }, [el('span', { class: 'side-name', text: ref.title })]);
    const tick = el('span', { class: 'side-tick' });
    tick.innerHTML = CHECK_ICON;
    link.appendChild(tick);
    const li = el('li', { class: isCurrent(ref.href) ? 'current' : '' }, [link]);
    trackedRows.push({ li, file: fileOf(ref.href), lesson: false });
    if (isCurrent(ref.href)) {
      link.setAttribute('aria-current', 'page');
      li.appendChild(toc);
    }
    refList.appendChild(li);
  });

  const themePick = el('div', { class: 'theme-pick', role: 'group', 'aria-label': 'Theme' });
  const themeButtons = themes.map(([value, name]) => {
    const button = el('button', { type: 'button', text: name, 'aria-pressed': String(readTheme() === value) });
    button.addEventListener('click', () => {
      applyTheme(value);
      /** If storage is blocked the choice isn't saved, but it still applies to this page. */
      try { localStorage.setItem(THEME_KEY, value); } catch (e) { /** Nothing to do. */ }
      themeButtons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    });
    themePick.appendChild(button);
    return button;
  });

  const side = el('nav', { class: 'side', 'aria-label': 'Course contents' }, [
    el('a', { class: 'side-title', href: course.home || '#' }, [
      el('span', { text: course.title }),
      el('span', { class: 'label', text: course.subtitle || '' }),
    ]),
    themePick,
    el('p', { class: 'label', text: 'Lessons' }),
    lessonList,
    refList.children.length ? el('p', { class: 'label', text: 'Reference' }) : null,
    refList.children.length ? refList : null,
  ]);
  scrollLinks(side);

  /** A lesson's number turns into a tick once read; the first unread lesson is "next". */
  const refreshProgress = () => {
    let nextFound = false;
    trackedRows.forEach((row) => {
      const done = readPages.has(row.file);
      row.li.classList.toggle('done', done);
      if (row.lesson) {
        if (done) row.num.innerHTML = CHECK_ICON; else row.num.textContent = row.label;
        const isNext = !done && !nextFound;
        if (isNext) nextFound = true;
        row.li.classList.toggle('next', isNext);
      }
    });
  };
  refreshProgress();

  /** The "Mark as read" switch, placed just above the previous/next links. */
  const readInput = el('input', { type: 'checkbox', role: 'switch', class: 'read-input' });
  readInput.checked = readPages.has(pageFile);
  const readState = el('span', { class: 'read-state' });
  const showReadState = () => {
    readState.textContent = readInput.checked ? 'Read. Nice work.' : 'Finished this page? Mark it so you know what to study next.';
  };
  showReadState();
  readInput.addEventListener('change', () => {
    if (readInput.checked) readPages.add(pageFile); else readPages.delete(pageFile);
    saveRead();
    showReadState();
    refreshProgress();
  });
  const readToggle = el('label', { class: 'read-toggle' }, [
    readInput,
    el('span', { class: 'read-track', 'aria-hidden': 'true' }),
    el('span', { class: 'read-text' }, [el('strong', { text: 'Mark as read' }), readState]),
  ]);
  const footerNav = main.querySelector('nav.course');
  if (footerNav) main.insertBefore(readToggle, footerNav); else main.appendChild(readToggle);

  /** Right panel: reading progress, then the outline. */
  const progressFill = el('div', { class: 'otp-progress-fill' });
  const progressValue = el('span', { class: 'otp-progress-value', text: '0%' });
  const onThisPage = el('aside', { class: 'otp', 'aria-label': 'On this page' }, [
    el('div', { class: 'otp-progress-head' }, [el('span', { text: 'Reading progress' }), progressValue]),
    el('div', { class: 'otp-progress', role: 'progressbar', 'aria-label': 'Reading progress' }, [progressFill]),
    el('p', { class: 'otp-title', text: 'On this page' }),
    buildOutline('otp-list'),
  ]);
  scrollLinks(onThisPage);

  /** Narrow-screen top bar and drawer. */
  const barProgress = el('div', { class: 'topbar-progress' });
  const toggle = el('button', { class: 'topbar-toggle', type: 'button', 'aria-expanded': 'false', text: 'Contents' });
  const topbar = el('div', { class: 'topbar' }, [
    el('span', { class: 'topbar-title', text: course.title }),
    toggle,
    barProgress,
  ]);
  const scrim = el('div', { class: 'scrim' });
  const setDrawer = (open) => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setDrawer(!document.body.classList.contains('nav-open')));
  scrim.addEventListener('click', () => setDrawer(false));
  side.addEventListener('click', (event) => { if (event.target.closest('a')) setDrawer(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setDrawer(false); });

  document.body.classList.add('has-chrome');
  document.body.prepend(topbar, side, scrim);
  document.body.appendChild(onThisPage);

  const docTop = (node) => node.getBoundingClientRect().top + window.scrollY;
  const byPosition = (list) => list.slice().sort((a, b) => docTop(a.node) - docTop(b.node));

  /**
   * The active entry is the last one whose top has passed 30% of the way
   * down the viewport; at the very bottom it's always the last one.
   */
  const lastPassed = (list) => {
    const docHeight = document.documentElement.scrollHeight;
    const line = window.scrollY + window.innerHeight * 0.3;
    if (window.scrollY + window.innerHeight >= docHeight - 2) return list[list.length - 1];
    let found = null;
    list.forEach((entry) => { if (docTop(entry.node) <= line) found = entry; });
    return found;
  };

  let lastActive = null;
  const update = () => {
    const docHeight = document.documentElement.scrollHeight;
    const scrollable = Math.max(1, docHeight - window.innerHeight);
    const percent = Math.round(Math.min(100, (window.scrollY / scrollable) * 100));
    progressFill.style.width = `${percent}%`;
    progressValue.textContent = `${percent}%`;
    barProgress.style.width = `${percent}%`;

    const active = lastPassed(byPosition(entries));
    const section = active && (active.parent || active);
    entries.forEach((entry) => {
      entry.link.classList.toggle('active', entry === active);
      if (entry.item) entry.item.classList.toggle('open', entry === section);
    });
    const activeToc = lastPassed(tocLinks);
    tocLinks.forEach((entry) => entry.link.classList.toggle('active', entry === activeToc));

    /** Keep the highlighted entry visible when the outline is taller than the screen. */
    if (active && active !== lastActive) {
      lastActive = active;
      const box = onThisPage.getBoundingClientRect();
      const linkBox = active.link.getBoundingClientRect();
      if (linkBox.top < box.top + 80 || linkBox.bottom > box.bottom - 24) {
        onThisPage.scrollTop += linkBox.top - box.top - box.height / 2;
      }
    }
  };

  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; update(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', update);
  /** Opening a <details> or loading a font changes section positions. */
  if ('ResizeObserver' in window) new ResizeObserver(onScroll).observe(main);
  update();
})();
