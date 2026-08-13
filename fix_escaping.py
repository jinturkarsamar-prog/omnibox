import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    r"className={`text-[9px] font-bold truncate \${isActive ? \'text-theme-text\' : \'text-theme-muted group-hover:text-theme-text\'}`}",
    r"className={`text-[10px] font-bold truncate ${isActive ? 'text-theme-text' : 'text-theme-muted group-hover:text-theme-text'}`}"
)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(content)
