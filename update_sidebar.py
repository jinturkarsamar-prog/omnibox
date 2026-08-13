import re

with open('src/components/Sidebar.tsx', 'r') as f:
    text = f.read()

# Remove state variables
state_pattern = r"""  // Rules Configuration States
  const \[showRulesConfig, setShowRulesConfig\] = useState\(false\);
  const \[newRuleField, setNewRuleField\] = useState<'url' \| 'header' \| 'note'>\('url'\);
  const \[newRuleOperator, setNewRuleOperator\] = useState<'contains' \| 'equals'>\('contains'\);
  const \[newRuleValue, setNewRuleValue\] = useState\(''\);
  const \[newRuleAction, setNewRuleAction\] = useState<'add_tag' \| 'move_to_folder'>\('add_tag'\);
  const \[newRuleActionValue, setNewRuleActionValue\] = useState\(''\);"""

text = re.sub(state_pattern, "", text)

# Remove handleCreateRuleSubmit
handle_pattern = r"""  const handleCreateRuleSubmit = \(e: React.FormEvent\) => \{
    e.preventDefault\(\);
    if \(!newRuleValue.trim\(\) \|\| !newRuleActionValue.trim\(\)\) return;
    onAddRule\(\{
      triggerField: newRuleField,
      triggerOperator: newRuleOperator,
      triggerValue: newRuleValue.trim\(\).toLowerCase\(\),
      actionType: newRuleAction,
      actionValue: newRuleActionValue,
    \}\);
    setNewRuleValue\(''\);
    setNewRuleActionValue\(''\);
  \};"""

text = re.sub(handle_pattern, "", text)

# Find the start of the Magic Rules button
btn_pattern = r"""        <button
          onClick=\{\(\) => setShowRulesConfig\(!showRulesConfig\)\}
          className=\{`flex items-center justify-between w-full px-3\.5 py-2\.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer \$\{
            showRulesConfig
              \? 'bg-theme-card text-theme-text font-semibold shadow-sm border border-theme-border/50'
              : 'text-theme-muted hover:bg-theme-card hover:text-theme-text'
          \}`\}
        >
          <div className="flex items-center space-x-3">
            <Sparkles size=\{16\} className="text-theme-muted animate-pulse" />
            <span>Magic Rules</span>
          </div>
          <span className="text-\[11px\] font-semibold bg-theme-card text-theme-text px-2 py-0\.5 rounded-xl border border-theme-border">
            \{rules.length\}
          </span>
        </button>"""

text = re.sub(btn_pattern, "", text)

# Remove the actual form
form_pattern = r"""        \{\/\* Rules Setup Sub-menu \*\/\}
        \{showRulesConfig && \(
          <div className="p-4 rounded-xl border border-theme-border bg-theme-card/60 backdrop-blur space-y-3\.5">
(.*?)          <\/div>
        \)\}"""

text = re.sub(form_pattern, "", text, flags=re.DOTALL)

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(text)

