import re

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "showNotesInFeed={showNotesInFeed}" in line and "setShowNotesInFeed" not in line and "SettingsSection" in "".join(lines[max(0, i-20):i]):
        if "showTagsInFeed" in lines[i+1]:
            # This is the bad block
            new_lines.append("              showNotesInFeed={showNotesInFeed}\n")
            new_lines.append("              setShowNotesInFeed={setShowNotesInFeed}\n")
            new_lines.append("              showTagsInFeed={showTagsInFeed}\n")
            new_lines.append("              setShowTagsInFeed={setShowTagsInFeed}\n")
            new_lines.append("              showPlatformBadges={showPlatformBadges}\n")
            new_lines.append("              setShowPlatformBadges={setShowPlatformBadges}\n")
            skip = True
            skip_count = 7
            continue
            
    if skip:
        if skip_count > 0:
            skip_count -= 1
            continue
        else:
            skip = False
            
    new_lines.append(line)

with open('src/App.tsx', 'w') as f:
    f.writelines(new_lines)
