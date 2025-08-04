import pygame

def load_images():
    grass_tile = pygame.image.load('assets/grass1.png').convert_alpha()
    grass3_tile = pygame.image.load('assets/grass3.png').convert_alpha()
    dirt_tile = pygame.image.load('assets/grass2.png').convert_alpha()
    sky_img = pygame.image.load('assets/sky.jpg').convert()
    duck_walk = pygame.image.load("assets/duck_walk.png").convert_alpha()
    bee_img = pygame.image.load('assets/bee.png').convert_alpha()

    toast_img = pygame.image.load('assets/toast.png').convert_alpha()
    cookie_img = pygame.image.load('assets/cookie.png').convert_alpha()
    chocolate_img = pygame.image.load('assets/chocolate.png').convert_alpha()
    water_tile = pygame.image.load('assets/water.png').convert_alpha()
    duck_swim = pygame.image.load('assets/duck_swim.png').convert_alpha()


    home_bg = pygame.image.load('assets/home.png').convert()

    return {
        "grass_tile": grass_tile,
        "grass3_tile": grass3_tile,
        "dirt_tile": dirt_tile,
        "sky_img": sky_img,
        "duck_walk": duck_walk,
        "bee_img": bee_img,
        "toast_img": toast_img,
        "cookie_img": cookie_img,
        "chocolate_img": chocolate_img,
        "home_bg": home_bg,
        "duck_swim": duck_swim,
        "water_tile": water_tile
    }
