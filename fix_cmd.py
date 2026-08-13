import re

with open('src/components/CommandPalette.tsx', 'r') as f:
    text = f.read()

text = re.sub(r"\s*onToggleDensity: \(\) => void;", "", text)
text = re.sub(r"\s*currentDensity: 'comfortable' \| 'small';", "", text)
text = re.sub(r"\s*onToggleDensity,", "", text)
text = re.sub(r"\s*currentDensity,", "", text)

# Find the act-density option and remove it
pattern = r"\s*options\.push\(\{\s*id: 'act-density',[\s\S]*?\}\);"
text = re.sub(pattern, "", text)

with open('src/components/CommandPalette.tsx', 'w') as f:
    f.write(text)

