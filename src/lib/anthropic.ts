import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { serverEnv } from '@/lib/env'

let cached: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!cached) {
    cached = new Anthropic({ apiKey: serverEnv.anthropicApiKey })
  }
  return cached
}

// IDs de modelo — alineados con el plan (§13). Usar Haiku por defecto,
// escalar a Sonnet solo si source_confidence < 0.7.
export const MODELS = {
  haiku: 'claude-haiku-4-5',
  sonnet: 'claude-sonnet-4-6',
} as const

export type ModelKey = keyof typeof MODELS

// Precios USD por 1M tokens (octubre 2025).
const PRICING: Record<ModelKey, { input: number; output: number }> = {
  haiku: { input: 1, output: 5 },
  sonnet: { input: 3, output: 15 },
}

// Calcula costo USD considerando prompt caching:
//   - cache_creation: 25% extra sobre tarifa input
//   - cache_read: 10% de tarifa input (90% off)
export function computeCostUsd(
  modelKey: ModelKey,
  usage: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens?: number | null
    cache_read_input_tokens?: number | null
  },
): number {
  const p = PRICING[modelKey]
  const baseInput = (usage.input_tokens / 1_000_000) * p.input
  const baseOutput = (usage.output_tokens / 1_000_000) * p.output
  const cacheWrite = ((usage.cache_creation_input_tokens ?? 0) / 1_000_000) * p.input * 1.25
  const cacheRead = ((usage.cache_read_input_tokens ?? 0) / 1_000_000) * p.input * 0.1
  return Number((baseInput + baseOutput + cacheWrite + cacheRead).toFixed(6))
}
