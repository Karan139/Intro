# Prompt Management Tool Design

## 1. System Overview

The Prompt Management Tool is a productivity-first application for managing large prompt libraries with fast retrieval, reliable categorization, and flexible manual control. It supports:

- Prompt CRUD: save, edit, delete prompts.
- AI-assisted categorization and tag suggestion.
- Human override for categories/tags at any time.
- Hybrid search (semantic + keyword).
- Structured browsing (list, category, tag views).
- Duplicate/similarity detection.
- JSON import/export.

### Product goals

- **Scalable** to thousands of prompts per user/workspace.
- **Fast** indexing and retrieval (<200ms keyword lookups, <500ms hybrid search target at p95 with proper infra).
- **Accurate** category/tag assignment with confidence scoring.
- **Simple UI** optimized for daily prompt workflows.

---

## 2. Architecture

### Frontend

**Recommended stack:** React + TypeScript + Next.js (or Vite SPA), Tailwind/Chakra for rapid UI.

#### Key UI modules

1. **Prompt Editor**
   - Text area with title/description.
   - AI-suggested category/tags panel.
   - Manual override controls.
2. **Prompt Library Views**
   - List view (sortable by updated date, usage, confidence).
   - Category view (grouped cards).
   - Tag view (tag cloud + filtered table).
3. **Search Bar + Advanced Filters**
   - Keyword query.
   - Semantic toggle.
   - Filters: category, tags, date range, owner.
4. **Similarity Warnings UI**
   - “Possible duplicates” panel during create/edit.
5. **Import/Export UI**
   - Upload JSON file, validate, preview, merge strategy.

### Backend/API Layer

**Recommended stack:** FastAPI (Python) or NestJS (Node), with async worker queue.

#### Service decomposition

1. **Prompt Service**
   - CRUD endpoints.
   - Versioning support (optional).
2. **Categorization Service**
   - Calls NLP classifier + embedding model.
   - Applies rule engine and confidence thresholds.
3. **Search Service**
   - Keyword search via DB full-text index.
   - Semantic search via vector index.
   - Hybrid rank fusion.
4. **Similarity Service**
   - Near-duplicate detection using cosine similarity + MinHash/SimHash.
5. **Library I/O Service**
   - JSON import/export, schema validation, idempotent upserts.

#### Async processing

Use a queue (Celery/RQ/BullMQ + Redis/RabbitMQ):
- On prompt create/update, enqueue:
  - embedding generation
  - category classification
  - tag extraction
  - duplicate scan
- Return quick API response and progressively update status (`ANALYZING`, `READY`, `REVIEW_NEEDED`).

### Database & Search Storage

**Primary DB:** PostgreSQL.

- Relational consistency for prompts/tags/categories/user permissions.
- JSONB for extensible metadata.
- Full-text search (GIN index + `tsvector`).

**Vector storage:**
- PostgreSQL + pgvector (simple and sufficient for thousands to low millions), or
- Dedicated vector DB (Qdrant/Weaviate/Pinecone) if scaling beyond.

### AI Layer

1. **Embedding model**
   - Generate vector for prompt text (`title + body`).
2. **Classifier model**
   - Multi-class category prediction + confidence.
3. **Tag suggestion model**
   - NER/keyphrase extraction + controlled vocabulary alignment.
4. **Rule engine**
   - Business logic, thresholds, manual override precedence.

### Scalability notes

- Use stateless API pods behind a load balancer.
- Cache hot queries (Redis).
- Precompute embeddings and search features.
- Partition data by workspace/user if enterprise.
- Background reindex jobs for model updates.

---

## 3. Categorization Engine

### Example category taxonomy

- Marketing
- Coding
- Personal Productivity
- Social Media
- Business Strategy
- Content Creation
- Automation

(Optionally include subcategories, e.g., Coding → Debugging, Refactoring, Documentation.)

### Inputs used

- Prompt title
- Prompt body
- Optional user-provided context (project, domain)
- Existing tags (if editing)

### 3.1 NLP classification

Use a supervised multi-class model (or LLM classification prompt with structured output) to produce:
- `predicted_category`
- `category_confidence`
- `top_k_categories`

Example output:
```json
{
  "predicted_category": "Coding",
  "confidence": 0.87,
  "alternatives": [
    {"category": "Automation", "confidence": 0.09},
    {"category": "Content Creation", "confidence": 0.04}
  ]
}
```

### 3.2 Embedding similarity

Generate embedding and compare against:
- historical prompts in the same workspace
- centroid vectors for each predefined category cluster

Compute cosine similarity:
- If nearest category centroid is high (e.g., `>=0.78`), boost that category.
- If top two categories are close (delta < 0.05), mark as `REVIEW_NEEDED`.

### 3.3 Predefined category clusters

For each category, maintain:
- Seed prompts/examples.
- Cluster centroid embedding.
- Keyword priors (weighted terms).

Hybrid category score:

`final_score(category) = 0.55 * nlp_prob + 0.35 * embedding_similarity + 0.10 * keyword_prior`

Configurable by category performance metrics.

### 3.4 Tag suggestion logic

