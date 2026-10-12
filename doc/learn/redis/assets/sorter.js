/**
 * Reusable "sort each item" exercise: the learner puts every item into one of
 * two or more bins, then checks all answers at once. Used for "masked or
 * kept?", "label or not?" and "ship or block?" drills.
 *
 * Markup:
 *   <div class="sorter" data-bins="Masked|Kept">
 *     <p class="q">Instructions.</p>
 *     <ol class="items">
 *       <li data-bin="0"><code>resetToken</code><p class="why">Ends with "token".</p></li>
 *       …
 *     </ol>
 *   </div>
 *
 * `data-bins` lists the bin names, separated by "|". Each item's `data-bin` is
 * the zero-based index of its correct bin. The `.why` text shows once the
 * answers are checked. Answers are checked together rather than one at a time,
 * so the learner commits to every call before seeing any feedback.
 */
(function () {
  document.querySelectorAll('.sorter').forEach((sorter) => {
    const bins = (sorter.dataset.bins || 'Yes|No').split('|');
    const items = Array.from(sorter.querySelectorAll('.items > li'));
    const picks = new Map();

    const result = document.createElement('p');
    result.className = 'sorter-result';

    items.forEach((item) => {
      const choices = document.createElement('div');
      choices.className = 'sorter-choices';
      bins.forEach((name, bi) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = name;
        button.addEventListener('click', () => {
          if (sorter.classList.contains('checked')) return;
          picks.set(item, bi);
          choices.querySelectorAll('button').forEach((b) => b.classList.toggle('picked', b === button));
        });
        choices.appendChild(button);
      });
      const why = item.querySelector('.why');
      item.insertBefore(choices, why || null);
    });

    const actions = document.createElement('div');
    actions.className = 'sorter-actions';
    const check = document.createElement('button');
    check.type = 'button';
    check.textContent = 'Check my answers';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Reset';
    actions.append(check, reset);
    sorter.append(actions, result);

    check.addEventListener('click', () => {
      if (picks.size < items.length) {
        result.textContent = `Sort all ${items.length} first (${items.length - picks.size} left).`;
        return;
      }
      let right = 0;
      items.forEach((item) => {
        const ok = picks.get(item) === Number(item.dataset.bin);
        if (ok) right += 1;
        item.classList.add(ok ? 'right' : 'miss');
      });
      sorter.classList.add('checked');
      result.textContent = `${right} / ${items.length} right.` + (right < items.length ? ' Read the reasons on the red ones, then Reset and try again later.' : '');
    });

    reset.addEventListener('click', () => {
      picks.clear();
      sorter.classList.remove('checked');
      result.textContent = '';
      items.forEach((item) => {
        item.classList.remove('right', 'miss');
        item.querySelectorAll('.sorter-choices button').forEach((b) => b.classList.remove('picked'));
      });
    });
  });
})();
