export type EntityType = 'character' | 'location' | 'object';

export interface WorldEntity {
  id: string;
  name: string;
  aliases: string[];
  type: EntityType;
  color: string;
  description?: string;
}

export const TYPE_COLORS: Record<EntityType, string> = {
  character: '#3b82f6',
  location: '#22c55e',
  object: '#f59e0b',
};

export interface EntityMention {
  entityId: string;
  entityType: EntityType;
  from: number;
  to: number;
  text: string;
  color: string;
}

/**
 * Maintains a case-insensitive lookup of entity names/aliases
 * for fast matching during typing.
 */
export class EntityRegistry {
  private entities: Map<string, WorldEntity> = new Map();
  private nameLookup: Map<string, string> = new Map();

  constructor(entities: WorldEntity[]) {
    this.load(entities);
  }

  load(entities: WorldEntity[]) {
    this.entities.clear();
    this.nameLookup.clear();

    for (const entity of entities) {
      this.entities.set(entity.id, entity);

      const names = [entity.name, ...entity.aliases];
      for (const name of names) {
        this.nameLookup.set(name.toLowerCase(), entity.id);
      }
    }
  }

  /**
   * Find all entity mentions in a text string.
   * Returns matches sorted by position, longest match first (greedy).
   */
  findMentions(text: string): EntityMention[] {
    const mentions: EntityMention[] = [];
    const lowerText = text.toLowerCase();

    // Sort names by length descending for greedy matching
    const sortedNames = [...this.nameLookup.keys()].sort(
      (a, b) => b.length - a.length
    );

    // Track covered ranges to avoid overlapping matches
    const covered = new Set<number>();

    for (const name of sortedNames) {
      let searchFrom = 0;
      while (true) {
        const idx = lowerText.indexOf(name, searchFrom);
        if (idx === -1) break;

        // Check word boundaries
        const before = idx > 0 ? lowerText[idx - 1] : ' ';
        const after = idx + name.length < lowerText.length
          ? lowerText[idx + name.length]
          : ' ';

        const isWordBoundary = /\W/.test(before) && /\W/.test(after);

        if (isWordBoundary && !covered.has(idx)) {
          const entityId = this.nameLookup.get(name)!;
          const entity = this.entities.get(entityId)!;

          mentions.push({
            entityId,
            entityType: entity.type,
            from: idx,
            to: idx + name.length,
            text: text.slice(idx, idx + name.length),
            color: entity.color || TYPE_COLORS[entity.type],
          });

          // Mark range as covered
          for (let i = idx; i < idx + name.length; i++) {
            covered.add(i);
          }
        }

        searchFrom = idx + 1;
      }
    }

    return mentions.sort((a, b) => a.from - b.from);
  }

  getEntity(id: string): WorldEntity | undefined {
    return this.entities.get(id);
  }

  getColor(type: EntityType): string {
    return TYPE_COLORS[type];
  }
}
