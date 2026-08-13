import re
with open('src/components/SettingsSection.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-\[200px\] overflow-y-auto pr-1"', 'className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1"', content)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(content)
