import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

let clientInstance: AIClient | null = null

export class AIClient {
  private anthropic: Anthropic
  private model: string

  constructor(options?: { apiKey?: string; model?: string }) {
    this.anthropic = new Anthropic({
      apiKey: options?.apiKey ?? process.env.ANTHROPIC_API_KEY,
      maxRetries: 0,
    })
    this.model = options?.model ?? process.env.AI_MODEL ?? DEFAULT_MODEL
  }

  async analyze(text: string, systemPrompt: string): Promise<string> {
    return this.invoke(systemPrompt, text)
  }

  async generate(context: string, systemPrompt: string): Promise<string> {
    return this.invoke(systemPrompt, context)
  }

  private async invoke(system: string, userMessage: string): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 4096,
          system,
          messages: [{ role: 'user', content: userMessage }],
        })

        const textBlock = response.content.find((block) => block.type === 'text')
        if (!textBlock || textBlock.type !== 'text') {
          throw new Error('No text content in AI response')
        }
        return textBlock.text
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError ?? new Error('AI invocation failed after retries')
  }
}

export function getAIClient(): AIClient {
  if (!clientInstance) {
    clientInstance = new AIClient()
  }
  return clientInstance
}
