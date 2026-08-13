import re

with open('src/components/Feed.tsx', 'r') as f:
    content = f.read()

# Badges Overlay (Gallery View)
content = content.replace(
    '<div className="absolute top-3 left-10 flex flex-wrap gap-1.5 pointer-events-none">',
    '<div className="absolute top-3 left-10 flex flex-wrap gap-1.5 z-10">'
)

content = content.replace(
    'className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${getPlatformBadgeColor(',
    'onClick={(e) => { e.stopPropagation(); onTagClick?.(item.platform, \'platform\'); }}\n                      className={`cursor-pointer hover:scale-105 transition-transform flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${getPlatformBadgeColor('
)

content = content.replace(
    '<div className="bg-theme-card/90 backdrop-blur-md text-theme-text border border-theme-border flex items-center space-x-1 px-2 py-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider">',
    '<div onClick={(e) => { e.stopPropagation(); onTagClick?.(item.format, \'format\'); }} className="cursor-pointer hover:scale-105 transition-transform bg-theme-card/90 backdrop-blur-md text-theme-text border border-theme-border flex items-center space-x-1 px-2 py-1 rounded-xl text-[10px] font-semibold uppercase tracking-wider">'
)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(content)
