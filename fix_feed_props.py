import re

with open('src/components/Feed.tsx', 'r') as f:
    content = f.read()

# Add onTagClick to FeedProps
content = content.replace(
    '  onPermanentDeleteItem?: (id: string) => void;',
    '  onPermanentDeleteItem?: (id: string) => void;\n  onTagClick?: (tagName: string, type: \'user\' | \'platform\' | \'format\') => void;'
)

# Add onTagClick to props destructuring
content = content.replace(
    '  onPermanentDeleteItem,',
    '  onPermanentDeleteItem,\n  onTagClick,'
)

with open('src/components/Feed.tsx', 'w') as f:
    f.write(content)
