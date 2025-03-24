/****************************
 *  Constants & Globals
 ****************************/
// Tuning arrays
const STANDARD_TUNING = [4, 11, 7, 2, 9, 4]; // E, B, G, D, A, E
const REVERSED_STANDARD_TUNING = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E

// Predefined Tunings dropdown options
const TUNINGS = {
  "Drop D": [4, 11, 7, 2, 9, 2],
  "Half Step Down": [3, 10, 6, 1, 8, 3],
  "Drop C": [2, 9, 5, 0, 7, 0],
  "Open G": [2, 11, 7, 2, 7, 2],
  "Open D": [2, 9, 6, 2, 9, 2],
  "DADGAD": [2, 9, 7, 2, 9, 2],
  "Drop B": [1, 8, 4, 11, 6, 11],
  "Open C": [4, 0, 7, 0, 7, 0],
  "Double Drop D": [2, 11, 7, 2, 9, 2]
};

// Global object to store custom tunings
let customTunings = {};

// Map of semitones for each note
const semitoneMap = {
  "C": 0,
  "C#/DB": 1,
  "D": 2,
  "D#/EB": 3,
  "E": 4,
  "F": 5,
  "F#/GB": 6,
  "G": 7,
  "G#/AB": 8,
  "A": 9,
  "A#/BB": 10,
  "B": 11
};

// Mapping of relative semitones to scale degrees
const SEMITONE_DEGREE_MAP = {
  0: "1",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "b6",
  9: "6",
  10: "b7",
  11: "7"
};

// Class representing a diatonic chunk
class DiatonicChunk {
  constructor(id, name, values) {
    this.id = id;
    this.name = name;
    this.values = values;
  }
}

// Define available diatonic chunks
const DIATONIC_CHUNKS = [
  new DiatonicChunk(0, "Single Note", [0]),
  new DiatonicChunk(1, "Maj Triad", [0, 4, 7]),
  new DiatonicChunk(2, "Min Triad", [0, 3, 7]),
  new DiatonicChunk(3, "Maj Pentatonic", [0, 2, 4, 7, 9]),
  new DiatonicChunk(4, "Min Pentatonic", [0, 3, 5, 7, 10]),
  new DiatonicChunk(5, "Maj Scale", [0, 2, 4, 5, 7, 9, 11]),
  new DiatonicChunk(6, "Nat Min Scale", [0, 2, 3, 5, 7, 8, 10]),
  new DiatonicChunk(7, "Blues Scale", [0, 3, 5, 6, 7, 10]),
  new DiatonicChunk(8, "Dominant 7", [0, 4, 7, 10]),
];

// Define available root notes and colors
const ROOT_NOTES = Object.keys(semitoneMap);
const AVAILABLE_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

// Custom tuning (if any)
let customTuning = null;
let tuning = customTuning ? customTuning : STANDARD_TUNING;

// We'll build highlightRows on the fly from the current dropdown sets.
let highlightRows = []; // each entry: { rootSemitone, chunk, color, showScaleDegrees, showNoteName }

/****************************
 *  Helper Functions
 ****************************/
function getNoteNameFromValue(value) {
  const normalized = ((value % 12) + 12) % 12;
  for (const note in semitoneMap) {
    if (semitoneMap[note] === normalized) {
      return note;
    }
  }
  return "?";
}

function setTuning(newTuning) {
  tuning = newTuning;
  console.log("Tuning updated to:", tuning);
}

/****************************
 *  Local Storage Functions
 ****************************/
function loadCustomTunings() {
  const stored = localStorage.getItem("customTunings");
  if (stored) {
    customTunings = JSON.parse(stored);
  } else {
    customTunings = {};
  }
}

function saveCustomTunings() {
  localStorage.setItem("customTunings", JSON.stringify(customTunings));
}

function updateTuningsDropdown() {
  const tuningDropdown = document.getElementById("tunings-dropdown");
  tuningDropdown.innerHTML = "";
  // Add predefined tunings
  for (const tuningName in TUNINGS) {
    const option = document.createElement("option");
    option.value = tuningName;
    option.textContent = tuningName;
    tuningDropdown.appendChild(option);
  }
  // Add custom tunings
  for (const tuningName in customTunings) {
    const option = document.createElement("option");
    option.value = tuningName;
    option.textContent = tuningName;
    tuningDropdown.appendChild(option);
  }
}

/****************************
 *  getHighlightForFretValue
 ****************************/
function getHighlightForFretValue(fretValue) {
  let result = null;
  // Later rows override earlier ones.
  highlightRows.forEach((row) => {
    let difference = (fretValue - row.rootSemitone) % 12;
    difference = (difference + 12) % 12;
    if (row.chunk.values.includes(difference)) {
      let noteName = getNoteNameFromValue(fretValue);
      result = { 
        color: row.color, 
        showScaleDegrees: row.showScaleDegrees, 
        showNoteName: row.showNoteName,
        degree: SEMITONE_DEGREE_MAP[difference],
        noteName: noteName
      };
    }
  });
  return result;
}

