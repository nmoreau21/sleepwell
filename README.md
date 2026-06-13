# Sleepwell

Nonprofit resource coordination network — connecting furniture donors, recipients, volunteers, and community partners.

## Documentation

Planning and architecture live in [`docs/`](docs/):

- [Constitution](docs/constitution.md)
- [Technical Architecture](docs/technical-architecture.md)
- [Database Design](docs/database-design.md)
- [Workflows](docs/workflows.md)
- [User Types](docs/user-types.md)
- [Roadmap](docs/roadmap.md)

**MVP stabilization (pilot prep):**

- [Developer setup checklist](docs/developer-setup.md)
- [MVP test plan & route checklist](docs/mvp-test-plan.md)

## Stack (MVP)

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui-ready structure
- **Drizzle ORM** + PostgreSQL (Supabase)
- **Supabase** Auth + Storage (configured in later steps)
- **Vercel** hosting (target)

## Getting Started

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and Supabase keys from your Supabase project

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Database health (requires `DATABASE_URL`): [http://localhost:3000/api/health/db](http://localhost:3000/api/health/db)

## Database

```bash
npm run db:migrate    # apply migrations (requires DATABASE_URL)
npm run db:generate   # generate new migrations from schema changes
npm run db:studio     # Drizzle Studio
```

MVP schema: 15 tables — see `db/schema/` and `db/migrations/`.

### Admin sign-in (Step 3)

1. Run migrations including `0008_users_auth_id`
2. Supabase Auth: enable Email + Magic Link
3. Set redirect URL `http://localhost:3000/auth/callback` in Supabase dashboard
4. Provision coordinator: edit and run `scripts/provision-admin.sql`
5. Visit `/login` then `/admin`

## shadcn/ui

```bash
npx shadcn@latest add button
```

Configuration: `components.json`

## Build Status

| Step | Status |
|------|--------|
| 1. Project setup | Done |
| 2. Database connection | Done |
| 3. Auth / admin | Done |
| 4. Donor intake form | Done |
| 5. Partner referral form | Done |
| 6. Admin dashboard queues | Done |
| 7. Connection dashboard / matching prep | Done |
| 8. Manual match creation | Done |
| 9. Transfer scheduling | Done |
| 10. Transfer completion | Done |
| 11. Communications sending | Done |
| 12. Impact records / reporting | Done |
| 13. MVP stabilization / pilot prep | Done |

See [docs/technical-architecture.md](docs/technical-architecture.md) § MVP Build Sequence. Before pilot: complete [docs/mvp-test-plan.md](docs/mvp-test-plan.md).
