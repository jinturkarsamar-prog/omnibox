with open('src/components/SettingsSection.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == ")}":
        # check if the surrounding lines look like we're in the broken spot
        pass
        
with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

text = text.replace("            )}\n          </div>\n        </div>\n      )}\n      {/* AI ENGINE TAB CONTENT */}", "          </div>\n        </div>\n      )}\n      {/* AI ENGINE TAB CONTENT */}")

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)

