import re

with open('src/components/Feed.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="absolute top-1 left-1 pointer-events-none">',
    '<div className="absolute top-1 left-1 z-10" onClick={(e) => { e.stopPropagation(); onTagClick?.(item.platform, \'platform\'); }}>'
)
# Make platform icon have cursor-pointer
content = content.replace(
    '<PlatformIcon platform={item.platform} size={11} className="bg-black/60 rounded-xl p-0.5" />',
    '<PlatformIcon platform={item.platform} size={11} className="bg-black/60 rounded-xl p-0.5 cursor-pointer hover:scale-110 transition-transform" />'
)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(content)