/****************************
 *  Create a Single String Row
 ****************************/
function createStringRow(value, interactive, index, customLabel) {
  const row = document.createElement("div");
  row.classList.add("string-row");
  if (!interactive) {
    row.classList.add("extra");
  }
  
  const labelContainer = document.createElement("div");
  labelContainer.classList.add("string-label-container");
  
  const arrowContainer = document.createElement("div");
  arrowContainer.classList.add("arrow-container");
  
  const upArrow = document.createElement("div");
  upArrow.textContent = "▲";
  upArrow.classList.add("arrow");
  
  const downArrow = document.createElement("div");
  downArrow.textContent = "▼";
  downArrow.classList.add("arrow");
  
  const stringLabel = document.createElement("div");
  stringLabel.classList.add("string-label");
  stringLabel.textContent = (customLabel !== undefined)
    ? customLabel
    : getNoteNameFromValue(value);

  if (interactive) {
    upArrow.addEventListener("click", () => {
      tuning[index] = (tuning[index] + 1) % 12;
      stringLabel.textContent = getNoteNameFromValue(tuning[index]);
      createFretboard(getExtraAbove(), getExtraBelow());
    });
    downArrow.addEventListener("click", () => {
      tuning[index] = (tuning[index] + 11) % 12;
      stringLabel.textContent = getNoteNameFromValue(tuning[index]);
      createFretboard(getExtraAbove(), getExtraBelow());
    });
  } else {
    upArrow.classList.add("hide-arrow");
    downArrow.classList.add("hide-arrow");
  }
  
  arrowContainer.appendChild(upArrow);
  arrowContainer.appendChild(downArrow);
  labelContainer.appendChild(arrowContainer);
  labelContainer.appendChild(stringLabel);
  row.appendChild(labelContainer);
  
  let baseValue;
  if (customLabel !== undefined) {
    let note = customLabel.toUpperCase();
    baseValue = semitoneMap[note] !== undefined ? semitoneMap[note] : 0;
  } else {
    baseValue = value;
  }

  const numFrets = 18;
  for (let f = 1; f <= numFrets; f++) {
    const fret = document.createElement("div");
    fret.classList.add("fret");
    const fretValue = baseValue + f;
    fret.setAttribute("data-fret-value", fretValue);
    
    const highlight = getHighlightForFretValue(fretValue);
    if (highlight) {
      const highlightCircle = document.createElement("div");
      highlightCircle.classList.add("fret-highlight");
      highlightCircle.style.backgroundColor = highlight.color;
      fret.appendChild(highlightCircle);
      if (highlight.showScaleDegrees) {
        const degreeText = document.createElement("span");
        degreeText.textContent = highlight.degree;
        degreeText.classList.add("fret-scale-text");
        fret.appendChild(degreeText);
      } else if (highlight.showNoteName) {
        const noteNameText = document.createElement("span");
        noteNameText.textContent = highlight.noteName;
        noteNameText.classList.add("fret-scale-text");
        fret.appendChild(noteNameText);
      }
    }

    row.appendChild(fret);
  }
  
  return row;
}

/****************************
 *  Build the Fretboard
 ****************************/
function createFretboard(extraAbove = 5, extraBelow = 5) {
  const fretboard = document.getElementById("fretboard");
  fretboard.innerHTML = "";
  
  const mainLabels = tuning.map(getNoteNameFromValue);
  let cycle;
  if (mainLabels[0] === mainLabels[mainLabels.length - 1]) {
    cycle = mainLabels.slice(0, mainLabels.length - 1);
  } else {
    cycle = mainLabels.slice();
  }
  
  const reverseCycle = cycle.slice().reverse();

  for (let i = 0; i < extraAbove; i++) {
    const label = reverseCycle[i % reverseCycle.length];
    const row = createStringRow(0, false, undefined, label);
    fretboard.insertBefore(row, fretboard.firstChild);
  }

  tuning.forEach((value, index) => {
    const row = createStringRow(value, true, index);
    fretboard.appendChild(row);
  });
  
  const bottomLabel = mainLabels[mainLabels.length - 1];
  const bottomIndexInCycle = cycle.indexOf(bottomLabel);
  for (let i = 1; i <= extraBelow; i++) {
    const labelIndex = (bottomIndexInCycle + i) % cycle.length;
    const label = cycle[labelIndex];
    const row = createStringRow(0, false, undefined, label);
    fretboard.appendChild(row);
  }
}

