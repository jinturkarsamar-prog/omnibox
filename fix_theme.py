import re

with open('src/theme.ts', 'r') as f:
    content = f.read()

# Remove everything after // --- DARK MODE THEMES ---
dark_themes_index = content.find('  // --- DARK MODE THEMES ---')
if dark_themes_index != -1:
    content = content[:dark_themes_index] + '];\n'

with open('src/theme.ts', 'w') as f:
    f.write(content)
