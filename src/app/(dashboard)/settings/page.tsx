"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Hash,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Settings2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import type { AvailableModel } from "@/lib/ai/providers";

type SettingsData = {
  id: number;
  ollamaUrl: string | null;
  modelAssignmentsJson: string | null;
  hasApiKeys: { openai: boolean };
  hasSlack: { token: boolean; channel: boolean; enabled: boolean };
  slackChannelId: string | null;
  slackEnabled: number | null;
  updatedAt: string;
};

type ModelsResponse = {
  models: AvailableModel[];
  status: {
    ollama: { connected: boolean; url: string };
    openai: { configured: boolean };
  };
};

type ModelAssignment = { provider: "ollama" | "openai"; model: string };
type ModelAssignments = { proposalDrafting?: ModelAssignment };

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [models, setModels] = useState<ModelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [openAiKey, setOpenAiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [assignments, setAssignments] = useState<ModelAssignments>({});

  const [slackToken, setSlackToken] = useState("");
  const [showSlackToken, setShowSlackToken] = useState(false);
  const [slackTokenStatus, setSlackTokenStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [slackChannelId, setSlackChannelId] = useState("");
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackTest, setSlackTest] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [slackTestError, setSlackTestError] = useState("");

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data: SettingsData = await res.json();
      setSettings(data);
      setOllamaUrl(data.ollamaUrl ?? "http://localhost:11434");
      if (data.modelAssignmentsJson) {
        setAssignments(JSON.parse(data.modelAssignmentsJson));
      }
      setSlackChannelId(data.slackChannelId ?? "");
      setSlackEnabled(!!data.slackEnabled);
    }
    setLoading(false);
  }, []);

  const fetchModels = useCallback(async () => {
    setLoadingModels(true);
    const res = await fetch("/api/ai/models");
    if (res.ok) {
      const data: ModelsResponse = await res.json();
      setModels(data);
    }
    setLoadingModels(false);
  }, []);

  useEffect(() => {
    fetchSettings().then(() => fetchModels());
  }, [fetchSettings, fetchModels]);

  async function saveOllamaUrl() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ollamaUrl }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchModels();
  }

  async function saveApiKey() {
    setKeyStatus("saving");
    const res = await fetch("/api/settings/api-keys", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ openai: openAiKey }),
    });
    if (res.ok) {
      setKeyStatus("saved");
      setOpenAiKey("");
      setShowKey(false);
      fetchSettings();
      fetchModels();
      setTimeout(() => setKeyStatus("idle"), 2000);
    }
  }

  async function saveModelAssignment(
    feature: keyof ModelAssignments,
    value: string,
  ) {
    if (!value) {
      const updated = { ...assignments };
      delete updated[feature];
      setAssignments(updated);
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelAssignmentsJson: JSON.stringify(updated) }),
      });
      return;
    }

    const sepIndex = value.indexOf(":");
    const provider = value.slice(0, sepIndex);
    const model = value.slice(sepIndex + 1);
    const updated = {
      ...assignments,
      [feature]: { provider: provider as "ollama" | "openai", model },
    };
    setAssignments(updated);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelAssignmentsJson: JSON.stringify(updated) }),
    });
  }

  async function saveSlackToken() {
    setSlackTokenStatus("saving");
    const res = await fetch("/api/slack/token", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: slackToken }),
    });
    if (res.ok) {
      setSlackTokenStatus("saved");
      setSlackToken("");
      setShowSlackToken(false);
      fetchSettings();
      setTimeout(() => setSlackTokenStatus("idle"), 2000);
    }
  }

  async function saveSlackSettings(channelId: string, enabled: boolean) {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slackChannelId: channelId || null,
        slackEnabled: enabled ? 1 : 0,
      }),
    });
    fetchSettings();
  }

  async function testSlack() {
    setSlackTest("sending");
    setSlackTestError("");
    const res = await fetch("/api/slack/test", { method: "POST" });
    if (res.ok) {
      setSlackTest("success");
      setTimeout(() => setSlackTest("idle"), 3000);
    } else {
      const data = await res.json();
      setSlackTestError(data.error ?? "Test failed");
      setSlackTest("error");
      setTimeout(() => setSlackTest("idle"), 5000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-bone-dim" />
      </div>
    );
  }

  const ollamaConnected = models?.status.ollama.connected ?? false;
  const openAiConfigured = settings?.hasApiKeys.openai ?? false;
  const allModels = models?.models ?? [];
  const slackTokenConfigured = settings?.hasSlack.token ?? false;
  const slackChannelConfigured = settings?.hasSlack.channel ?? false;

  const currentAssignment = assignments.proposalDrafting;
  const currentValue = currentAssignment
    ? `${currentAssignment.provider}:${currentAssignment.model}`
    : "";

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="mt-1 text-sm text-bone-dim">
          AI models, API keys, and app configuration.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Ollama Connection */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={16} className="text-accent" />
            <h2 className="font-display text-sm font-semibold">
              Ollama (Local Models)
            </h2>
            <span className="ml-auto flex items-center gap-1.5 text-xs">
              {ollamaConnected ? (
                <>
                  <Wifi size={12} className="text-accent" />
                  <span className="text-accent">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-red-400" />
                  <span className="text-red-400">Not connected</span>
                </>
              )}
            </span>
          </div>

          <div className="flex gap-2 mb-3">
            <label className="flex flex-col gap-1 flex-1">
              <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                Ollama URL
              </span>
              <input
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone focus:border-accent focus:outline-none"
              />
            </label>
            <button
              onClick={saveOllamaUrl}
              disabled={saving}
              className="self-end flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <Save size={12} />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          {ollamaConnected && (
            <div>
              <p className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50 mb-2">
                Available Local Models
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allModels
                  .filter((m) => m.provider === "ollama")
                  .map((m) => (
                    <span
                      key={m.model}
                      className="px-2 py-0.5 rounded bg-surface-raised text-[11px] font-mono text-bone-dim"
                    >
                      {m.model}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* API Keys */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <h2 className="font-display text-sm font-semibold mb-4">API Keys</h2>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                  OpenAI
                </span>
                {openAiConfigured && (
                  <span className="flex items-center gap-1 text-[10px] text-accent">
                    <Check size={10} /> Configured
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={openAiKey}
                    onChange={(e) => setOpenAiKey(e.target.value)}
                    placeholder={openAiConfigured ? "Enter new key to replace" : "sk-..."}
                    className="w-full rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none pr-9"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-dim hover:text-bone transition-colors"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={saveApiKey}
                  disabled={!openAiKey || keyStatus === "saving"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {keyStatus === "saving" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : keyStatus === "saved" ? (
                    <Check size={12} />
                  ) : (
                    <Save size={12} />
                  )}
                  {keyStatus === "saved" ? "Saved" : "Save Key"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Slack Notifications */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-accent" />
            <h2 className="font-display text-sm font-semibold">
              Slack Notifications
            </h2>
            <span className="ml-auto flex items-center gap-1.5 text-xs">
              {slackTokenConfigured && slackChannelConfigured ? (
                <>
                  <Wifi size={12} className="text-accent" />
                  <span className="text-accent">Configured</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-bone-dim/50" />
                  <span className="text-bone-dim/50">Not configured</span>
                </>
              )}
            </span>
          </div>

          {/* Bot Token */}
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                  Bot User OAuth Token
                </span>
                {slackTokenConfigured && (
                  <span className="flex items-center gap-1 text-[10px] text-accent">
                    <Check size={10} /> Configured
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showSlackToken ? "text" : "password"}
                    value={slackToken}
                    onChange={(e) => setSlackToken(e.target.value)}
                    placeholder={slackTokenConfigured ? "Enter new token to replace" : "xoxb-..."}
                    className="w-full rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none pr-9"
                  />
                  <button
                    onClick={() => setShowSlackToken(!showSlackToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-bone-dim hover:text-bone transition-colors"
                  >
                    {showSlackToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  onClick={saveSlackToken}
                  disabled={!slackToken || slackTokenStatus === "saving"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {slackTokenStatus === "saving" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : slackTokenStatus === "saved" ? (
                    <Check size={12} />
                  ) : (
                    <Save size={12} />
                  )}
                  {slackTokenStatus === "saved" ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>

          {/* Channel ID */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
                Channel ID
              </span>
              <Hash size={10} className="text-bone-dim/50" />
            </div>
            <div className="flex gap-2">
              <input
                value={slackChannelId}
                onChange={(e) => setSlackChannelId(e.target.value)}
                placeholder="C0123456789"
                className="flex-1 rounded-lg border border-border bg-ink px-3 py-1.5 text-sm text-bone placeholder:text-bone-dim/50 focus:border-accent focus:outline-none"
              />
              <button
                onClick={() => saveSlackSettings(slackChannelId, slackEnabled)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-ink-deep text-xs font-semibold hover:brightness-110 transition-all"
              >
                <Save size={12} />
                Save
              </button>
            </div>
            <p className="text-[11px] text-bone-dim/50 mt-1.5">
              Right-click a channel in Slack, select &quot;View channel details&quot;, then copy the Channel ID from the bottom.
            </p>
          </div>

          {/* Enable toggle + Test */}
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                role="switch"
                aria-checked={slackEnabled}
                onClick={() => {
                  const next = !slackEnabled;
                  setSlackEnabled(next);
                  saveSlackSettings(slackChannelId, next);
                }}
                className={`relative w-9 h-5 rounded-full transition-colors ${slackEnabled ? "bg-accent" : "bg-border"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-bone transition-transform ${slackEnabled ? "translate-x-4" : ""}`}
                />
              </button>
              <span className="text-xs text-bone-dim">
                {slackEnabled ? "Notifications enabled" : "Notifications disabled"}
              </span>
            </label>

            <button
              onClick={testSlack}
              disabled={!slackTokenConfigured || !slackChannelConfigured || slackTest === "sending"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-bone-dim hover:text-bone hover:border-bone-dim/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {slackTest === "sending" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : slackTest === "success" ? (
                <Check size={12} className="text-accent" />
              ) : slackTest === "error" ? (
                <X size={12} className="text-red-400" />
              ) : (
                <Send size={12} />
              )}
              {slackTest === "sending"
                ? "Sending..."
                : slackTest === "success"
                  ? "Sent"
                  : slackTest === "error"
                    ? "Failed"
                    : "Send Test"}
            </button>
          </div>

          {slackTestError && (
            <p className="mt-2 text-xs text-red-400">{slackTestError}</p>
          )}
        </section>

        {/* Model Assignments */}
        <section className="p-5 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-semibold">
              AI Model Configuration
            </h2>
            <button
              onClick={fetchModels}
              disabled={loadingModels}
              className="flex items-center gap-1.5 text-xs text-bone-dim hover:text-bone transition-colors"
            >
              <RefreshCw
                size={12}
                className={loadingModels ? "animate-spin" : ""}
              />
              Refresh Models
            </button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-medium tracking-wider uppercase text-bone-dim/50">
              Proposal Drafting Model
            </span>
            <select
              value={currentValue}
              onChange={(e) =>
                saveModelAssignment("proposalDrafting", e.target.value)
              }
              className="rounded-lg border border-border bg-ink px-3 py-2 text-sm text-bone focus:border-accent focus:outline-none"
            >
              <option value="">-- Select a model --</option>
              {allModels.filter((m) => m.provider === "ollama").length > 0 && (
                <optgroup label="Ollama (Local)">
                  {allModels
                    .filter((m) => m.provider === "ollama")
                    .map((m) => (
                      <option key={m.label} value={`${m.provider}:${m.model}`}>
                        {m.model}
                      </option>
                    ))}
                </optgroup>
              )}
              {allModels.filter((m) => m.provider === "openai").length > 0 && (
                <optgroup label="OpenAI">
                  {allModels
                    .filter((m) => m.provider === "openai")
                    .map((m) => (
                      <option key={m.label} value={`${m.provider}:${m.model}`}>
                        {m.model}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            {allModels.length === 0 && (
              <p className="text-xs text-bone-dim/50 mt-1">
                No models available. Connect Ollama or add an OpenAI API key above.
              </p>
            )}
          </label>
        </section>
      </div>
    </div>
  );
}
