import re

with open('src/components/Feed.tsx', 'r') as f:
    text = f.read()

# Fix the gallery one:
text = text.replace("{showNotesInFeed && item.note && listDensity !== 'compact' && (", "{showNotesInFeed && item.note && (")

# Fix the list one:
text = text.replace("<p className=\"text-xs text-theme-muted truncate mt-0.5 max-w-2xl\">{item.note}</p>", "{showNotesInFeed && item.note && listDensity !== 'compact' && (<p className=\"text-xs text-theme-muted truncate mt-0.5 max-w-2xl\">{item.note}</p>)}")

with open('src/components/Feed.tsx', 'w') as f:
    f.write(text)

