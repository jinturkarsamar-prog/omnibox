with open('src/components/SettingsSection.tsx', 'r') as f:
    content = f.read()

depth = 0
for i, c in enumerate(content):
    if c == '{': depth += 1
    elif c == '}': depth -= 1

print('Final depth:', depth)
