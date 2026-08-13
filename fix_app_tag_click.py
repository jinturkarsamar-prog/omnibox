import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

handle_func = """
  const handleTagClick = (tagName: string, type: 'user' | 'platform' | 'format') => {
    if (type === 'platform') {
      setPlatformFilter(tagName);
      // Optional: switch to 'all' if they were in inbox? User might expect to search globally.
      // But keeping current section is also fine. Let's switch to 'all' if it's a tag click to ensure they see it.
      setActiveSection('all');
    } else if (type === 'format') {
      setFormatFilter(tagName);
      setActiveSection('all');
    } else if (type === 'user') {
      setSearchQuery(tagName);
      setActiveSection('all');
    }
  };

  const getFilteredItems = (): SavedItem[] => {
"""

content = content.replace('  const getFilteredItems = (): SavedItem[] => {', handle_func)

# Add to InboxSection
content = content.replace(
    '<InboxSection layout={layout} setLayout={setLayout}',
    '<InboxSection layout={layout} setLayout={setLayout}\n              onTagClick={handleTagClick}'
)

# Add to TrashSection
content = content.replace(
    '<TrashSection',
    '<TrashSection\n              onTagClick={handleTagClick}'
)

# Add to Feed
content = content.replace(
    '<Feed\n                  items={filteredItems}',
    '<Feed\n                  onTagClick={handleTagClick}\n                  items={filteredItems}'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
