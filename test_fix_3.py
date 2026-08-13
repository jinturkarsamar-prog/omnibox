text = ""
with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

text = text.replace("            </form>\n          </div>\n          </div>\n        </div>\n      )}", "            </form>\n          </div>\n        </div>\n      )}")

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)