/****************************
 *  Extra Rows: Helpers
 ****************************/
function getExtraAbove() {
  const toggle = document.getElementById("extra-rows-toggle");
  if (toggle.checked) {
    return parseInt(document.getElementById("rows-above").value) || 0;
  }
  return 0;
}

function getExtraBelow() {
  const toggle = document.getElementById("extra-rows-toggle");
  if (toggle.checked) {
    return parseInt(document.getElementById("rows-below").value) || 0;
  }
  return 0;
}

/****************************
 *  Highlight Dropdowns
 ****************************/
function createHighlightRow() {
  const container = document.createElement("div");
  container.classList.add("highlight-row");
  
  // Reorder container with up/down arrows
  const reorderContainer = document.createElement("div");
  reorderContainer.classList.add("reorder-container");
  
  const upArrow = document.createElement("button");
  upArrow.textContent = "↑";
  upArrow.classList.add("reorder-button");
  upArrow.addEventListener("click", () => {
    const currentRow = container;
    const parent = currentRow.parentElement;
    const previous = currentRow.previousElementSibling;
    if (previous) {
      parent.insertBefore(currentRow, previous);
    }
  });
  
  const downArrow = document.createElement("button");
  downArrow.textContent = "↓";
  downArrow.classList.add("reorder-button");
  downArrow.addEventListener("click", () => {
    const currentRow = container;
    const parent = currentRow.parentElement;
    const next = currentRow.nextElementSibling;
    if (next) {
      parent.insertBefore(next, currentRow);
    }
  });
  
  reorderContainer.appendChild(upArrow);
  reorderContainer.appendChild(downArrow);
  
  // Remove button
  const removeButton = document.createElement("button");
  removeButton.textContent = "Remove";
  removeButton.classList.add("remove-button");
  removeButton.addEventListener("click", () => {
    container.remove();
  });
  
  container.appendChild(reorderContainer);
  container.appendChild(removeButton);
  
  // Root dropdown
  const rootDiv = document.createElement("div");
  const rootLabel = document.createElement("label");
  rootLabel.textContent = "Root: ";
  const rootSelect = document.createElement("select");
  rootSelect.classList.add("root-dropdown");
  ROOT_NOTES.forEach(note => {
    const option = document.createElement("option");
    option.value = note;
    option.textContent = note;
    rootSelect.appendChild(option);
  });
  rootLabel.appendChild(rootSelect);
  rootDiv.appendChild(rootLabel);
  
  // Chunk dropdown
  const chunkDiv = document.createElement("div");
  const chunkLabel = document.createElement("label");
  chunkLabel.textContent = "Chunk: ";
  const chunkSelect = document.createElement("select");
  chunkSelect.classList.add("chunk-dropdown");
  DIATONIC_CHUNKS.forEach(chunk => {
    const option = document.createElement("option");
    option.value = chunk.id;
    option.textContent = chunk.name;
    chunkSelect.appendChild(option);
  });
  chunkLabel.appendChild(chunkSelect);
  chunkDiv.appendChild(chunkLabel);
  
  // Color dropdown
  const colorDiv = document.createElement("div");
  const colorLabel = document.createElement("label");
  colorLabel.textContent = "Color: ";
  const colorSelect = document.createElement("select");
  colorSelect.classList.add("color-dropdown");
  AVAILABLE_COLORS.forEach(color => {
    const option = document.createElement("option");
    option.value = color;
    option.textContent = color[0].toUpperCase() + color.slice(1);
    colorSelect.appendChild(option);
  });
  colorLabel.appendChild(colorSelect);
  colorDiv.appendChild(colorLabel);
  
  container.appendChild(rootDiv);
  container.appendChild(chunkDiv);
  container.appendChild(colorDiv);
  
  // Initialize checkbox states
  container.dataset.showScaleDegrees = "false";
  container.dataset.showNoteName = "false";

  // "Scale Degrees" checkbox
  const scaleContainer = document.createElement("div");
  scaleContainer.classList.add("scale-container");
  const scaleCheckbox = document.createElement("input");
  scaleCheckbox.type = "checkbox";
  scaleCheckbox.classList.add("scale-checkbox");
  const scaleLabel = document.createElement("label");
  scaleLabel.textContent = "Scale Degrees";
  scaleContainer.appendChild(scaleCheckbox);
  scaleContainer.appendChild(scaleLabel);
  
  // "Note Name" checkbox
  const noteNameContainer = document.createElement("div");
  noteNameContainer.classList.add("note-name-container");
  const noteNameCheckbox = document.createElement("input");
  noteNameCheckbox.type = "checkbox";
  noteNameCheckbox.classList.add("note-name-checkbox");
  const noteNameLabel = document.createElement("label");
  noteNameLabel.textContent = "Note Name";
  noteNameContainer.appendChild(noteNameCheckbox);
  noteNameContainer.appendChild(noteNameLabel);
  
  // Enforce mutual exclusivity
  scaleCheckbox.addEventListener("change", () => {
    if (scaleCheckbox.checked) {
      noteNameCheckbox.checked = false;
      container.dataset.showNoteName = "false";
    }
    container.dataset.showScaleDegrees = scaleCheckbox.checked ? "true" : "false";
  });
  
  noteNameCheckbox.addEventListener("change", () => {
    if (noteNameCheckbox.checked) {
      scaleCheckbox.checked = false;
      container.dataset.showScaleDegrees = "false";
    }
    container.dataset.showNoteName = noteNameCheckbox.checked ? "true" : "false";
  });
  
  container.appendChild(scaleContainer);
  container.appendChild(noteNameContainer);
  
  return container;
}

