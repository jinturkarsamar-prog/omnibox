import re

with open('src/components/Feed.tsx', 'r') as f:
    text = f.read()

# Replace layout and remove size
text = re.sub(r"layout: 'gallery' \| 'list' \| 'masonry';", "layout: 'gallery' | 'list';", text)
text = re.sub(r"\s*size:\s*'comfortable' \| 'small' \| 'compact';", "", text)

# Remove size from props definition
text = re.sub(r"size,", "", text)
text = re.sub(r"size = 'comfortable',", "", text)
text = re.sub(r"size,\s*", "", text)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(text)

