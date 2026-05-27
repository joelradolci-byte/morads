import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { MoraAITask } from "./types";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 55_000;

const MODEL_REDACTOR =
  process.env.MORA_AI_REDACTOR_MODEL?.trim() || "gpt-5.4-mini";
const MODEL_ESTRATEGA =
  process.env.MORA_AI_ESTRATEGA_MODEL?.trim() || "claude-sonnet-4-6";
const MODEL_ANUNCIOS =
  process.env.MORA_AI_ANUNCIOS_MODEL?.trim() || "claude-sonnet-4-6";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

export function parseJsonResponse<T>(raw: string): T {
  const jsonStr = extractJsonObject(raw);
  return JSON.parse(jsonStr) as T;
}

function logAiCall(meta: {
  task: MoraAITask;
  model: string;
  attempt: number;
  latencyMs: number;
  ok: boolean;
}) {
  console.info(
    `[mora-ai] task=${meta.task} model=${meta.model} attempt=${meta.attempt} latency_ms=${meta.latencyMs} ok=${meta.ok}`
  );
}

function requireOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY no configurada");
  }
  return new OpenAI({ apiKey: key, timeout: REQUEST_TIMEOUT_MS });
}

function requireAnthropic(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY no configurada");
  }
  return new Anthropic({ apiKey: key, timeout: REQUEST_TIMEOUT_MS });
}

async function callOpenAIJson(
  model: string,
  system: string,
  user: string,
  temperature: number
): Promise<string> {
  const client = requireOpenAI();
  const completion = await client.chat.completions.create({
    model,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI devolvió respuesta vacía");
  return content;
}

async function callAnthropicJson(
  model: string,
  system: string,
  user: string,
  temperature: number
): Promise<string> {
  const client = requireAnthropic();
  const message = await client.messages.create({
    model,
    max_tokens: 8192,
    temperature,
    system: `${system}\n\nRespondé únicamente con JSON válido, sin markdown ni texto extra.`,
    messages: [{ role: "user", content: user }],
  });
  const block = message.content.find(b => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Anthropic devolvió respuesta sin texto");
  }
  return block.text;
}

export type CallMoraAIOptions = {
  task: MoraAITask;
  system: string;
  user: string;
  temperature?: number;
};

export async function callMoraAI<T>(options: CallMoraAIOptions): Promise<T> {
  const { task, system, user, temperature = 0.2 } = options;
  const model =
    task === "redactor_hallazgos"
      ? MODEL_REDACTOR
      : task === "estratega_auditoria"
        ? MODEL_ESTRATEGA
        : MODEL_ANUNCIOS;

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const started = Date.now();
    try {
      const raw =
        task === "redactor_hallazgos"
          ? await callOpenAIJson(model, system, user, temperature)
          : await callAnthropicJson(model, system, user, temperature);

      logAiCall({ task, model, attempt, latencyMs: Date.now() - started, ok: true });
      return parseJsonResponse<T>(raw);
    } catch (error) {
      lastError = error;
      logAiCall({ task, model, attempt, latencyMs: Date.now() - started, ok: false });
      console.warn(`[mora-ai] ${task} intento ${attempt}/${MAX_ATTEMPTS} falló:`, error);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

export function isAiConfigured(task: MoraAITask): boolean {
  if (task === "redactor_hallazgos") {
    return !!process.env.OPENAI_API_KEY?.trim();
  }
  return !!process.env.ANTHROPIC_API_KEY?.trim();
}

export function getModelForTask(task: MoraAITask): string {
  if (task === "redactor_hallazgos") return MODEL_REDACTOR;
  if (task === "estratega_auditoria") return MODEL_ESTRATEGA;
  return MODEL_ANUNCIOS;
}