function addHighlightDropdownRow() {
  const container = document.getElementById("highlight-rows-container");
  const newRow = createHighlightRow();
  container.appendChild(newRow);
}

function applyHighlights() {
  // Clear previous highlightRows
  highlightRows = [];
  const rows = document.querySelectorAll(".highlight-row");
  rows.forEach(row => {
    const rootVal = row.querySelector(".root-dropdown").value;
    const chunkId = parseInt(row.querySelector(".chunk-dropdown").value, 10);
    const color = row.querySelector(".color-dropdown").value;
    const rootSemitone = semitoneMap[rootVal.toUpperCase()] || 0;
    const chunkObj = DIATONIC_CHUNKS.find(c => c.id === chunkId);
    const showScaleDegrees = row.dataset.showScaleDegrees === "true";
    const showNoteName = row.dataset.showNoteName === "true";
    if (chunkObj) {
      highlightRows.push({
        rootSemitone: rootSemitone,
        chunk: chunkObj,
        color: color,
        showScaleDegrees: showScaleDegrees,
        showNoteName: showNoteName
      });
    }
  });
  console.log("Applying highlights:", highlightRows);
  createFretboard(getExtraAbove(), getExtraBelow());
}

/****************************
 *  DOM Ready
 ****************************/
document.addEventListener("DOMContentLoaded", function() {
  // Load custom tunings and populate tunings dropdown
  loadCustomTunings();
  updateTuningsDropdown();
  
  // Tunings apply button event
  document.getElementById("apply-tuning-button").addEventListener("click", () => {
    const tuningDropdown = document.getElementById("tunings-dropdown");
    const selectedTuningName = tuningDropdown.value;
    let newTuning = TUNINGS[selectedTuningName];
    if (!newTuning) {
      newTuning = customTunings[selectedTuningName];
    }
    if (newTuning) {
      setTuning(newTuning);
      createFretboard(getExtraAbove(), getExtraBelow());
    }
  });
  
  // Save current tuning button event
  document.getElementById("save-tuning-button").addEventListener("click", () => {
    const nameInput = document.getElementById("custom-tuning-name");
    const name = nameInput.value.trim();
    if (!name) {
      alert("Please enter a name for your tuning.");
      return;
    }
    // Save the current tuning (clone the tuning array)
    customTunings[name] = tuning.slice();
    saveCustomTunings();
    updateTuningsDropdown();
    nameInput.value = "";
  });
  
  // Remove tuning button event
  document.getElementById("remove-tuning-button").addEventListener("click", () => {
    const tuningDropdown = document.getElementById("tunings-dropdown");
    const selectedTuningName = tuningDropdown.value;
    // Only remove if it's a custom tuning
    if (TUNINGS[selectedTuningName] !== undefined) {
      alert("Predefined tunings cannot be removed.");
      return;
    }
    delete customTunings[selectedTuningName];
    saveCustomTunings();
    updateTuningsDropdown();
  });
  
  // Extra rows toggle and apply
  const toggle = document.getElementById("extra-rows-toggle");
  const extraRowsInput = document.getElementById("extra-rows-input");
  
  toggle.addEventListener("change", () => {
    extraRowsInput.style.display = toggle.checked ? "block" : "none";
    createFretboard(getExtraAbove(), getExtraBelow());
  });
  
  document.getElementById("apply-extra-rows").addEventListener("click", () => {
    createFretboard(getExtraAbove(), getExtraBelow());
  });
  
  // Create an initial highlight dropdown row
  const container = document.getElementById("highlight-rows-container");
  container.appendChild(createHighlightRow());
  
  // Add row and apply button events
  document.getElementById("add-row-button").addEventListener("click", addHighlightDropdownRow);
  document.getElementById("apply-button").addEventListener("click", applyHighlights);
  
  // Initial fretboard render
  createFretboard(getExtraAbove(), getExtraBelow());
});

