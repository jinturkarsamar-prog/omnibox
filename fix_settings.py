import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    content = f.read()

# 1. Remove themeModeFilter and newThemeMode states
content = re.sub(r"  const \[themeModeFilter, setThemeModeFilter\] = useState\s*<\s*'light' \| 'dark'\s*>\s*\([^\)]+\);\n", "", content)
content = re.sub(r"  const \[newThemeMode, setNewThemeMode\] = useState\s*<\s*'light' \| 'dark'\s*>\s*\('dark'\);\n", "", content)

# 2. Update currentModeThemes to just use all themes
content = re.sub(r"  const currentModeThemes = \[\.\.\.THEME_PRESETS, \.\.\.customThemes\]\.filter\(t => t\.mode === themeModeFilter\);", r"  const currentModeThemes = [...THEME_PRESETS, ...customThemes];", content)

# 3. Remove toggleModeFilter function
content = re.sub(r"  const toggleModeFilter = \(mode: 'light' \| 'dark'\) => \{\n    setThemeModeFilter\(mode\);\n  \};\n", "", content)

# 4. Remove Light / Dark Mode Toggle from APPEARANCE TAB CONTENT
# It's a block starting with:
#                 {/* Light / Dark Mode Toggle */}
# ending before:                 {/* PRESETS GRID FOR SELECTED MODE */}

pattern_toggle = r"\s*\{/\* Light / Dark Mode Toggle \*/\}.*?(?=\s*\{/\* PRESETS GRID FOR SELECTED MODE \*/\})"
content = re.sub(pattern_toggle, "\n", content, flags=re.DOTALL)

# 5. Remove Base Style toggle from Custom Theme Builder
# Starts with: {/* Base Style */}
# Ends with:               </div>
# Wait, it ends with a closing div for the grid-cols-2

pattern_base_style = r"\s*\{/\* Base Style \*/\}.*?(?=\s*</div>\s*\{/\* Grid of Color Pickers \*/\})"
content = re.sub(pattern_base_style, "\n              ", content, flags=re.DOTALL)

# 6. Change grid-cols-2 to grid-cols-1 for Theme Name in Custom Theme Builder
content = re.sub(r"className=\"grid grid-cols-1 sm:grid-cols-2 gap-4\"", 'className="grid grid-cols-1 gap-4"', content)

# 7. In onCreateCustomTheme, remove mode: newThemeMode, and hardcode mode: 'light'
content = re.sub(r"      mode: newThemeMode,", "      mode: 'light',", content)

# 8. Remove replace(' (Dark)', '').replace(' (Light)', '')
content = re.sub(r"\{theme\.name\.replace\(' \(Dark\)', ''\)\.replace\(' \(Light\)', ''\)\}", "{theme.name}", content)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(content)
