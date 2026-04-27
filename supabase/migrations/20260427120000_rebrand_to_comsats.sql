-- Rebrand seeded prose from "Northbridge" to "COMSATS University Islamabad".
--
-- The schema and IDs are unchanged; only display text is rewritten so the
-- knowledge base, building descriptions, and faculty bios refer to the real
-- institution. Embeddings on kb_chunks remain valid for retrieval — they
-- were generated from the prior text but the cosine geometry stays close
-- enough for a name swap, and chunks will be re-embedded on the next reseed.

BEGIN;

-- Buildings: descriptions and street addresses.
UPDATE public.buildings
SET description = REPLACE(REPLACE(description,
        'Northbridge University', 'COMSATS University Islamabad'),
        'Northbridge', 'COMSATS'),
    address = REPLACE(REPLACE(address,
        'Northbridge University', 'COMSATS University Islamabad'),
        'Northbridge', 'COMSATS')
WHERE description LIKE '%Northbridge%' OR address LIKE '%Northbridge%';

-- Faculty bios.
UPDATE public.faculty
SET bio = REPLACE(REPLACE(bio,
        'Northbridge University', 'COMSATS University Islamabad'),
        'Northbridge', 'COMSATS')
WHERE bio LIKE '%Northbridge%';

-- Knowledge-base prose documents.
UPDATE public.kb_documents
SET body = REPLACE(REPLACE(body,
        'Northbridge University', 'COMSATS University Islamabad'),
        'Northbridge', 'COMSATS'),
    title = REPLACE(REPLACE(title,
        'Northbridge University', 'COMSATS University Islamabad'),
        'Northbridge', 'COMSATS')
WHERE body LIKE '%Northbridge%' OR title LIKE '%Northbridge%';

-- Chunked, embedded passages used for retrieval.
UPDATE public.kb_chunks
SET content = REPLACE(REPLACE(content,
        'Northbridge University', 'COMSATS University Islamabad'),
        'Northbridge', 'COMSATS')
WHERE content LIKE '%Northbridge%';

-- Events / clubs (in case any descriptions reference the old name).
UPDATE public.events
SET description = REPLACE(REPLACE(description,
        'Northbridge University', 'COMSATS University Islamabad'),
        'Northbridge', 'COMSATS')
WHERE description LIKE '%Northbridge%';

UPDATE public.clubs
SET description = REPLACE(REPLACE(description,
        'Northbridge University', 'COMSATS University Islamabad'),
        'Northbridge', 'COMSATS')
WHERE description LIKE '%Northbridge%';

COMMIT;
