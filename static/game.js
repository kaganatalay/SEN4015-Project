const socket = io();

let mySessionId = null;
let currentGameId = null;
let currentDrawerId = null;
let isDrawing = false;
let drawingHistory = [];

const INTERNAL_WIDTH = 400;
const INTERNAL_HEIGHT = 400;
const TARGET_ASPECT_RATIO = INTERNAL_WIDTH / INTERNAL_HEIGHT;

// DOM Elements
const screens = {
  login: document.getElementById("login-screen"),
  lobby: document.getElementById("lobby-screen"),
  game: document.getElementById("game-screen"),
};
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const messagesDiv = document.getElementById("messages");
const btnClear = document.getElementById("btn-clear");
const chatInput = document.getElementById("guess-input");
const chatBtn = document.getElementById("btn-chat-submit");

// Navigation
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");

  if (name === "game") {
    resizeCanvas();
  }
}

// Event Listeners

socket.on("connect", () => console.log("Connected"));

// 1. Join & Lobby
socket.on("game_joined", (data) => {
  mySessionId = data.you.pid;
  currentGameId = data.game_id;
  document.getElementById("lobby-room-code").innerText = currentGameId;
  updateLobbyList(data.players);
  showScreen("lobby");
  overlay.classList.add("hidden");
});

socket.on("update_players", (data) => updateLobbyList(data.players));
socket.on("error", (data) => alert(data.message));
socket.on("game_closed", (data) => {
  alert(data.message);
  resetGame();
});

// 2. Game Start
socket.on("game_started", (data) => {
  overlay.classList.add("hidden");
  drawingHistory = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  messagesDiv.innerHTML = "";

  currentDrawerId = data.drawer_id;
  const amIDrawing = mySessionId === currentDrawerId;

  // UI Updates
  const secretWordEl = document.getElementById("secret-word");
  const roleTextEl = document.getElementById("role-text");

  secretWordEl.innerText = data.word;

  if (amIDrawing) {
    roleTextEl.innerText = "✏️ IT'S YOUR TURN TO DRAW!";
    roleTextEl.style.color = "#22c55e";
    secretWordEl.style.color = "#22c55e";
    document.getElementById("canvas-container").classList.remove("locked");
    btnClear.style.display = "block";
    chatInput.disabled = true;
    chatBtn.disabled = true;
    chatInput.placeholder = "You are drawing...";
  } else {
    roleTextEl.innerText = `👀 GUESS WHAT ${data.drawer} IS DRAWING`;
    roleTextEl.style.color = "#a1a1aa";
    secretWordEl.style.color = "#ffffff";
    document.getElementById("canvas-container").classList.add("locked");
    btnClear.style.display = "none";
    chatInput.disabled = false;
    chatBtn.disabled = false;
    chatInput.placeholder = "Type your guess here...";
  }

  addMessage("Round Started!", "msg-system");

  canvas.width = INTERNAL_WIDTH;
  canvas.height = INTERNAL_HEIGHT;

  showScreen("game");
  resizeCanvas();
});

// 3. Round End
socket.on("round_end", (data) => {
  const title = document.getElementById("overlay-title");
  const msg = document.getElementById("overlay-msg");

  if (data.reason === "drawer_left") {
    title.innerText = "DRAWER LEFT!";
    title.style.color = "#ef4444";
    msg.innerText = "The drawer disconnected. Round ended.";
  } else {
    title.innerText = "ROUND OVER!";
    title.style.color = "#22c55e";
    msg.innerText = `${data.winner} guessed correctly!`;
  }

  document.getElementById("overlay-word-reveal").innerText = data.word;
  overlay.classList.remove("hidden");
});

// 4. Game Events
socket.on("message", (data) => addMessage(data.message, "msg-chat"));

