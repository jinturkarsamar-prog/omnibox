with open('src/components/SettingsSection.tsx', 'r') as f:
    lines = f.readlines()

with open('src/components/SettingsSection.tsx', 'w') as f:
    for i, line in enumerate(lines):
        if i == 734:
            pass # skip )}
        else:
            f.write(line)
