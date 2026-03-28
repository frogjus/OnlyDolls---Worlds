import type { SyncConfig, MemoryEntry, SearchResult } from './types'

const DEFAULT_BASE_URL = 'https://api.supermemory.ai'

export class SuperMemoryClient {
  private apiKey: string
  private baseUrl: string
  private containerTag: string

  constructor(config: SyncConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL
    this.containerTag = config.containerTag
  }

  async addMemory(content: string, metadata?: Record<string, string>): Promise<string> {
    const response = await this.request('/memories', {
      method: 'POST',
      body: JSON.stringify({
        content,
        containerTag: this.containerTag,
        metadata: metadata ?? {},
      }),
    })

    const data = (await response.json()) as { id: string }
    return data.id
  }

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const response = await this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        containerTag: this.containerTag,
        limit,
      }),
    })

    const data = (await response.json()) as { results: SearchResult[] }
    return data.results
  }

  async deleteMemory(memoryId: string): Promise<void> {
    await this.request(`/memories/${memoryId}`, {
      method: 'DELETE',
    })
  }

  async listMemories(limit = 50): Promise<MemoryEntry[]> {
    const response = await this.request(
      `/memories?containerTag=${encodeURIComponent(this.containerTag)}&limit=${limit}`,
      { method: 'GET' }
    )

    const data = (await response.json()) as { memories: MemoryEntry[] }
    return data.memories
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers as Record<string, string> | undefined),
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `SuperMemory API error (${response.status}): ${errorText}`
      )
    }

    return response
  }
}

let clientInstance: SuperMemoryClient | null = null

export function getSuperMemoryClient(worldId: string): SuperMemoryClient {
  const apiKey = process.env.SUPERMEMORY_API_KEY
  if (!apiKey) {
    throw new Error('SUPERMEMORY_API_KEY environment variable is not set')
  }

  const containerTag = `storyforge_world_${worldId}`

  if (clientInstance && (clientInstance as unknown as { containerTag: string }).containerTag === containerTag) {
    return clientInstance
  }

  clientInstance = new SuperMemoryClient({
    apiKey,
    containerTag,
  })

  return clientInstance
}
