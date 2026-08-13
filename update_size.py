import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    content = f.read()

# Change text size from text-[10px] to text-[11px] or text-xs
content = re.sub(r'className={`text-\[10px\] font-bold truncate \$\{isActive \? \'text-theme-text\' : \'text-theme-muted group-hover:text-theme-text\'\}`\}', r'className={`text-xs font-bold truncate ${isActive ? \'text-theme-text\' : \'text-theme-muted group-hover:text-theme-text\'}`}', content)

# Change swatch size from w-3 h-3 to w-4 h-4
content = re.sub(r'className="w-3 h-3 rounded-md border border-black/10 shadow-xs"', 'className="w-4 h-4 rounded-md border border-black/10 shadow-xs"', content)

# Adjust spacing of swatches a bit
content = re.sub(r'className="flex items-center space-x-1 mt-1"', 'className="flex items-center space-x-1.5 mt-1.5"', content)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(content)
