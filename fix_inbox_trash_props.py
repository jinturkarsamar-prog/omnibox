import re

for filename in ['src/components/InboxSection.tsx', 'src/components/TrashSection.tsx']:
    with open(filename, 'r') as f:
        content = f.read()
    
    content = content.replace(
        '  onContextMenu: (e: React.MouseEvent, item: SavedItem) => void;',
        '  onContextMenu: (e: React.MouseEvent, item: SavedItem) => void;\n  onTagClick?: (tagName: string, type: \'user\' | \'platform\' | \'format\') => void;'
    )
    
    content = content.replace(
        '  onContextMenu,',
        '  onContextMenu,\n  onTagClick,'
    )

    # In Feed usage, add onTagClick={onTagClick}
    content = content.replace(
        '<Feed',
        '<Feed\n            onTagClick={onTagClick}'
    )

    with open(filename, 'w') as f:
        f.write(content)
