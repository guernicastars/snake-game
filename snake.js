const CELL = 20;
const COLS = 30;
const ROWS = 30;
const WIDTH = COLS * CELL;
const HEIGHT = ROWS * CELL;
const FPS = 10;

const BG = "#14141a";
const GRID = "#1e1e23";
const GREEN = "#28c83c";
const DARK_GREEN = "#198c28";
const WHITE = "#f0f0f0";
const MUTED = "#9696a0";

const PALETTE = [
  { name: "Blue",   color: "rgb(40, 110, 230)" },
  { name: "Red",    color: "rgb(220, 30, 30)"  },
  { name: "Yellow", color: "rgb(240, 200, 40)" },
  { name: "Purple", color: "rgb(170, 60, 210)" },
  { name: "Orange", color: "rgb(240, 130, 40)" },
  { name: "Cyan",   color: "rgb(40, 200, 220)" },
];

function darker(rgbStr, factor = 0.6) {
  const m = rgbStr.match(/\d+/g).map(Number);
  return `rgb(${Math.round(m[0] * factor)}, ${Math.round(m[1] * factor)}, ${Math.round(m[2] * factor)})`;
}

function spawnApple(snake) {
  const occupied = new Set(snake.map(([x, y]) => `${x},${y}`));
  const free = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!occupied.has(`${x},${y}`)) free.push([x, y]);
    }
  }
  return free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

function initialState(color) {
  const mx = Math.floor(COLS / 2);
  const my = Math.floor(ROWS / 2);
  const snake = [[mx + 1, my], [mx, my], [mx - 1, my]];
  return {
    snake,
    direction: [1, 0],
    pendingDirection: [1, 0],
    apple: spawnApple(snake),
    score: 0,
    gameOver: false,
    color,
  };
}

function step(state) {
  if (state.gameOver) return;
  state.direction = state.pendingDirection;
  const [dx, dy] = state.direction;
  const [hx, hy] = state.snake[0];
  const newHead = [hx + dx, hy + dy];
  const [nx, ny] = newHead;

  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
    state.gameOver = true;
    return;
  }

  const willGrow = state.apple && newHead[0] === state.apple[0] && newHead[1] === state.apple[1];
  const body = willGrow ? state.snake : state.snake.slice(0, -1);
  for (const [bx, by] of body) {
    if (bx === nx && by === ny) {
      state.gameOver = true;
      return;
    }
  }

  state.snake.unshift(newHead);
  if (willGrow) {
    state.score += 1;
    state.apple = spawnApple(state.snake);
  } else {
    state.snake.pop();
  }
}

function drawGrid(ctx) {
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= WIDTH; x += CELL) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, HEIGHT);
  }
  for (let y = 0; y <= HEIGHT; y += CELL) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(WIDTH, y + 0.5);
  }
  ctx.stroke();
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawGame(ctx, state) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid(ctx);

  const body = state.color;
  const head = darker(body, 0.65);

  if (state.apple) {
    const [ax, ay] = state.apple;
    const cx = ax * CELL + CELL / 2;
    const cy = ay * CELL + CELL / 2;
    const r = CELL / 2 - 2;
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = DARK_GREEN;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  state.snake.forEach(([sx, sy], i) => {
    const x = sx * CELL + 1;
    const y = sy * CELL + 1;
    const w = CELL - 2;
    const h = CELL - 2;
    ctx.fillStyle = i === 0 ? head : body;
    roundedRect(ctx, x, y, w, h, 4);
    ctx.fill();
    if (i === 0) {
      ctx.fillStyle = body;
      roundedRect(ctx, x + 3, y + 3, w - 6, h - 6, 3);
      ctx.fill();
    }
  });

  ctx.fillStyle = WHITE;
  ctx.font = "bold 18px ui-monospace, Menlo, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Score: ${state.score}`, 10, 10);

  if (state.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = WHITE;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 48px ui-monospace, Menlo, monospace";
    ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = "16px ui-monospace, Menlo, monospace";
    ctx.fillText("R restart   -   M menu", WIDTH / 2, HEIGHT / 2 + 30);
  }
}

