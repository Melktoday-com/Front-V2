import os
from PIL import Image

SRC_ICON = "public/web-app-manifest-512x512.png"
RES_DIR = "android/app/src/main/res"

if not os.path.exists(SRC_ICON):
    print(f"Error: {SRC_ICON} not found")
    exit(1)

icon_img = Image.open(SRC_ICON).convert("RGBA")

# 1. Generate Mipmap Launcher Icons (ic_launcher.png, ic_launcher_round.png)
MIPMAPS = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for folder, size in MIPMAPS.items():
    target_dir = os.path.join(RES_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)
    resized = icon_img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(os.path.join(target_dir, "ic_launcher.png"), "PNG")
    resized.save(os.path.join(target_dir, "ic_launcher_round.png"), "PNG")
    print(f"Generated {folder}/ic_launcher.png ({size}x{size})")

# 2. Generate Splash Screens (white background with centered logo)
SPLASH_SIZES = {
    "drawable": (480, 800),
    "drawable-port-mdpi": (320, 480),
    "drawable-port-hdpi": (480, 800),
    "drawable-port-xhdpi": (720, 1280),
    "drawable-port-xxhdpi": (960, 1600),
    "drawable-port-xxxhdpi": (1280, 1920),
    "drawable-land-mdpi": (480, 320),
    "drawable-land-hdpi": (800, 480),
    "drawable-land-xhdpi": (1280, 720),
    "drawable-land-xxhdpi": (1600, 960),
    "drawable-land-xxxhdpi": (1920, 1280),
}

for folder, (w, h) in SPLASH_SIZES.items():
    target_dir = os.path.join(RES_DIR, folder)
    os.makedirs(target_dir, exist_ok=True)
    splash = Image.new("RGBA", (w, h), (255, 255, 255, 255))
    
    # Scale logo so it takes ~30% of minimum dimension
    logo_size = int(min(w, h) * 0.35)
    logo_resized = icon_img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    pos_x = (w - logo_size) // 2
    pos_y = (h - logo_size) // 2
    splash.paste(logo_resized, (pos_x, pos_y), logo_resized)
    
    splash.convert("RGB").save(os.path.join(target_dir, "splash.png"), "PNG")
    print(f"Generated {folder}/splash.png ({w}x{h})")

print("All Android branded icons and splashes generated successfully!")
