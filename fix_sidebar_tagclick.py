import re

with open('src/components/Sidebar.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '  onDeleteRule: (id: string) => void;',
    '  onDeleteRule: (id: string) => void;\n  onTagClick?: (tagName: string, type: \'user\') => void;'
)

content = content.replace(
    '  onDeleteRule,',
    '  onDeleteRule,\n  onTagClick,'
)

content = content.replace(
    '                  className="flex items-center space-x-1.5 pl-2.5 pr-1 py-1 rounded-xl border text-xs text-theme-text/90 group/tag transition-all duration-200 hover:bg-black/5"',
    '                  className="flex items-center space-x-1.5 pl-2.5 pr-1 py-1 rounded-xl border text-xs text-theme-text/90 group/tag transition-all duration-200 hover:bg-theme-card/80 cursor-pointer"\n                  onClick={() => onTagClick?.(tag.name, \'user\')}'
)

content = content.replace(
    '<input\n                        type="text"\n                        value={editingTagName}',
    '<input\n                        onClick={(e) => e.stopPropagation()}\n                        type="text"\n                        value={editingTagName}'
)

content = content.replace(
    '<input\n                        type="color"\n                        value={editingTagColor}',
    '<input\n                        onClick={(e) => e.stopPropagation()}\n                        type="color"\n                        value={editingTagColor}'
)

content = content.replace(
    '                        onClick={() => handleEditTagSubmit(tag.id)}',
    '                        onClick={(e) => { e.stopPropagation(); handleEditTagSubmit(tag.id); }}'
)

content = content.replace(
    '                        onClick={() => setEditingTagId(null)}',
    '                        onClick={(e) => { e.stopPropagation(); setEditingTagId(null); }}'
)

content = content.replace(
    '                          onClick={() => {',
    '                          onClick={(e) => { e.stopPropagation(); '
)

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(content)

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '        activeFolderId={activeFolderId}',
    '        activeFolderId={activeFolderId}\n        onTagClick={handleTagClick}'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
