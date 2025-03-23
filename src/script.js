/**************************** 
 *  Constants & Globals
 ****************************/
const STANDARD_TUNING = [4, 11, 7, 2, 9, 4]; // E, B, G, D, A, E
const REVERSED_STANDARD_TUNING = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E

// Map of semitones for each note
const semitoneMap = {
  "C": 0,
  "C#": 1,
  "D": 2,
  "D#": 3,
  "E": 4,
  "F": 5,
  "F#": 6,
  "G": 7,
  "G#": 8,
  "A": 9,
  "A#": 10,
  "B": 11
};

// Custom tuning (if any)
let customTuning = null;
let tuning = customTuning ? customTuning : STANDARD_TUNING;

// Global variable for highlight semitone (null if none)
let highlightSemitone = null;

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

  const numFrets = 12;
  for (let f = 1; f <= numFrets; f++) {
    const fret = document.createElement("div");
    fret.classList.add("fret");
    const fretValue = baseValue + f;
    fret.setAttribute("data-fret-value", fretValue);
    
    // Add red circle if (fretValue % 12) equals the highlight note's semitone value
    if (highlightSemitone !== null && (fretValue % 12) === highlightSemitone) {
      const highlightCircle = document.createElement("div");
      highlightCircle.classList.add("fret-highlight");
      fret.appendChild(highlightCircle);
    }

    row.appendChild(fret);
  }
  
  return row;
}

/****************************
 *  Build the Fretboard
 ****************************/
function createFretboard(extraAbove = 0, extraBelow = 0) {
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
 *  Toggle & Input Handling
 ****************************/
document.addEventListener("DOMContentLoaded", function() {
  const toggle = document.getElementById("extra-rows-toggle");
  const extraRowsInput = document.getElementById("extra-rows-input");
  
  toggle.addEventListener("change", () => {
    if (toggle.checked) {
      extraRowsInput.style.display = "block";
    } else {
      extraRowsInput.style.display = "none";
      createFretboard(getExtraAbove(), getExtraBelow());
    }
  });
  
  const applyButton = document.getElementById("apply-extra-rows");
  applyButton.addEventListener("click", () => {
    createFretboard(getExtraAbove(), getExtraBelow());
  });
  
  const applyNoteButton = document.getElementById("apply-note");
  applyNoteButton.addEventListener("click", () => {
    const noteInput = document.getElementById("note-input").value.trim().toUpperCase();
    if (semitoneMap.hasOwnProperty(noteInput)) {
      highlightSemitone = semitoneMap[noteInput];
    } else {
      highlightSemitone = null;
    }
    createFretboard(getExtraAbove(), getExtraBelow());
  });
  
  createFretboard(0, 0);
});

