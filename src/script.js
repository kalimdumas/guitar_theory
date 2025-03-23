/****************************
 *  Constants & Globals
 ****************************/
// Tuning arrays
const STANDARD_TUNING = [4, 11, 7, 2, 9, 4]; // E, B, G, D, A, E
const REVERSED_STANDARD_TUNING = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E

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
  new DiatonicChunk(4, "Min Pentatonic", [0, 3, 5, 7, 10])
];

// Define available root notes and colors
const ROOT_NOTES = Object.keys(semitoneMap);
const AVAILABLE_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

// Custom tuning (if any)
let customTuning = null;
let tuning = customTuning ? customTuning : STANDARD_TUNING;

// We'll build highlightRows on the fly from the current dropdown sets.
let highlightRows = []; // each entry: { rootSemitone, chunk, color, showScaleDegrees }

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
 *  getHighlightForFretValue
 ****************************/
function getHighlightForFretValue(fretValue) {
  let result = null;
  // Later rows override earlier ones.
  highlightRows.forEach((row) => {
    let difference = (fretValue - row.rootSemitone) % 12;
    difference = (difference + 12) % 12;
    if (row.chunk.values.includes(difference)) {
      result = { 
        color: row.color, 
        showScaleDegrees: row.showScaleDegrees, 
        degree: SEMITONE_DEGREE_MAP[difference]
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
  
  // "Scale Degrees" checkbox
  container.dataset.showScaleDegrees = "false"; // initial state
  const scaleContainer = document.createElement("div");
  scaleContainer.classList.add("scale-container");
  const scaleCheckbox = document.createElement("input");
  scaleCheckbox.type = "checkbox";
  scaleCheckbox.classList.add("scale-checkbox");
  scaleCheckbox.addEventListener("change", () => {
    container.dataset.showScaleDegrees = scaleCheckbox.checked ? "true" : "false";
  });
  const scaleLabel = document.createElement("label");
  scaleLabel.textContent = "Scale Degrees";
  scaleContainer.appendChild(scaleCheckbox);
  scaleContainer.appendChild(scaleLabel);
  container.appendChild(scaleContainer);
  
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
    if (chunkObj) {
      highlightRows.push({
        rootSemitone: rootSemitone,
        chunk: chunkObj,
        color: color,
        showScaleDegrees: showScaleDegrees
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

