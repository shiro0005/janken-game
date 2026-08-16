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
        <svg class="detective-illustration" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="54" cy="45" r="20" fill="#f1c7a5"/>
          <path d="M31 39h46l-8-18H41Z" fill="#334155"/>
          <path d="M24 39h60" stroke="#1f2937" stroke-width="7" stroke-linecap="round"/>
          <path d="M20 112c3-34 15-51 34-51 18 0 31 17 34 51Z" fill="#b99162" stroke="#8a6845" stroke-width="3"/>
          <path d="M45 65 54 77 63 65M54 77v35" fill="none" stroke="#f5eadc" stroke-width="4"/>
          <circle cx="48" cy="45" r="2" fill="#333"/>
          <circle cx="61" cy="45" r="2" fill="#333"/>
          <path d="M49 54q5 4 10 0" fill="none" stroke="#a05d55" stroke-width="2" stroke-linecap="round"/>
          <circle cx="88" cy="78" r="17" fill="none" stroke="#3f5368" stroke-width="6"/>
          <path d="m100 91 14 17" stroke="#3f5368" stroke-width="7" stroke-linecap="round"/>
        </svg>`
    }
  ];
  const challenge = { formula: [[4, 5], [2, 4]], intermediate: "さんし", answer: "じゅうに" };

  const examplesElement = document.getElementById("examples");
  const challengeElement = document.getElementById("challenge");
  const status = document.getElementById("status");
  const clearPanel = document.getElementById("clearPanel");
  const resetButton = document.getElementById("resetButton");

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
      <label class="challenge">
        <span class="formula">${formulaText(challenge.formula)} ＝ ？</span>
        <input id="answerInput" class="answer-input" type="text" inputmode="text" pattern="[ぁ-ゖ]*" maxlength="4" autocomplete="off" aria-label="問題の答え">
      </label>`;
  }

  function checkAnswer(event) {
    if (event?.isComposing) return;
    const value = hiraganaOnly(answerInput.value).slice(0, 4);
    if (answerInput.value !== value) answerInput.value = value;
    const filled = value.length === 4;
    const correct = value === challenge.answer;
    answerInput.classList.toggle("correct", correct);
    answerInput.classList.toggle("wrong", filled && !correct);
    answerInput.setAttribute("aria-invalid", String(filled && !correct));
    clearPanel.hidden = !correct;
    status.classList.toggle("clear", correct);
    status.textContent = correct ? "正解です！" : filled ? "答えが違います。" : "式が表す言葉を考えてください。";
    if (correct) clearPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function reset() {
    answerInput.value = "";
    answerInput.classList.remove("correct", "wrong");
    answerInput.removeAttribute("aria-invalid");
    clearPanel.hidden = true;
    status.classList.remove("clear");
    status.textContent = "式が表す言葉を考えてください。";
    answerInput.focus();
  }

  verifyDefinitions();
  render();
  const answerInput = document.getElementById("answerInput");
  answerInput.addEventListener("input", checkAnswer);
  answerInput.addEventListener("compositionend", checkAnswer);
  resetButton.addEventListener("click", reset);
  answerInput.focus();
})();
