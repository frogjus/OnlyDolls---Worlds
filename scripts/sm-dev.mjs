import Supermemory from 'supermemory';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const CONTAINER = 'storyforge_dev_memory';
const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY
});

const command = process.argv[2];
const arg = process.argv.slice(3).join(' ');

async function addMemory(content, metadata = {}) {
  const result = await client.add({
    content,
    containerTag: CONTAINER,
    metadata: { ...metadata, timestamp: new Date().toISOString() },
  });
  return result;
}

async function search(query) {
  const result = await client.search.execute({
    q: query,
    containerTag: CONTAINER,
    limit: 10,
  });
  return result;
}

async function ingestDoc(filepath) {
  const content = readFileSync(filepath, 'utf-8');
  const filename = filepath.split('/').pop();
  console.log(`Ingesting ${filename} (${content.length} chars)...`);
  const result = await addMemory(content, {
    type: 'architecture_doc',
    filename,
    project: 'storyforge',
  });
  console.log(`  -> ${result.id} (${result.status})`);
  return result;
}

async function ingestAllDocs() {
  const docsDir = '/app/docs';
  const files = readdirSync(docsDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    await ingestDoc(join(docsDir, file));
  }
  // Also ingest CLAUDE.md
  await ingestDoc('/app/CLAUDE.md');
  console.log('\nDone! All docs ingested into storyforge_dev_memory container.');
}

async function addSessionSummary(summary) {
  return addMemory(summary, {
    type: 'session_summary',
    project: 'storyforge',
  });
}

async function addDecision(decision) {
  return addMemory(decision, {
    type: 'decision',
    project: 'storyforge',
  });
}

async function addStatus(status) {
  return addMemory(status, {
    type: 'project_status',
    project: 'storyforge',
  });
}

async function listMemories() {
  const docs = await client.documents.list();
  const ours = docs.memories.filter(m =>
    m.containerTags?.includes(CONTAINER)
  );
  console.log(`Found ${ours.length} memories in ${CONTAINER}:\n`);
  for (const m of ours) {
    console.log(`  [${m.status}] ${m.id} — ${m.title || m.metadata?.type || 'untitled'}`);
    if (m.metadata?.filename) console.log(`         file: ${m.metadata.filename}`);
  }
}

// CLI router
switch (command) {
  case 'ingest-all':
    await ingestAllDocs();
    break;
  case 'ingest':
    if (!arg) { console.error('Usage: sm-dev.mjs ingest <filepath>'); process.exit(1); }
    await ingestDoc(arg);
    break;
  case 'search':
    if (!arg) { console.error('Usage: sm-dev.mjs search "<query>"'); process.exit(1); }
    const results = await search(arg);
    console.log(JSON.stringify(results, null, 2));
    break;
  case 'status':
    if (!arg) { console.error('Usage: sm-dev.mjs status "<status text>"'); process.exit(1); }
    const sr = await addStatus(arg);
    console.log(`Status saved: ${sr.id}`);
    break;
  case 'decision':
    if (!arg) { console.error('Usage: sm-dev.mjs decision "<decision text>"'); process.exit(1); }
    const dr = await addDecision(arg);
    console.log(`Decision saved: ${dr.id}`);
    break;
  case 'session':
    if (!arg) { console.error('Usage: sm-dev.mjs session "<summary>"'); process.exit(1); }
    const ssr = await addSessionSummary(arg);
    console.log(`Session summary saved: ${ssr.id}`);
    break;
  case 'list':
    await listMemories();
    break;
  default:
    console.log(`Usage: node scripts/sm-dev.mjs <command> [arg]
Commands:
  ingest-all          Ingest all /app/docs/*.md + CLAUDE.md
  ingest <file>       Ingest a single file
  search "<query>"    Semantic search dev memories
  status "<text>"     Save project status update
  decision "<text>"   Save an architectural decision
  session "<text>"    Save session summary
  list                List all dev memories`);
}
