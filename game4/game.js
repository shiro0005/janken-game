(() => {
  const gameNames = ["じゃんけん", "あるなしくいず", "くろすわーど"];
  const examples = [
    { formula: [[1, 4], [1, 5]], answer: "けん", label: "剣", icon: "🗡️" },
    { formula: [[2, 3], [3, 3]], answer: "なす", label: "なす", icon: "🍆" },
    { formula: [[2, 6], [2, 4], [1, 2]], answer: "いしゃ", label: "医者", icon: "🧑‍⚕️" }
  ];
  const challenges = [
    { formula: [[3, 4], [2, 4]], answer: "わし" },
    { formula: [[2, 6], [3, 4], [2, 4]], answer: "いわし" },
    { formula: [[2, 4], [1, 3], [3, 4]], answer: "しんわ" }
  ];

  const gameWords = document.getElementById("gameWords");
  const examplesElement = document.getElementById("examples");
  const challengesElement = document.getElementById("challenges");
  const status = document.getElementById("status");
  const clearPanel = document.getElementById("clearPanel");
  const resetButton = document.getElementById("resetButton");
  const inputs = [];

  const formulaText = formula => formula.map(([game, position]) => `${game}.${position}`).join(" ＋ ");
  const solve = formula => formula.map(([game, position]) => Array.from(gameNames[game - 1])[position - 1]).join("");
  const hiraganaOnly = value => Array.from(String(value || "")).filter(character => /^[ぁ-ゖ]$/.test(character)).join("");

  function verifyDefinitions() {
    [...examples, ...challenges].forEach(item => {
      if (solve(item.formula) !== item.answer) throw new Error(`${formulaText(item.formula)} の答えが一致しません`);
    });
  }

  function renderGameWords() {
    gameWords.innerHTML = gameNames.map((name, gameIndex) => `
      <div class="game-word">
        <div class="game-word-name">ゲーム${gameIndex + 1}<br>${name}</div>
        <div class="letter-row">
          ${Array.from(name).map((letter, index) => `<span class="indexed-letter"><small>${gameIndex + 1}.${index + 1}</small>${letter}</span>`).join("")}
        </div>
      </div>
    `).join("");
  }

  function renderExamples() {
    examplesElement.innerHTML = examples.map(item => `
      <div class="example">
        <div class="formula">${formulaText(item.formula)} ＝</div>
        <div class="example-answer"><span class="example-icon" aria-hidden="true">${item.icon}</span><span>${item.answer}（${item.label}）</span></div>
      </div>
    `).join("");
  }

  function renderChallenges() {
    challengesElement.innerHTML = challenges.map((item, index) => `
      <label class="challenge">
        <span class="formula">${index + 1}.　${formulaText(item.formula)} ＝</span>
        <input class="answer-input" type="text" inputmode="text" pattern="[ぁ-ゖ]*" maxlength="${Array.from(item.answer).length}" autocomplete="off" aria-label="問題${index + 1}の答え">
      </label>
    `).join("");

    challengesElement.querySelectorAll(".answer-input").forEach((input, index) => {
      inputs.push(input);
      input.addEventListener("input", event => {
        if (event.isComposing) return;
        checkAnswers();
      });
      input.addEventListener("compositionend", checkAnswers);
    });
  }

  function checkAnswers() {
    inputs.forEach((input, index) => {
      const value = hiraganaOnly(input.value).slice(0, Array.from(challenges[index].answer).length);
      if (input.value !== value) input.value = value;
      const filled = value.length === Array.from(challenges[index].answer).length;
      const correct = value === challenges[index].answer;
      input.classList.toggle("correct", correct);
      input.classList.toggle("wrong", filled && !correct);
      input.setAttribute("aria-invalid", String(filled && !correct));
    });

    const correctCount = inputs.filter((input, index) => input.value === challenges[index].answer).length;
    const cleared = correctCount === challenges.length;
    clearPanel.hidden = !cleared;
    status.classList.toggle("clear", cleared);
    status.textContent = cleared ? "すべて正解です！" : `${correctCount}/${challenges.length}問正解`;
    if (cleared) clearPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function reset() {
    inputs.forEach(input => {
      input.value = "";
      input.classList.remove("correct", "wrong");
      input.removeAttribute("aria-invalid");
    });
    clearPanel.hidden = true;
    status.classList.remove("clear");
    status.textContent = "3つの式を解いてください。";
    inputs[0]?.focus();
  }

  verifyDefinitions();
  renderGameWords();
  renderExamples();
  renderChallenges();
  resetButton.addEventListener("click", reset);
  inputs[0]?.focus();
})();
