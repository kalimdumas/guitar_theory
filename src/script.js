console.log("Welcome to Guitar Theory Visualizer!");

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

// Default tuning variable (standard E, A, D, G, B, E)
let tuning = [4, 9, 2, 7, 11, 4];

// Function to update tuning (can be expanded later for custom tunings)
function setTuning(newTuning) {
  tuning = newTuning;
  console.log("Tuning updated to:", tuning);
  // Additional logic to re-render or update fretboard could go here.
}

// Create the fretboard with 6 strings and 12 frets
document.addEventListener("DOMContentLoaded", function() {
  createFretboard();
});

function createFretboard() {
  const fretboard = document.getElementById("fretboard");
  const stringLabels = ["E", "A", "D", "G", "B", "E"]; // Low to high
  const numFrets = 12;

  // Clear existing content if needed
  fretboard.innerHTML = "";

  stringLabels.forEach(label => {
    const row = document.createElement("div");
    row.classList.add("string-row");

    // Left-side label for the string
    const stringLabel = document.createElement("div");
    stringLabel.classList.add("string-label");
    stringLabel.textContent = label;
    row.appendChild(stringLabel);

    // Create the fret cells
    for (let f = 0; f < numFrets; f++) {
      const fret = document.createElement("div");
      fret.classList.add("fret");
      row.appendChild(fret);
    }

    fretboard.appendChild(row);
  });
}

