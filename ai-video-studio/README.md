# AI Video Studio (Production-Ready Scaffold)

## Architecture Overview (ASCII)

```text
┌───────────────────────────────────────────────────────────────────────┐
│                               Next.js UI                             │
│  Landing  /app workspace  /history  /project/[id]  /admin            │
└───────────────┬───────────────────────────────┬───────────────────────┘
                │ REST + SSE                    │ Server Actions/API
                ▼                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         API + Orchestrator Layer                      │
│ Validate input (Zod) → Safety checks → Cost estimate → Credit debit   │
│ Create generation record → enqueue BullMQ job → stream status (SSE)   │
└───────────────┬───────────────────────────────┬───────────────────────┘
                │                               │
                ▼                               ▼
     ┌─────────────────────┐          ┌─────────────────────────────┐
     │ PostgreSQL + Prisma │          │ Redis + BullMQ Worker       │
     │ users/projects/jobs │          │ retries/timeouts/progress    │
     └─────────┬───────────┘          └─────────────┬───────────────┘
               │                                     │
               ▼                                     ▼
      ┌───────────────────┐                ┌──────────────────────────┐
      │ S3-compatible CDN │                │ Video Provider Adapters  │
      │ signed uploads     │                │ ProviderA + Mock         │
      └───────────────────┘                └──────────────────────────┘
```

## Prisma DB Schema
Defined in `prisma/schema.prisma` for:
- Users
- Projects
- Generations (jobs)
- Assets (images/frames/videos)
- Billing/Credits ledger
- Admin logs

## Folder Structure

```text
ai-video-studio/
  app/
    api/
      generations/
      history/
      stream/[id]/
      upload-url/
    admin/
    app/
    history/
    project/[id]/
    layout.tsx
    page.tsx
  components/
    shared/
    workspace/
  lib/
    billing/
    providers/
    queue/
    realtime/
    safety/
    storage/
    video/
  prisma/
    schema.prisma
  types/
  worker/
    index.ts
```

## Setup

1. `cd ai-video-studio`
2. `cp .env.example .env`
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run dev`
6. `npm run worker`

## Environment Variables

Create `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_video_studio
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=replace_me
NEXTAUTH_URL=http://localhost:3000
VIDEO_PROVIDER=mock
MOCK_MODE=true
PROVIDER_A_BASE_URL=https://api.provider-a.example
PROVIDER_A_API_KEY=replace_me
S3_BUCKET=ai-video-studio
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=replace_me
S3_SECRET_ACCESS_KEY=replace_me
S3_ENDPOINT=https://s3.amazonaws.com
```

## Provider-Agnostic Design

Implement `VideoProvider` in `types/video.ts`:
- `submit(req)`
- `getStatus(providerJobId)`
- optional `cancel(providerJobId)`

Adapters:
- `lib/providers/provider-a.ts` (real API pattern + placeholders)
- `lib/providers/provider-mock.ts` (local fake generation)

To add a new adapter:
1. Create `lib/providers/provider-<name>.ts` implementing `VideoProvider`.
2. Register it in `lib/providers/index.ts`.
3. Set `VIDEO_PROVIDER=<name>` in `.env`.

## Mock Mode

`MOCK_MODE=true` + `VIDEO_PROVIDER=mock`:
- Signed upload URL returns safe fake URL.
- Worker polls mock provider and resolves with sample assets.
- Enables local product/UX development without external APIs.

## Acceptance Tests Checklist

- [ ] Generate 20–25s video in vertical and horizontal.
- [ ] Image-to-video strength slider changes settings payload.
- [ ] Frames-to-video frame ordering persists correctly.
- [ ] Progress updates stream via `/api/stream/[id]`.
- [ ] History stores prompt/settings/seed/preview and re-run works.

## Notes

- Includes safety policy checks with friendly refusal copy.
- Includes admin view for jobs, errors, and user credits.
- Includes cost estimate panel and advanced accordion UX.
- Includes autosave field in project schema (`autosaveSettings`).
