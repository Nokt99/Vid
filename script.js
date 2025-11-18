// Old-Fangled Future — Brush Ninja-style canvas animation with Web Speech voiceover

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const subtitleEl = document.getElementById("subtitle");

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const voiceToggle = document.getElementById("voiceToggle");
const speedSlider = document.getElementById("speed");

let playing = false;
let startTimestamp = null;
let elapsed = 0;
let speed = 1;
let currentSceneIndex = 0;
let lastFrameTime = 0;

// Simple helper palette
const colors = {
  bg1831: "#2f2a25",
  smoke: "#69635c",
  flash: "#ffffff",
  street: "#0a0f18",
  neonBlue: "#3bdcff",
  neonPink: "#ff4fb0",
  white: "#ffffff",
  black: "#000000",
  panel: "#111317",
  pedestal: "#d9dfe7",
  computer: "#9aa3ad",
  label: "#e7e9ee",
};

// Accessibility subtitles
function setSubtitle(text) {
  subtitleEl.textContent = text || "";
}

// Voiceover using Web Speech API
let speechQueue = [];
let speaking = false;

function speakLine(text, rate = 1.0) {
  if (!voiceToggle.checked) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  utter.pitch = 1.0;
  utter.volume = 0.95;
  // Select a voice if available (optional)
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find(v => /en-US/i.test(v.lang) && /Male|David/i.test(v.name)) ||
    voices.find(v => /en-US/i.test(v.lang));
  if (preferred) utter.voice = preferred;
  utter.onend = () => {
    speaking = false;
    processSpeechQueue();
  };
  speechQueue.push(utter);
  processSpeechQueue();
}

function processSpeechQueue() {
  if (!voiceToggle.checked) return;
  if (speaking) return;
  const next = speechQueue.shift();
  if (next) {
    speaking = true;
    window.speechSynthesis.speak(next);
  }
}

function clearSpeech() {
  window.speechSynthesis.cancel();
  speechQueue = [];
  speaking = false;
}

