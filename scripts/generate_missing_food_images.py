#!/usr/bin/env python3
"""
Genera imágenes WebP (128x128) con estilo botánico/cálido para los ingredientes
faltantes en el catálogo de CycleSync.
Renderiza a 512x512 con supersampling y reduce a 128x128 con Lanczos.
"""

import os
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'foods')
os.makedirs(OUTPUT_DIR, exist_ok=True)

BG_COLOR = (248, 243, 235)  # #f8f3eb crema cálido

def create_base_canvas():
    return Image.new('RGB', (512, 512), color=BG_COLOR)

def finalize_and_save(im, filename):
    downscaled = im.resize((128, 128), Image.Resampling.LANCZOS)
    target = os.path.join(OUTPUT_DIR, filename)
    downscaled.save(target, 'WEBP', quality=90)
    print(f"[+] Guardado: {filename}")

# 1. Limón
def generate_limon():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    # Sombra suave
    draw.ellipse((100, 370, 412, 440), fill=(225, 218, 206))
    
    # Hoja verde
    draw.polygon([(290, 160), (380, 80), (430, 120), (340, 200)], fill=(86, 138, 48))
    draw.line([(310, 180), (410, 100)], fill=(60, 100, 30), width=4)

    # Limón entero al fondo
    draw.ellipse((160, 140, 420, 360), fill=(245, 208, 45), outline=(215, 175, 25), width=6)
    draw.polygon([(410, 240), (440, 250), (410, 260)], fill=(225, 185, 30))
    
    # Rodaja de limón al frente
    center = (210, 290)
    radius = 110
    draw.ellipse((center[0]-radius, center[1]-radius, center[0]+radius, center[1]+radius), fill=(248, 218, 55), outline=(210, 170, 20), width=8)
    # Albedo blanco
    draw.ellipse((center[0]-radius+14, center[1]-radius+14, center[0]+radius-14, center[1]+radius-14), fill=(255, 253, 235))
    # Pulpa
    draw.ellipse((center[0]-radius+24, center[1]-radius+24, center[0]+radius-24, center[1]+radius-24), fill=(250, 225, 60))
    # Gajos (8 gajos)
    import math
    for i in range(8):
        angle = i * (2 * math.pi / 8)
        x2 = center[0] + (radius - 24) * math.cos(angle)
        y2 = center[1] + (radius - 24) * math.sin(angle)
        draw.line([center, (x2, y2)], fill=(255, 253, 235), width=6)
    draw.ellipse((center[0]-16, center[1]-16, center[0]+16, center[1]+16), fill=(255, 253, 235))
    
    finalize_and_save(im, 'limon.webp')

# 2. Miel
def generate_miel():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((120, 390, 392, 450), fill=(225, 218, 206))
    
    # Tarro de miel (vidrio)
    draw.rounded_rectangle((150, 190, 362, 400), radius=35, fill=(245, 175, 35), outline=(215, 135, 15), width=6)
    # Brillo de vidrio
    draw.rounded_rectangle((170, 210, 200, 370), radius=15, fill=(255, 215, 95))
    # Tapa del tarro (tela o madera rústica)
    draw.rounded_rectangle((130, 150, 382, 195), radius=15, fill=(200, 140, 80), outline=(150, 95, 45), width=5)
    draw.line([(135, 190), (377, 190)], fill=(120, 75, 30), width=6) # Cuerda

    # Palito de miel inclinado
    draw.polygon([(260, 80), (285, 70), (380, 240), (355, 250)], fill=(210, 155, 95))
    # Cabeza acanalada del palito
    for offset in range(-30, 40, 15):
        draw.ellipse((340 + offset*0.6, 210 + offset, 400 + offset*0.6, 250 + offset), fill=(235, 155, 20), outline=(180, 110, 10), width=4)
    # Gota de miel cayendo
    draw.ellipse((350, 310, 380, 355), fill=(245, 165, 25))
    finalize_and_save(im, 'miel.webp')

