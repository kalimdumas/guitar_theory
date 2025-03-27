/****************************
 *  Constants & Globals
 ****************************/
const STANDARD_TUNING = [4, 11, 7, 2, 9, 4]; // E, B, G, D, A, E
const TUNINGS = {
  "Standard": STANDARD_TUNING,
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
let customTunings = {};
const semitoneMap = {
  "C": 0, "C#/DB": 1, "D": 2, "D#/EB": 3, "E": 4,
  "F": 5, "F#/GB": 6, "G": 7, "G#/AB": 8, "A": 9,
  "A#/BB": 10, "B": 11
};
const SEMITONE_DEGREE_MAP = {
  0: "1", 1: "b2", 2: "2", 3: "b3", 4: "3", 5: "4",
  6: "b5", 7: "5", 8: "b6", 9: "6", 10: "b7", 11: "7"
};

class DiatonicChunk {
  constructor(id, name, values) {
    this.id = id;
    this.name = name;
    this.values = values;
  }
}
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
const ROOT_NOTES = Object.keys(semitoneMap);
const AVAILABLE_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];
let customTuning = null;
let tuning = customTuning ? customTuning : STANDARD_TUNING;

// Each highlight row now includes a 'fretboard' property ("1" or "2")
let highlightRows = [];
// manualHighlights: key = "fretboard_index_fret" => { removed, color, showNoteName, showScaleDegrees, highlightRowIndex, highlightRowData }
let manualHighlights = {};
let cursorActivationActive = false;
// New: control whether Fretboard 2 is active
let fretboard2Active = false;

/****************************
 *  Helper Functions
 ****************************/
function getNoteNameFromValue(value) {
  const norm = ((value % 12) + 12) % 12;
  for (let note in semitoneMap) {
    if (semitoneMap[note] === norm) return note;
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
  customTunings = stored ? JSON.parse(stored) : {};
}
function saveCustomTunings() {
  localStorage.setItem("customTunings", JSON.stringify(customTunings));
}
function updateTuningsDropdown() {
  const dd = document.getElementById("tunings-dropdown");
  dd.innerHTML = "";
  for (let name in TUNINGS) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    dd.appendChild(opt);
  }
  for (let name in customTunings) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    dd.appendChild(opt);
  }
}

/****************************
 *  getHighlightForFretValue
 *  (Applies only for a given fretboard.)
 ****************************/
function getHighlightForFretValue(fretValue, fretboardId) {
  let result = null;
  highlightRows.forEach(row => {
    if (row.fretboard !== fretboardId) return;
    let diff = (fretValue - row.rootSemitone) % 12;
    diff = (diff + 12) % 12;
    if (row.chunk.values.includes(diff)) {
      result = { 
        color: row.color, 
        showScaleDegrees: row.showScaleDegrees, 
        showNoteName: row.showNoteName,
        degree: SEMITONE_DEGREE_MAP[diff],
        noteName: getNoteNameFromValue(fretValue)
      };
    }
  });
  return result;
}

/****************************
 *  Create a Single String Row
 *  Now accepts an extra parameter 'fretboardId'
 ****************************/
