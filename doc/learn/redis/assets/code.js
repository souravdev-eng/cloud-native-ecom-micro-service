/**
 * Code blocks on every lesson and reference sheet:
 *
 * - Copy: each <pre> gets a "Copy" button in its top-right corner that puts
 *   the block's text on the clipboard.
 * - Highlighting: plain <pre> blocks (code and commands) are coloured with
 *   highlight.js, loaded from cdnjs. The language is guessed from a short
 *   list of what the course uses. Lab output (`pre.out`) and blocks that
 *   already carry their own <span> markup are left alone, so their verdict
 *   colours survive.
 *
 * Colours come from the --hl-* tokens in course.css, so they follow the
 * reader's theme. Offline, highlighting is skipped and copy still works.
 */
(function () {
  const HLJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
  const LANGUAGES = ['typescript', 'bash', 'lua', 'yaml', 'json'];
  /** Below this score the guess is noise (prose, key → hash tables), so the block stays plain. */
  const MIN_RELEVANCE = 3;

  const blocks = Array.from(document.querySelectorAll('main pre'));
  if (!blocks.length) return;

  /** The clipboard API needs a secure context; the textarea route covers the rest. */
  const copyText = (text) => {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (ok) resolve(); else reject(new Error('copy failed'));
    });
  };

  const COPY_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
  const DONE_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /**
   * The button sits on a wrapper rather than inside the <pre>, so it stays put
   * while a long line scrolls sideways.
   */
  blocks.forEach((pre) => {
    const wrap = document.createElement('div');
    wrap.className = 'code-wrap';
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.setAttribute('aria-label', 'Copy code');
    button.innerHTML = `${COPY_ICON}<span>Copy</span>`;
    let timer = 0;
    button.addEventListener('click', () => {
      copyText(pre.textContent.replace(/\n$/, '')).then(
        () => { button.innerHTML = `${DONE_ICON}<span>Copied</span>`; button.classList.add('done'); },
        () => { button.innerHTML = `${COPY_ICON}<span>Press Ctrl+C</span>`; },
      ).finally(() => {
        clearTimeout(timer);
        timer = setTimeout(() => { button.innerHTML = `${COPY_ICON}<span>Copy</span>`; button.classList.remove('done'); }, 1600);
      });
    });
    wrap.appendChild(button);
  });

  const plain = blocks.filter((pre) => !pre.classList.contains('out') && !pre.classList.contains('diff') && !pre.querySelector('span'));
  if (!plain.length) return;

  const highlight = () => {
    const hljs = window.hljs;
    if (!hljs) return;
    plain.forEach((pre) => {
      const result = hljs.highlightAuto(pre.textContent, LANGUAGES);
      if (result.relevance < MIN_RELEVANCE) return;
      pre.innerHTML = `<code class="hljs language-${result.language}">${result.value}</code>`;
    });
  };

  if (window.hljs) { highlight(); return; }
  const script = document.createElement('script');
  script.src = HLJS_URL;
  script.crossOrigin = 'anonymous';
  script.onload = highlight;
  document.head.appendChild(script);
})();