# 3. Canela
def generate_canela():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((100, 380, 412, 440), fill=(225, 218, 206))

    # Rama 1 cruzada
    draw.polygon([(110, 280), (360, 120), (395, 165), (145, 325)], fill=(155, 78, 42), outline=(110, 50, 25), width=5)
    draw.ellipse((105, 275, 150, 330), fill=(185, 105, 60), outline=(100, 45, 20), width=4)
    # Espiral del rollo
    draw.arc((115, 285, 140, 320), 0, 300, fill=(90, 40, 15), width=5)

    # Rama 2 al frente
    draw.polygon([(140, 180), (390, 340), (360, 385), (110, 225)], fill=(170, 90, 50), outline=(115, 55, 28), width=5)
    draw.ellipse((350, 335, 395, 390), fill=(195, 115, 70), outline=(105, 48, 22), width=4)
    draw.arc((360, 345, 385, 380), 30, 330, fill=(90, 40, 15), width=5)

    # Polvo de canela esparcido
    for (x, y) in [(200, 370), (220, 385), (250, 365), (310, 380), (280, 395), (180, 360)]:
        draw.ellipse((x, y, x+8, y+8), fill=(150, 75, 35))

    finalize_and_save(im, 'canela.webp')

# 4. Azúcar
def generate_azucar():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((100, 380, 412, 445), fill=(225, 218, 206))

    # Tazón de cerámica cálida
    draw.ellipse((110, 210, 402, 390), fill=(235, 228, 215), outline=(180, 168, 150), width=6)
    draw.polygon([(110, 300), (402, 300), (340, 390), (172, 390)], fill=(225, 215, 200))
    draw.ellipse((160, 375, 352, 405), fill=(205, 195, 180))

    # Montículo de azúcar cristalina
    draw.ellipse((135, 200, 377, 300), fill=(255, 255, 255), outline=(225, 225, 230), width=3)
    draw.ellipse((175, 175, 337, 250), fill=(255, 255, 255))
    # Brillos de cristales
    for (x, y) in [(210, 210), (240, 195), (280, 220), (200, 240), (290, 245), (250, 235), (265, 205)]:
        draw.line([(x-4, y), (x+4, y)], fill=(210, 220, 230), width=2)
        draw.line([(x, y-4), (x, y+4)], fill=(210, 220, 230), width=2)

    # Cucharita de madera
    draw.polygon([(300, 130), (340, 110), (390, 270), (360, 285)], fill=(195, 145, 95))
    draw.ellipse((345, 245, 395, 310), fill=(180, 130, 80))
    finalize_and_save(im, 'azucar.webp')

# 5. Cilantro
def generate_cilantro():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((120, 390, 392, 440), fill=(225, 218, 206))

    # Tallos
    draw.line([(256, 420), (256, 230)], fill=(95, 155, 55), width=7)
    draw.line([(256, 330), (170, 210)], fill=(95, 155, 55), width=6)
    draw.line([(256, 290), (345, 195)], fill=(95, 155, 55), width=6)

    # Hojas características de cilantro (3 lóbulos redondeados con muescas)
    def leaf(cx, cy, scale=1.0):
        for dx, dy in [(-30, -15), (0, -35), (30, -15), (-15, 0), (15, 0)]:
            draw.ellipse((cx + dx*scale - 20*scale, cy + dy*scale - 20*scale, cx + dx*scale + 20*scale, cy + dy*scale + 20*scale), fill=(70, 145, 45), outline=(50, 115, 30), width=2)
        draw.ellipse((cx - 22*scale, cy - 22*scale, cx + 22*scale, cy + 22*scale), fill=(80, 160, 50))

    leaf(256, 170, 1.2)
    leaf(160, 175, 1.0)
    leaf(355, 165, 1.0)
    leaf(205, 255, 0.8)
    leaf(310, 245, 0.8)

    finalize_and_save(im, 'cilantro.webp')

# 6. Perejil
def generate_perejil():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((120, 390, 392, 440), fill=(225, 218, 206))

    draw.line([(256, 420), (256, 240)], fill=(85, 145, 50), width=7)
    draw.line([(256, 320), (150, 220)], fill=(85, 145, 50), width=6)
    draw.line([(256, 280), (360, 200)], fill=(85, 145, 50), width=6)

    # Hojas triangulares puntiagudas
    def parsley_leaf(cx, cy, angle_offset=0):
        draw.polygon([(cx, cy-45), (cx-35, cy+15), (cx+35, cy+15)], fill=(60, 135, 40), outline=(40, 100, 25), width=3)
        draw.polygon([(cx-25, cy-25), (cx-55, cy+10), (cx-10, cy+20)], fill=(65, 140, 45))
        draw.polygon([(cx+25, cy-25), (cx+55, cy+10), (cx+10, cy+20)], fill=(65, 140, 45))

    parsley_leaf(256, 175)
    parsley_leaf(150, 185)
    parsley_leaf(360, 170)
    parsley_leaf(210, 260)
    parsley_leaf(305, 250)

    finalize_and_save(im, 'perejil.webp')

