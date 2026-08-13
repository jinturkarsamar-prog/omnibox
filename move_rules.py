import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

# Extract Auto-Organize rules
pattern = r"(\s*\{/\* AUTO-ORGANIZE RULES \*/\}.*?)(?=\s*\{/\* FEED & LAYOUT PREFERENCES \*/\})"
match = re.search(pattern, text, re.DOTALL)
if match:
    rules_block = match.group(1)
    text = text.replace(rules_block, "")
    
    # Let's insert it before the closing </div> of the AI Engine tab content
    # I will just find `{/* SYSTEM & DATA TAB CONTENT */}` and go back a bit.
    
    parts = text.split("{/* SYSTEM & DATA TAB CONTENT */}")
    
    # parts[0] contains the AI tab. The last few lines of parts[0] are:
    #         </div>
    #       )}
    # Let's replace that.
    
    parts[0] = parts[0].replace("        </div>\n      )}\n\n      ", rules_block + "\n        </div>\n      )}\n\n      ")
    
    text = "{/* SYSTEM & DATA TAB CONTENT */}".join(parts)
    
    with open('src/components/SettingsSection.tsx', 'w') as f:
        f.write(text)
    print("Successfully moved rules block.")
else:
    print("Could not find rules block.")

