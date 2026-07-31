(() => {
  const removedCharacter = "い";
  const specialId = "e3";
  const specialAnswer = "とりい";
  const finalAnswerValue = "くりえいと";
  const finalLetterCellOrder = ["3-4", "4-2", "4-3", "4-4", "5-5"];
  const finalLetterCells = new Set(finalLetterCellOrder);

  const shapes = [
    {
      rows: 7,
      cols: 8,
      cells: {
        e1: [[5, 4], [5, 5], [5, 6], [5, 7]],
        e2: [[3, 4], [4, 4], [5, 4]],
        e3: [[4, 2], [4, 3], [4, 4]],
        e4: [[3, 4], [3, 5], [3, 6]],
        e5: [[1, 5], [2, 5], [3, 5]]
      }
    },
    {
      rows: 7,
      cols: 8,
      cells: {
        e1: [[5, 4], [5, 5], [5, 6], [5, 7]],
        e2: [[3, 4], [4, 4], [5, 4]],
        e3: [[4, 2], [4, 3], [4, 4]],
        e4: [[3, 4], [3, 5], [3, 6]],
        e5: [[1, 5], [2, 5], [3, 5]]
      }
    }
  ];

  const stages = [
    {
      e1: { number: 1, clue: "いえを守るため、外側を囲むもの", answer: "がいへき" },
      e2: { number: 2, clue: "映像と音声で、物語などを表現する作品", answer: "えいが" },
      e5: {
        number: 5,
        clue: "電話・カメラ・インターネットなどの機能を持つ携帯端末",
        answer: "すまほ"
      },
      e3: {
        number: 3,
        clue: "神社の入口などに立つ、二本の柱と横木からなる門",
        answer: "とりい",
        fallbackImage: "./torii.svg"
      },
      e4: { number: 4, clue: "絵を中心に、物語や内容を伝える本", answer: "えほん" }
    },
    {
      e1: { number: 1, clue: "えを守るため、外側を囲むもの", answer: "がくぶち" },
      e2: { number: 2, clue: "映像と音声で、物語などを表現する作品", answer: "えいが" },
      e5: {
        number: 5,
        clue: "電話・カメラ・インターネットなどの機能を持つ携帯端末",
        answer: "すまほ"
      },
      e3: {
        number: 3,
        clue: "神社の入口などに立つ、二本の柱と横木からなる門",
        answer: "とりい",
        fallbackImage: "./torii.svg"
      },
      e4: { number: 4, clue: "絵を中心に、物語や内容を伝える本", answer: "えほん" }
    }
  ];

  function verifyPuzzleDefinition() {
    for (const [stageIndexToVerify, stage] of stages.entries()) {
      const shapeToVerify = shapes[stageIndexToVerify];
      for (const id of Object.keys(shapeToVerify.cells)) {
        const first = stages[0][id];
        const second = stages[1][id];
        const entry = stage[id];
        const positions = shapeToVerify.cells[id];

        if (Array.from(entry.answer).length !== positions.length) {
          throw new Error(`${id}: 第${stageIndexToVerify + 1}段階の答えの文字数とマス数が一致しません`);
        }
        if (stageIndexToVerify === 0) {
          if (first.clue.split(removedCharacter).join("") !== second.clue) {
            throw new Error(`${id}: カギから「${removedCharacter}」を消した結果が一致しません`);
          }
          const clueChanges = first.clue.includes(removedCharacter);
          if (clueChanges && first.answer === second.answer) {
            throw new Error(`${id}: カギが変わる場合は答えも変わる必要があります`);
          }
          if (!clueChanges && first.answer !== second.answer) {
            throw new Error(`${id}: カギが変わらない場合は答えも同じでなければなりません`);
          }
        }
      }
      const values = new Map();
      for (const [id, entry] of Object.entries(stage)) {
        Array.from(entry.answer).forEach((character, index) => {
          const key = shapeToVerify.cells[id][index].join("-");
          if (values.has(key) && values.get(key) !== character) {
            throw new Error(`${key}: 交差する文字が一致しません`);
          }
          values.set(key, character);
        });
      }

      const entryIds = Object.keys(shapeToVerify.cells);
      const connected = new Set([entryIds[0]]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const id of entryIds) {
          if (connected.has(id)) continue;
          const positions = new Set(shapeToVerify.cells[id].map(position => position.join("-")));
          const touchesConnectedEntry = [...connected].some(connectedId =>
            shapeToVerify.cells[connectedId].some(position => positions.has(position.join("-")))
          );
          if (touchesConnectedEntry) {
            connected.add(id);
            changed = true;
          }
        }
      }
      if (connected.size !== entryIds.length) {
        throw new Error(`第${stageIndexToVerify + 1}段階のすべての答えが交差する必要があります`);
      }
    }

    if (JSON.stringify(shapes[0]) !== JSON.stringify(shapes[1])) {
      throw new Error("第1段階と第2段階の盤面配置は同一でなければなりません");
    }

    if (!Object.values(stages[0]).some(entry => entry.clue.includes(removedCharacter))) {
      throw new Error(`少なくとも1つのカギに「${removedCharacter}」が必要です`);
    }

    const specialAnswers = Object.entries(stages[0])
      .filter(([, entry]) => entry.answer === specialAnswer);
    if (
      specialAnswers.length !== 1 ||
      specialAnswers[0][0] !== specialId ||
      !specialAnswer.includes(removedCharacter)
    ) {
      throw new Error(`特殊画像は「${specialAnswer}」1つだけでなければなりません`);
    }
  }

  verifyPuzzleDefinition();

  let stageIndex = 0;
  let entries = stages[stageIndex];
  let shape = shapes[stageIndex];
  let answerSlotKeys = Array(finalLetterCellOrder.length).fill(null);
  let selectedLetterCard = null;

  const left = document.getElementById("leftClues");
  const right = document.getElementById("rightClues");
  const board = document.getElementById("crossword");
  const stageElement = document.getElementById("crosswordStage");
  const status = document.getElementById("status");
  const letterCards = document.getElementById("letterCards");
  const answerSlots = document.getElementById("answerSlots");
  const letterCardsHint = document.getElementById("letterCardsHint");
  const resetButton = document.getElementById("resetButton");

  const inputs = new Map();
  const cards = new Map();
  const cells = new Map();
  const searches = new Map();

  const isHiragana = character => /^[ぁ-ゖ]$/.test(character);
  const clean = value => Array.from(String(value || "")).filter(isHiragana);

  function clueHtml(id) {
    const entry = entries[id];
    return `
      <div class="clue">
        <label class="clue-label" for="${id}">
          <span class="clue-number">${entry.number}</span>${entry.clue}
        </label>
        <div class="answer-wrap">
          <input id="${id}" class="answer-input" autocomplete="off" inputmode="text" pattern="[ぁ-ゖ]*" aria-describedby="hiraganaHelp" maxlength="${entry.answer.length}">
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
        if (event.isComposing) return;
        refresh();
        scheduleImage(id);
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
          element.classList.toggle("final-letter", finalLetterCells.has(key));
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
    renderLetterCards();
  }

  function finalLettersByCell() {
    const result = new Map();
    for (const key of finalLetterCellOrder) {
      const character = cells.get(key)?.letter.textContent || "";
      if (character && character !== "？") result.set(key, character);
    }
    return result;
  }

  function currentCardWord() {
    const letters = finalLettersByCell();
    if (answerSlotKeys.some(key => !key || !letters.has(key))) return "";
    return answerSlotKeys.map(key => letters.get(key)).join("");
  }

  function placeLetterCard(key, targetIndex) {
    const sourceIndex = answerSlotKeys.indexOf(key);
    if (sourceIndex === targetIndex) return;
    const displacedKey = answerSlotKeys[targetIndex];
    answerSlotKeys[targetIndex] = key;
    if (sourceIndex >= 0) answerSlotKeys[sourceIndex] = displacedKey || null;
  }

  function returnLetterCard(key) {
    const slotIndex = answerSlotKeys.indexOf(key);
    if (slotIndex >= 0) answerSlotKeys[slotIndex] = null;
  }

  function selectLetterCard(key) {
    selectedLetterCard = key;
    document.querySelectorAll(".letter-card").forEach(card => {
      const selected = card.dataset.key === key;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-pressed", String(selected));
    });
    if (key) {
      const character = finalLettersByCell().get(key);
      letterCardsHint.textContent = `「${character}」を選択中です。入れたい枠を押してください。`;
    } else {
      letterCardsHint.textContent = "カードを選び、はめたい枠を押してください。";
    }
  }

  function createLetterCard(key, character, label, slotIndex = -1) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "letter-card";
    card.textContent = character;
    card.dataset.key = key;
    card.classList.toggle("selected", selectedLetterCard === key);
    card.setAttribute("aria-pressed", String(selectedLetterCard === key));
    card.setAttribute("aria-label", label);
    card.addEventListener("click", event => {
      event.stopPropagation();
      if (slotIndex >= 0 && selectedLetterCard && selectedLetterCard !== key) {
        placeLetterCard(selectedLetterCard, slotIndex);
        selectedLetterCard = null;
        refresh();
      } else if (selectedLetterCard === key) {
        if (slotIndex >= 0) {
          returnLetterCard(key);
          selectedLetterCard = null;
          refresh();
        } else {
          selectLetterCard(null);
        }
      } else {
        selectLetterCard(key);
      }
    });
    return card;
  }

  function renderLetterCards() {
    const letters = finalLettersByCell();
    letterCards.replaceChildren();
    answerSlots.replaceChildren();

    answerSlotKeys = answerSlotKeys.map(key => key && letters.has(key) ? key : null);

    if (letters.size === 0) {
      selectedLetterCard = null;
      letterCards.classList.remove("complete");
      letterCardsHint.textContent = "囲みのマスに文字が入ると、文字カードが現れます。";
    }

    if (selectedLetterCard && !letters.has(selectedLetterCard)) selectedLetterCard = null;
    if (letters.size > 0) letterCardsHint.textContent = letters.size === finalLetterCellOrder.length
      ? "カードを選び、はめたい枠を押してください。"
      : `囲みの文字からカードを作成中です（${letters.size}/${finalLetterCellOrder.length}）。`;
    const slottedKeys = new Set(answerSlotKeys.filter(Boolean));
    finalLetterCellOrder.filter(key => letters.has(key) && !slottedKeys.has(key)).forEach(key => {
      letterCards.appendChild(createLetterCard(key, letters.get(key), `文字カード ${letters.get(key)}`));
    });

    answerSlotKeys.forEach((key, index) => {
      const slot = document.createElement("div");
      slot.className = "answer-slot";
      slot.dataset.position = String(index + 1);
      slot.tabIndex = 0;
      slot.setAttribute("role", "button");
      slot.setAttribute("aria-label", `${index + 1}番目の枠${key ? `、${letters.get(key)}` : "、空き"}`);
      if (key) slot.appendChild(createLetterCard(key, letters.get(key), `${index + 1}番目の枠の文字 ${letters.get(key)}`, index));
      slot.addEventListener("click", () => {
        if (!selectedLetterCard) return;
        placeLetterCard(selectedLetterCard, index);
        selectedLetterCard = null;
        refresh();
      });
      slot.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        slot.click();
      });
      answerSlots.appendChild(slot);
    });

    answerSlots.classList.toggle("complete", currentCardWord() === finalAnswerValue);
  }

  function allCorrect() {
    return Object.entries(entries).every(([id, entry]) => clean(inputs.get(id)?.value).join("") === entry.answer);
  }

  function refresh() {
    for (const [id, input] of inputs) {
      const entry = entries[id];
      const characters = clean(input.value);
      const sanitizedValue = characters.slice(0, entry.answer.length).join("");
      if (input.value !== sanitizedValue) input.value = sanitizedValue;

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
    const finalCorrect = currentCardWord() === finalAnswerValue;
    const cleared = stageIndex === 1 && correct && finalCorrect;

    answerSlots.classList.toggle("complete", finalCorrect);
    status.classList.toggle("clear", cleared);
    cards.get(specialId).image.title = correct && stageIndex === 0 ? "クリック" : "";

    if (cleared) {
      status.textContent = "クリア！";
    } else if (stageIndex === 1 && correct) {
      status.textContent = "クロスワードは正解です。最終欄も確認してください。";
    } else if (stageIndex === 1 && finalCorrect) {
      status.textContent = "最終欄は正解です。クロスワードも確認してください。";
    } else if (stageIndex === 0 && correct) {
      status.textContent = "クロスワードが完成しました。";
    } else if (filled) {
      status.textContent = "クロスワードの答えを確認してください。";
    } else {
      status.textContent = "カギの答えを入力してください。";
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

  function showFallbackImage(id, query) {
    const card = cards.get(id);
    const fallbackImage = entries[id].fallbackImage;
    if (!fallbackImage) return false;

    card.image.onload = () => card.figure.classList.add("ready");
    card.image.onerror = () => {
      card.figure.classList.remove("ready");
      card.placeholder.textContent = "読込失敗";
    };
    card.image.src = fallbackImage;
    card.image.alt = `${query}のイラスト`;
    card.word.textContent = query;
    card.source.hidden = true;
    card.source.removeAttribute("href");
    return true;
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
      const searchQuery = query === entry.answer && entry.imageQuery ? entry.imageQuery : query;
      card.figure.classList.remove("ready");
      card.figure.classList.add("loading");
      card.word.textContent = query;
      const hasFallback = query === entry.answer && showFallbackImage(id, query);
      state.controller = new AbortController();

      try {
        const result = await window.findWordImage(searchQuery, entry.clue, state.controller.signal);
        if (searches.get(id) !== state) return;
        card.figure.classList.remove("loading");
        if (!result) {
          if (!hasFallback) card.placeholder.textContent = "画像なし";
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
          if (!hasFallback) card.placeholder.textContent = "画像なし";
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
    answerSlotKeys = Array(finalLetterCellOrder.length).fill(null);
    selectedLetterCard = null;
    refresh();
    if (focus) inputs.get("e1")?.focus();
  }

  function activateStage2() {
    if (stageIndex !== 0 || !allCorrect()) return;

    const previousAnswers = new Map(
      [...inputs].map(([id, input]) => [id, input.value])
    );
    for (const id of inputs.keys()) cancelSearch(id);

    stageIndex = 1;
    entries = stages[stageIndex];
    shape = shapes[stageIndex];
    window.clearWordImageCache();
    renderClues();
    renderBoard();
    for (const [id, answer] of previousAnswers) {
      inputs.get(id).value = answer;
    }
    refresh();
    inputs.get("e1")?.focus();
  }

  resetButton.addEventListener("click", () => clearAll());
  renderClues();
  renderCards();
  renderBoard();
  refresh();
  inputs.get("e1")?.focus();
})();