# 7. Menta
def generate_menta():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((120, 390, 392, 440), fill=(225, 218, 206))

    draw.line([(256, 420), (256, 200)], fill=(80, 145, 65), width=7)
    
    # Hojas ovaladas con borde serrado y nervaduras
    def mint_leaf(x1, y1, x2, y2, angle=0):
        cx, cy = (x1+x2)//2, (y1+y2)//2
        draw.ellipse((cx-55, cy-35, cx+55, cy+35), fill=(65, 155, 75), outline=(45, 115, 50), width=3)
        draw.line([(x1, y1), (x2, y2)], fill=(45, 115, 50), width=3)
        # Nervaduras laterales
        draw.line([(cx-20, cy), (cx-35, cy-18)], fill=(50, 125, 55), width=2)
        draw.line([(cx-20, cy), (cx-35, cy+18)], fill=(50, 125, 55), width=2)
        draw.line([(cx+15, cy), (cx+30, cy-18)], fill=(50, 125, 55), width=2)
        draw.line([(cx+15, cy), (cx+30, cy+18)], fill=(50, 125, 55), width=2)

    mint_leaf(256, 210, 256, 110) # Hoja apical
    mint_leaf(256, 260, 145, 220) # Izquierda 1
    mint_leaf(256, 260, 365, 220) # Derecha 1
    mint_leaf(256, 330, 155, 305) # Izquierda 2
    mint_leaf(256, 330, 355, 305) # Derecha 2

    finalize_and_save(im, 'menta.webp')

# 8. Mantequilla
def generate_mantequilla():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((90, 370, 422, 445), fill=(225, 218, 206))

    # Plato o platillo blanco
    draw.ellipse((95, 300, 417, 420), fill=(245, 242, 235), outline=(210, 200, 185), width=5)

    # Bloque 3D de mantequilla dorada
    # Cara superior
    draw.polygon([(170, 210), (330, 210), (360, 270), (200, 270)], fill=(255, 232, 115))
    # Cara frontal
    draw.polygon([(200, 270), (360, 270), (360, 345), (200, 345)], fill=(245, 205, 75), outline=(215, 175, 45), width=4)
    # Cara lateral izquierda
    draw.polygon([(170, 210), (200, 270), (200, 345), (170, 285)], fill=(240, 195, 65), outline=(215, 175, 45), width=4)

    # Rulo o corte de mantequilla encima
    draw.arc((240, 220, 300, 260), 0, 260, fill=(255, 245, 155), width=10)

    finalize_and_save(im, 'mantequilla.webp')

# 9. Remolacha
def generate_remolacha():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((110, 385, 402, 445), fill=(225, 218, 206))

    # Tallos morados y hojas verdes arriba
    draw.line([(256, 230), (220, 80)], fill=(160, 25, 70), width=9)
    draw.line([(256, 230), (280, 75)], fill=(160, 25, 70), width=9)
    draw.polygon([(200, 70), (240, 50), (210, 120)], fill=(65, 130, 50))
    draw.polygon([(270, 60), (310, 45), (290, 115)], fill=(65, 130, 50))

    # Cuerpo redondeado cónico de la remolacha
    draw.ellipse((140, 170, 372, 390), fill=(145, 22, 65), outline=(105, 12, 45), width=6)
    draw.polygon([(200, 350), (312, 350), (256, 425)], fill=(145, 22, 65), outline=(105, 12, 45), width=4)
    draw.line([(256, 420), (256, 445)], fill=(120, 15, 50), width=4) # Raíz fina

    # Rodaja frontal con anillos concéntricos
    rcx, rcy, r_rad = 200, 310, 65
    draw.ellipse((rcx-r_rad, rcy-r_rad, rcx+r_rad, rcy+r_rad), fill=(185, 30, 85), outline=(120, 15, 55), width=5)
    draw.ellipse((rcx-r_rad+14, rcy-r_rad+14, rcx+r_rad-14, rcy+r_rad-14), fill=(205, 55, 110), outline=(155, 20, 70), width=3)
    draw.ellipse((rcx-r_rad+28, rcy-r_rad+28, rcx+r_rad-28, rcy+r_rad-28), fill=(220, 80, 130), outline=(180, 30, 80), width=2)
    draw.ellipse((rcx-16, rcy-16, rcx+16, rcy+16), fill=(175, 25, 75))

    finalize_and_save(im, 'remolacha.webp')

