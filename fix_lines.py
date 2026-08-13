with open('src/components/SettingsSection.tsx', 'r') as f:
    lines = f.readlines()

# find reader.readAsText(file);
idx = -1
for i, l in enumerate(lines):
    if 'reader.readAsText(file);' in l:
        idx = i
        break

if idx != -1:
    # replace the following lines up to return (
    # with the correct code
    end_idx = -1
    for i in range(idx, len(lines)):
        if 'return (' in lines[i]:
            end_idx = i
            break
    
    if end_idx != -1:
        new_lines = lines[:idx+1] + ["  };\n\n  const currentModeThemes = [...THEME_PRESETS, ...customThemes];\n"] + lines[end_idx:]
        with open('src/components/SettingsSection.tsx', 'w') as f:
            f.writelines(new_lines)

