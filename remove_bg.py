from PIL import Image

img = Image.open('keyabroad-app/public/destinations/uk-waving-flag.jpg')
img = img.convert("RGBA")

datas = img.getdata()
newData = []

for item in datas:
    # A simple heuristic: check if it's white or light gray (the checkerboard pattern)
    # The flag has red, blue, and white. The checkerboard has light gray. 
    # White in the flag might be removed if we just remove all white.
    # It's better to use rembg if possible.
    pass