// Handle Clear Board
socket.on("clear_board", () => {
  drawingHistory = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on("draw_start", (data) => {
  drawingHistory.push({ type: "start", x: data.x, y: data.y });
  drawRemote(data.x, data.y, "start");
});
socket.on("draw_line", (data) => {
  drawingHistory.push({ type: "line", x: data.x, y: data.y });
  drawRemote(data.x, data.y, "line");
});

// User Actions

function joinGame() {
  const username = document.getElementById("username").value.trim();
  const gameId = document.getElementById("gameId").value.trim();
  if (!username || !gameId) return alert("Enter name and room code");
  socket.emit("join_game", { username, game_id: gameId });
}

function startGame() {
  socket.emit("start_game", { game_id: currentGameId });
}

function leaveGame() {
  if (!confirm("Leave the room?")) return;
  socket.emit("leave_game", { game_id: currentGameId });
  resetGame();
}

function resetGame() {
  currentGameId = null;
  mySessionId = null;
  currentDrawerId = null;
  isDrawing = false;
  drawingHistory = [];
  document.getElementById("player-list").innerHTML = "";
  overlay.classList.add("hidden");
  showScreen("login");
}

function backToLobby() {
  overlay.classList.add("hidden");
  showScreen("lobby");
}

function clearCanvas() {
  if (mySessionId === currentDrawerId) {
    socket.emit("clear_board", { game_id: currentGameId });
  }
}

function sendGuess(e) {
  e.preventDefault();
  if (mySessionId === currentDrawerId) return;

  const msg = chatInput.value.trim();
  if (!msg) return;

  socket.emit("guess", { game_id: currentGameId, message: msg });
  chatInput.value = "";
}

// Helper Functions

function updateLobbyList(players) {
  const list = document.getElementById("player-list");
  list.innerHTML = "";

  let amIAdmin = false;
  players.forEach((p) => {
    if (p.pid === mySessionId && p.is_admin) amIAdmin = true;
  });

  const btn = document.getElementById("btn-start-game");
  const msg = document.getElementById("waiting-msg");

  if (amIAdmin) {
    btn.style.display = "block";
    msg.style.display = "none";
  } else {
    btn.style.display = "none";
    msg.style.display = "block";
  }

  players.forEach((p) => {
    const div = document.createElement("div");
    div.className = "player-card";
    div.innerHTML = `
            <span>${p.username} ${p.pid === mySessionId ? "(You)" : ""}</span>
            ${p.is_admin ? '<span class="admin-badge">👑</span>' : ""}
        `;
    list.appendChild(div);
  });
}

function addMessage(text, type = "msg-chat") {
  const div = document.createElement("div");
  div.className = type;
  div.innerText = text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Canvas Logic

function resizeCanvas() {
  const container = document.getElementById("canvas-container");
  if (container && container.clientWidth > 0) {
    const availWidth = container.clientWidth;
    const availHeight = container.clientHeight;

    // 1. Calculate the CSS display size (same aspect ratio logic)
    let cssWidth = availWidth;
    let cssHeight = availWidth / TARGET_ASPECT_RATIO;

    if (cssHeight > availHeight) {
      cssHeight = availHeight;
      cssWidth = availHeight * TARGET_ASPECT_RATIO;
    }

    // 2. Apply ONLY to CSS (Stretch the image)
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
  }
}

window.addEventListener("resize", () => {
  resizeCanvas();
});

function redrawHistory() {
  ctx.beginPath();
  drawingHistory.forEach((step) => {
    drawRemote(step.x, step.y, step.type);
  });
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect(); // Get CSS size/position

  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;

  // 1. Get mouse position relative to the CSS element
  const cssX = cx - rect.left;
  const cssY = cy - rect.top;

  // 2. Scale it to the internal resolution (800x600)
  // Formula: (MousePos / CSS_Size) * Internal_Size
  const scaleX = INTERNAL_WIDTH / rect.width;
  const scaleY = INTERNAL_HEIGHT / rect.height;

  return {
    x: cssX * scaleX, // Example: Mouse at 150px on a 300px wide phone -> becomes 400 internal
    y: cssY * scaleY,
    normX: (cssX * scaleX) / INTERNAL_WIDTH,
    normY: (cssY * scaleY) / INTERNAL_HEIGHT,
  };
}

function startDraw(e) {
  if (mySessionId !== currentDrawerId) return;
  isDrawing = true;
  const p = getPos(e);

  drawingHistory.push({ type: "start", x: p.normX, y: p.normY });
  localDraw(p.x, p.y, "start");
  socket.emit("draw_start", { game_id: currentGameId, x: p.normX, y: p.normY });
}

function moveDraw(e) {
  if (!isDrawing || mySessionId !== currentDrawerId) return;
  if (e.cancelable) e.preventDefault();

  const p = getPos(e);

  // Boundary check: don't draw if mouse slips off the canvas element
  if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
    return;
  }

  drawingHistory.push({ type: "line", x: p.normX, y: p.normY });
  localDraw(p.x, p.y, "line");
  socket.emit("draw_line", { game_id: currentGameId, x: p.normX, y: p.normY });
}

function stopDraw() {
  isDrawing = false;
}

function localDraw(x, y, type) {
  if (type === "start") {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
  } else {
    ctx.lineTo(x, y);
    ctx.stroke();
  }
}

function drawRemote(normX, normY, type) {
  // Convert normalized back to local pixels
  localDraw(normX * canvas.width, normY * canvas.height, type);
}

// Events
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", moveDraw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseout", stopDraw);
canvas.addEventListener("touchstart", startDraw, { passive: false });
canvas.addEventListener("touchmove", moveDraw, { passive: false });
canvas.addEventListener("touchend", stopDraw);
