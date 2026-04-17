import asyncio
import random
from collections import deque

import pygame

CELL = 20
COLS = 30
ROWS = 30
WIDTH = COLS * CELL
HEIGHT = ROWS * CELL
FPS = 10

BG = (20, 20, 25)
GRID = (30, 30, 35)
GREEN = (40, 200, 60)
DARK_GREEN = (25, 140, 40)
WHITE = (240, 240, 240)
MUTED = (150, 150, 160)

PALETTE = [
    ("Blue", (40, 110, 230)),
    ("Red", (220, 30, 30)),
    ("Yellow", (240, 200, 40)),
    ("Purple", (170, 60, 210)),
    ("Orange", (240, 130, 40)),
    ("Cyan", (40, 200, 220)),
]


def darker(color, factor=0.6):
    return tuple(int(c * factor) for c in color)


def spawn_apple(snake):
    occupied = set(snake)
    free = [(x, y) for x in range(COLS) for y in range(ROWS) if (x, y) not in occupied]
    return random.choice(free) if free else None


def reset(color):
    mid_x, mid_y = COLS // 2, ROWS // 2
    snake = deque([(mid_x + 1, mid_y), (mid_x, mid_y), (mid_x - 1, mid_y)])
    return {
        "snake": snake,
        "direction": (1, 0),
        "pending_direction": (1, 0),
        "apple": spawn_apple(snake),
        "score": 0,
        "game_over": False,
        "color": color,
    }


def step(state):
    if state["game_over"]:
        return

    dx, dy = state["pending_direction"]
    state["direction"] = (dx, dy)

    head_x, head_y = state["snake"][0]
    new_head = (head_x + dx, head_y + dy)
    nx, ny = new_head

    if nx < 0 or nx >= COLS or ny < 0 or ny >= ROWS:
        state["game_over"] = True
        return

    will_grow = new_head == state["apple"]
    body_to_check = list(state["snake"])
    if not will_grow:
        body_to_check = body_to_check[:-1]
    if new_head in body_to_check:
        state["game_over"] = True
        return

    state["snake"].appendleft(new_head)
    if will_grow:
        state["score"] += 1
        state["apple"] = spawn_apple(state["snake"])
    else:
        state["snake"].pop()


def draw_grid(screen):
    for x in range(0, WIDTH, CELL):
        pygame.draw.line(screen, GRID, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, CELL):
        pygame.draw.line(screen, GRID, (0, y), (WIDTH, y))


def draw_game(screen, state, font, big_font):
    screen.fill(BG)
    draw_grid(screen)

    body = state["color"]
    head = darker(body, 0.65)

    if state["apple"] is not None:
        ax, ay = state["apple"]
        cx = ax * CELL + CELL // 2
        cy = ay * CELL + CELL // 2
        pygame.draw.circle(screen, GREEN, (cx, cy), CELL // 2 - 2)
        pygame.draw.circle(screen, DARK_GREEN, (cx, cy), CELL // 2 - 2, 2)

    for i, (sx, sy) in enumerate(state["snake"]):
        rect = pygame.Rect(sx * CELL + 1, sy * CELL + 1, CELL - 2, CELL - 2)
        color = head if i == 0 else body
        pygame.draw.rect(screen, color, rect, border_radius=4)
        if i == 0:
            pygame.draw.rect(screen, body, rect.inflate(-6, -6), border_radius=3)

    score_surf = font.render(f"Score: {state['score']}", True, WHITE)
    screen.blit(score_surf, (10, 8))

    if state["game_over"]:
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 160))
        screen.blit(overlay, (0, 0))
        msg = big_font.render("Game Over", True, WHITE)
        sub = font.render("R restart  -  M menu  -  Esc quit", True, WHITE)
        screen.blit(msg, msg.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 16)))
        screen.blit(sub, sub.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 24)))


def draw_menu(screen, selection, font, big_font):
    screen.fill(BG)
    draw_grid(screen)

    title = big_font.render("SNAKE", True, WHITE)
    screen.blit(title, title.get_rect(center=(WIDTH // 2, 90)))

    prompt = font.render("pick your snake color", True, MUTED)
    screen.blit(prompt, prompt.get_rect(center=(WIDTH // 2, 140)))

    row_h = 38
    start_y = 190
    for i, (name, color) in enumerate(PALETTE):
        y = start_y + i * row_h
        is_sel = i == selection

        if is_sel:
            hl = pygame.Rect(WIDTH // 2 - 160, y - 4, 320, row_h - 4)
            pygame.draw.rect(screen, (45, 45, 55), hl, border_radius=6)
            pygame.draw.rect(screen, color, hl, width=2, border_radius=6)

        swatch = pygame.Rect(WIDTH // 2 - 140, y, 26, 26)
        pygame.draw.rect(screen, color, swatch, border_radius=5)
        pygame.draw.rect(screen, darker(color, 0.65), swatch, width=2, border_radius=5)

        label_color = WHITE if is_sel else MUTED
        label = font.render(name, True, label_color)
        screen.blit(label, (WIDTH // 2 - 100, y + 4))

        marker_text = ">" if is_sel else " "
        marker = font.render(marker_text, True, color)
        screen.blit(marker, (WIDTH // 2 - 160, y + 4))

    hint = font.render("up/down to choose  -  Enter to start  -  Esc to quit", True, MUTED)
    screen.blit(hint, hint.get_rect(center=(WIDTH // 2, HEIGHT - 40)))


KEY_DIRS = {
    pygame.K_UP: (0, -1),
    pygame.K_w: (0, -1),
    pygame.K_DOWN: (0, 1),
    pygame.K_s: (0, 1),
    pygame.K_LEFT: (-1, 0),
    pygame.K_a: (-1, 0),
    pygame.K_RIGHT: (1, 0),
    pygame.K_d: (1, 0),
}


def handle_game_key(event, state):
    if event.key == pygame.K_r and state["game_over"]:
        return reset(state["color"]), "playing"
    if event.key == pygame.K_m and state["game_over"]:
        return state, "menu"
    new_dir = KEY_DIRS.get(event.key)
    if new_dir is not None and not state["game_over"]:
        cdx, cdy = state["direction"]
        ndx, ndy = new_dir
        if (ndx, ndy) != (-cdx, -cdy):
            state["pending_direction"] = new_dir
    return state, "playing"


def handle_menu_key(event, selection):
    if event.key in (pygame.K_UP, pygame.K_w):
        return (selection - 1) % len(PALETTE), False
    if event.key in (pygame.K_DOWN, pygame.K_s):
        return (selection + 1) % len(PALETTE), False
    if event.key in (pygame.K_RETURN, pygame.K_SPACE):
        return selection, True
    return selection, False


async def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Snake")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("menlo,monaco,monospace", 18)
    big_font = pygame.font.SysFont("menlo,monaco,monospace", 40, bold=True)

    scene = "menu"
    selection = 0
    state = None

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
                break
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                    break
                if scene == "menu":
                    selection, start = handle_menu_key(event, selection)
                    if start:
                        state = reset(PALETTE[selection][1])
                        scene = "playing"
                else:
                    state, scene = handle_game_key(event, state)
                    if scene == "menu":
                        state = None

        if scene == "playing":
            step(state)
            draw_game(screen, state, font, big_font)
        else:
            draw_menu(screen, selection, font, big_font)

        pygame.display.flip()
        await asyncio.sleep(0)
        clock.tick(FPS)

    pygame.quit()


if __name__ == "__main__":
    asyncio.run(main())
