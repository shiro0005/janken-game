(() => {
  const gameCharacters = [
    ["じ", "ゃ", "ん", "け", "ん", "げ", "ー", "む"],
    ["あ", "る", "な", "し", "く", "い", "ず"],
    ["く", "ろ", "す", "わ", "ー", "ど", "く", "い", "ず"],
    ["なぞ", "と", "き", "けい", "さん"]
  ];
  const examples = [
    { formula: [[1, 4], [1, 5]], answer: "けん", illustration: '<span class="emoji-illustration" aria-hidden="true">🗡️</span>' },
    { formula: [[2, 3], [3, 3]], answer: "なす", illustration: '<span class="emoji-illustration" aria-hidden="true">🍆</span>' },
    {
      formula: [[4, 4], [1, 1]],
      answer: "けいじ",
      illustration: `
        <svg class="detective-illustration" viewBox="0 0 150 120" aria-hidden="true">
          <path d="M34 116c2-35 15-52 40-52s38 17 40 52Z" fill="#183b66" stroke="#102a4b" stroke-width="3"/>
          <path d="M62 67 74 82 86 67" fill="#eef5fb"/>
          <path d="M74 82v34" stroke="#0f2744" stroke-width="4"/>
          <circle cx="74" cy="42" r="23" fill="#f1c7a5"/>
          <path d="M49 37h51l-9-22H58Z" fill="#183b66" stroke="#102a4b" stroke-width="3"/>
          <path d="M42 38h64" stroke="#102a4b" stroke-width="7" stroke-linecap="round"/>
          <path d="m74 19 4 6 7 1-5 5 1 7-7-3-7 3 1-7-5-5 7-1Z" fill="#f4c542"/>
          <circle cx="67" cy="44" r="2.2" fill="#27303a"/>
          <circle cx="82" cy="44" r="2.2" fill="#27303a"/>
          <path d="M68 54q6 5 13 0" fill="none" stroke="#a05d55" stroke-width="2" stroke-linecap="round"/>
          <path d="m93 78 5 4-2 8-7 1-5-6 3-7Z" fill="#f4c542" stroke="#9a7212" stroke-width="2"/>
          <rect x="107" y="57" width="34" height="44" rx="4" fill="#202b38"/>
          <rect x="112" y="62" width="24" height="34" rx="2" fill="#f7f2df"/>
          <circle cx="124" cy="72" r="6" fill="#7aa8cd"/>
          <path d="M116 85h16M116 90h12" stroke="#62717e" stroke-width="2"/>
          <circle cx="27" cy="79" r="16" fill="none" stroke="#3f5368" stroke-width="6"/>
          <path d="m38 91 13 16" stroke="#3f5368" stroke-width="7" stroke-linecap="round"/>
        </svg>`
    }
  ];
  const challenge = { formula: [[4, 5], [2, 4]], intermediate: "さんし", answer: "じゅうに" };

  const examplesElement = document.getElementById("examples");
  const challengeElement = document.getElementById("challenge");
  const status = document.getElementById("status");
  const clearPanel = document.getElementById("clearPanel");

  const formulaText = formula => formula.map(([game, position]) => `${game}.${position}`).join(" ＋ ");
  const solve = formula => formula.map(([game, position]) => gameCharacters[game - 1][position - 1]).join("");
  const hiraganaOnly = value => Array.from(String(value || "")).filter(character => /^[ぁ-ゖ]$/.test(character)).join("");

  function verifyDefinitions() {
    examples.forEach(item => {
      if (solve(item.formula) !== item.answer) throw new Error(`${formulaText(item.formula)} の答えが一致しません`);
    });
    if (solve(challenge.formula) !== challenge.intermediate || challenge.answer !== "じゅうに") {
      throw new Error(`${formulaText(challenge.formula)} の定義が一致しません`);
    }
  }

  function render() {
    examplesElement.innerHTML = examples.map(item => `
      <div class="example">
        <div class="formula">${formulaText(item.formula)} ＝</div>
        <div class="example-illustration">${item.illustration}</div>
      </div>
    `).join("");

    challengeElement.innerHTML = `
      <form id="answerForm" class="challenge">
        <span class="formula">${formulaText(challenge.formula)} ＝ ？</span>
        <label for="answerInput" class="visually-hidden">問題の答え</label>
        <input id="answerInput" class="answer-input" type="text" inputmode="text" pattern="[ぁ-ゖ]*" maxlength="4" autocomplete="off">
        <button class="answer-button" type="submit">回答する</button>
      </form>`;
  }

  function sanitizeInput(event) {
    if (event?.isComposing) return;
    const value = hiraganaOnly(answerInput.value).slice(0, 4);
    if (answerInput.value !== value) answerInput.value = value;
    answerInput.classList.remove("correct", "wrong");
    answerInput.removeAttribute("aria-invalid");
    clearPanel.hidden = true;
    status.classList.remove("clear");
    status.textContent = "式が表す言葉を考えてください。";
  }

  function checkAnswer(event) {
    event.preventDefault();
    sanitizeInput();
    const value = answerInput.value;
    const correct = value === challenge.answer;
    answerInput.classList.toggle("correct", correct);
    answerInput.classList.toggle("wrong", !correct && value.length > 0);
    answerInput.setAttribute("aria-invalid", String(!correct && value.length > 0));
    clearPanel.hidden = !correct;
    status.classList.toggle("clear", correct);
    status.textContent = correct ? "正解です！" : value ? "答えが違います。" : "答えを入力してください。";
    if (correct) clearPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  verifyDefinitions();
  render();
  const answerInput = document.getElementById("answerInput");
  const answerForm = document.getElementById("answerForm");
  answerInput.addEventListener("input", sanitizeInput);
  answerInput.addEventListener("compositionend", sanitizeInput);
  answerForm.addEventListener("submit", checkAnswer);
  answerInput.focus();
})();
