import re

with open('src/components/TrashSection.tsx', 'r') as f:
    text = f.read()

# Let's replace the block entirely using a clear regex

pattern = r"(<p className=\"text-xs text-theme-muted mt-1 max-w-xl leading-relaxed\">\s*Deleted folders and items are temporarily archived here. They will stay in the Trash Bin for\{' '\}\s*<strong className=\"text-theme-text font-medium\">30 days<\/strong>, after which they are permanently and irreversibly purged.\s*<\/p>\s*<\/div>\s*<\/div>)\s*\{trashItems\.length > 0 && \(\s*<button\s*onClick=\{[\s\S]*?className=\"flex items-center justify-center space-x-1\.5 px-4 py-2 bg-theme-card border border-red-200 dark:border-red-900\/40 hover:bg-red-100 dark:hover:bg-red-950\/20 text-red-500 font-medium rounded-xl text-xs transition shrink-0 cursor-pointer\"\s*>\s*<Flame size=\{14\} \/>\s*<span>Empty Trash Bin \(\{trashItems\.length\}\)<\/span>\s*<\/button>\s*\)\}\s*<\/div>\s*<\/div>"

replacement = r"""\1
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-end flex-1">
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
        {trashItems.length > 0 && (
          <button
            onClick={() => {
              if (
                confirm(
                  'Are you absolutely sure you want to empty the Trash Bin? All contents will be permanently deleted and cannot be recovered.',
                )
              ) {
                onEmptyTrash();
              }
            }}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-theme-card border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/20 text-red-500 font-medium rounded-xl text-xs transition shrink-0 cursor-pointer"
          >
            <Flame size={14} />
            <span>Empty Trash Bin ({trashItems.length})</span>
          </button>
        )}
        </div>
      </div>"""

new_text = re.sub(pattern, replacement, text)

with open('src/components/TrashSection.tsx', 'w') as f:
    f.write(new_text)

