import { Ollama } from "ollama";
import OpenAI from "openai";

export type AiProvider = "ollama" | "openai";

export type AvailableModel = {
  provider: AiProvider;
  model: string;
  label: string;
};

export type GenerateOptions = {
  provider: AiProvider;
  model: string;
  systemPrompt: string;
  userPrompt: string;
};

export async function listOllamaModels(
  ollamaUrl: string,
): Promise<AvailableModel[]> {
  try {
    const client = new Ollama({ host: ollamaUrl });
    const response = await client.list();
    return response.models.map((m) => ({
      provider: "ollama" as const,
      model: m.name,
      label: `Ollama / ${m.name}`,
    }));
  } catch {
    return [];
  }
}

export async function listOpenAiModels(
  apiKey: string,
): Promise<AvailableModel[]> {
  try {
    const client = new OpenAI({ apiKey });
    const response = await client.models.list();
    const chatModels = response.data
      .filter((m) => m.id.startsWith("gpt-"))
      .sort((a, b) => a.id.localeCompare(b.id));
    return chatModels.map((m) => ({
      provider: "openai" as const,
      model: m.id,
      label: `OpenAI / ${m.id}`,
    }));
  } catch {
    return [];
  }
}

export async function listAllModels(
  ollamaUrl: string,
  openAiKey?: string,
): Promise<AvailableModel[]> {
  const promises: Promise<AvailableModel[]>[] = [
    listOllamaModels(ollamaUrl),
  ];
  if (openAiKey) {
    promises.push(listOpenAiModels(openAiKey));
  }
  const results = await Promise.allSettled(promises);
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function generate(
  options: GenerateOptions,
  ollamaUrl: string,
  openAiKey?: string,
): Promise<string> {
  if (options.provider === "ollama") {
    const client = new Ollama({ host: ollamaUrl });
    const response = await client.chat({
      model: options.model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
    });
    return response.message.content;
  }

  if (options.provider === "openai") {
    if (!openAiKey) throw new Error("OpenAI API key not configured");
    const client = new OpenAI({ apiKey: openAiKey });
    const response = await client.chat.completions.create({
      model: options.model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }

  throw new Error(`Unknown provider: ${options.provider}`);
}