function createStringRow(value, interactive, index, customLabel, fretboardId) {
  const row = document.createElement("div");
  row.classList.add("string-row");
  if (!interactive) row.classList.add("extra");
  
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
  stringLabel.textContent = customLabel !== undefined ? customLabel : getNoteNameFromValue(value);
  
  if (interactive) {
    upArrow.addEventListener("click", () => {
      tuning[index] = (tuning[index] + 1) % 12;
      stringLabel.textContent = getNoteNameFromValue(tuning[index]);
      updateAllFretboards();
    });
    downArrow.addEventListener("click", () => {
      tuning[index] = (tuning[index] + 11) % 12;
      stringLabel.textContent = getNoteNameFromValue(tuning[index]);
      updateAllFretboards();
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
  
  let baseValue = customLabel !== undefined ? (semitoneMap[customLabel.toUpperCase()] || 0) : value;
  const numFrets = 18;
  for (let f = 1; f <= numFrets; f++) {
    const fret = document.createElement("div");
    fret.classList.add("fret");
    const fretValue = baseValue + f;
    fret.setAttribute("data-fret-value", fretValue);
    if (interactive && index !== undefined) {
      fret.dataset.stringIndex = index;
      fret.dataset.fretNumber = f;
      fret.dataset.fretboard = fretboardId;
    }
    
    // Build a key including the fretboard id
    let key = interactive && index !== undefined ? `${fretboardId}_${index}_${f}` : null;
    let highlight = null;
    if (key && manualHighlights[key]) {
      let m = manualHighlights[key];
      if (m.removed) {
        highlight = null;
      } else {
        if (m.showScaleDegrees && m.highlightRowData) {
          let diff = (fretValue - m.highlightRowData.rootSemitone) % 12;
          diff = (diff + 12) % 12;
          m.degree = SEMITONE_DEGREE_MAP[diff];
        }
        if (m.showNoteName) {
          m.noteName = getNoteNameFromValue(fretValue);
        }
        highlight = m;
      }
    } else {
      highlight = getHighlightForFretValue(fretValue, fretboardId);
    }
    
    if (highlight) {
      const circle = document.createElement("div");
      circle.classList.add("fret-highlight");
      circle.style.backgroundColor = highlight.color;
      fret.appendChild(circle);
      if (highlight.showScaleDegrees && highlight.degree) {
        const span = document.createElement("span");
        span.textContent = highlight.degree;
        span.classList.add("fret-scale-text");
        fret.appendChild(span);
      } else if (highlight.showNoteName && highlight.noteName) {
        const span = document.createElement("span");
        span.textContent = highlight.noteName;
        span.classList.add("fret-scale-text");
        fret.appendChild(span);
      }
    }
    
    // Cursor hover effect
    fret.addEventListener("mouseenter", () => {
      if (cursorActivationActive) {
        const hover = document.createElement("div");
        hover.classList.add("fret-cursor-hover");
        const span = document.createElement("span");
        span.textContent = getNoteNameFromValue(fretValue);
        span.classList.add("fret-scale-text");
        hover.appendChild(span);
        fret.appendChild(hover);
      }
    });
    fret.addEventListener("mouseleave", () => {
      const ov = fret.querySelector(".fret-cursor-hover");
      if (ov) ov.remove();
    });
    
    // Cursor click for manual highlight/removal
    fret.addEventListener("click", () => {
      if (!cursorActivationActive || !key) return;
      if (manualHighlights[key]) {
        delete manualHighlights[key];
      } else {
        let defaultHL = getHighlightForFretValue(fretValue, fretboardId);
        if (defaultHL) {
          manualHighlights[key] = { removed: true };
        } else {
          const selColor = document.getElementById("cursor-color-dropdown").value;
          const modeNote = document.getElementById("cursor-mode-note").checked;
          const modeRow = document.getElementById("cursor-mode-row").checked;
          let manual = { color: selColor, showNoteName: false, showScaleDegrees: false, highlightRowIndex: null };
          if (modeNote) {
            manual.showNoteName = true;
          } else if (modeRow) {
            manual.showScaleDegrees = true;
            const selRow = document.getElementById("cursor-highlight-row-dropdown").value;
            if (selRow !== "") {
              manual.highlightRowIndex = parseInt(selRow, 10) - 1;
              let rowsDOM = document.querySelectorAll(".highlight-row");
              if (rowsDOM[manual.highlightRowIndex]) {
                let rootVal = rowsDOM[manual.highlightRowIndex].querySelector(".root-dropdown").value;
                let chunkId = parseInt(rowsDOM[manual.highlightRowIndex].querySelector(".chunk-dropdown").value, 10);
                let rootSemitone = semitoneMap[rootVal.toUpperCase()] || 0;
                let chunkObj = DIATONIC_CHUNKS.find(c => c.id === chunkId);
                manual.highlightRowData = { rootSemitone, chunk: chunkObj };
              }
            }
          }
          manualHighlights[key] = manual;
        }
      }
      updateAllFretboards();
    });
    
    row.appendChild(fret);
  }
  return row;
}

/****************************
 *  Build the Fretboard
 *  Accepts parameter 'fretboardId' ("1" or "2")
 ****************************/
function createFretboard(fretboardId, extraAbove = 5, extraBelow = 5) {
  const container = document.getElementById("fretboard" + fretboardId);
  container.innerHTML = "";
  
  const mainLabels = tuning.map(getNoteNameFromValue);
  let cycle = (mainLabels[0] === mainLabels[mainLabels.length - 1])
    ? mainLabels.slice(0, mainLabels.length - 1)
    : mainLabels.slice();
  const reverseCycle = cycle.slice().reverse();
  
  // Extra rows above
  for (let i = 0; i < extraAbove; i++) {
    const label = reverseCycle[i % reverseCycle.length];
    const row = createStringRow(0, false, undefined, label, fretboardId);
    container.insertBefore(row, container.firstChild);
  }
  // Main interactive rows
  tuning.forEach((value, index) => {
    const row = createStringRow(value, true, index, undefined, fretboardId);
    container.appendChild(row);
  });
  // Extra rows below
  const bottomLabel = mainLabels[mainLabels.length - 1];
  const bottomIndex = cycle.indexOf(bottomLabel);
  for (let i = 1; i <= extraBelow; i++) {
    const labelIndex = (bottomIndex + i) % cycle.length;
    const label = cycle[labelIndex];
    const row = createStringRow(0, false, undefined, label, fretboardId);
    container.appendChild(row);
  }
}

/****************************
 *  Update Both Fretboards
 ****************************/
function updateAllFretboards() {
  let extraAbove = getExtraAbove();
  let extraBelow = getExtraBelow();
  createFretboard("1", extraAbove, extraBelow);
  // Only update Fretboard 2 if it's active; otherwise hide its container
  const fb2Container = document.getElementById("fretboard2-container");
  if (fretboard2Active) {
    fb2Container.style.display = "block";
    createFretboard("2", extraAbove, extraBelow);
  } else {
    fb2Container.style.display = "none";
  }
}

/****************************
 *  Extra Rows Helpers
 ****************************/
function getExtraAbove() {
  const toggle = document.getElementById("extra-rows-toggle");
  return toggle.checked ? parseInt(document.getElementById("rows-above").value) || 0 : 0;
}
function getExtraBelow() {
  const toggle = document.getElementById("extra-rows-toggle");
  return toggle.checked ? parseInt(document.getElementById("rows-below").value) || 0 : 0;
}

/****************************
 *  Highlight Dropdowns
 ****************************/
function createHighlightRow() {
  const container = document.createElement("div");
  container.classList.add("highlight-row");
  
  const reorder = document.createElement("div");
  reorder.classList.add("reorder-container");
  const upBtn = document.createElement("button");
  upBtn.textContent = "↑";
  upBtn.classList.add("reorder-button");
  upBtn.addEventListener("click", () => {
    const cur = container;
    const par = cur.parentElement;
    const prev = cur.previousElementSibling;
    if (prev) par.insertBefore(cur, prev);
    updateHighlightRowNumbers();
    updateCursorHighlightDropdown();
  });
  const downBtn = document.createElement("button");
  downBtn.textContent = "↓";
  downBtn.classList.add("reorder-button");
  downBtn.addEventListener("click", () => {
    const cur = container;
    const par = cur.parentElement;
    const next = cur.nextElementSibling;
    if (next) par.insertBefore(next, cur);
    updateHighlightRowNumbers();
    updateCursorHighlightDropdown();
  });
  reorder.appendChild(upBtn);
  reorder.appendChild(downBtn);
  
  const removeBtn = document.createElement("button");
  removeBtn.textContent = "Remove";
  removeBtn.classList.add("remove-button");
  removeBtn.addEventListener("click", () => {
    container.remove();
    updateHighlightRowNumbers();
    updateCursorHighlightDropdown();
  });
  container.appendChild(reorder);
  container.appendChild(removeBtn);
  
  // Root dropdown
  const rootDiv = document.createElement("div");
  const rootLabel = document.createElement("label");
  rootLabel.textContent = "Root: ";
  const rootSelect = document.createElement("select");
  rootSelect.classList.add("root-dropdown");
  ROOT_NOTES.forEach(note => {
    const opt = document.createElement("option");
    opt.value = note;
    opt.textContent = note;
    rootSelect.appendChild(opt);
  });
  rootLabel.appendChild(rootSelect);
  rootDiv.appendChild(rootLabel);
  container.appendChild(rootDiv);
  
  // Chunk dropdown
  const chunkDiv = document.createElement("div");
  const chunkLabel = document.createElement("label");
  chunkLabel.textContent = "Chunk: ";
  const chunkSelect = document.createElement("select");
  chunkSelect.classList.add("chunk-dropdown");
  DIATONIC_CHUNKS.forEach(chunk => {
    const opt = document.createElement("option");
    opt.value = chunk.id;
    opt.textContent = chunk.name;
    chunkSelect.appendChild(opt);
  });
  chunkLabel.appendChild(chunkSelect);
  chunkDiv.appendChild(chunkLabel);
  container.appendChild(chunkDiv);
  
  // Color dropdown
  const colorDiv = document.createElement("div");
  const colorLabel = document.createElement("label");
  colorLabel.textContent = "Color: ";
  const colorSelect = document.createElement("select");
  colorSelect.classList.add("color-dropdown");
  AVAILABLE_COLORS.forEach(color => {
    const opt = document.createElement("option");
    opt.value = color;
    opt.textContent = color[0].toUpperCase() + color.slice(1);
    colorSelect.appendChild(opt);
  });
  colorLabel.appendChild(colorSelect);
  colorDiv.appendChild(colorLabel);
  container.appendChild(colorDiv);
  
  // New: Fretboard selection dropdown
  const fbDiv = document.createElement("div");
  const fbLabel = document.createElement("label");
  fbLabel.textContent = "Fretboard: ";
  const fbSelect = document.createElement("select");
  fbSelect.classList.add("fretboard-dropdown");
  ["1", "2"].forEach(num => {
    const opt = document.createElement("option");
    opt.value = num;
    opt.textContent = "Fretboard " + num;
    fbSelect.appendChild(opt);
  });
  fbLabel.appendChild(fbSelect);
  fbDiv.appendChild(fbLabel);
  container.appendChild(fbDiv);
  
  // Radio buttons for mutually exclusive options
  const radioDiv = document.createElement("div");
  const radioGroup = "highlightOption_" + Date.now();
  const scaleRadio = document.createElement("input");
  scaleRadio.type = "radio";
  scaleRadio.name = radioGroup;
  scaleRadio.value = "scale";
  const scaleLabel = document.createElement("label");
  scaleLabel.textContent = "Scale Degrees";
  const noteRadio = document.createElement("input");
  noteRadio.type = "radio";
  noteRadio.name = radioGroup;
  noteRadio.value = "note";
  const noteLabel = document.createElement("label");
  noteLabel.textContent = "Note Name";
  radioDiv.appendChild(scaleRadio);
  radioDiv.appendChild(scaleLabel);
  radioDiv.appendChild(noteRadio);
  radioDiv.appendChild(noteLabel);
  container.dataset.showScaleDegrees = "false";
  container.dataset.showNoteName = "false";
  scaleRadio.addEventListener("change", () => {
    if(scaleRadio.checked){
      container.dataset.showScaleDegrees = "true";
      container.dataset.showNoteName = "false";
    }
  });
  noteRadio.addEventListener("change", () => {
    if(noteRadio.checked){
      container.dataset.showNoteName = "true";
      container.dataset.showScaleDegrees = "false";
    }
  });
  container.appendChild(radioDiv);
  
  // Row number label
  const rowNumberLabel = document.createElement("div");
  rowNumberLabel.classList.add("row-number");
  container.appendChild(rowNumberLabel);
  
  return container;
}
function updateHighlightRowNumbers() {
  const rows = document.querySelectorAll(".highlight-row");
  rows.forEach((row, i) => {
    const lbl = row.querySelector(".row-number");
    if(lbl) lbl.textContent = i + 1;
  });
}
function updateCursorHighlightDropdown() {
  const dd = document.getElementById("cursor-highlight-row-dropdown");
  dd.innerHTML = '<option value="">None</option>';
  const rows = document.querySelectorAll(".highlight-row");
  rows.forEach((_, i) => {
    const opt = document.createElement("option");
    opt.value = i + 1;
    opt.textContent = i + 1;
    dd.appendChild(opt);
  });
}

/****************************
 *  Apply Highlight Rows
 ****************************/
function applyHighlights() {
  highlightRows = [];
  const rows = document.querySelectorAll(".highlight-row");
  rows.forEach(row => {
    const rootVal = row.querySelector(".root-dropdown").value;
    const chunkId = parseInt(row.querySelector(".chunk-dropdown").value, 10);
    const color = row.querySelector(".color-dropdown").value;
    const rootSemitone = semitoneMap[rootVal.toUpperCase()] || 0;
    const showScale = row.dataset.showScaleDegrees === "true";
    const showNote = row.dataset.showNoteName === "true";
    let chunkObj = DIATONIC_CHUNKS.find(c => c.id === chunkId);
    const fretboardTarget = row.querySelector(".fretboard-dropdown").value;
    if(chunkObj){
      highlightRows.push({
        rootSemitone,
        chunk: chunkObj,
        color,
        showScaleDegrees: showScale,
        showNoteName: showNote,
        fretboard: fretboardTarget
      });
    }
  });
  console.log("Applying highlights:", highlightRows);
  updateAllFretboards();
  updateCursorHighlightDropdown();
}

/****************************
 *  DOM Ready
 ****************************/
document.addEventListener("DOMContentLoaded", () => {
  loadCustomTunings();
  updateTuningsDropdown();
  
  document.getElementById("apply-tuning-button").addEventListener("click", () => {
    const dd = document.getElementById("tunings-dropdown");
    const sel = dd.value;
    let newTuning = TUNINGS[sel] || customTunings[sel];
    if(newTuning){
      setTuning(newTuning);
      updateAllFretboards();
    }
  });
  
  document.getElementById("save-tuning-button").addEventListener("click", () => {
    const inp = document.getElementById("custom-tuning-name");
    const name = inp.value.trim();
    if(!name){
      alert("Please enter a name for your tuning.");
      return;
    }
    customTunings[name] = tuning.slice();
    saveCustomTunings();
    updateTuningsDropdown();
    inp.value = "";
  });
  
  document.getElementById("remove-tuning-button").addEventListener("click", () => {
    const dd = document.getElementById("tunings-dropdown");
    const sel = dd.value;
    if(TUNINGS[sel] !== undefined){
      alert("Predefined tunings cannot be removed.");
      return;
    }
    delete customTunings[sel];
    saveCustomTunings();
    updateTuningsDropdown();
  });
  
  const extraToggle = document.getElementById("extra-rows-toggle");
  const extraInput = document.getElementById("extra-rows-input");
  extraToggle.addEventListener("change", () => {
    extraInput.style.display = extraToggle.checked ? "block" : "none";
    updateAllFretboards();
  });
  document.getElementById("apply-extra-rows").addEventListener("click", () => {
    updateAllFretboards();
  });
  
  // Fretboard 2 toggle button
  const fb2Toggle = document.getElementById("fretboard2-toggle");
  fb2Toggle.addEventListener("click", () => {
    fretboard2Active = !fretboard2Active;
    fb2Toggle.textContent = `Fretboard 2: ${fretboard2Active ? "On" : "Off"}`;
    updateAllFretboards();
  });
  
  const hContainer = document.getElementById("highlight-rows-container");
  hContainer.appendChild(createHighlightRow());
  updateHighlightRowNumbers();
  updateCursorHighlightDropdown();
  document.getElementById("add-row-button").addEventListener("click", () => {
    hContainer.appendChild(createHighlightRow());
    updateHighlightRowNumbers();
    updateCursorHighlightDropdown();
  });
  document.getElementById("apply-button").addEventListener("click", applyHighlights);
  
  // Cursor Activation button & options
  const cursorBtn = document.getElementById("cursor-activation-button");
  const cursorOpts = document.getElementById("cursor-activation-options");
  cursorBtn.addEventListener("click", () => {
    cursorActivationActive = !cursorActivationActive;
    cursorBtn.textContent = `Cursor Activation: ${cursorActivationActive ? "On" : "Off"}`;
    cursorOpts.style.display = cursorActivationActive ? "block" : "none";
  });
  const modeNote = document.getElementById("cursor-mode-note");
  const modeRow = document.getElementById("cursor-mode-row");
  const cursorRowSel = document.getElementById("cursor-row-selection");
  modeNote.addEventListener("change", () => {
    if(modeNote.checked) cursorRowSel.style.display = "none";
  });
  modeRow.addEventListener("change", () => {
    if(modeRow.checked) cursorRowSel.style.display = "block";
  });
  
  updateAllFretboards();
});

