with open('src/components/SettingsSection.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
in_rules = False
rules_lines = []
rule_blocks = []
div_count = 0

for line in lines:
    if "{/* AUTO-ORGANIZE RULES */}" in line:
        in_rules = True
        rules_lines = [line]
        div_count = 0
        continue
        
    if in_rules:
        rules_lines.append(line)
        div_count += line.count("<div")
        div_count -= line.count("</div")
        
        if div_count == 0 and line.strip() == "</div>":
            in_rules = False
            rule_blocks.append("".join(rules_lines))
        continue
        
    new_lines.append(line)

if rule_blocks:
    rules_block = rule_blocks[0] # Take the first one
    
    text = "".join(new_lines)
    
    parts = text.split("{/* SYSTEM & DATA TAB CONTENT */}")
    if len(parts) > 1:
        # We want to insert the rules_block right before the end of the AI tab
        parts[0] = parts[0].replace("        </div>\n      )}\n", rules_block + "\n        </div>\n      )}\n")
        text = "{/* SYSTEM & DATA TAB CONTENT */}".join(parts)
        with open('src/components/SettingsSection.tsx', 'w') as f:
            f.write(text)
        print("Fixed.")
else:
    print("No blocks found")

