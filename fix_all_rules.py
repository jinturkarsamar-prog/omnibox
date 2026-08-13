import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

# The block starts with {/* AUTO-ORGANIZE RULES */} and ends with its matching </div>.
# Since it's tricky to parse HTML, we'll find {/* AUTO-ORGANIZE RULES */} and the next </div> that is at the same indentation level, or just use regex to match to the end of the </div> that closes it.
# Actually, the block is:
#           {/* AUTO-ORGANIZE RULES */}
#           <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-4 shadow-sm">
# ...
#             )}
#           </div>

pattern = r"\s*\{/\* AUTO-ORGANIZE RULES \*/\}.*?\n          <\/div>"

matches = re.findall(pattern, text, re.DOTALL)
if not matches:
    print("No rules blocks found?")
else:
    rules_block = matches[0]
    # delete all occurrences
    text = re.sub(pattern, "", text, flags=re.DOTALL)
    
    # insert under AI ENGINE TAB CONTENT
    # Look for "        </div>\n      )}\n\n      {/* SYSTEM & DATA TAB CONTENT */}"
    
    insert_point = r"        <\/div>\n      \)\}\n\n      \{\/\* SYSTEM & DATA TAB CONTENT \*\/\} \n"
    parts = text.split("{/* SYSTEM & DATA TAB CONTENT */}")
    
    if len(parts) > 1:
        parts[0] = parts[0].replace("        </div>\n      )}\n\n      ", "\n" + rules_block + "\n        </div>\n      )}\n\n      ")
        text = "{/* SYSTEM & DATA TAB CONTENT */}".join(parts)
        
        with open('src/components/SettingsSection.tsx', 'w') as f:
            f.write(text)
        print("Done fixing.")
    else:
        print("Could not find SYSTEM & DATA tab content.")

