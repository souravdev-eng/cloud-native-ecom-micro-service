/**
 * Reusable multiple-choice quiz for lessons.
 *
 * Markup:
 *   <div class="quiz" data-answer="2">
 *     <p class="q">Question?</p>
 *     <div class="options"><button>…</button><button>…</button>…</div>
 *     <p class="why">Explanation shown after answering.</p>
 *   </div>
 *
 * `data-answer` is the zero-based index of the correct button. Feedback is
 * immediate. A wrong pick can be retried, because retrieval effort is the
 * point. An element with class "score" shows first-try results.
 *
 * Groups (added for this course's diagnostic): wrap quizzes in an element
 * with `data-quiz-group` and they get their own `.score`, separate from the
 * page's. With `data-pass="4"`, the group gets the class `passed` or
 * `not-passed` once every quiz in it is answered, which reveals its
 * `.pass-msg` or `.fail-msg`.
 */
(function () {
  const groupOf = (node) => node.parentElement.closest('[data-quiz-group]') || document.body;
  const groups = new Map();
  document.querySelectorAll('.quiz').forEach((quiz) => {
    const root = groupOf(quiz);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(quiz);
  });

  groups.forEach((quizzes, root) => {
    const scoreEl = Array.from(root.querySelectorAll('.score')).find((el) => groupOf(el) === root);
    const passMark = Number(root.dataset.pass) || 0;
    const firstTry = new Map();

    const renderScore = () => {
      const right = Array.from(firstTry.values()).filter(Boolean).length;
      if (scoreEl) {
        scoreEl.textContent = `First-try score: ${right} / ${quizzes.length}` +
          (firstTry.size < quizzes.length ? ` (${quizzes.length - firstTry.size} left)` : '');
      }
      if (passMark && firstTry.size === quizzes.length) {
        root.classList.toggle('passed', right >= passMark);
        root.classList.toggle('not-passed', right < passMark);
      }
    };

    quizzes.forEach((quiz, qi) => {
      const answer = Number(quiz.dataset.answer);
      const buttons = Array.from(quiz.querySelectorAll('.options button'));

      buttons.forEach((button, bi) => {
        button.type = 'button';
        button.addEventListener('click', () => {
          const isRight = bi === answer;
          if (!firstTry.has(qi)) firstTry.set(qi, isRight);
          buttons.forEach((b) => (b.disabled = true));
          button.classList.add(isRight ? 'correct' : 'wrong');
          if (isRight) {
            quiz.classList.add('answered');
          } else {
            const retry = document.createElement('button');
            retry.className = 'retry';
            retry.textContent = 'Try again';
            retry.addEventListener('click', () => {
              buttons.forEach((b) => { b.disabled = false; b.classList.remove('wrong'); });
              retry.remove();
            });
            quiz.appendChild(retry);
          }
          renderScore();
        });
      });
    });
    renderScore();
  });
})();
