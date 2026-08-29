# oingg-cbc-ts

Ingests data from the Central Bank of the Republic of China (Taiwan)'s
Statistical Database API into Postgres, in the same style as its sibling
[oingg-mops-ts](https://github.com/oingg-tw/oingg-mops-ts).

**Status: skeleton only.** The server boots, connects to the DB, and serves
`/api-docs`, but no domains (exchange rates, interest rates, etc.) are
implemented yet — that's the next step, done one domain at a time.

## The CBC API

```
GET https://cpx.cbc.gov.tw/API/DataAPI/Get?FileName={ItemCode}
```

Returns JSON with three parts: `header` (basic info), `dataset` (the actual
series), `structure` (dimensional info for the dataset). The exact shape of
each isn't documented and seems to vary by item — always fetch a real item
and look at the real response before writing a parser for it, rather than
guessing the shape.

See [CBC-ITEM-CODES.md](./CBC-ITEM-CODES.md) for the full catalog of item
codes (exchange rates, money supply, interest rates, foreign exchange,
balance of payments, etc.), transcribed from CBC's own API documentation.
It also flags two apparent typos in that source document — check there
before trusting a Month-period code.

## Architecture

Same domain-driven layout as oingg-mops-ts:

```
src/
  index.ts              # app bootstrap (middleware, routes, error handler, server start)
  routes.ts             # mounts each domain's router under /api/ingest
  adapters/
    prisma/              # single shared PrismaClient instance
    swagger/              # swagger-jsdoc setup, reads @swagger comments from domains/**
  shared/
    config.ts            # env-derived config
    errorHandler.ts       # last-resort express error handler
    serverInfo.ts         # startup timing, exposed on GET /
    cbcClient.ts          # fetchCbcItem(itemCode) — the one place that talks to the CBC API
  domains/
    system/root.ts        # health check (GET /)
    <domain>/              # one folder per data category, added as needed:
      route.ts              #   Express router + @swagger docs
      controller.ts          #   HTTP layer: parse request, call service, shape response
      service.ts              #   orchestrates: check DB → fetch from CBC → parse → persist
      parser.ts                #   raw CBC dataset -> typed rows
      ingest.ts (optional)      #   DB upsert logic, if it's more than a one-liner in service.ts
      types.ts                  #   domain-specific types
prisma/
  schema.prisma          # no models yet — see the comment block in the file for how to add one
```

## Adding a new domain

1. Pick an item from [CBC-ITEM-CODES.md](./CBC-ITEM-CODES.md).
2. Call `fetchCbcItem(itemCode)` from `src/shared/cbcClient.ts` against the
   real endpoint and inspect the real `header`/`dataset`/`structure` shape —
   don't guess the schema from the item name alone.
3. Add a `src/domains/<domain>/` folder following the layout above.
4. Add a Prisma model in `prisma/schema.prisma` (field naming / `@map`
   conventions should match oingg-mops-ts's schema) and run
   `pnpm prisma migrate dev --name <description>`.
5. Wire the domain's router into `src/routes.ts`.

## Setup

```
pnpm install
cp .env.example .env   # fill in DATABASE_URL / DIRECT_URL
pnpm dev                # tsx watch src/index.ts
```

`pnpm dev` starts the API on `PORT` (default 8084) — part of the ecosystem's
shared port allocation maintained in oingg-conductor-ts's
[`docs/conventions.md`](../oingg-conductor-ts/docs/conventions.md), so it
doesn't collide with the other services when running side by side. Swagger
docs are served at `/api-docs`.
