import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

text = text.replace("import {\n", "import {\n  Layout,\n", 1)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)

