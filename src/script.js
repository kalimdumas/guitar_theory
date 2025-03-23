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

// Class representing a diatonic chunk (like a major triad or a pentatonic scale)
class DiatonicChunk {
  constructor(id, name, values) {
    this.id = id;         // integer ID
    this.name = name;     // user-friendly name
    this.values = values; // array of semitones relative to the root
  }
}

// Define available diatonic chunks
const DIATONIC_CHUNKS = [
  new DiatonicChunk(0, "Single Note", [0]),
  new DiatonicChunk(1, "Maj Triad", [0, 4, 7]),
  new DiatonicChunk(2, "Min Triad", [0, 3, 7]),
  new DiatonicChunk(3, "Maj Pentatonic", [0, 2, 4, 7, 9]),
  new DiatonicChunk(4, "Min Pentatonic", [0, 3, 5, 7, 10])
  // Add or remove more as needed
];

// Define available root notes (12 semitones). 
// Each key in `semitoneMap` can be used as the dropdown label.
const ROOT_NOTES = Object.keys(semitoneMap);

// Define some example colors
const AVAILABLE_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

// Custom tuning (if any)
let customTuning = null;
let tuning = customTuning ? customTuning : STANDARD_TUNING;

// We no longer use a single highlightSemitone. Instead, we allow multiple highlights.
let highlightRows = []; // Each entry: { rootSemitone, chunk, color }

/****************************
 *  Helper Functions
 ****************************/
// Convert numeric semitone to note name (for display if needed)
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
 *  getColorForFretValue
 *  Determines which color (if any) should highlight this fret,
 *  based on the user's highlightRows.
 ****************************/
