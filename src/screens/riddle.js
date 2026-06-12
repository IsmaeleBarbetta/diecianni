// Riddle screen: three cryptic clues + a tolerant password check.
// Answer = initials (I, C in any order) + 13 (the day) + 10 (the years).
// Accepted normalized forms: "ic1310" or "ci1310".

const ACCEPTED = ['ic1310', 'ci1310'];

// Strip everything but letters/digits and lowercase, so "I&C 13-10",
// "i.c.1310", "IC 13 10" all collapse to the same string.
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const BAD_HINTS = [
  'Non proprio… ripensa a chi siamo e a due numeri che conosci bene.',
  'Ci sei vicino? Lettere e numeri, l\'ordine delle lettere non conta.',
  'Riprova. Tre indizi, una sola chiave.',
];

export function mountRiddle(root, onSolved) {
  root.innerHTML = `
    <div class="riddle-card" id="riddle-card">
      <h2>L'indovinello</h2>
      <p class="sub">Tre indizi. Una chiave per il binario.</p>
      <ul class="clues">
        <li data-n="1">Prima lei, poi lui — o come preferite voi. Due iniziali, l'ordine non conta.</li>
        <li data-n="2">Il giorno in cui tutto è cominciato.</li>
        <li data-n="3">Tante candeline quante ne spegniamo stavolta.</li>
      </ul>
      <div class="input-row">
        <input
          id="answer"
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="la chiave…"
          aria-label="La tua risposta"
        />
        <button class="btn" id="submit">→</button>
      </div>
      <p class="hint" id="hint">Lettere e numeri, tutto attaccato.</p>
    </div>
  `;

  const card = root.querySelector('#riddle-card');
  const input = root.querySelector('#answer');
  const submit = root.querySelector('#submit');
  const hint = root.querySelector('#hint');

  let attempts = 0;
  let solved = false;

  function fail() {
    attempts += 1;
    card.classList.remove('error');
    void card.offsetWidth; // restart the shake animation
    card.classList.add('error');
    hint.textContent = BAD_HINTS[Math.min(attempts - 1, BAD_HINTS.length - 1)];
    hint.className = 'hint bad';
    if (navigator.vibrate) navigator.vibrate(60);
  }

  function tryAnswer() {
    if (solved) return;
    const value = normalize(input.value);
    if (!value) return;

    if (ACCEPTED.includes(value)) {
      solved = true;
      hint.textContent = 'Binario libero. Si parte ❤';
      hint.className = 'hint good';
      input.disabled = true;
      submit.disabled = true;
      if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      setTimeout(onSolved, 900);
    } else {
      fail();
    }
  }

  submit.addEventListener('click', tryAnswer);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tryAnswer();
  });
  input.addEventListener('input', () => {
    card.classList.remove('error');
  });
}