Tag generation pipeline:
1. Extract keyphrases/entities from prompt text.
2. Normalize (lowercase, singularization, dedupe, stopword removal).
3. Map to approved tag vocabulary (synonym map, e.g., “SEO copywriting” → `seo`).
4. Rank tags by relevance score.
5. Return top N suggestions (typically 5).

Example tags:
- `python`
- `debugging`
- `instagram`
- `market-research`
- `workflow-automation`

### 3.5 Manual override behavior

- User can overwrite category and tags.
- Store both:
  - `system_category`, `system_tags`
  - `final_category`, `final_tags`
- Override always wins in UI/search facets.
- Keep audit fields (`overridden_by`, `overridden_at`) for retraining signals.

### 3.6 Duplicate/high-similarity detection

Use two checks:
1. **Exact-ish hash check** (normalized text hash) for near-identical entries.
2. **Embedding similarity check** to find semantically similar prompts.

Threshold examples:
- `>=0.95`: likely duplicate
- `0.85–0.95`: highly similar (suggest merge or link)

---

## 4. Database Schema

Below is a suggested PostgreSQL schema (simplified):

### `users`
- `id` (UUID, PK)
- `email` (unique)
- `name`
- `created_at`

### `workspaces`
- `id` (UUID, PK)
- `name`
- `owner_id` (FK `users.id`)
- `created_at`

### `prompts`
- `id` (UUID, PK)
- `workspace_id` (FK)
- `title` (text)
- `body` (text)
- `system_category_id` (FK `categories.id`, nullable)
- `final_category_id` (FK `categories.id`, nullable)
- `category_confidence` (numeric)
- `status` (`ANALYZING|READY|REVIEW_NEEDED`)
- `embedding` (vector, nullable)
- `normalized_hash` (text, indexed)
- `created_by` (FK `users.id`)
- `created_at`, `updated_at`
- `deleted_at` (soft delete)

Indexes:
- GIN full-text index on `to_tsvector('english', title || ' ' || body)`
- ivfflat/hnsw index on `embedding`
- btree on `workspace_id`, `updated_at`

### `categories`
- `id` (serial/UUID, PK)
- `name` (unique)
- `description`
- `is_active`

### `tags`
- `id` (UUID, PK)
- `workspace_id` (FK)
- `name` (text)
- `normalized_name` (text)
- unique (`workspace_id`, `normalized_name`)

### `prompt_tags`
- `prompt_id` (FK)
- `tag_id` (FK)
- `source` (`SYSTEM|USER`)
- `confidence` (numeric, nullable)
- PK (`prompt_id`, `tag_id`, `source`)

### `prompt_similarities`
- `prompt_id` (FK)
- `similar_prompt_id` (FK)
- `similarity_score` (numeric)
- `similarity_type` (`DUPLICATE|HIGH_SIMILARITY`)
- `computed_at`

### `prompt_versions` (optional, recommended)
- `id` (UUID)
- `prompt_id` (FK)
- `title`
- `body`
- `changed_by`
- `changed_at`

### `imports`
- `id` (UUID)
- `workspace_id`
- `file_name`
- `status`
- `summary_json` (JSONB)
- `created_at`

### `exports`
- `id` (UUID)
- `workspace_id`
- `filters_json` (JSONB)
- `file_url`
- `created_by`
- `created_at`

---

## 5. Example Workflow

### Scenario
User pastes a prompt:

> “Write a 30-day Instagram content calendar for a SaaS startup focused on AI productivity tools. Include post ideas, hooks, and CTAs.”

### Step-by-step system flow

1. **User submits prompt** in editor.
2. **Prompt Service stores draft** with status `ANALYZING`.
3. **Queue job runs NLP pipeline**:
   - classifier predicts: `Social Media` (0.81)
   - alternatives: `Marketing` (0.12), `Content Creation` (0.07)
4. **Embedding generated** and compared to category centroids + prompt corpus.
   - Social Media similarity: 0.84
   - Marketing similarity: 0.75
5. **Rule engine computes final score** and confirms `Social Media`.
6. **Tag suggester proposes**: `instagram`, `content-calendar`, `saas`, `cta`, `audience-growth`.
7. **Duplicate scan** finds no matches >0.85.
8. **Prompt updated** to status `READY`, category/tags saved.
9. **Search indexes refreshed** (FTS + vector index).
10. **User sees saved prompt** in list view and can find it via:
    - keyword: “Instagram calendar”
    - semantic query: “monthly social media plan for AI startup”.

### Hybrid search behavior

When querying:
- Retrieve top keyword matches from FTS.
- Retrieve top semantic matches from vector search.
- Fuse results via weighted reciprocal rank fusion.
- Re-rank by recency + exact tag/category matches.

---

## 6. Future Improvements

1. **Active learning loop**
   - Use manual overrides as training feedback.
2. **Team knowledge graph**
   - Link prompts to projects, docs, outcomes.
3. **Prompt quality scoring**
   - Predict likely effectiveness based on historical usage/results.
4. **Auto-template extraction**
   - Detect repeatable structures and convert to variable templates.
5. **Multilingual categorization**
   - Detect language and route through language-specific models.
6. **Policy/compliance guardrails**
   - Flag sensitive content and enforce org-level governance.
7. **Offline batch ingestion**
   - Bulk import tens of thousands of prompts with progress tracking.

