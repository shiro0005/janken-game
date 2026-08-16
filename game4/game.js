(() => {
  const gameNames = ["じゃんけん", "あるなしくいず", "くろすわーど"];
  const examples = [
    { formula: [[1, 4], [1, 5]], answer: "けん", illustration: '<span class="emoji-illustration" aria-hidden="true">🗡️</span>' },
    { formula: [[2, 3], [3, 3]], answer: "なす", illustration: '<span class="emoji-illustration" aria-hidden="true">🍆</span>' },
    {
      formula: [[2, 6], [2, 4], [1, 2]],
      answer: "いしゃ",
      illustration: `
        <svg class="doctor-illustration" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="37" r="21" fill="#f1c7a5"/>
          <path d="M39 34c1-18 11-26 22-26 13 0 22 10 22 27-7-2-13-7-17-14-7 8-15 12-27 13Z" fill="#384252"/>
          <path d="M25 112c2-36 15-53 35-53s33 17 35 53Z" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>
          <path d="M48 61 60 78 72 61" fill="#6aa9df"/>
          <path d="M60 78v34" stroke="#cbd5e1" stroke-width="3"/>
          <path d="M43 68v16c0 10 7 16 17 16s17-6 17-16V68" fill="none" stroke="#455a64" stroke-width="4" stroke-linecap="round"/>
          <circle cx="60" cy="100" r="6" fill="#455a64"/>
          <circle cx="60" cy="100" r="2.5" fill="#b8d8f0"/>
          <circle cx="52" cy="38" r="2" fill="#333"/>
          <circle cx="68" cy="38" r="2" fill="#333"/>
          <path d="M54 48q6 5 12 0" fill="none" stroke="#a05d55" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    }
  ];
  const challenge = { formula: [[2, 6], [1, 1], [3, 4], [2, 2]], answer: "いじわる" };

  const examplesElement = document.getElementById("examples");
  const challengeElement = document.getElementById("challenge");
  const status = document.getElementById("status");
  const clearPanel = document.getElementById("clearPanel");
  const resetButton = document.getElementById("resetButton");

  const formulaText = formula => formula.map(([game, position]) => `${game}.${position}`).join(" ＋ ");
  const solve = formula => formula.map(([game, position]) => Array.from(gameNames[game - 1])[position - 1]).join("");
  const hiraganaOnly = value => Array.from(String(value || "")).filter(character => /^[ぁ-ゖ]$/.test(character)).join("");

  function verifyDefinitions() {
    [...examples, challenge].forEach(item => {
      if (solve(item.formula) !== item.answer) throw new Error(`${formulaText(item.formula)} の答えが一致しません`);
    });
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
