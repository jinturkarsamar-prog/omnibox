with open('src/components/SettingsSection.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # If we are in the Appearance tab and hit AUTO-ORGANIZE RULES
    if i > 700 and i < 900 and "{/* AUTO-ORGANIZE RULES */}" in line:
        skip = True
    
    if skip:
        # Check if we reached the end of the appearance tab
        if "      )}\n" in line and "{/* AI ENGINE TAB CONTENT */}" in lines[i+1] if i+1 < len(lines) else False:
            skip = False
            # also, we shouldn't append this </div> if it was part of the rules?
            # Wait, the </div> at the end of the rules block is at line 873.
            pass
        elif line.strip() == "</div>" and lines[i+1].strip() == "</div>" and lines[i+2].strip() == ")}":
            # the rules block ends with </div>
            skip = False
            continue # skip this </div> as it's the rules block </div>
        elif "        </div>\n" == line and "      )}\n" == lines[i+1]:
            # end of Appearance tab!
            skip = False
            new_lines.append(line)
            continue
        
        continue
        
    new_lines.append(line)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.writelines(new_lines)