function getColorForFretValue(fretValue) {
  let color = null;
  // If multiple highlight rows match, we use the last match’s color
  highlightRows.forEach((row) => {
    // row.rootSemitone + each value in row.chunk.values
    // We check if (fretValue - root) % 12 is in row.chunk.values
    let difference = (fretValue - row.rootSemitone) % 12;
    difference = (difference + 12) % 12; // ensure positive
    if (row.chunk.values.includes(difference)) {
      color = row.color;
    }
  });
  return color;
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
  
  // Label container
  const labelContainer = document.createElement("div");
  labelContainer.classList.add("string-label-container");
  
  // Arrows
  const arrowContainer = document.createElement("div");
  arrowContainer.classList.add("arrow-container");
  
  const upArrow = document.createElement("div");
  upArrow.textContent = "▲";
  upArrow.classList.add("arrow");
  
  const downArrow = document.createElement("div");
  downArrow.textContent = "▼";
  downArrow.classList.add("arrow");
  
  // Label text
  const stringLabel = document.createElement("div");
  stringLabel.classList.add("string-label");
  stringLabel.textContent = (customLabel !== undefined)
    ? customLabel
    : getNoteNameFromValue(value);

  // Only interactive if it's part of the main tuning
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
    // Hide arrows if it's an extra row
    upArrow.classList.add("hide-arrow");
    downArrow.classList.add("hide-arrow");
  }
  
  arrowContainer.appendChild(upArrow);
  arrowContainer.appendChild(downArrow);
  labelContainer.appendChild(arrowContainer);
  labelContainer.appendChild(stringLabel);
  row.appendChild(labelContainer);
  
  // Determine base value for the string
  let baseValue;
  if (customLabel !== undefined) {
    let note = customLabel.toUpperCase();
    baseValue = semitoneMap[note] !== undefined ? semitoneMap[note] : 0;
  } else {
    baseValue = value;
  }

  // Create fret cells
  const numFrets = 18;
  for (let f = 1; f <= numFrets; f++) {
    const fret = document.createElement("div");
    fret.classList.add("fret");
    const fretValue = baseValue + f;
    fret.setAttribute("data-fret-value", fretValue);
    
    // Determine if we should highlight this fret
    const color = getColorForFretValue(fretValue);
    if (color) {
      const highlightCircle = document.createElement("div");
      highlightCircle.classList.add("fret-highlight");
      highlightCircle.style.backgroundColor = color;
      fret.appendChild(highlightCircle);
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

  // Extra rows above
  for (let i = 0; i < extraAbove; i++) {
    const label = reverseCycle[i % reverseCycle.length];
    const row = createStringRow(0, false, undefined, label);
    fretboard.insertBefore(row, fretboard.firstChild);
  }

  // Main tuning rows
  tuning.forEach((value, index) => {
    const row = createStringRow(value, true, index);
    fretboard.appendChild(row);
  });
  
  // Extra rows below
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
 *  Dropdown Handling
 ****************************/

// Populate the dropdowns (root note, chunk, color) on page load
function populateDropdowns() {
  const rootDropdown = document.getElementById("root-dropdown");
  const chunkDropdown = document.getElementById("chunk-dropdown");
  const colorDropdown = document.getElementById("color-dropdown");

  // 1) Root notes
  ROOT_NOTES.forEach((note) => {
    const option = document.createElement("option");
    option.value = note; 
    option.textContent = note; 
    rootDropdown.appendChild(option);
  });

  // 2) Diatonic chunks
  DIATONIC_CHUNKS.forEach((chunk) => {
    const option = document.createElement("option");
    option.value = chunk.id;
    option.textContent = chunk.name;
    chunkDropdown.appendChild(option);
  });

  // 3) Colors
  AVAILABLE_COLORS.forEach((col) => {
    const option = document.createElement("option");
    option.value = col;
    option.textContent = col[0].toUpperCase() + col.slice(1);
    colorDropdown.appendChild(option);
  });
}

/****************************
 *  Add/Apply Buttons
 ****************************/
function addHighlightRow() {
  // Grab the user’s selections
  const rootDropdown = document.getElementById("root-dropdown");
  const chunkDropdown = document.getElementById("chunk-dropdown");
  const colorDropdown = document.getElementById("color-dropdown");

  const rootNote = rootDropdown.value; // e.g. "C#/Db"
  const chunkId = parseInt(chunkDropdown.value, 10);
  const color = colorDropdown.value;

  // Convert root note to semitone
  const rootSemitone = semitoneMap[rootNote.toUpperCase()] || 0;

  // Find the chunk object by ID
  const chunkObj = DIATONIC_CHUNKS.find((c) => c.id === chunkId);

  if (!chunkObj) return;

  // Store the user’s highlight row
  highlightRows.push({
    rootSemitone: rootSemitone,
    chunk: chunkObj,
    color: color
  });

  console.log("Added highlight row:", {
    rootSemitone: rootSemitone,
    chunk: chunkObj,
    color: color
  });
}

function applyHighlights() {
  // Re-render the fretboard using all highlightRows
  createFretboard(getExtraAbove(), getExtraBelow());
}

/****************************
 *  DOM Ready
 ****************************/
document.addEventListener("DOMContentLoaded", function() {
  // Extra row toggling
  const toggle = document.getElementById("extra-rows-toggle");
  const extraRowsInput = document.getElementById("extra-rows-input");
  
  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      extraRowsInput.style.display = "block";
    } else {
      extraRowsInput.style.display = "none";
    }
    createFretboard(getExtraAbove(), getExtraBelow());
  });
  
  // Apply extra rows
  const applyButton = document.getElementById("apply-extra-rows");
  applyButton.addEventListener("click", () => {
    createFretboard(getExtraAbove(), getExtraBelow());
  });

  // Populate the new dropdowns
  populateDropdowns();

  // "Add Row" & "Apply" for highlighting
  document.getElementById("add-row-button").addEventListener("click", addHighlightRow);
  document.getElementById("apply-button").addEventListener("click", applyHighlights);

  // Initial fretboard render
  createFretboard(getExtraAbove(), getExtraBelow());
});

