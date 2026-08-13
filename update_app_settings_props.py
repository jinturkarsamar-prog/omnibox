import re

with open('src/App.tsx', 'r') as f:
    text = f.read()

pattern = r"""              rules=\{rules\}
              onResetData=\{handleResetData\}"""

new_text = """              rules={rules}
              onAddRule={handleAddRule}
              onDeleteRule={handleDeleteRule}
              onResetData={handleResetData}"""

text = re.sub(pattern, new_text, text)

with open('src/App.tsx', 'w') as f:
    f.write(text)

