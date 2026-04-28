#!/usr/bin/env node
// Embed the COMSATS knowledge-base corpus and write to Supabase.
//
// Usage:
//   VOYAGE_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/ingest/embed-corpus.mjs
//
// Reads .env if present. Idempotent: deletes existing kb_documents/kb_chunks
// rows before re-inserting (corpus is the single source of truth).

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORPUS } from './corpus.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// ── Tiny .env loader (avoid runtime deps) ───────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*?)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VOYAGE_KEY   = process.env.VOYAGE_API_KEY;

if (!SUPABASE_URL) die('Missing SUPABASE_URL (or VITE_SUPABASE_URL).');
if (!SERVICE_KEY)  die('Missing SUPABASE_SERVICE_ROLE_KEY.');
if (!VOYAGE_KEY)   die('Missing VOYAGE_API_KEY. Get one at https://www.voyageai.com (free tier covers this corpus).');

const VOYAGE_MODEL = 'voyage-3';   // 1024-dim, matches kb_chunks.embedding type

// ── Chunking ────────────────────────────────────────────────────────────────
// Paragraph-aware split, with a soft target of ~500 words per chunk. Keeps
// FAQs intact (already short) and splits long policy/handbook docs by para.
const TARGET_WORDS = 280;

function chunkBody(body) {
  const paras = body.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const chunks = [];
  let buf = [];
  let bufWords = 0;
  for (const p of paras) {
    const w = p.split(/\s+/).length;
    if (bufWords && bufWords + w > TARGET_WORDS) {
      chunks.push(buf.join('\n\n'));
      buf = [];
      bufWords = 0;
    }
    buf.push(p);
    bufWords += w;
  }
  if (buf.length) chunks.push(buf.join('\n\n'));
  return chunks.length ? chunks : [body.trim()];
}

// ── Voyage embeddings ───────────────────────────────────────────────────────
async function embedBatch(texts, inputType /* "document" | "query" */) {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VOYAGE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model: VOYAGE_MODEL,
      input_type: inputType,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage error ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.data.map(d => d.embedding);
}

// ── Supabase REST (service role) ────────────────────────────────────────────
async function sbFetch(path, init = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${init.method || 'GET'} ${path} → ${res.status}: ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Embedding ${CORPUS.length} documents with ${VOYAGE_MODEL}…`);

  // 1) Wipe existing kb_chunks + kb_documents (FK cascade handles chunks).
  await sbFetch(`/rest/v1/kb_documents?id=neq.00000000-0000-0000-0000-000000000000`, {
    method: 'DELETE',
  });
  console.log('  cleared previous kb_documents');

  // 2) Insert documents.
  const docRows = CORPUS.map(d => ({
    slug: d.slug,
    title: d.title,
    source: d.source,
    category: d.category ?? null,
    url: d.url ?? null,
    metadata: d.metadata ?? {},
    body: d.body,
  }));
  const inserted = await sbFetch('/rest/v1/kb_documents', {
    method: 'POST',
    body: JSON.stringify(docRows),
  });
  console.log(`  inserted ${inserted.length} documents`);

  const slugToId = Object.fromEntries(inserted.map(d => [d.slug, d.id]));

  // 3) Build chunks list (preserving order per doc).
  const chunkRows = [];
  for (const d of CORPUS) {
    const pieces = chunkBody(d.body);
    pieces.forEach((content, i) => {
      chunkRows.push({
        document_id: slugToId[d.slug],
        chunk_index: i,
        content,
        token_count: estimateTokens(content),
      });
    });
  }
  console.log(`  prepared ${chunkRows.length} chunks`);

  // 4) Embed in batches. Voyage free tier: 3 RPM, 10K TPM. Stay under both
  //    by sending small batches (~6 chunks ≈ 2K tokens) and sleeping 22s
  //    between requests.
  const BATCH = 6;
  const SLEEP_MS = 22_000;
  for (let i = 0; i < chunkRows.length; i += BATCH) {
    const slice = chunkRows.slice(i, i + BATCH);
    const embeddings = await embedBatch(slice.map(c => c.content), 'document');
    slice.forEach((row, j) => { row.embedding = formatVector(embeddings[j]); });
    process.stdout.write(`  embedded ${Math.min(i + BATCH, chunkRows.length)}/${chunkRows.length}\n`);
    if (i + BATCH < chunkRows.length) {
      await new Promise(r => setTimeout(r, SLEEP_MS));
    }
  }

  // 5) Insert chunks (in batches to keep payload size reasonable).
  const INSERT_BATCH = 25;
  for (let i = 0; i < chunkRows.length; i += INSERT_BATCH) {
    const slice = chunkRows.slice(i, i + INSERT_BATCH);
    const inserted = await sbFetch('/rest/v1/kb_chunks', {
      method: 'POST',
      body: JSON.stringify(slice),
    });
    console.log(`  inserted ${Math.min(i + INSERT_BATCH, chunkRows.length)}/${chunkRows.length} (response rows: ${Array.isArray(inserted) ? inserted.length : 'n/a'})`);
  }
  console.log('Done.');
}

function estimateTokens(text) {
  // Rough estimate; ~4 chars per token for English/Urdu mix.
  return Math.ceil(text.length / 4);
}

function formatVector(arr) {
  // pgvector text format: '[0.1, 0.2, ...]'
  return '[' + arr.map(n => Number(n).toFixed(6)).join(',') + ']';
}

function die(msg) {
  console.error('error: ' + msg);
  process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
