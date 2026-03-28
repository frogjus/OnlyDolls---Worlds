export interface FountainToken {
  type: string;
  text: string;
  scene_number?: string;
  depth?: number;
  dual?: string;
}

export interface FountainParseResult {
  title: string;
  credit: string;
  author: string;
  source: string;
  tokens: FountainToken[];
}

export interface FountainTitlePage {
  title?: string;
  credit?: string;
  author?: string;
  source?: string;
  'draft date'?: string;
  contact?: string;
}