# 10. Arvejas
def generate_arvejas():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((100, 380, 412, 440), fill=(225, 218, 206))

    # Vaina de arveja abierta curvada
    # Vaina exterior
    draw.arc((100, 160, 412, 380), 30, 170, fill=(75, 155, 45), width=35)
    draw.arc((100, 160, 412, 380), 30, 170, fill=(110, 185, 70), width=25)

    # Arvejas redondas brillantes dentro de la vaina
    pea_centers = [(175, 305), (225, 325), (280, 325), (335, 300)]
    for (px, py) in pea_centers:
        draw.ellipse((px-25, py-25, px+25, py+25), fill=(105, 195, 55), outline=(65, 145, 35), width=4)
        # Brillo
        draw.ellipse((px-14, py-14, px-4, py-4), fill=(175, 235, 125))

    finalize_and_save(im, 'arvejas.webp')

# 11. Comino
def generate_comino():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((100, 380, 412, 445), fill=(225, 218, 206))

    # Cuchara pequeña de madera
    draw.ellipse((140, 220, 320, 360), fill=(200, 150, 95), outline=(150, 105, 60), width=6)
    draw.polygon([(290, 280), (430, 350), (415, 380), (275, 310)], fill=(185, 135, 85))

    # Semillas de comino agrupadas en la cuchara
    draw.ellipse((160, 240, 300, 340), fill=(135, 95, 55))
    import random
    random.seed(42)
    for _ in range(35):
        sx = random.randint(170, 280)
        sy = random.randint(250, 325)
        length = random.randint(12, 18)
        draw.line([(sx, sy), (sx+length, sy+random.randint(-4, 4))], fill=(175, 135, 80), width=4)
        draw.line([(sx, sy), (sx+length, sy+random.randint(-4, 4))], fill=(95, 65, 35), width=2)

    finalize_and_save(im, 'comino.webp')

# 12. Polvo de hornear
def generate_polvo_hornear():
    im = create_base_canvas()
    draw = ImageDraw.Draw(im)
    draw.ellipse((100, 380, 412, 445), fill=(225, 218, 206))

    # Lata cilíndrica retro
    draw.rounded_rectangle((160, 190, 352, 385), radius=20, fill=(240, 235, 225), outline=(175, 165, 150), width=6)
    draw.ellipse((160, 165, 352, 215), fill=(220, 85, 75), outline=(175, 50, 40), width=5) # Tapa roja
    
    # Etiqueta vintage
    draw.rectangle((165, 240, 347, 340), fill=(255, 252, 245), outline=(215, 205, 190), width=3)
    draw.rectangle((175, 250, 337, 330), fill=(220, 85, 75))
    # Letra B grande de Baking / Leudante
    draw.text((235, 255), "P", fill=(255, 255, 255), font_size=55)

    # Cuchara medidora con polvo blanco al frente
    draw.ellipse((105, 320, 225, 395), fill=(215, 215, 220), outline=(160, 160, 170), width=5)
    draw.ellipse((115, 328, 215, 385), fill=(255, 255, 255))
    draw.line([(105, 360), (70, 395)], fill=(175, 175, 185), width=8)

    finalize_and_save(im, 'polvo-hornear.webp')

if __name__ == '__main__':
    generate_limon()
    generate_miel()
    generate_canela()
    generate_azucar()
    generate_cilantro()
    generate_perejil()
    generate_menta()
    generate_mantequilla()
    generate_remolacha()
    generate_arvejas()
    generate_comino()
    generate_polvo_hornear()
    print("[✓] Todos los ingredientes nuevos generados con éxito.")
