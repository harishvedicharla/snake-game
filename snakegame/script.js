const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20;

let snake, direction, food, score, game;
let level = "medium";
let speed, baseSpeed, minSpeed;
let obstacles = [];
let isPaused = false;

let highScores = JSON.parse(localStorage.getItem("snakeHighScores")) || {
  easy: 0,
  medium: 0,
  hard: 0
};

const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");

// Fix canvas for mobile
function resizeCanvas() {
  let size = Math.min(window.innerWidth * 0.95, 420);
  size = Math.floor(size / box) * box;
  canvas.width = size;
  canvas.height = size;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Direction helper (prevents reverse crash bugs)
function setDirection(newDir) {
  if (newDir === "UP" && direction !== "DOWN") direction = "UP";
  if (newDir === "DOWN" && direction !== "UP") direction = "DOWN";
  if (newDir === "LEFT" && direction !== "RIGHT") direction = "LEFT";
  if (newDir === "RIGHT" && direction !== "LEFT") direction = "RIGHT";
}

// Keyboard controls
document.addEventListener("keydown", e => {
  setDirection(
    e.key === "ArrowUp" ? "UP" :
    e.key === "ArrowDown" ? "DOWN" :
    e.key === "ArrowLeft" ? "LEFT" :
    e.key === "ArrowRight" ? "RIGHT" :
    direction
  );

  if (e.key.toLowerCase() === "p") togglePause();
});

// Start game
function startGame(selectedLevel) {
  level = selectedLevel;

  if (level === "easy") { baseSpeed = 180; minSpeed = 90; }
  if (level === "medium") { baseSpeed = 140; minSpeed = 70; }
  if (level === "hard") { baseSpeed = 110; minSpeed = 50; }

  document.getElementById("startScreen").classList.add("hidden");
  document.querySelector(".game-container").classList.remove("hidden");

  init();
}

// Init
function init() {
  snake = [{ x: 10 * box, y: 10 * box }];
  direction = "RIGHT";
  score = 0;
  speed = baseSpeed;
  isPaused = false;

  food = spawnFood();
  obstacles = level === "hard" ? generateObstacles() : [];

  document.getElementById("score").innerText = score;
  document.getElementById("highScore").innerText = highScores[level];

  clearInterval(game);
  game = setInterval(draw, speed);
}

// Safe food spawn
function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * (canvas.width / box)) * box,
      y: Math.floor(Math.random() * (canvas.height / box)) * box
    };
  } while (
    snake.some(s => s.x === pos.x && s.y === pos.y) ||
    obstacles.some(o => o.x === pos.x && o.y === pos.y)
  );
  return pos;
}

// Obstacles
function generateObstacles() {
  let obs = [];
  for (let i = 0; i < 5; i++) {
    obs.push({
      x: Math.floor(Math.random() * (canvas.width / box)) * box,
      y: Math.floor(Math.random() * (canvas.height / box)) * box
    });
  }
  return obs;
}

// Pause
function togglePause() {
  if (isPaused) {
    game = setInterval(draw, speed);
    document.getElementById("pauseBtn").innerText = "Pause";
  } else {
    clearInterval(game);
    document.getElementById("pauseBtn").innerText = "Resume";
  }
  isPaused = !isPaused;
}

// MAIN GAME LOOP (FIXED COLLISION ORDER)
function draw() {
  if (isPaused) return;

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === "UP") headY -= box;
  if (direction === "DOWN") headY += box;
  if (direction === "LEFT") headX -= box;
  if (direction === "RIGHT") headX += box;

  // NEW HEAD
  let newHead = { x: headX, y: headY };

  // ✅ COLLISION CHECK (FIXED)
  if (
    headX < 0 ||
    headY < 0 ||
    headX >= canvas.width ||
    headY >= canvas.height ||
    snake.some(s => s.x === headX && s.y === headY) ||
    obstacles.some(o => o.x === headX && o.y === headY)
  ) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  // FOOD
  if (headX === food.x && headY === food.y) {
    score++;
    eatSound.play();

    document.getElementById("score").innerText = score;

    if (score % 4 === 0 && speed > minSpeed) {
      speed -= 5;
      clearInterval(game);
      game = setInterval(draw, speed);
    }

    food = spawnFood();
  } else {
    snake.pop();
  }

  // DRAW SNAKE
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? "#0ff" : "#0aa";
    ctx.fillRect(s.x, s.y, box, box);
  });

  // FOOD
  ctx.fillStyle = "red";
  ctx.fillRect(food.x, food.y, box, box);

  // OBSTACLES
  ctx.fillStyle = "gray";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, box, box));
}

// GAME OVER
function endGame() {
  clearInterval(game);
  gameOverSound.play();

  if (score > highScores[level]) {
    highScores[level] = score;
  }

  localStorage.setItem("snakeHighScores", JSON.stringify(highScores));

  document.getElementById("finalScore").innerText = score;
  document.getElementById("easyScore").innerText = highScores.easy;
  document.getElementById("mediumScore").innerText = highScores.medium;
  document.getElementById("hardScore").innerText = highScores.hard;

  document.getElementById("globalBest").innerText =
    Math.max(highScores.easy, highScores.medium, highScores.hard);

  document.querySelector(".game-container").classList.add("hidden");
  document.getElementById("gameOverScreen").classList.remove("hidden");
}

// Restart
function restartGame() {
  document.getElementById("gameOverScreen").classList.add("hidden");
  document.querySelector(".game-container").classList.remove("hidden");
  init();
}

// Menu
function goToMenu() {
  clearInterval(game);
  document.querySelector(".game-container").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
}