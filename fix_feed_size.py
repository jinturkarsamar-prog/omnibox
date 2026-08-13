import re

with open('src/components/Feed.tsx', 'r') as f:
    text = f.read()

# Replace the layout classes in Feed.tsx
pattern = r"layout === 'list'\s*\?\s*'space-y-4 max-w-4xl mx-auto'\s*:\s*layout === 'gallery'\s*\?\s*`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4`[\s\S]*?\}`"
replacement = r"layout === 'list' ? 'space-y-4 max-w-4xl mx-auto' : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'"

text = re.sub(pattern, replacement, text)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(text)

