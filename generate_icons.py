from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color = '#6366f1')
    d = ImageDraw.Draw(img)
    # Draw a simple white square in the middle
    margin = size // 4
    d.rectangle([margin, margin, size - margin, size - margin], fill='white')
    img.save(filename)

create_icon(192, 'public/icon-192.png')
create_icon(512, 'public/icon-512.png')
