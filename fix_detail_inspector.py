import re

for filename in ['src/components/DetailSheet.tsx', 'src/components/InspectorPanel.tsx']:
    with open(filename, 'r') as f:
        content = f.read()

    # Add to props interface
    content = content.replace(
        '  onUpdateItem: (id: string, updates: Partial<SavedItem>) => void;',
        '  onUpdateItem: (id: string, updates: Partial<SavedItem>) => void;\n  onTagClick?: (tagName: string, type: \'user\' | \'platform\' | \'format\') => void;'
    )

    # Add to destructuring
    content = content.replace(
        '  onUpdateItem,',
        '  onUpdateItem,\n  onTagClick,'
    )

    # Make platforms clickable
    content = content.replace(
        '<div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-card/50 text-xs font-bold uppercase tracking-wider">',
        '<div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-card/50 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-theme-card transition-colors" onClick={() => onTagClick?.(item.platform, \'platform\')}>'
    )

    content = content.replace(
        '<div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-card/50 text-xs font-bold uppercase tracking-wider text-theme-muted">',
        '<div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-theme-border bg-theme-card/50 text-xs font-bold uppercase tracking-wider text-theme-muted cursor-pointer hover:bg-theme-card transition-colors" onClick={() => onTagClick?.(item.format, \'format\')}>'
    )

    # Make user tags clickable
    content = content.replace(
        'className="text-[10px] font-semibold px-2.5 py-1 rounded-xl border flex items-center space-x-1 transition-all hover:opacity-80"',
        'className="text-[10px] font-semibold px-2.5 py-1 rounded-xl border flex items-center space-x-1 transition-all hover:opacity-80 cursor-pointer"\n                        onClick={() => onTagClick?.(tag.name, \'user\')}'
    )

    with open(filename, 'w') as f:
        f.write(content)

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'onUpdateItem={handleUpdateItem}',
    'onUpdateItem={handleUpdateItem}\n          onTagClick={handleTagClick}'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
