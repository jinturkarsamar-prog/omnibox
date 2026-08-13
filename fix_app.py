import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

pattern = r"    if \(currentTheme\.mode === 'light'\) \{\n      root\.classList\.remove\('dark'\);\n    \} else \{\n      root\.classList\.add\('dark'\);\n    \}"
content = re.sub(pattern, "    root.classList.remove('dark');", content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
