import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

text = re.sub(r"\s*size:\s*'comfortable' \| 'small' \| 'compact';", "", text)
text = re.sub(r"\s*setSize:\s*\(s: 'comfortable' \| 'small' \| 'compact'\) => void;", "", text)
text = re.sub(r"\s*size,\s*setSize,", "", text)
text = text.replace("layout: 'gallery' | 'list' | 'masonry'", "layout: 'gallery' | 'list'")
text = text.replace("setLayout: (l: 'gallery' | 'list' | 'masonry') => void", "setLayout: (l: 'gallery' | 'list') => void")

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)

