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
      // 出典: いらすとや「刑事・警察官のイラスト」
      // https://www.irasutoya.com/2014/07/blog-post_91.html
      illustration: '<span class="detective-crop" aria-hidden="true"><img class="detective-illustration" alt="" decoding="async"></span>'
    }
  ];
  const challenge = { formula: [[4, 5], [2, 4]], intermediate: "さんし", answer: "じゅうに" };

  const examplesElement = document.getElementById("examples");
  const challengeElement = document.getElementById("challenge");
  const status = document.getElementById("status");
  const clearPanel = document.getElementById("clearPanel");
  const closeClearScreen = document.getElementById("closeClearScreen");

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

  async function loadDetectiveIllustration() {
    const image = document.querySelector(".detective-illustration");
    if (!image) return;

    if (location.protocol === "file:") {
      image.src = "./detective.png";
      return;
    }

    try {
      const response = await fetch("./detective.png", {
        cache: "no-store",
        credentials: "same-origin"
      });
      if (!response.ok) throw new Error(`刑事イラストを読み込めませんでした: ${response.status}`);
      const objectUrl = URL.createObjectURL(await response.blob());
      image.addEventListener("load", () => URL.revokeObjectURL(objectUrl), { once: true });
      image.src = objectUrl;
    } catch {
      image.src = "./detective.png";
    }
  }

  function sanitizeInput(event) {
    if (event?.isComposing) return;
    const value = hiraganaOnly(answerInput.value).slice(0, 4);
    if (answerInput.value !== value) answerInput.value = value;
    answerInput.classList.remove("correct", "wrong");
    answerInput.removeAttribute("aria-invalid");
    clearPanel.hidden = true;
    document.body.classList.remove("clear-open");
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
    document.body.classList.toggle("clear-open", correct);
    status.classList.toggle("clear", correct);
    status.textContent = correct ? "正解です！" : value ? "答えが違います。" : "答えを入力してください。";
    if (correct) {
      sessionStorage.setItem("game4Cleared", "true");
      closeClearScreen.focus();
    }
  }

  function closeClear() {
    clearPanel.hidden = true;
    document.body.classList.remove("clear-open");
    answerInput.focus();
  }

  verifyDefinitions();
  render();
  loadDetectiveIllustration();
  const answerInput = document.getElementById("answerInput");
  const answerForm = document.getElementById("answerForm");
  answerInput.addEventListener("input", sanitizeInput);
  answerInput.addEventListener("compositionend", sanitizeInput);
  answerForm.addEventListener("submit", checkAnswer);
  closeClearScreen.addEventListener("click", closeClear);
  answerInput.focus();
})();
