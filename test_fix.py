import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

text = text.replace("              </div>\n            )}\n          </div>\n        </div>\n      )}\n      {/* AI ENGINE TAB CONTENT */}", "        </div>\n      )}\n      {/* AI ENGINE TAB CONTENT */}")

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)
