export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Platform Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure security, LLM providers, and organization preferences.
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Security Settings */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4">Security Policies</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require Multi-Factor Authentication</p>
                <p className="text-[10px] text-muted-foreground">Enforce MFA for all enterprise users.</p>
              </div>
              <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-primary-foreground rounded-full absolute top-0.5 right-0.5" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="text-sm font-medium">Session Timeout</p>
                <p className="text-[10px] text-muted-foreground">Automatically log out idle users.</p>
              </div>
              <select className="bg-secondary border border-border rounded text-sm px-3 py-1.5 text-foreground">
                <option>15 Minutes</option>
                <option>30 Minutes</option>
                <option>1 Hour</option>
                <option>4 Hours</option>
              </select>
            </div>
          </div>
        </section>

        {/* LLM Provider Configuration */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4">Model Orchestration</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary LLM Provider</label>
              <select className="w-full bg-secondary border border-border rounded p-2 text-sm">
                <option>OpenAI (GPT-4o)</option>
                <option>Anthropic (Claude 3.5 Sonnet)</option>
                <option>Local (Ollama / LLaMA 3)</option>
              </select>
            </div>
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fallback Provider</label>
              <select className="w-full bg-secondary border border-border rounded p-2 text-sm">
                <option>Local (Ollama / LLaMA 3)</option>
                <option>Anthropic (Claude 3.5 Sonnet)</option>
                <option>OpenAI (GPT-4o)</option>
              </select>
              <p className="text-[10px] text-muted-foreground">The platform will automatically failover to this provider if the primary is down or rate-limited.</p>
            </div>
          </div>
        </section>

        {/* Audit Retention */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-sm font-semibold mb-4">Compliance & Retention</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Data Retention Period (Days)</p>
              <p className="text-[10px] text-muted-foreground">Used for SOC2 and GDPR compliance standards.</p>
            </div>
            <input type="number" defaultValue={2555} className="w-24 bg-secondary border border-border rounded p-1.5 text-sm text-right" />
          </div>
        </section>

        <div className="flex justify-end gap-3 mt-4">
          <button className="btn-secondary">Discard Changes</button>
          <button className="btn-primary">Save Configuration</button>
        </div>
      </div>
    </div>
  )
}
