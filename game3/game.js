(() => {
  const removedCharacter = "し";
  const specialId = "e1";

  const shape = {
    rows: 7,
    cols: 7,
    cells: {
      e1: [[3, 2], [3, 3], [3, 4]],
      e2: [[3, 2], [4, 2], [5, 2]],
      e3: [[3, 3], [4, 3]],
      e4: [[3, 4], [4, 4], [5, 4]],
      e5: [[4, 4], [4, 5]]
    }
  };

  const stages = [
    {
      e1: { number: 1, clue: "棒で打つとしなるもの", answer: "しない" },
      e2: { number: 2, clue: "白くて、すしに入っているもの", answer: "しゃり" },
      e3: { number: 3, clue: "二文字で、織ってしきものを作る材料", answer: "なわ" },
      e4: { number: 4, clue: "すしの材料になる小さなもの", answer: "いくら" },
      e5: { number: 5, clue: "二文字で、しろの中にあるもの", answer: "くら" }
    },
    {
      e1: { number: 1, clue: "棒で打つとなるもの", answer: "たいこ" },
      e2: { number: 2, clue: "白くて、すに入っているもの", answer: "たまご" },
      e3: { number: 3, clue: "二文字で、織ってきものを作る材料", answer: "いと" },
      e4: { number: 4, clue: "すの材料になる小さなもの", answer: "こえだ" },
      e5: { number: 5, clue: "二文字で、ろの中にあるもの", answer: "えだ" }
    }
  ];

  function verifyPuzzleDefinition() {
    for (const id of Object.keys(shape.cells)) {
      const first = stages[0][id];
      const second = stages[1][id];
      const positions = shape.cells[id];

      if (first.clue.split(removedCharacter).join("") !== second.clue) {
        throw new Error(`${id}: カギから「${removedCharacter}」を消した結果が一致しません`);
      }
      if (Array.from(first.answer).length !== positions.length || Array.from(second.answer).length !== positions.length) {
        throw new Error(`${id}: 答えの文字数とマス数が一致しません`);
      }
    }

    for (const stage of stages) {
      const values = new Map();
      for (const [id, entry] of Object.entries(stage)) {
        Array.from(entry.answer).forEach((character, index) => {
          const key = shape.cells[id][index].join("-");
          if (values.has(key) && values.get(key) !== character) {
            throw new Error(`${key}: 交差する文字が一致しません`);
          }
          values.set(key, character);
        });
      }
    }
  }

  verifyPuzzleDefinition();

  let stageIndex = 0;
  let entries = stages[stageIndex];

  const left = document.getElementById("leftClues");
  const right = document.getElementById("rightClues");
  const board = document.getElementById("crossword");
  const stageElement = document.getElementById("crosswordStage");
  const status = document.getElementById("status");
  const resetButton = document.getElementById("resetButton");

  const inputs = new Map();
  const cards = new Map();
  const cells = new Map();
  const searches = new Map();

  const clean = value => Array.from(String(value || "").replace(/[\s　]/g, ""));

  function clueHtml(id) {
    const entry = entries[id];
    return `
      <div class="clue">
        <label class="clue-label" for="${id}">
          <span class="clue-number">${entry.number}</span>${entry.clue}
        </label>
        <div class="answer-wrap">
          <input id="${id}" class="answer-input" autocomplete="off" maxlength="${entry.answer.length}">
          <span id="count-${id}" class="char-count">0/${entry.answer.length}</span>
        </div>
      </div>
    `;
  }

  function renderClues() {
    left.innerHTML = ["e1", "e3", "e5"].map(clueHtml).join("");
    right.innerHTML = ["e2", "e4"].map(clueHtml).join("");
    inputs.clear();

    for (const id of Object.keys(entries)) {
      const input = document.getElementById(id);
      inputs.set(id, input);
      input.addEventListener("input", event => {
        refresh();
        if (!event.isComposing) scheduleImage(id);
      });
      input.addEventListener("compositionend", () => {
        refresh();
        scheduleImage(id);
      });
    }
  }

  function renderCards() {
    for (const id of Object.keys(entries)) {
      const entry = entries[id];
      const figure = document.createElement("figure");
      figure.className = `image-card ${id}${id === specialId ? " secret" : ""}`;
      figure.innerHTML = `
        <div class="image-frame">
          <img alt="" decoding="async" referrerpolicy="no-referrer">
          <span class="image-placeholder">${entry.answer.length}文字で表示</span>
          <span class="spinner"></span>
        </div>
        <figcaption>
          <span class="clue-number">${entry.number}</span>
          <span class="image-word">未入力</span>
          <a class="image-source" target="_blank" rel="noopener noreferrer" hidden>出典</a>
        </figcaption>
      `;
      stageElement.appendChild(figure);
      cards.set(id, {
        figure,
        image: figure.querySelector("img"),
        placeholder: figure.querySelector(".image-placeholder"),
        word: figure.querySelector(".image-word"),
        source: figure.querySelector("a")
      });
    }

    cards.get(specialId).image.addEventListener("click", activateStage2);
  }

  function renderBoard() {
    board.replaceChildren();
    cells.clear();
    board.style.gridTemplateColumns = `repeat(${shape.cols}, minmax(36px, 50px))`;
    board.style.gridTemplateRows = `repeat(${shape.rows}, minmax(36px, 50px))`;

    const active = new Set();
    const numbers = new Map();

    for (const id of Object.keys(shape.cells)) {
      const positions = shape.cells[id];
      positions.forEach(([row, column]) => active.add(`${row}-${column}`));
      const startKey = positions[0].join("-");
      if (!numbers.has(startKey)) numbers.set(startKey, []);
      numbers.get(startKey).push(entries[id].number);
    }

    for (let row = 0; row < shape.rows; row += 1) {
      for (let column = 0; column < shape.cols; column += 1) {
        const key = `${row}-${column}`;
        const element = document.createElement("div");
        element.className = active.has(key) ? "cell" : "cell block";

        if (active.has(key)) {
          if (numbers.has(key)) {
            const number = document.createElement("span");
            number.className = "cell-number";
            number.textContent = numbers.get(key).join("/");
            element.appendChild(number);
          }
          const letter = document.createElement("span");
          element.appendChild(letter);
          cells.set(key, { element, letter });
        }

        board.appendChild(element);
      }
    }
  }

  function updateBoard() {
    const valuesByCell = new Map();

    for (const [id, entry] of Object.entries(entries)) {
      const characters = clean(inputs.get(id)?.value);
      shape.cells[id].forEach((position, index) => {
        const character = characters[index];
        if (!character) return;
        const key = position.join("-");
        if (!valuesByCell.has(key)) valuesByCell.set(key, []);
        valuesByCell.get(key).push(character);
      });
    }

    for (const [key, { element, letter }] of cells) {
      const values = [...new Set(valuesByCell.get(key) || [])];
      element.classList.toggle("conflict", values.length > 1);
      letter.textContent = values.length === 0 ? "" : values.length === 1 ? values[0] : "？";
    }
  }

  function allCorrect() {
    return Object.entries(entries).every(([id, entry]) => {
      return clean(inputs.get(id)?.value).join("") === entry.answer;
    });
  }

  function refresh() {
    for (const [id, input] of inputs) {
      const entry = entries[id];
      const characters = clean(input.value);
      if (characters.length > entry.answer.length) {
        input.value = characters.slice(0, entry.answer.length).join("");
      }

      const current = clean(input.value);
      const filled = current.length === entry.answer.length;
      const correct = current.join("") === entry.answer;
      document.getElementById(`count-${id}`).textContent = `${current.length}/${entry.answer.length}`;
      input.classList.toggle("complete", filled && correct);
      input.classList.toggle("wrong", filled && !correct);
    }

    updateBoard();

    const correct = allCorrect();
    const filled = [...inputs].every(([id, input]) => clean(input.value).length === entries[id].answer.length);
    status.classList.toggle("clear", correct && stageIndex === 1);
    cards.get(specialId).image.title = correct && stageIndex === 0 ? "クリック" : "";

    if (correct) {
      status.textContent = stageIndex === 0
        ? "クロスワードは完成しました。ただし、まだ終わりではありません。"
        : "クリア！ 『し』が消えた後のクロスワードも完成です。";
    } else if (stageIndex === 1) {
      status.textContent = "『し』が消えたカギで、同じ形のクロスワードを完成させてください。";
    } else if (filled) {
      status.textContent = "交差する文字や答えをもう一度確認してください。";
    } else {
      status.textContent = "カギの入力欄は、指定された文字数まで入力できます。";
    }
  }

  function cancelSearch(id) {
    const state = searches.get(id);
    if (!state) return;
    clearTimeout(state.timer);
    state.controller?.abort();
    searches.delete(id);
  }

  function emptyCard(id) {
    const card = cards.get(id);
    const entry = entries[id];
    card.figure.classList.remove("loading", "ready");
    card.image.removeAttribute("src");
    card.placeholder.textContent = `${entry.answer.length}文字で表示`;
    card.word.textContent = "未入力";
    card.source.hidden = true;
    card.source.removeAttribute("href");
  }

  function scheduleImage(id) {
    cancelSearch(id);
    const entry = entries[id];
    const query = clean(inputs.get(id).value).join("");

    if (query.length !== entry.answer.length) {
      emptyCard(id);
      return;
    }

    const state = { timer: 0, controller: null };
    searches.set(id, state);
    state.timer = setTimeout(async () => {
      const card = cards.get(id);
      card.figure.classList.remove("ready");
      card.figure.classList.add("loading");
      card.word.textContent = query;
      state.controller = new AbortController();

      try {
        const result = await window.findWordImage(query, entry.clue, state.controller.signal);
        if (searches.get(id) !== state) return;
        card.figure.classList.remove("loading");

        if (!result) {
          card.placeholder.textContent = "画像なし";
          return;
        }

        card.image.onload = () => card.figure.classList.add("ready");
        card.image.onerror = () => {
          card.figure.classList.remove("ready");
          card.placeholder.textContent = "読込失敗";
        };
        card.image.src = result.imageUrl;
        card.image.alt = `${query}の検索画像`;
        card.source.href = result.pageUrl;
        card.source.textContent = result.sourceName;
        card.source.hidden = false;
      } catch {
        if (searches.get(id) === state) {
          card.figure.classList.remove("loading");
          card.placeholder.textContent = "画像なし";
        }
      } finally {
        if (searches.get(id) === state) searches.delete(id);
      }
    }, 500);
  }

  function clearAll(focus = true) {
    for (const [id, input] of inputs) {
      cancelSearch(id);
      input.value = "";
      emptyCard(id);
    }
    refresh();
    if (focus) inputs.get("e1")?.focus();
  }

  function activateStage2() {
    if (stageIndex !== 0 || !allCorrect()) return;
    stageIndex = 1;
    entries = stages[stageIndex];
    window.clearWordImageCache();
    renderClues();
    clearAll(false);
    status.textContent = "カギから『し』が消えました。パズルの形はそのままで、答えが変わっています。";
    inputs.get("e1")?.focus();
  }

  resetButton.addEventListener("click", () => clearAll());
  renderClues();
  renderCards();
  renderBoard();
  refresh();
  inputs.get("e1")?.focus();
})();