function drawMenu(ctx, selection) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid(ctx);

  ctx.fillStyle = WHITE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 56px ui-monospace, Menlo, monospace";
  ctx.fillText("SNAKE", WIDTH / 2, 100);

  ctx.fillStyle = MUTED;
  ctx.font = "16px ui-monospace, Menlo, monospace";
  ctx.fillText("pick your snake color", WIDTH / 2, 150);

  const rowH = 44;
  const startY = 210;
  PALETTE.forEach(({ name, color }, i) => {
    const y = startY + i * rowH;
    const isSel = i === selection;

    if (isSel) {
      ctx.fillStyle = "#2d2d37";
      roundedRect(ctx, WIDTH / 2 - 160, y - 16, 320, 32, 6);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      roundedRect(ctx, WIDTH / 2 - 160, y - 16, 320, 32, 6);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    roundedRect(ctx, WIDTH / 2 - 140, y - 13, 26, 26, 5);
    ctx.fill();
    ctx.strokeStyle = darker(color, 0.6);
    ctx.lineWidth = 2;
    roundedRect(ctx, WIDTH / 2 - 140, y - 13, 26, 26, 5);
    ctx.stroke();

    ctx.fillStyle = isSel ? WHITE : MUTED;
    ctx.textAlign = "left";
    ctx.font = "bold 18px ui-monospace, Menlo, monospace";
    ctx.fillText(name, WIDTH / 2 - 100, y);

    if (isSel) {
      ctx.fillStyle = color;
      ctx.fillText(">", WIDTH / 2 - 155, y);
    }
  });

  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.font = "14px ui-monospace, Menlo, monospace";
  ctx.fillText("up / down to choose   -   Enter to start", WIDTH / 2, HEIGHT - 40);
}

const DIR_KEYS = {
  ArrowUp:    [0, -1],
  KeyW:       [0, -1],
  ArrowDown:  [0,  1],
  KeyS:       [0,  1],
  ArrowLeft:  [-1, 0],
  KeyA:       [-1, 0],
  ArrowRight: [ 1, 0],
  KeyD:       [ 1, 0],
};

function main() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  canvas.focus();

  let scene = "menu";
  let selection = 0;
  let state = null;

  function handleKey(e) {
    if (scene === "menu") {
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        selection = (selection - 1 + PALETTE.length) % PALETTE.length;
        e.preventDefault();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        selection = (selection + 1) % PALETTE.length;
        e.preventDefault();
      } else if (e.code === "Enter" || e.code === "Space") {
        state = initialState(PALETTE[selection].color);
        scene = "playing";
        e.preventDefault();
      }
      return;
    }

    if (state.gameOver) {
      if (e.code === "KeyR") {
        state = initialState(PALETTE[selection].color);
      } else if (e.code === "KeyM" || e.code === "Escape") {
        scene = "menu";
        state = null;
      }
      return;
    }

    const dir = DIR_KEYS[e.code];
    if (dir) {
      const [cdx, cdy] = state.direction;
      const [ndx, ndy] = dir;
      if (!(ndx === -cdx && ndy === -cdy)) {
        state.pendingDirection = dir;
      }
      e.preventDefault();
    } else if (e.code === "Escape") {
      scene = "menu";
      state = null;
    }
  }

  window.addEventListener("keydown", handleKey);
  canvas.addEventListener("click", () => canvas.focus());

  let last = performance.now();
  const frameMs = 1000 / FPS;
  function loop(now) {
    if (now - last >= frameMs) {
      last = now;
      if (scene === "playing" && state) step(state);
    }
    if (scene === "playing" && state) drawGame(ctx, state);
    else drawMenu(ctx, selection);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

main();
