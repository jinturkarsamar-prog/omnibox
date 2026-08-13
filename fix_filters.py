import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'pool = pool.filter((item) => item.platform === platformFilter);',
    'pool = pool.filter((item) => (item.platform || \'\').toLowerCase() === platformFilter.toLowerCase());'
)

content = content.replace(
    'pool = pool.filter((item) => item.format === formatFilter);',
    'pool = pool.filter((item) => (item.format || \'\').toLowerCase() === formatFilter.toLowerCase());'
)

handle_func_new = """  const handleTagClick = (tagName: string, type: 'user' | 'platform' | 'format') => {
    if (type === 'platform') {
      const matched = PLATFORM_CHIPS.find(p => p.toLowerCase() === tagName.toLowerCase());
      setPlatformFilter(matched || tagName);
      setActiveSection('all');
    } else if (type === 'format') {
      const matched = FORMAT_CHIPS.find(f => f.toLowerCase() === tagName.toLowerCase());
      setFormatFilter(matched || tagName);
      setActiveSection('all');
    } else if (type === 'user') {
      setSearchQuery(tagName);
      setActiveSection('all');
    }
  };"""

content = re.sub(r'  const handleTagClick =.*?};', handle_func_new, content, flags=re.DOTALL)

with open('src/App.tsx', 'w') as f:
    f.write(content)
