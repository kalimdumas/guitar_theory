const canvas = document.getElementById("fretboard");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 200;

// Function to draw the fretboard
function drawFretboard() {
    const numFrets = 12;
    const numStrings = 6;
    const fretWidth = canvas.width / numFrets;
    const stringHeight = canvas.height / (numStrings + 1);

    ctx.strokeStyle = "white";
    
    // Draw frets
    for (let i = 0; i <= numFrets; i++) {
        ctx.beginPath();
        ctx.moveTo(i * fretWidth, 0);
        ctx.lineTo(i * fretWidth, canvas.height);
        ctx.stroke();
    }

    // Draw strings
    for (let i = 1; i <= numStrings; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * stringHeight);
        ctx.lineTo(canvas.width, i * stringHeight);
        ctx.stroke();
    }
}

drawFretboard();
