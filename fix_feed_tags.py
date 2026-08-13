import re

with open('src/components/Feed.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="text-[10px] font-semibold px-2 py-0.5 rounded-xl border shrink-0"',
    'onClick={(e) => { e.stopPropagation(); onTagClick?.(tag.name, \'user\'); }}\n                        className="cursor-pointer hover:scale-105 transition-transform text-[10px] font-semibold px-2 py-0.5 rounded-xl border shrink-0"'
)

# And in list view tags
content = content.replace(
    'className="text-[10px] font-semibold"',
    'onClick={(e) => { e.stopPropagation(); onTagClick?.(tag.name, \'user\'); }}\n                      className="cursor-pointer hover:opacity-80 text-[10px] font-semibold"'
)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(content)
