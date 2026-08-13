import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

props_pattern = r"""  rules: AutoRule\[\];
  onResetData: \(\) => void;"""

new_props = """  rules: AutoRule[];
  onAddRule: (rule: Omit<AutoRule, 'id'>) => void;
  onDeleteRule: (id: string) => void;
  onResetData: () => void;"""

text = re.sub(props_pattern, new_props, text)

destruct_pattern = r"""  rules,
  onResetData,"""

new_destruct = """  rules,
  onAddRule,
  onDeleteRule,
  onResetData,"""

text = re.sub(destruct_pattern, new_destruct, text)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)

