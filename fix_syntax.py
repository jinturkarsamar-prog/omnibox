import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    content = f.read()

content = content.replace(r"isActive ? \'text-theme-text\' : \'text-theme-muted group-hover:text-theme-text\'", r"isActive ? 'text-theme-text' : 'text-theme-muted group-hover:text-theme-text'")

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(content)
