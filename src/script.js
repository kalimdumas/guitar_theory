/****************************
 *  Constants & Globals
 ****************************/
const STANDARD_TUNING = [4, 9, 2, 7, 11, 4]; // E, A, D, G, B, E
const REVERSED_STANDARD_TUNING = [4, 11, 7, 2, 9, 4]; // E, B, G, D, A, E

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

// If a user has a custom tuning, it can go here
let customTuning = null;

// Default to reversed standard tuning if no custom tuning is provided
let tuning = customTuning ? customTuning : REVERSED_STANDARD_TUNING;

/****************************
 *  Helper Functions
 ****************************/
// Convert a semitone value (0-11) to its note name (C, C#, D, etc.)
function getNoteNameFromValue(value) {
  // Normalize to 0-11 in case we go negative
  const normalized = ((value % 12) + 12) % 12;
  // Find the note whose semitone matches
  for (const note in semitoneMap) {
    if (semitoneMap[note] === normalized) {
      return note;
    }
  }
  return "?";
}

// Update the global tuning array
function setTuning(newTuning) {
  tuning = newTuning;
  console.log("Tuning updated to:", tuning);
  // Additional logic to re-render or update fretboard can go here
}

/****************************
 *  Fretboard Creation
 ****************************/
document.addEventListener("DOMContentLoaded", function() {
  createFretboard();
});

function createFretboard() {
  const fretboard = document.getElementById("fretboard");
  const numFrets = 12; // Adjust as desired

  // Clear the fretboard first
  fretboard.innerHTML = "";

  // For each string in the reversed tuning array
  tuning.forEach((value, index) => {
    const row = document.createElement("div");
    row.classList.add("string-row");

    // Container for arrows + label
    const labelContainer = document.createElement("div");
    labelContainer.classList.add("string-label-container");

    // A small container to stack up/down arrows vertically
    const arrowContainer = document.createElement("div");
    arrowContainer.classList.add("arrow-container");

    // Up arrow
    const upArrow = document.createElement("div");
    upArrow.textContent = "▲";
    upArrow.classList.add("arrow");
    upArrow.addEventListener("click", () => {
      // Increase semitone by 1 (mod 12)
      tuning[index] = (tuning[index] + 1) % 12;
      stringLabel.textContent = getNoteNameFromValue(tuning[index]);
    });

    // Down arrow
    const downArrow = document.createElement("div");
    downArrow.textContent = "▼";
    downArrow.classList.add("arrow");
    downArrow.addEventListener("click", () => {
      // Decrease semitone by 1 (mod 12)
      tuning[index] = (tuning[index] + 11) % 12;
      stringLabel.textContent = getNoteNameFromValue(tuning[index]);
    });

    // Put the arrows into the arrowContainer
    arrowContainer.appendChild(upArrow);
    arrowContainer.appendChild(downArrow);

    // String label (initially showing current semitone’s note name)
    const stringLabel = document.createElement("div");
    stringLabel.classList.add("string-label");
    stringLabel.textContent = getNoteNameFromValue(value);

    // Add arrowContainer + label to labelContainer
    labelContainer.appendChild(arrowContainer);
    labelContainer.appendChild(stringLabel);

    // Put labelContainer into the row
    row.appendChild(labelContainer);

    // Create fret cells for this row/string
    for (let f = 0; f < numFrets; f++) {
      const fret = document.createElement("div");
      fret.classList.add("fret");
      row.appendChild(fret);
    }

    fretboard.appendChild(row);
  });
}

