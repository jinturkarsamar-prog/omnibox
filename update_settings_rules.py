import re

with open('src/components/SettingsSection.tsx', 'r') as f:
    text = f.read()

# State variables
state_vars = """  const [newRuleField, setNewRuleField] = useState<'url' | 'header' | 'note'>('url');
  const [newRuleOperator, setNewRuleOperator] = useState<'contains' | 'equals'>('contains');
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleAction, setNewRuleAction] = useState<'add_tag' | 'move_to_folder'>('add_tag');
  const [newRuleActionValue, setNewRuleActionValue] = useState('');

  const handleCreateRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleValue.trim() || !newRuleActionValue.trim()) return;
    onAddRule({
      triggerField: newRuleField,
      triggerOperator: newRuleOperator,
      triggerValue: newRuleValue.trim().toLowerCase(),
      actionType: newRuleAction,
      actionValue: newRuleActionValue,
    });
    setNewRuleValue('');
    setNewRuleActionValue('');
  };"""

# We'll insert it right after the custom theme states
target_state = "const handlePrepopulateColors = () => {"
text = text.replace(target_state, state_vars + "\n\n  " + target_state)


# UI snippet
ui_snippet = """          {/* AUTO-ORGANIZE RULES */}
          <div className="border border-theme-border bg-theme-sidebar rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <h2 className="text-sm font-semibold text-theme-text uppercase tracking-wider flex items-center space-x-2">
                <Sparkles size={14} className="text-theme-accent" />
                <span>Auto-Organize Rules</span>
              </h2>
            </div>
            
            <form onSubmit={handleCreateRuleSubmit} className="space-y-4 text-sm text-theme-text">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">If item's</label>
                  <select
                    value={newRuleField}
                    onChange={(e) => setNewRuleField(e.target.value as any)}
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text focus:outline-none focus:border-theme-accent cursor-pointer text-xs"
                  >
                    <option value="url">Source URL</option>
                    <option value="header">Title / Header</option>
                    <option value="note">Personal Note</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Condition</label>
                  <select
                    value={newRuleOperator}
                    onChange={(e) => setNewRuleOperator(e.target.value as any)}
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text focus:outline-none focus:border-theme-accent cursor-pointer text-xs"
                  >
                    <option value="contains">Contains text</option>
                    <option value="equals">Equals exactly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Value to match</label>
                  <input
                    type="text"
                    placeholder="e.g. youtube, design, recipes"
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent text-xs"
                    required
                  />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Then auto-organize</label>
                  <select
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value as any)}
                    className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text focus:outline-none focus:border-theme-accent cursor-pointer text-xs"
                  >
                    <option value="add_tag">Assign Tag</option>
                    <option value="move_to_folder">Move to Folder</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">Target</label>
                  {newRuleAction === 'add_tag' ? (
                    <input
                      type="text"
                      placeholder="Enter tag name"
                      value={newRuleActionValue}
                      onChange={(e) => setNewRuleActionValue(e.target.value)}
                      className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-muted/50 focus:outline-none focus:border-theme-accent text-xs"
                      required
                    />
                  ) : (
                    <select
                      value={newRuleActionValue}
                      onChange={(e) => setNewRuleActionValue(e.target.value)}
                      className="w-full bg-theme-sidebar border border-theme-border rounded-xl px-3 py-2 text-theme-text focus:outline-none focus:border-theme-accent cursor-pointer text-xs"
                      required
                    >
                      <option value="">-- Choose Folder --</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-1.5 bg-theme-accent hover:bg-theme-hover text-white font-bold py-2 rounded-xl transition text-xs shadow mt-2 cursor-pointer"
              >
                <Plus size={14} />
                <span>Save Magic Rule</span>
              </button>
            </form>

            {/* List existing rules */}
            {rules.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-theme-border">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Active Rules ({rules.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rules.map((rule) => {
                     const folderName = rule.actionType === 'move_to_folder'
                       ? folders.find((f) => f.id === rule.actionValue)?.name || 'Unknown Folder'
                       : '';
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-theme-card/50 border border-theme-border text-theme-text/80 text-xs shadow-sm hover:shadow transition group"
                      >
                        <span className="truncate pr-2">
                          If <strong className="text-theme-text">{rule.triggerField}</strong> {rule.triggerOperator}{' '}
                          <span className="text-theme-accent font-mono bg-theme-accent/10 px-1 rounded">"{rule.triggerValue}"</span><br/>
                          <span className="text-theme-muted text-[10px] flex items-center space-x-1 mt-1">
                            <span>↳ {rule.actionType === 'add_tag' ? 'Assign Tag:' : 'Move to Folder:'}</span>
                            <strong className="text-theme-text">"{rule.actionType === 'add_tag' ? rule.actionValue : folderName}"</strong>
                          </span>
                        </span>
                        <button
                          onClick={() => onDeleteRule(rule.id)}
                          title="Delete Rule"
                          className="text-theme-muted hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-xl transition opacity-50 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>\n\n"""

target_ui = "{/* FEED & LAYOUT PREFERENCES */}"
text = text.replace(target_ui, ui_snippet + "          " + target_ui)

with open('src/components/SettingsSection.tsx', 'w') as f:
    f.write(text)

