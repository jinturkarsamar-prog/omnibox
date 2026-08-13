import re

with open('src/index.css', 'r') as f:
    text = f.read()

# Replace the @import url(...)
pattern = r"(@import url\('https:\/\/fonts\.googleapis\.com\/css2\?)(.*)(&display=swap'\);)"

new_fonts = "&family=Nunito:wght@400;600;700&family=Open+Sans:wght@400;600;700&family=Oswald:wght@400;600;700&family=Raleway:wght@400;600;700&family=Ubuntu:wght@400;500;700&family=Lobster&family=Anton&family=Cormorant+Garamond:wght@400;600;700&family=Alfa+Slab+One&family=Space+Mono:wght@400;700&family=Inconsolata:wght@400;600;700&family=Anonymous+Pro:wght@400;700&family=Ubuntu+Mono:wght@400;700"

text = re.sub(pattern, r"\1\2" + new_fonts + r"\3", text)

with open('src/index.css', 'w') as f:
    f.write(text)

