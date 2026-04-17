# Snake

Classic snake game with a color-picker menu. Two versions:

- **Web** — `index.html` + `snake.js`, plain HTML canvas + JS. Deployed to Vercel.
- **Desktop** — `snake.py`, Python + pygame-ce.

## Play in the browser

Deployed from this repo on Vercel. Locally just open `index.html` in a browser, or serve with:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Run the Python desktop version

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python snake.py
```

## Controls

- Menu: up/down (or W/S) to pick a color, Enter/Space to start
- In-game: arrows or WASD to steer
- Game over: `R` restart with the same color, `M` (or `Esc`) back to menu
