# Snake

Classic snake game in Python with pygame-ce, with a color-picker menu. Also compiles to WebAssembly via pygbag for browser play.

## Run locally

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python snake.py
```

## Controls

- Menu: up/down (or W/S) to choose a snake color, Enter/Space to start
- In-game: arrows or WASD to steer
- Game over: `R` restart with same color, `M` back to menu, `Esc` quit

## Browser build (pygbag)

```bash
.venv/bin/pip install pygbag
.venv/bin/python -m pygbag snake.py          # local test server at http://localhost:8000
.venv/bin/python -m pygbag --build snake.py  # static bundle in build/web/
```

Deployed automatically from this repo to Vercel (see `vercel.json`).
