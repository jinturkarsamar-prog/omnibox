import re

with open('src/components/InboxSection.tsx', 'r') as f:
    text = f.read()

text = text.replace("import {", "import {\n  Grid,\n  List,", 1)
text = text.replace('layout?: "gallery" | "list" | "masonry";', 'layout: "gallery" | "list";\n  setLayout: (l: "gallery" | "list") => void;')
text = text.replace('size?: "comfortable" | "small" | "compact";', '')

# Remove size from props
text = re.sub(r"\s*size,", "", text)
text = text.replace("layout,", "layout,\n  setLayout,")

# Remove size from Feed props
text = re.sub(r"\s*size=\{size\}", "", text)

# Insert the layout toggle in the header
# Find:
#             <h2 className="text-base font-semibold text-theme-text flex items-center space-x-2">
#               <Inbox className="text-theme-muted" size={18} />
#               <span>Inbox Processing Queue ({inboxItems.length} items)</span>
#             </h2>
#             <p className="text-xs text-theme-muted mt-0.5">
#               Items landing here must be categorized into folders or tagged before leaving.
#             </p>
#           </div>
#           {inboxItems.length > 0 && (

header_pattern = r"(<p className=\"text-xs text-theme-muted mt-0.5\">[\s\S]*?<\/p>\s*<\/div>)"

toggle_code = """
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-theme-card border border-theme-border rounded-xl p-0.5 text-theme-muted">
              <button
                onClick={() => setLayout('gallery')}
                title="Gallery View"
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  layout === 'gallery' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                }`}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => setLayout('list')}
                title="List View"
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                  layout === 'list' ? 'bg-theme-sidebar text-theme-text' : 'hover:text-theme-text'
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
"""

# Let's place it after the `<div>` that contains the title.
# Wait, the structure is:
#         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
#           <div>
#             <h2 ...
#             <p ...
#           </div>
#           <div className="flex items-center space-x-3">... toggle ...</div>
#           {inboxItems.length > 0 && ( ... mass actions ... )}

# Let's replace the header block to include the toggle inside the flex container.
# Currently:
#         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
#           <div>
#             <h2>...</h2>
#             <p>...</p>
#           </div>
#           {inboxItems.length > 0 && (

text = re.sub(header_pattern, r"\1\n" + toggle_code, text)

with open('src/components/InboxSection.tsx', 'w') as f:
    f.write(text)

