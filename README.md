# RocketFin — Prototype pipeline async d'upload & scoring

Prototype backend réalisé en amont d'un entretien technique RocketFin, pour démontrer une
réponse concrète à trois besoins de la fiche de poste : pipeline de scoring asynchrone
(jobs/queues, idempotence, reprise sur erreur), API avec authentification par clé API, et
modèle de données PostgreSQL multi-organisation.

**Stack** : NestJS 12 (ESM), TypeORM + PostgreSQL, BullMQ + Redis, Bull Board.

## Mapping avec la fiche de poste

| Besoin RocketFin | Implémentation ici |
|---|---|
| Pipeline de scoring asynchrone (jobs/queues, idempotence, reprise sur erreur) | BullMQ + Redis. Idempotence via header `Idempotency-Key` + contrainte unique en base. Retry avec backoff exponentiel (3 tentatives). |
| API publique, authentification par clés d'API | `ApiKeyGuard` sur header `x-api-key` (clé hashée en SHA-256, jamais stockée en clair) |
| Modèle de données PostgreSQL, multi-organisation | TypeORM + migration explicite (pas de `synchronize`). Toutes les requêtes scopées par organisation via le guard. |

**Non implémenté dans ce prototype** (backend priorisé sur le temps disponible) :
- Front React (dashboards, upload drag & drop)
- Versioning REST explicite (`/api/v1`) — les routes sont en `/uploads` directement pour l'instant


## Lancer le projet

```bash
docker compose up -d          # Postgres + Redis
cp .env.example .env          # à adapter si besoin
pnpm install
pnpm migration:run
pnpm seed                     # crée une organisation + affiche une clé API brute (à conserver)
pnpm start:dev
```

Supervision des jobs : http://localhost:3000/admin/queues

## Tester le flux complet

```bash
API_KEY="<clé affichée par pnpm seed>"

# 1. Upload (idempotent via Idempotency-Key)
curl -X POST http://localhost:3000/uploads \
  -H "x-api-key: $API_KEY" \
  -H "Idempotency-Key: un-identifiant-unique" \
  -F "file=@bilan.pdf"

# 2. Polling du statut (pending → queued → processing → completed)
curl http://localhost:3000/uploads/<id> -H "x-api-key: $API_KEY"

# 3. Rejouer la même requête (même Idempotency-Key) → renvoie le même job,
#    même statut, sans recréer ni retraiter quoi que ce soit.
```

## Architecture

```
src/
├── organizations/entities/organization.entity.ts   # Client B2B (établissement de financement)
├── api-keys/entities/api-key.entity.ts              # Clé API hashée, liée à une organisation
├── uploads/
│   ├── entities/upload-job.entity.ts                # Le job d'upload/scoring, avec son statut
│   ├── uploads.controller.ts                        # POST /uploads, GET /uploads/:id
│   ├── uploads.service.ts                           # Logique idempotence + enqueue
│   └── uploads.module.ts
├── queue/
│   ├── scoring.processor.ts                         # Worker BullMQ : traite les jobs, gère le retry
│   ├── queue.module.ts
│   └── queue.constants.ts
├── common/
│   ├── guards/api-key.guard.ts                      # Authentification par clé API
│   └── decorators/current-organization.decorator.ts # Récupère l'organisation courante
├── config/typeorm.config.ts                         # Config runtime (app) + CLI (migrations) séparées
├── migrations/                                       # Migration explicite du schéma
└── app.module.ts

scripts/seed.ts   # Crée une organisation + une clé API de démo (hors app, script standalone)
```

## Points d'implémentation à assumer/discuter en entretien

- **Idempotence réelle vs blocage de doublon** : la première version bloquait juste les
  doublons (erreur 409). Corrigé pour renvoyer le job existant tel quel en cas de rejeu —
  c'est la vraie promesse de l'idempotence (même requête → même réponse, sans erreur).
- **Race condition sur l'idempotence** : le `findOne` avant insertion gère le cas normal ;
  la contrainte unique en base + un `catch` qui re-cherche le job gagnant gèrent le cas où
  deux requêtes quasi simultanées passeraient le check en même temps.
- **Runtime config vs CLI config séparées** : l'app ne charge jamais les fichiers de
  migration au démarrage (elle n'en a pas besoin) ; seuls le CLI et les scripts (seed) les
  chargent. Bug rencontré et corrigé en cours de route.
- **Stockage fichier** : disque local pour la démo. En prod → Scaleway Object Storage.
- **Fenêtre non-transactionnelle** : entre la création du `UploadJob` en base et son enqueue
  BullMQ, il n'y a pas de garantie atomique (deux écritures séparées). Un pattern outbox
  serait la vraie solution en prod — non implémenté ici par souci de temps, bon sujet à
  amener soi-même en entretien.
- **Auth simple** : clé API hashée SHA-256, une seule par organisation en pratique
  actuellement. Le modèle (`ApiKey` en relation `OneToMany` vers `Organization`) permet
  nativement plusieurs clés par organisation (rotation, séparation sandbox/prod) sans
  migration de schéma le jour où ça devient nécessaire.

## Stack de développement utilisée

- Docker Compose pour Postgres 16 + Redis 7 en local
- pnpm comme gestionnaire de paquets
- Bull Board pour la supervision visuelle des jobs (branché en quelques lignes via
  `@bull-board/nestjs`)
