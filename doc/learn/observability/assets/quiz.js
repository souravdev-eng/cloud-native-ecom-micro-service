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
 * point. An element with class "score" shows first-try results for the page.
 */
(function () {
  const quizzes = Array.from(document.querySelectorAll('.quiz'));
  const scoreEl = document.querySelector('.score');
  const firstTry = new Map();

  const renderScore = () => {
    if (!scoreEl) return;
    const right = Array.from(firstTry.values()).filter(Boolean).length;
    scoreEl.textContent = `First-try score: ${right} / ${quizzes.length}` +
      (firstTry.size < quizzes.length ? ` (${quizzes.length - firstTry.size} left)` : '');
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
})();
