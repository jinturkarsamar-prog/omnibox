import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    content = f.read()

# Change grid-cols-2 to grid-cols-3 sm:grid-cols-4
content = re.sub(r'className="grid grid-cols-2 gap-2 max-h-\[200px\] overflow-y-auto pr-1"', 'className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1"', content)

# Change button padding from p-2.5 to p-1.5
content = re.sub(r'className={`flex flex-col p-2\.5 rounded-xl border text-left transition relative cursor-pointer group', 'className={`flex flex-col p-1.5 rounded-xl border text-left transition relative cursor-pointer group', content)

# Change text-[11px] to text-[9px] and truncate
content = re.sub(r'className={`text-\[11px\] font-bold truncate \$\{isActive \? \'text-theme-text\' : \'text-theme-muted group-hover:text-theme-text\'\}`\}', r'className={`text-[9px] font-bold truncate \${isActive ? \'text-theme-text\' : \'text-theme-muted group-hover:text-theme-text\'}`}', content)

# Change swatches size w-3.5 h-3.5 to w-2.5 h-2.5
content = re.sub(r'className="w-3\.5 h-3\.5 rounded-xl border border-black/10 shadow-xs"', 'className="w-2.5 h-2.5 rounded border border-black/10 shadow-xs"', content)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(content)
