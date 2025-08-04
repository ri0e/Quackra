import pygame
import time
import math
from assets import load_images

pygame.init()
pygame.mixer.init()

# --- Sounds ---
coin_sound = pygame.mixer.Sound('assets/coin.mp3')
egg_sound = pygame.mixer.Sound('assets/egg.mp3')
hurt_sound = pygame.mixer.Sound('assets/hurt.mp3')
bee_sound = pygame.mixer.Sound('assets/bee.mp3')
bee_sound.set_volume(0.3)
win_sound = pygame.mixer.Sound('assets/win.mp3')

# --- Screen setup ---
WIDTH, HEIGHT = 900, 600
window = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption('Quackra')
icon = pygame.image.load('assets/duck.png')
pygame.display.set_icon(icon)
clock = pygame.time.Clock()

# --- Load images ---
images = load_images()
grass_tile = images["grass_tile"]
grass3_tile = images["grass3_tile"]
dirt_tile = images["dirt_tile"]
water_tile = images["water_tile"]
duck_swim = images["duck_swim"]
sky_img = images["sky_img"]
duck_walk = images["duck_walk"]
bee_img = images["bee_img"]
toast_img = images["toast_img"]
cookie_img = images["cookie_img"]
chocolate_img = images["chocolate_img"]
home_bg = images["home_bg"]
heart_img = pygame.image.load('assets/heart.png').convert_alpha()
egg_img = pygame.Surface((10, 10), pygame.SRCALPHA)
pygame.draw.circle(egg_img, (255, 255, 255), (5, 5), 5)

TILE_SIZE = 60
GRASS_TOP_OFFSET = 15

font = pygame.font.Font(None, 50)
small_font = pygame.font.Font(None, 30)

def slice_frames(sheet, frame_width, frame_height, num_frames):
    frames = []
    for i in range(num_frames):
        rect = pygame.Rect(i * frame_width, 0, frame_width, frame_height)
        frame = pygame.Surface((frame_width, frame_height), pygame.SRCALPHA)
        frame.blit(sheet, (0, 0), rect)
        frames.append(frame)
    return frames

duck_frames_right = slice_frames(duck_walk, 47, 60, 3)
duck_frames_left = [pygame.transform.flip(frame, True, False) for frame in duck_frames_right]

# --- Game States ---
STATE_HOME = 0
STATE_LEVEL_SELECT = 1
STATE_PLAYING = 2
STATE_LOSE = 3
STATE_MENU = 4
STATE_TUTORIAL = 5
STATE_WIN = 6
game_state = STATE_HOME

# --- Levels Data ---
levels = {
    1: [
        "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000H00000000000000000000000000000000000000000000000000000",
        "000000000000000000000000000C000011100000000000000000000000000000000000000000000000000000",
        "000000000000000000000000011110000000000000000000000000C0000000000000000000000T0000000000",
        "0000000000000000000T00T00000000000000000000000000T00000000000000000000000000000000000000",
        "00000000T000T00000111110000000000000000C00T00000111000000000C000T000T000T000000000000000",
        "111111100111111111222221111111111111111111111111222111111111111111111111111111111111WWWW",
        "2222222112222222222222222222222222222222222222222222222222222222222222222222222222222222",
        "2222222222222222222222222222222222222222222222222222222222222222222222222222222222222222"
    ],
    2:[
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "0000000000000000000000000000000000H0000000000000000000000000000000000000000000H00000000000000000000",
        "0000000000000000000000C0001111000000000000000C00000000000000000000000000000000100000000000000000000",
        "000000000000T00000011100000000000000110000000000000000T000000000000000000000C0000000000000000000000",
        "0000000000000000000000000T000000000000000T0000000000000000000000000000000000110000000T0000000000000",
        "000T0000C000000111110000000000000000C00000000011100000C0000000T0000000000000000000000000000T0000000",
        "111111111111111222221111111111111111111111111122211111111111111111111000111111111111111111111111WWW",
        "222222222222222222222222222222222222222222222222222222222222222222222000222222222222222222222222222",
        "222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222"
    ],
    3: [
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "000000000000C0000000H000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "00000000000000010000T000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "00000000000100000000T00000000000000000000000000000000000000000000000000C000000000000000000000000000000000000000000000",
        "000000000C0000000000T000000000000000000TTT000000000000000000000000000001000000000000000000000000000000000000000000000",
        "00000000110000000000T0000000000000000000000000000000000000000000000000T0000000000T000T0000000000000000000000000000000",
        "0000000000000000000000000000000000T00000000000001111000000000000000000100000000000000000000000000T00T00T00T00T00T0000",
        "111111111111111111111111111111111111111111111111222211000111111111111021111111111111111100111111111111111111111111WWW",
        "22222222222222222222222222222222222222222222222222222200T0T0C0T0T0C00T22222222222222222200222222222222222222222222222",
        "222222222222222222222222222222222222222222222222222222222222222222222222222222222222222200222222222222222222222222222"
    ],
    4: [
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "000000000000000000000000000000000C0000000000000H00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "00000000000000000000000000000C0C111000000000000C000000000000000000000000000000000000000000000000C00000000H0000000000000000000000000000000000000000",
        "00000000000000000000000000TT1111200000000000000T0000000000000000C000000000000000000000000000000000000000110000000000000000000000000000000000000000",
        "000000000000000000000CT011112000000000000000000T00000000000000000000000T0000000000T00000000000T0000000000000000C0000000000000000000000000000000000",
        "0000000000000000T000111120000000000000000000000T00000000000T0000000000000000T000000000T000000000000000000000000000000000000T000000000000T0000T0000",
        "H1111111111110111111222221111111111111111111111C11111111111111111111111111111111111111111111111111111111111111111111111001111110111110111111111WWW",
        "22222222222C00222222222222222222222222222222222C00C00T00T00C00T00H22222222222222222222222222222222222222222222222222222222222220222220222222222222",
        "22222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222222220222220222222222222"
    ],
    5: [
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "000000000000000000000000000000H00000000000000000000000000000000000000000000000000000000000000HC000000000000000000000000000000000000000000000000H000000000000000",
        "00000000000000000000000000C0001000000000000000000000000000000000000000000000000000000TT0000001100000000000000000000000000000000000000000000C0001000000000000000",
        "0000000000000000000000C000100000000000000000C00000C000T000C0000000T0000H000000T0000001100000000000000T00000000000000C000000000000000000C00010000000000T00000000",
        "00000000000000000000001000000000000000000T000000000000000000000000000000000000000010000000000000000000000000C00000000000000000000000T01000000000000T0000000000",
        "00000000T000T00T00T000000000000000000T000000000000000000000000000000000000000000000000000000000000000000000000000000000000H00000000000000000000000000000000000",
        "101111111111111111111111111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111111111111111111111WWW",
        "222222222222222222222222222222222000022222222222222222222222222222222222222222222222222222222222222222222222222222222222222200002222222222222222222222222222222",
        "222222222222222222222222222222222000022222222222222222222222222222222222222222222222222222222222222222222222222222222222222200002222222222222222222222222222222"
    ]
}

