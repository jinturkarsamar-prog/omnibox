import re

with open('src/App.tsx', 'r') as f:
    text = f.read()

# Replace state initialization
# const [layout, setLayout] = useState<'gallery' | 'list' | 'masonry'>('gallery');
# const [size, setSize] = useState<'comfortable' | 'small' | 'compact'>('comfortable');
text = re.sub(
    r"const \[layout, setLayout\] = useState<'gallery' \| 'list' \| 'masonry'>\([^)]*\);",
    "const [layout, setLayout] = useState<'gallery' | 'list'>('gallery');",
    text
)
text = re.sub(
    r"const \[size, setSize\] = useState<'comfortable' \| 'small' \| 'compact'>\([^)]*\);",
    "",
    text
)

# Replace the layout controls in the Feed section (lines ~965-981 for size toggles)
# Wait, let's just do a regex replace for the size toggles and the layout buttons
layout_buttons_pattern = r"\{/\* Size density toggles \(Only on gallery layout\) \*/\}[\s\S]*?\{/\* Grid vs List layout buttons \*/\}[\s\S]*?<\/div>"
replacement = """{/* Grid vs List layout buttons */}
                  <div className="flex items-center bg-theme-card border border-theme-border rounded-xl p-0.5 text-theme-muted">
                    <button
                      onClick={() => setLayout('gallery')}
                      title="Gallery Masonry View"
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        layout === 'gallery' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                      }`}
                    >
                      <Grid size={15} />
                    </button>
                    <button
                      onClick={() => setLayout('list')}
                      title="Compact List View"
                      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                        layout === 'list' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                      }`}
                    >
                      <List size={15} />
                    </button>
                  </div>"""

text = re.sub(layout_buttons_pattern, replacement, text)

# Update InboxSection props
text = re.sub(
    r"<InboxSection layout=\{layout\} size=\{size\}",
    "<InboxSection layout={layout} setLayout={setLayout}",
    text
)

# Update TrashSection props
text = re.sub(
    r"<TrashSection layout=\{layout\} size=\{size\}",
    "<TrashSection layout={layout} setLayout={setLayout}",
    text
)

# Update Feed props (remove size)
text = re.sub(
    r"layout=\{layout\}\s*size=\{size\}",
    "layout={layout}",
    text
)

with open('src/App.tsx', 'w') as f:
    f.write(text)