// Utility: draw rounded rectangle
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Utility: text label
function label(text, x, y, color = colors.label, size = 22, align = "left") {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, Segoe UI, Roboto, Helvetica, Arial`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

// Character — simple stick figure with silhouette
function drawCharacter(cx, cy, scale = 1, color = "#1fe1b3") {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  // head
  ctx.beginPath();
  ctx.arc(0, -30, 16, 0, Math.PI * 2);
  ctx.stroke();
  // body
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 40);
  ctx.stroke();
  // arms
  ctx.beginPath();
  ctx.moveTo(-28, 0);
  ctx.lineTo(28, 0);
  ctx.stroke();
  // legs
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(-22, 80);
  ctx.moveTo(0, 40);
  ctx.lineTo(22, 80);
  ctx.stroke();
  ctx.restore();
}

// Teleport rings
function drawTeleport(cx, cy, t) {
  const r1 = 120 * (0.8 + 0.2 * Math.sin(t * 6));
  const r2 = 80 * (0.8 + 0.2 * Math.cos(t * 7));
  const r3 = 50 * (0.8 + 0.2 * Math.sin(t * 8));
  ctx.strokeStyle = colors.flash;
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = colors.neonBlue;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = colors.neonPink;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r3, 0, Math.PI * 2); ctx.stroke();
}

// Futuristic store block
function drawStore(x, y, w, h, name, neon = colors.neonBlue) {
  roundRect(x, y, w, h, 18);
  ctx.fillStyle = "#131722";
  ctx.fill();
  ctx.strokeStyle = neon;
  ctx.lineWidth = 3;
  ctx.stroke();
  label(name, x + w / 2, y + 36, neon, 20, "center");
}

// Pedestal and item
function drawPedestal(x, y, w, h, itemName) {
  roundRect(x, y, w, h, 12);
  ctx.fillStyle = colors.pedestal;
  ctx.fill();
  ctx.strokeStyle = "#c8ced7";
  ctx.lineWidth = 2;
  ctx.stroke();
  label(itemName, x + w / 2, y - 12, colors.label, 22, "center");
}

// Giant computer terminal
function drawComputer(x, y, w, h, tag) {
  roundRect(x, y, w, h, 12);
  ctx.fillStyle = colors.computer;
  ctx.fill();
  ctx.strokeStyle = "#c0c6cf";
  ctx.lineWidth = 3;
  ctx.stroke();
  label(tag, x + 16, y + 28, "#091016", 20, "left");
}

// Scene definitions
// Each scene returns a duration (seconds) and a draw(t) function for that scene.
// Also optional onEnter() for voice/subtitles.
const scenes = [
  {
    name: "1831 Civil War",
    duration: 3.0,
    onEnter() {
      setSubtitle("Year: 1831 — Civil War");
      speakLine("The year is 1831. The civil war rages. One man stands in the middle.", 1.0 * speed);
    },
    draw(t) {
      // Background
      ctx.fillStyle = colors.bg1831;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.fillStyle = "#3b352e";
      ctx.fillRect(0, 420, canvas.width, 120);

      // Smoke puffs
      for (let i = 0; i < 6; i++) {
        const x = 80 + i * 140;
        const y = 260 + Math.sin(t * 2 + i) * 8;
        ctx.fillStyle = colors.smoke;
        ctx.beginPath();
        ctx.arc(x, y, 22 + (i % 3) * 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main character
      const bob = Math.sin(t * 4) * 2;
      drawCharacter(480, 340 + bob, 1.0, "#22e3c7");

      // Labels
      label("Year: 1831 — Civil War", 24, 40, colors.label, 26, "left");
      label("Character: I'm going to 2030", 24, 80, colors.label, 24, "left");
    },
  },
  {
    name: "Teleport",
    duration: 1.6,
    onEnter() {
      setSubtitle("");
      speakLine("I'm going to 2030.", 1.1 * speed);
    },
    draw(t) {
      // Flash background
      const alpha = Math.max(0, 1 - t);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rings
      drawTeleport(480, 300, t);

      // Character dissolving
      ctx.globalAlpha = Math.max(0, 1 - t * 0.8);
      drawCharacter(480, 340, 1.0, "#22e3c7");
      ctx.globalAlpha = 1;
    },
  },
  {
    name: "2030 Street — Old-Fangled Things",
    duration: 3.2,
    onEnter() {
      setSubtitle("2030 — Downtown");
      speakLine("He lands on a futuristic street, beside a store called Old-Fangled Things.", 1.0 * speed);
    },
    draw(t) {
      // Futuristic street
      ctx.fillStyle = colors.street;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Neon gradients
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, "#0b1220");
      grad.addColorStop(1, "#0e1530");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stores
      drawStore(120, 220, 220, 240, "Old-Fangled Things", colors.neonBlue);
      drawStore(420, 220, 220, 240, "Snack Nebula", colors.neonPink);
      drawStore(720, 220, 180, 200, "Drift Coffee 8", colors.neonBlue);

      // Character walking in
      const walkX = 60 + t * 60;
      drawCharacter(80 + walkX, 380, 1.0, "#22e3c7");

      // Label
      label("2030 — Downtown", canvas.width - 24, 40, colors.neonBlue, 24, "right");
    },
  },
  {
    name: "Inside Old-Fangled Things",
    duration: 4.2,
    onEnter() {
      setSubtitle("iPhone 67");
      speakLine("How much do this cost, bucko?", 1.05 * speed);
      setTimeout(() => speakLine("Fifty-nine thousand, eight hundred thirty-two dollars.", 1.0 * speed), 1200 / speed);
      setTimeout(() => speakLine("WHATTHE?! HOW IS THIS POSSIBLE? You people are so rich!", 1.0 * speed), 2400 / speed);
      setTimeout(() => speakLine("That's normal price for a dirt piece.", 1.0 * speed), 3600 / speed);
    },
    draw(t) {
      // Interior panel
      ctx.fillStyle = colors.panel;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pedestal and item
      drawPedestal(380, 300, 200, 100, "iPhone 67");

      // Manager desk
      drawStore(140, 280, 160, 120, "Desk", colors.neonPink);

      // Character and manager
      drawCharacter(300, 360, 1.0, "#22e3c7"); // character
      drawCharacter(720, 360, 0.9, "#f5a");     // manager proxy

      // Dialogue bubbles
      // Character line
      roundRect(220, 220, 300, 52, 12);
      ctx.fillStyle = "#f6f7fb";
      ctx.fill();
      ctx.strokeStyle = "#cfd5df"; ctx.stroke();
      label("How much do this cost, bucko?", 240, 255, "#1a1d24", 20, "left");

      // Manager price
      roundRect(620, 220, 240, 52, 12);
      ctx.fillStyle = "#f6f7fb"; ctx.fill();
      ctx.strokeStyle = "#cfd5df"; ctx.stroke();
      label("$59,832", 640, 255, "#1a1d24", 22, "left");

      // Shock line
      const shake = Math.sin(t * 16) * 2;
      label("WHATTHE?! HOW IS THIS POSSIBLE?", 160 + shake, 120, colors.neonPink, 22, "left");
      label("U PEOPLE ARE SO RICH!", 160 - shake, 150, colors.neonPink, 22, "left");

      // Manager quip
      label("That's normal price for a dirt piece.", 160, 190, colors.neonBlue, 20, "left");
    },
  },
  {
    name: "Back to street — NASA Computers 67",
    duration: 2.8,
    onEnter() {
      setSubtitle("NASA Computers 67");
      speakLine("He heads to NASA Computers 67.", 1.0 * speed);
    },
    draw(t) {
      ctx.fillStyle = colors.street;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawStore(140, 220, 260, 240, "NASA Computers 67", colors.neonPink);
      drawStore(520, 240, 220, 200, "Cloud 9.9", colors.neonBlue);

      // Character enters
      const walkX = Math.min(380, t * 140 + 60);
      drawCharacter(80 + walkX, 380, 1.0, "#22e3c7");
    },
  },
  {
    name: "Inside NASA shop — absurd pricing",
    duration: 5.4,
    onEnter() {
      setSubtitle("6767667676766776nasa");
      speakLine("How much?", 1.0 * speed);
      setTimeout(() => speakLine("Ninety-nine trillion, nine hundred ninety-nine billion, zero ninety-nine million, seven hundred ninety-nine billion, eight hundred eighty-seven million, eight hundred seventy-eight thousand, seven hundred eighty-nine, seven hundred nine dollars—if you are not subbed to Cetus P-two-n.", 0.95 * speed), 800 / speed);
      setTimeout(() => speakLine("How much without?", 1.0 * speed), 3200 / speed);
      setTimeout(() => speakLine("Seventy-five nonillion, eight hundred forty-seven octillion, five hundred forty-three septillion, seven hundred fifty-nine sextillion, eight hundred forty-seven quintillion, five hundred eighty-four quadrillion, three hundred twenty-seven trillion, five hundred eighty-four billion, three hundred seventy-five million, eight hundred forty-three thousand, seven hundred fifty-eight—etc.", 0.95 * speed), 4000 / speed);
      setTimeout(() => speakLine("He faints.", 1.0 * speed), 5200 / speed);
    },
    draw(t) {
      ctx.fillStyle = colors.panel;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Giant computer
      drawComputer(280, 220, 420, 220, "6767667676766776nasa");

      // Seller
      drawCharacter(680, 380, 0.95, "#f5a");

      // Character reaction / faint
      const tilt = t > 3.8 ? Math.min(15, (t - 3.8) * 18) : 0;
      ctx.save();
      ctx.translate(340, 400);
      ctx.rotate((-tilt * Math.PI) / 180);
      drawCharacter(0, 0, 1.05, "#22e3c7");
      ctx.restore();

      // Dialogue banners
      roundRect(80, 120, 800, 50, 12);
      ctx.fillStyle = "#f6f7fb"; ctx.fill();
      ctx.strokeStyle = "#cfd5df"; ctx.stroke();
      label("Seller: $99,999,099,999,979,887,878,789,709 (not subbed to Cetus-P2n)", 96, 152, "#1a1d24", 18, "left");

      roundRect(80, 180, 800, 50, 12);
      ctx.fillStyle = "#f6f7fb"; ctx.fill();
      ctx.strokeStyle = "#cfd5df"; ctx.stroke();
      label("Character: How much without?", 96, 212, "#1a1d24", 18, "left");

      roundRect(80, 240, 800, 70, 12);
      ctx.fillStyle = "#f6f7fb"; ctx.fill();
      ctx.strokeStyle = "#cfd5df"; ctx.stroke();
      label("Manager: $75,847,543,759,847,584,327,584,375,843,758,758,748,574,357,022,020,765,875,482,587,534,579,854,875,843,584,785,748,574,285,784,758,475,874,598,72", 96, 288, "#1a1d24", 16, "left");

      if (t > 4.8) {
        // Thud SFX cue via subtitle
        setSubtitle("Thud.");
      }
    },
  },
  {
    name: "End card",
    duration: 2.0,
    onEnter() {
      setSubtitle("Old-Fangled Future — Subscribe to Cetus-P2n?");
      speakLine("Old-Fangled Future. Subscribe to Cetus P-two-n?", 1.0 * speed);
    },
    draw(t) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      label("Old-Fangled Future", canvas.width / 2, canvas.height / 2 - 12, colors.neonBlue, 40, "center");
      label("Subscribe to Cetus-P2n?", canvas.width / 2, canvas.height / 2 + 32, colors.neonPink, 24, "center");
    },
  },
];

// Timeline control
function getSceneRange(index) {
  let start = 0;
  for (let i = 0; i < index; i++) start += scenes[i].duration;
  const end = start + scenes[index].duration;
  return { start, end };
}

function findSceneByTime(t) {
  let accum = 0;
  for (let i = 0; i < scenes.length; i++) {
    accum += scenes[i].duration;
    if (t < accum) return i;
  }
  return scenes.length - 1;
}

function renderFrame(timestamp) {
  if (!playing) return;
  if (!startTimestamp) startTimestamp = timestamp;
  const delta = (timestamp - (lastFrameTime || timestamp)) / 1000;
  lastFrameTime = timestamp;

  elapsed += delta * speed;
  const sceneIdx = findSceneByTime(elapsed);
  if (sceneIdx !== currentSceneIndex) {
    currentSceneIndex = sceneIdx;
    clearSpeech();
    if (scenes[sceneIdx].onEnter) scenes[sceneIdx].onEnter();
  }

  const { start } = getSceneRange(sceneIdx);
  const sceneTime = Math.max(0, elapsed - start);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  scenes[sceneIdx].draw(sceneTime);

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  if (elapsed >= totalDuration) {
    playing = false;
    setSubtitle("Replay?");
    return;
  }

  requestAnimationFrame(renderFrame);
}

// Controls
playBtn.addEventListener("click", () => {
  if (!playing) {
    playing = true;
    startTimestamp = null;
    lastFrameTime = 0;
    requestAnimationFrame(renderFrame);
  }
});

pauseBtn.addEventListener("click", () => {
  playing = false;
  clearSpeech();
});

resetBtn.addEventListener("click", () => {
  playing = false;
  startTimestamp = null;
  lastFrameTime = 0;
  elapsed = 0;
  currentSceneIndex = 0;
  clearSpeech();
  setSubtitle("");
  // Draw first scene idle state
  scenes[0].onEnter && scenes[0].onEnter();
  scenes[0].draw(0);
});

speedSlider.addEventListener("input", (e) => {
  speed = parseFloat(e.target.value);
});

// Initialize
(function init() {
  speed = parseFloat(speedSlider.value);
  scenes[0].onEnter && scenes[0].onEnter();
  scenes[0].draw(0);
})();