selected_level = 1
bee_triggers = []
bee_playing = False

def draw_home_screen():
    window.blit(home_bg, (0, 0))
    title = "Quackra"
    for dx, dy in [(-2,0),(2,0),(0,-2),(0,2)]:
        border_text = font.render(title, True, (0,0,0))
        window.blit(border_text, (WIDTH//2 - border_text.get_width()//2 + dx,
                                  HEIGHT//3 + dy))
    title_text = font.render(title, True, (255, 255, 255))
    window.blit(title_text, (WIDTH//2 - title_text.get_width()//2, HEIGHT//3))
    instruction_text = small_font.render("Press ENTER or TAB ON THE SCREEN HERE to start", True, (255, 255, 255))
    window.blit(instruction_text, (WIDTH//2 - instruction_text.get_width()//2, HEIGHT//2))
    credit_text = small_font.render("Art is by @Cookiekayjax on PixilArt", True, (255, 244, 41))
    window.blit(credit_text, (10, HEIGHT - 40))
    pygame.display.flip()

duck_image = pygame.image.load('assets/duck.png').convert_alpha()

def draw_tutorial_screen():
    for y in range(0, HEIGHT, grass_tile.get_height()):
        for x in range(0, WIDTH, grass_tile.get_width()):
            window.blit(grass_tile, (x, y))
    bob = int(5 * math.sin(time.time() * 3))
    window.blit(duck_image, (WIDTH // 4 - duck_image.get_width() // 2, HEIGHT // 2 + bob))
    window.blit(bee_img, (int(WIDTH * 0.7), HEIGHT // 2 - 50 - bob))
    lines = [
        "Meet Quackra, the brave duck!",
        "Help Quackra reach the leak to swim.",
        "Beware of Haider the bee!",
        "",
        "Controls:",
        "Arrow Keys - Move",
        "Up Arrow - Jump (double jump)",
        "Space - Shoot eggs",
        "ESC - Pause",
        "",
        "Collect food for points and speed boost.",
        "",
        "Press ENTER or TAB ON THE SCREEN to start the adventure!"
    ]
    y = 60
    for line in lines:
        text = small_font.render(line, True, (255, 244, 41)) 
        window.blit(text, (WIDTH // 2 - text.get_width() // 2, y))
        y += 40
    pygame.display.flip()

def draw_level_select(duck_bob_offset):
    for y in range(0, HEIGHT, grass3_tile.get_height()):
        for x in range(0, WIDTH, grass3_tile.get_width()):
            window.blit(grass3_tile, (x, y))
    title_text = font.render("Select Level", True, (255, 255, 255))
    window.blit(title_text, (WIDTH // 2 - title_text.get_width()//2, HEIGHT // 8))
    start_y = HEIGHT // 4
    spacing = 60
    for i in range(1, 6):
        color = (255, 244, 41) if i == selected_level else (255, 255, 255)
        level_text = font.render(f"Level {i}", True, color)
        window.blit(level_text, (WIDTH // 2 - level_text.get_width() // 2, start_y + i * spacing))
    duck_y = start_y + selected_level * spacing + duck_bob_offset - 10
    window.blit(duck_frames_right[1], (WIDTH // 2 - 150, duck_y))
    instructions = small_font.render("Use UP/DOWN arrows and ENTER or TAB on the level to select", True, (255, 255, 255))
    window.blit(instructions, (WIDTH // 2 - instructions.get_width() // 2, HEIGHT - 80))
    pygame.display.flip()

def draw_lose_screen(duck_bob_offset, selected_option):
    for y in range(0, HEIGHT, grass3_tile.get_height()):
        for x in range(0, WIDTH, grass3_tile.get_width()):
            window.blit(grass3_tile, (x, y))
    title_text = font.render("You Lost!", True, (255, 41, 41))
    window.blit(title_text, (WIDTH // 2 - title_text.get_width() // 2, HEIGHT // 8))
    options = ["Play Again", "Exit to Home", "Change Level"]
    start_y = HEIGHT // 3
    spacing = 60
    for i, option in enumerate(options):
        color = (255, 244, 41) if i == selected_option else (255, 255, 255)
        option_text = font.render(option, True, color)
        window.blit(option_text, (WIDTH // 2 - option_text.get_width() // 2, start_y + i * spacing))
    duck_y = start_y + selected_option * spacing + duck_bob_offset - 10
    window.blit(duck_frames_right[1], (WIDTH // 2 - 150, duck_y))
    pygame.display.flip()

def draw_menu_screen(duck_bob_offset, selected_option):
    for y in range(0, HEIGHT, grass3_tile.get_height()):
        for x in range(0, WIDTH, grass3_tile.get_width()):
            window.blit(grass3_tile, (x, y))
    title_text = font.render("Paused", True, (255, 255, 255))
    window.blit(title_text, (WIDTH // 2 - title_text.get_width() // 2, HEIGHT // 8))
    options = ["Continue", "Re-Play", "Change Level", "Exit to Home"]
    start_y = HEIGHT // 3
    spacing = 60
    for i, option in enumerate(options):
        color = (255, 244, 41) if i == selected_option else (255, 255, 255)
        option_text = font.render(option, True, color)
        window.blit(option_text, (WIDTH // 2 - option_text.get_width() // 2, start_y + i * spacing))
    duck_y = start_y + selected_option * spacing + duck_bob_offset - 10
    window.blit(duck_frames_right[1], (WIDTH // 2 - 150, duck_y))
    pygame.display.flip()

def init_game(level_num):
    global player_x, player_y, player_speed, velocity, jumps_remaining
    global toast_count, cookie_count, choco_count, choco_boost_end, boost_active
    global bee_list, triggered_bees, camera_x, start_time
    global tilemap, toasts, cookies, chocolates, lives, eggs, bee_triggers, waters

    bee_triggers = []
    if level_num == 1:
        bee_triggers = [(600, 300), (1200, 350), (1800, 300), (2400, 320), (3000, 280) ]
    elif level_num == 2:
        bee_triggers = [(500, 250), (800, 300), (1200, 270), (1500, 260), (2000, 300), (2500, 250), (3000, 230), (3999, 244), (4500, 230)]
    elif level_num == 3:
        bee_triggers = [(800, 240), (900, 230), (900, 265), (1200, 250), (1600, 270), (1700, 235), (2000, 260), (2200, 300), (3000, 254), (3555, 239), (4000, 280)]
    elif level_num == 4:
        bee_triggers = [(300, 250), (400, 210), (500, 240), (600, 230), (700, 300), (800, 240), (1000, 230), (1200, 244), (1400, 225), (1700, 221), (2000, 234), (2003, 239), (2006, 280), (2400, 200), (2800, 230), (3000, 260), (3200, 244), (3300, 230), (3600, 250), (3800, 254), (4000, 239), (4200, 280), (4400, 300)]
    elif level_num == 5:
        bee_triggers = [(280, 220), (300, 210), (370, 220), (375, 230), (380, 190), (370, 230), (400, 170), (430, 180), (430, 220), (500, 240), (500, 230), (500, 240), (500, 170), (560, 190), (600, 180), (680, 201), (700, 206), (800, 210), (900, 190), (1000, 160), (1100, 200), (1200, 204), (1300, 207), (1400, 190), (1500, 210), (1600, 220), (1700, 205), (1800, 200), (1900, 210), (2000, 230), (2100, 290), (2200, 220), (2300, 260), (2400, 230), (2500, 250), (2600, 250), (2700, 230), (2800, 240), (2900, 250), 
        (3000, 220), (3100, 224), (3200, 240), (3300, 201), (3400, 190), (3500, 210), (3600, 212), (3700, 170), (3800, 220), (3900, 222), (4000, 240), (4100, 202), (4200, 200), (4300, 220), (4400, 214), (4500, 181), (4600, 220), (4700, 225), (4800, 240), (4900, 203), (5000, 210), (5100, 170), (5200, 215), (5300, 193), (5400, 220), (5500, 227), (5600, 240), (5700, 204), (5800, 190), (5900, 223), (6000, 216), (6100, 185), (6200, 220), (6300, 229), (6400, 240), (6500, 190), (6600, 204), (6700, 215), (6800, 218), (6900, 200), (7000, 220), (7100, 222), (7200, 240), (7300, 205), (7400, 206), (7500, 219), (7600, 219), (7700, 190), (7800, 220), (7900, 221), (8000, 240), (8100, 206), (8200, 190), (8300, 215), (8400, 221), (8500, 210), (8600, 220), (8700, 223), (8800, 240), (8900, 207), (9000, 230)]
    triggered_bees = set()
    tilemap = levels[level_num]
    player_x, player_y = 200, 365
    player_speed = 6
    velocity = 0
    jumps_remaining = 2
    toast_count = 0
    cookie_count = 0
    choco_count = 0
    choco_boost_end = 0
    boost_active = False
    bee_list = []
    triggered_bees = set()
    camera_x = 0
    start_time = time.time()
    lives = 3
    eggs = []
    toasts, cookies, chocolates = [], [], []
    waters = []
    for y, row in enumerate(tilemap):
        for x, tile in enumerate(row):
            world_x, world_y = x * TILE_SIZE, y * TILE_SIZE
            if tile == "W":  
                waters.append(pygame.Rect(world_x, world_y, TILE_SIZE, TILE_SIZE))
            elif tile == "T":
                toasts.append(pygame.Rect(world_x, world_y + 10, toast_img.get_width(), toast_img.get_height()))
            elif tile == "C":
                cookies.append(pygame.Rect(world_x, world_y + 10, cookie_img.get_width(), cookie_img.get_height()))
            elif tile == "H":
                chocolates.append(pygame.Rect(world_x, world_y + 10, chocolate_img.get_width(), chocolate_img.get_height()))

base_speed = 6
player_speed = base_speed
velocity = 0
gravity = 0.9
jump_power = -15
boost_jump_power = -20
jumps_remaining = 2
boost_active = False
choco_boost_end = 0

frame_index = 0
frame_timer = 0
animation_speed = 0.2
facing_right = True
start_time = time.time()
duck_bob_angle = 0
lose_duck_angle = 0
lose_selected_option = 0
menu_selected_option = 0
running = True
swimming = False
swim_timer = 0
win_sound_played = False
# --- Button positions and sizes ---
BTN_SIZE = 64
BTN_MARGIN = 20
btn_left = pygame.Rect(BTN_MARGIN, HEIGHT-BTN_SIZE-BTN_MARGIN, BTN_SIZE, BTN_SIZE)
btn_right = pygame.Rect(BTN_MARGIN*2+BTN_SIZE, HEIGHT-BTN_SIZE-BTN_MARGIN, BTN_SIZE, BTN_SIZE)
btn_jump = pygame.Rect(WIDTH-BTN_MARGIN-BTN_SIZE, HEIGHT-BTN_SIZE*2-BTN_MARGIN*2, BTN_SIZE, BTN_SIZE)
btn_shoot = pygame.Rect(WIDTH-BTN_MARGIN-BTN_SIZE, HEIGHT-BTN_SIZE-BTN_MARGIN, BTN_SIZE, BTN_SIZE)

btn_left_pressed = False
btn_right_pressed = False
btn_jump_pressed = False
btn_shoot_pressed = False

last_level_tap = None
last_level_tap_time = 0
DOUBLE_TAP_DELAY = 0.5  # seconds

last_lose_tap = None
last_lose_tap_time = 0
LOSE_DOUBLE_TAP_DELAY = 0.5  # seconds

def draw_buttons():
    # Draw left arrow
    pygame.draw.rect(window, (200,200,200), btn_left, border_radius=16)
    pygame.draw.polygon(window, (80,80,80), [
        (btn_left.left+16, btn_left.centery),
        (btn_left.right-16, btn_left.top+16),
        (btn_left.right-16, btn_left.bottom-16)
    ])
    # Draw right arrow
    pygame.draw.rect(window, (200,200,200), btn_right, border_radius=16)
    pygame.draw.polygon(window, (80,80,80), [
        (btn_right.right-16, btn_right.centery),
        (btn_right.left+16, btn_right.top+16),
        (btn_right.left+16, btn_right.bottom-16)
    ])
    # Draw jump button (up arrow)
    pygame.draw.rect(window, (200,200,200), btn_jump, border_radius=16)
    pygame.draw.polygon(window, (80,80,80), [
        (btn_jump.centerx, btn_jump.top+16),
        (btn_jump.left+16, btn_jump.bottom-16),
        (btn_jump.right-16, btn_jump.bottom-16)
    ])
    # Draw shoot button (egg)
    pygame.draw.rect(window, (200,200,200), btn_shoot, border_radius=16)
    pygame.draw.circle(window, (255,255,255), btn_shoot.center, BTN_SIZE//4)
    pygame.draw.circle(window, (80,80,80), btn_shoot.center, BTN_SIZE//4, 3)

while running:

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

        # --- Touch/Mouse controls: set flags on DOWN, clear on UP ---
        if event.type == pygame.MOUSEBUTTONDOWN:
            mx, my = event.pos
            if btn_left.collidepoint(mx, my):
                btn_left_pressed = True
            if btn_right.collidepoint(mx, my):
                btn_right_pressed = True
            if btn_jump.collidepoint(mx, my):
                btn_jump_pressed = True
            if btn_shoot.collidepoint(mx, my):
                btn_shoot_pressed = True
        if event.type == pygame.MOUSEBUTTONUP:
            mx, my = event.pos
            if btn_left.collidepoint(mx, my):
                btn_left_pressed = False
            if btn_right.collidepoint(mx, my):
                btn_right_pressed = False
            if btn_jump.collidepoint(mx, my):
                btn_jump_pressed = False
            if btn_shoot.collidepoint(mx, my):
                btn_shoot_pressed = False
        if event.type == pygame.FINGERDOWN:
            tx = int(event.x * WIDTH)
            ty = int(event.y * HEIGHT)
            if btn_left.collidepoint(tx, ty):
                btn_left_pressed = True
            if btn_right.collidepoint(tx, ty):
                btn_right_pressed = True
            if btn_jump.collidepoint(tx, ty):
                btn_jump_pressed = True
            if btn_shoot.collidepoint(tx, ty):
                btn_shoot_pressed = True
        if event.type == pygame.FINGERUP:
            tx = int(event.x * WIDTH)
            ty = int(event.y * HEIGHT)
            if btn_left.collidepoint(tx, ty):
                btn_left_pressed = False
            if btn_right.collidepoint(tx, ty):
                btn_right_pressed = False
            if btn_jump.collidepoint(tx, ty):
                btn_jump_pressed = False
            if btn_shoot.collidepoint(tx, ty):
                btn_shoot_pressed = False
                
        if game_state == STATE_HOME:
            if event.type == pygame.KEYDOWN and event.key == pygame.K_RETURN:
                game_state = STATE_LEVEL_SELECT
            # --- Touch/Mouse support ---
            if event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                # Make the title or instruction area clickable
                title_rect = pygame.Rect(WIDTH//2-200, HEIGHT//3, 400, 100)
                instr_rect = pygame.Rect(WIDTH//2-200, HEIGHT//2, 400, 50)
                if title_rect.collidepoint(mx, my) or instr_rect.collidepoint(mx, my):
                    game_state = STATE_LEVEL_SELECT
            if event.type == pygame.FINGERDOWN:
                tx = int(event.x * WIDTH)
                ty = int(event.y * HEIGHT)
                title_rect = pygame.Rect(WIDTH//2-200, HEIGHT//3, 400, 100)
                instr_rect = pygame.Rect(WIDTH//2-200, HEIGHT//2, 400, 50)
                if title_rect.collidepoint(tx, ty) or instr_rect.collidepoint(tx, ty):
                    game_state = STATE_LEVEL_SELECT

        elif game_state == STATE_LEVEL_SELECT:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    selected_level = max(1, selected_level - 1)
                elif event.key == pygame.K_DOWN:
                    selected_level = min(5, selected_level + 1)
                elif event.key == pygame.K_RETURN:
                    if selected_level == 1:
                        game_state = STATE_TUTORIAL
                    else:
                        game_state = STATE_PLAYING
                        init_game(selected_level)
            # --- Touch/Mouse support with double tap ---
            if event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                start_y = HEIGHT // 4
                spacing = 60
                for i in range(1, 6):
                    rect = pygame.Rect(WIDTH // 2 - 100, start_y + i * spacing, 200, 50)
                    if rect.collidepoint(mx, my):
                        if selected_level == i and last_level_tap == i and time.time() - last_level_tap_time < DOUBLE_TAP_DELAY:
                            # Double tap detected, start game
                            if selected_level == 1:
                                game_state = STATE_TUTORIAL
                            else:
                                game_state = STATE_PLAYING
                                init_game(selected_level)
                        else:
                            selected_level = i
                            last_level_tap = i
                            last_level_tap_time = time.time()
            if event.type == pygame.FINGERDOWN:
                tx = int(event.x * WIDTH)
                ty = int(event.y * HEIGHT)
                start_y = HEIGHT // 4
                spacing = 60
                for i in range(1, 6):
                    rect = pygame.Rect(WIDTH // 2 - 100, start_y + i * spacing, 200, 50)
                    if rect.collidepoint(tx, ty):
                        if selected_level == i and last_level_tap == i and time.time() - last_level_tap_time < DOUBLE_TAP_DELAY:
                            # Double tap detected, start game
                            if selected_level == 1:
                                game_state = STATE_TUTORIAL
                            else:
                                game_state = STATE_PLAYING
                                init_game(selected_level)
                        else:
                            selected_level = i
                            last_level_tap = i
                            last_level_tap_time = time.time()

        elif game_state == STATE_TUTORIAL:
            if event.type == pygame.KEYDOWN and event.key == pygame.K_RETURN:
                game_state = STATE_PLAYING
                init_game(selected_level)
            # --- Touch/Mouse support ---
            if event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                # Make the instruction area clickable
                instr_rect = pygame.Rect(WIDTH//2-200, 60, 400, 500)
                if instr_rect.collidepoint(mx, my):
                    game_state = STATE_PLAYING
                    init_game(selected_level)
            if event.type == pygame.FINGERDOWN:
                tx = int(event.x * WIDTH)
                ty = int(event.y * HEIGHT)
                instr_rect = pygame.Rect(WIDTH//2-200, 60, 400, 500)
                if instr_rect.collidepoint(tx, ty):
                    game_state = STATE_PLAYING
                    init_game(selected_level)

        elif game_state == STATE_LOSE:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    lose_selected_option = (lose_selected_option - 1) % 3
                elif event.key == pygame.K_DOWN:
                    lose_selected_option = (lose_selected_option + 1) % 3
                elif event.key == pygame.K_RETURN:
                    if lose_selected_option == 0:
                        game_state = STATE_PLAYING
                        init_game(selected_level)
                    elif lose_selected_option == 1:
                        game_state = STATE_HOME
                    elif lose_selected_option == 2:
                        game_state = STATE_LEVEL_SELECT
            # --- Touch/Mouse support with double tap ---
            if event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                start_y = HEIGHT // 3
                spacing = 60
                for i in range(3):
                    rect = pygame.Rect(WIDTH // 2 - 150, start_y + i * spacing, 300, 50)
                    if rect.collidepoint(mx, my):
                        if lose_selected_option == i and last_lose_tap == i and time.time() - last_lose_tap_time < LOSE_DOUBLE_TAP_DELAY:
                            # Double tap detected, trigger action
                            if i == 0:
                                game_state = STATE_PLAYING
                                init_game(selected_level)
                            elif i == 1:
                                game_state = STATE_HOME
                            elif i == 2:
                                game_state = STATE_LEVEL_SELECT
                        else:
                            lose_selected_option = i
                            last_lose_tap = i
                            last_lose_tap_time = time.time()

            if event.type == pygame.FINGERDOWN:
                tx = int(event.x * WIDTH)
                ty = int(event.y * HEIGHT)
                start_y = HEIGHT // 3
                spacing = 60
                for i in range(3):
                    rect = pygame.Rect(WIDTH // 2 - 150, start_y + i * spacing, 300, 50)
                    if rect.collidepoint(tx, ty):
                        if lose_selected_option == i and last_lose_tap == i and time.time() - last_lose_tap_time < LOSE_DOUBLE_TAP_DELAY:
                            # Double tap detected, trigger action
                            if i == 0:
                                game_state = STATE_PLAYING
                                init_game(selected_level)
                            elif i == 1:
                                game_state = STATE_HOME
                            elif i == 2:
                                game_state = STATE_LEVEL_SELECT
                        else:
                            lose_selected_option = i
                            last_lose_tap = i
                            last_lose_tap_time = time.time()

        elif game_state == STATE_MENU:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    menu_selected_option = (menu_selected_option - 1) % 4
                elif event.key == pygame.K_DOWN:
                    menu_selected_option = (menu_selected_option + 1) % 4
                elif event.key == pygame.K_RETURN:
                    if menu_selected_option == 0:  # Continue
                        game_state = STATE_PLAYING
                    elif menu_selected_option == 1:  # Re-Play
                        init_game(selected_level)
                        game_state = STATE_PLAYING
                    elif menu_selected_option == 2:  # Change Level
                        game_state = STATE_LEVEL_SELECT
                    elif menu_selected_option == 3:  # Exit to Home
                        game_state = STATE_HOME

        elif game_state == STATE_PLAYING:
            if event.type == pygame.KEYDOWN:
                if (keys[pygame.K_UP] or btn_jump_pressed) and jumps_remaining > 0:
                    velocity = boost_jump_power if boost_active else jump_power
                    jumps_remaining -= 1
                if event.key == pygame.K_ESCAPE:
                    game_state = STATE_MENU
            if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
                eggs.append([player_x + 20 if facing_right else player_x - 20,
                            player_y + 20,
                            8 if facing_right else -8])
                egg_sound.play()
            if event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = event.pos
                if btn_shoot.collidepoint(mx, my):
                    eggs.append([player_x + 20 if facing_right else player_x - 20,
                                player_y + 20,
                                8 if facing_right else -8])
                    egg_sound.play()
            if event.type == pygame.FINGERDOWN:
                tx = int(event.x * WIDTH)
                ty = int(event.y * HEIGHT)
                if btn_shoot.collidepoint(tx, ty):
                    eggs.append([player_x + 20 if facing_right else player_x - 20,
                                player_y + 20,
                                8 if facing_right else -8])
                    egg_sound.play()

    # --- WIN STATE: Duck swims in place, then swims away ---
    if game_state == STATE_WIN:
        swim_timer += 1
        if not win_sound_played:
            win_sound.play()
            win_sound_played = True
        # Clamp camera so it doesn't show beyond the right edge
        max_camera_x = max(0, len(tilemap[0]) * TILE_SIZE - WIDTH)
        camera_x = min(max(0, player_x - WIDTH // 2), max_camera_x)
        window.fill((105,190,255))
        sky_width = sky_img.get_width()
        start_x = -camera_x % sky_width - sky_width
        while start_x < WIDTH:
            window.blit(sky_img, (start_x, -130))
            start_x += sky_width
        for y, row in enumerate(tilemap):
            for x, tile in enumerate(row):
                if tile == "1":
                    window.blit(grass_tile, (x*TILE_SIZE-camera_x, y*TILE_SIZE))
                elif tile == "2":
                    window.blit(dirt_tile, (x*TILE_SIZE-camera_x, y*TILE_SIZE))
                elif tile == "3":
                    offset_y = TILE_SIZE - grass3_tile.get_height()
                    window.blit(grass3_tile, (x*TILE_SIZE-camera_x, y*TILE_SIZE+offset_y))
                elif tile == "W":
                    window.blit(water_tile, (x*TILE_SIZE-camera_x, y*TILE_SIZE))
        if swim_timer < 60:
            # Duck swims in place for 1 second
            window.blit(duck_swim, (player_x-camera_x, player_y))
        else:
            # Duck swims away horizontally after 1 second
            player_x += 4
            # Clamp camera again as duck moves
            camera_x = min(max(0, player_x - WIDTH // 2), max_camera_x)
            window.blit(duck_swim, (player_x-camera_x, player_y))
        pygame.display.flip()
        if swim_timer > 120:
            game_state = STATE_LEVEL_SELECT
            win_sound_played = False
        clock.tick(60)
        continue

    if game_state == STATE_HOME:
        draw_home_screen()
        clock.tick(60)
        continue

    elif game_state == STATE_LEVEL_SELECT:
        duck_bob_angle += 0.1
        duck_bob_offset = int(5 * math.sin(duck_bob_angle))
        draw_level_select(duck_bob_offset)
        clock.tick(60)
        continue

    elif game_state == STATE_TUTORIAL:
        draw_tutorial_screen()
        clock.tick(60)
        continue

    elif game_state == STATE_LOSE:
        lose_duck_angle += 0.1
        lose_duck_offset = int(5 * math.sin(lose_duck_angle))
        draw_lose_screen(lose_duck_offset, lose_selected_option)
        clock.tick(60)
        continue

    elif game_state == STATE_MENU:
        duck_bob_angle += 0.1
        duck_bob_offset = int(5 * math.sin(duck_bob_angle))
        draw_menu_screen(duck_bob_offset, menu_selected_option)
        clock.tick(60)
        continue

    # --- Gameplay Logic ---
    if time.time() > choco_boost_end:
        player_speed = base_speed
        boost_active = False
    
    keys = pygame.key.get_pressed()
    move_x = 0
    if keys[pygame.K_RIGHT] or btn_right_pressed:
        move_x += player_speed
    if keys[pygame.K_LEFT] or btn_left_pressed:
        move_x -= player_speed
    moving = move_x != 0

    # Jump (double jump support)
    if (keys[pygame.K_UP] or btn_jump_pressed) and jumps_remaining > 0:
        velocity = boost_jump_power if boost_active else jump_power
        jumps_remaining -= 1
        btn_jump_pressed = False  # Prevent repeated jumps while holding

    facing_right = True if move_x > 0 else (False if move_x < 0 else facing_right)
    velocity += gravity
    move_y = velocity

    player_rect = pygame.Rect(player_x, player_y, 47, 60)
    blocks = []
    for y, row in enumerate(tilemap):
        for x, tile in enumerate(row):
            if tile == "1":
                blocks.append(pygame.Rect(x*TILE_SIZE, y*TILE_SIZE + GRASS_TOP_OFFSET, TILE_SIZE, TILE_SIZE-GRASS_TOP_OFFSET))
            elif tile in ("2","3"):
                blocks.append(pygame.Rect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE))

    player_rect.x += move_x
    for block in blocks:
        if player_rect.colliderect(block):
            if move_x > 0:
                player_rect.right = block.left
            elif move_x < 0:
                player_rect.left = block.right

    prev_bottom = player_rect.bottom
    player_rect.y += move_y
    on_ground = False
    for block in blocks:
        if player_rect.colliderect(block):
            if move_y > 0:
                player_rect.bottom = block.top
                velocity = 0
                on_ground = True
                jumps_remaining = 2
            elif move_y < 0:
                player_rect.top = block.bottom
                velocity = 0
    player_x = max(0, player_rect.x)
    player_y = player_rect.y

    if player_y > HEIGHT:
        game_state = STATE_LOSE

    # --- Check water collision (only trigger win if duck's bottom is inside last water tiles) ---
    if game_state == STATE_PLAYING and waters:
        for water_rect in waters[-3:]:  # Only last 3 water tiles
            if player_rect.colliderect(water_rect) and player_rect.bottom > water_rect.top + TILE_SIZE // 3:
                game_state = STATE_WIN
                swim_timer = 0
                win_sound_played = False
                break

    # --- Bees ---
    for trigger_x, spawn_y in bee_triggers:
        if player_x >= trigger_x and trigger_x not in locals().get("triggered_bees", set()):
            bee_list.append(pygame.Rect(camera_x+WIDTH+50, spawn_y, bee_img.get_width(), bee_img.get_height()))
            triggered_bees.add(trigger_x)

    bee_on_screen = False
    for bee in bee_list[:]:
        bee.x -= 3
        if player_rect.colliderect(bee):
            lives -= 1
            hurt_sound.play()
            bee_list.remove(bee)
            if lives <= 0:
                game_state = STATE_LOSE
        if bee.right < camera_x:
            bee_list.remove(bee)
        if bee.x - camera_x < WIDTH and bee.x - camera_x + bee.width > 0:
            bee_on_screen = True

    if bee_on_screen and not bee_playing:
        bee_sound.play(-1)
        bee_playing = True
    elif not bee_on_screen and bee_playing:
        bee_sound.stop()
        bee_playing = False

    # --- Eggs ---
    for egg in eggs[:]:
        egg[0] += egg[2]
        egg_rect = pygame.Rect(egg[0], egg[1], 10, 10)
        removed = False
        for block in blocks:
            if egg_rect.colliderect(block):
                if egg in eggs:
                    eggs.remove(egg)
                removed = True
                break
        if not removed:
            for bee in bee_list[:]:
                if egg_rect.colliderect(bee):
                    if bee in bee_list:
                        bee_list.remove(bee)
                    if egg in eggs:
                        eggs.remove(egg)
                    break
        if egg in eggs and (egg[0] < camera_x-50 or egg[0] > camera_x+WIDTH+50):
            eggs.remove(egg)

    # --- Food ---
    for t in toasts[:]:
        if player_rect.colliderect(t):
            toasts.remove(t)
            toast_count += 1
            coin_sound.play()
    for c in cookies[:]:
        if player_rect.colliderect(c):
            cookies.remove(c)
            cookie_count += 1
            coin_sound.play()
    for h in chocolates[:]:
        if player_rect.colliderect(h):
            chocolates.remove(h)
            choco_count += 1
            player_speed = base_speed * 2
            boost_active = True
            choco_boost_end = time.time() + 7
            coin_sound.play()

    # --- Animation ---
    frame_timer += animation_speed
    if moving:
        if frame_timer >= 1:
            frame_timer = 0
            frame_index = (frame_index + 1) % len(duck_frames_right)
        current_frame = duck_frames_right[frame_index] if facing_right else duck_frames_left[frame_index]
    else:
        current_frame = duck_frames_right[1] if facing_right else duck_frames_left[1]
    # Clamp camera_x so it doesn't show beyond the right edge of the level
    max_camera_x = max(0, len(tilemap[0]) * TILE_SIZE - WIDTH)
    camera_x = min(max(0, player_x - WIDTH // 2), max_camera_x)

    # --- Drawing ---
    window.fill((105,190,255))
    sky_width = sky_img.get_width()
    start_x = -camera_x % sky_width - sky_width
    while start_x < WIDTH:
        window.blit(sky_img, (start_x, -130))
        start_x += sky_width

    for y, row in enumerate(tilemap):
        for x, tile in enumerate(row):
            if tile == "1":
                window.blit(grass_tile, (x*TILE_SIZE-camera_x, y*TILE_SIZE))
            elif tile == "2":
                window.blit(dirt_tile, (x*TILE_SIZE-camera_x, y*TILE_SIZE))
            elif tile == "3":
                offset_y = TILE_SIZE - grass3_tile.get_height()
                window.blit(grass3_tile, (x*TILE_SIZE-camera_x, y*TILE_SIZE+offset_y))
            elif tile == "W":
                window.blit(water_tile, (x*TILE_SIZE-camera_x, y*TILE_SIZE))

    food_offset = int(math.sin(time.time() * 4) * 5)
    for t in toasts: window.blit(toast_img, (t.x-camera_x, t.y+food_offset))
    for c in cookies: window.blit(cookie_img, (c.x-camera_x, c.y+food_offset))
    for h in chocolates: window.blit(chocolate_img, (h.x-camera_x, h.y+food_offset))

    for bee in bee_list: window.blit(bee_img, (bee.x-camera_x, bee.y))
    for egg in eggs: window.blit(egg_img, (egg[0]-camera_x, egg[1]))
    window.blit(current_frame, (player_x-camera_x, player_y))

    icon_size = 24; x_pos = 10
    small_toast = pygame.transform.scale(toast_img,(icon_size,icon_size))
    window.blit(small_toast,(x_pos,10)); x_pos += icon_size+5
    toast_text = small_font.render(str(toast_count),True,(255,255,255))
    window.blit(toast_text,(x_pos,10)); x_pos += toast_text.get_width()+15
    small_cookie = pygame.transform.scale(cookie_img,(icon_size,icon_size))
    window.blit(small_cookie,(x_pos,10)); x_pos += icon_size+5
    cookie_text = small_font.render(str(cookie_count),True,(255,255,255))
    window.blit(cookie_text,(x_pos,10)); x_pos += cookie_text.get_width()+15
    small_choco = pygame.transform.scale(chocolate_img,(icon_size,icon_size))
    window.blit(small_choco,(x_pos,10)); x_pos += icon_size+5
    choco_text = small_font.render(str(choco_count),True,(255,255,255))
    window.blit(choco_text,(x_pos,10))
    heart_size = 24
    for i in range(lives):
        window.blit(pygame.transform.scale(heart_img,(heart_size,heart_size)),(10+i*(heart_size+5),40))
    elapsed = int(time.time()-start_time)
    timer_text = small_font.render(f"Time: {elapsed}s",True,(255,255,255))
    window.blit(timer_text,(WIDTH-timer_text.get_width()-10,10))
    if boost_active:
        boost_text = small_font.render("BOOST!",True,(255,244,41))
        window.blit(boost_text,(WIDTH//2-boost_text.get_width()//2,50))

    draw_buttons()
    pygame.display.flip()
    clock.tick(60)

pygame.quit()