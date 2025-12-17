# AI_Sandbox Action Resolver

This project is a lightweight TypeScript web API that exposes action-resolution primitives for a game's NPC and player checks.

Endpoints:
- `GET /health` — health check
- `POST /check` — run hybrid d20-style check (body: `{ seed?, skill, modifiers?, DC }`)
- `POST /logistic` — return logistic probability (body: `{ skill, modifiers?, DC, k? }`)
- `POST /opposed` — opposed check (body: `{ seed?, attSkill, attMods?, defSkill, defMods? }`)

Build & run locally:
```bash
npm install
npm run build
npm start
```

Dev mode:
```bash
npm install
npm run dev
```

Docker:
```bash
docker build -t ai-sandbox-action-resolver .
docker run -p 3000:3000 ai-sandbox-action-resolver
```

Use the endpoints to test checks from your game server or tools.

Publishing images from CI
-------------------------

The repo includes a CI workflow that can publish container images to GitHub Container Registry (GHCR) on pushes to `master`.

- The workflow will publish to `ghcr.io/<owner>/ai-sandbox-action-resolver:latest` using the repository's `GITHUB_TOKEN` (ensure repo permissions allow `packages: write`).
- Optionally, you can publish to Docker Hub by adding the repository secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (a Docker Hub access token). When present the CI will also push to `DOCKERHUB_USERNAME/ai-sandbox-action-resolver:latest`.

To enable Docker Hub publishing:

1. Create a Docker Hub access token (Account Settings → Security → New Access Token).
2. In GitHub, go to Settings → Secrets → Actions and add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

Notes:
- If your organization restricts the default `GITHUB_TOKEN` permissions, give the workflow `packages: write` permission or supply a PAT with `write:packages` as a secret and update the workflow to use it.
- CI is configured with caching to speed repeated builds; see `.github/workflows/ci.yml` for details.

Authentication and roles
------------------------

This API is protected with JWT authentication (all endpoints except `GET /health` require a valid token). Tokens contain a `role` claim which the server uses for authorization:

- `player`: can call `POST /check`, `POST /logistic`, and `POST /opposed`.
- `admin`: can call any endpoint including `POST /simulate` (admin acts as a superuser).

Local token issuance (development only)
--------------------------------------

For local testing you can enable a simple token-issuing endpoint by starting the server with:

```bash
ALLOW_TOKEN_ISSUE=true JWT_SECRET=your-secret npm run dev
```

Then request a token:

```bash
curl -sS -X POST http://localhost:3000/auth/token \
	-H 'Content-Type: application/json' \
	-d '{"sub":"tester","role":"player"}' | jq -r .token
```

Use the returned token in subsequent requests:

```bash
curl -X POST http://localhost:3000/check \
	-H "Authorization: Bearer <TOKEN>" \
	-H 'Content-Type: application/json' \
	-d '{"skill":6,"modifiers":1,"DC":15}'
```

Example: simulate (admin only)
```bash
# request admin token
curl -sS -X POST http://localhost:3000/auth/token -H 'Content-Type: application/json' -d '{"sub":"admin","role":"admin"}' | jq -r .token

# run simulation (requires admin token)
curl -X POST http://localhost:3000/simulate \
	-H "Authorization: Bearer <ADMIN_TOKEN>" \
	-H 'Content-Type: application/json' \
	-d '{"algorithm":"hybrid","iterations":10000,"skill":6,"modifiers":1,"DC":15}'
```

Security notes: do not enable `ALLOW_TOKEN_ISSUE` in production. Use an identity provider or other secure mechanism to issue tokens for production deployments.

API Endpoints
-------------

All endpoints (except `GET /health`) require a bearer JWT in the `Authorization` header: `Authorization: Bearer <token>`.

- `GET /health`
	- Public health check. Returns `{ "status": "ok" }`.

- `POST /auth/token` (development optional)
	- Only available when `ALLOW_TOKEN_ISSUE=true` (dev only). Body: `{ "sub": "user-id", "role": "player|admin", "expiresIn": "1h" }`
	- Response: `{ "token": "<jwt>" }`.

- `POST /check` (role: `player` or `admin`)
	- Hybrid d20-style check. Body: `{ "seed"?: number, "skill": number, "modifiers"?: number, "DC": number }`
	- Response: `{ "success": boolean, "roll": number, "total": number, "margin": number, "critical": boolean, "fumble": boolean }`

- `POST /logistic` (role: `player` or `admin`)
	- Returns logistic success probability without sampling. Body: `{ "skill": number, "modifiers"?: number, "DC": number, "k"?: number }`
	- Response: `{ "p": number, "diff": number }` where `p` is probability in [0,1].

- `POST /opposed` (role: `player` or `admin`)
	- Opposed roll between attacker and defender. Body: `{ "seed"?: number, "attSkill": number, "attMods"?: number, "defSkill": number, "defMods"?: number }`
	- Response: `{ "attackerWins": boolean, "margin": number, "attacker": { ... }, "defender": { ... } }` (attacker/defender include their roll/total/margin/critical/fumble fields).

- `POST /simulate` (role: `admin` only)
	- Run a Monte Carlo simulation (server caps iterations to prevent abuse). Body example:
		`{ "algorithm": "hybrid", "iterations": 10000, "seed": 42, "skill": 6, "modifiers": 1, "DC": 15 }`
	- Response (hybrid example):
		`{ "iterations": 10000, "successes": 6474, "successRate": 0.6474, "avgMargin": 2.4748, "crits": 515, "fumbles": 484 }`

Notes
- Role `admin` is treated as superuser and can call player endpoints and simulation.
- The `seed` field is optional and allows deterministic runs for reproducibility.
- Keep simulation `iterations` moderate when calling the API — the server caps it at 200000.


Publishing to AWS ECR
---------------------

The CI workflow can also push images to Amazon ECR when the following repository secrets are set:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`
- (optional) `AWS_REGION` — defaults to `us-east-1` if not provided

When these secrets are present and a commit is pushed to `master`, the workflow will ensure the ECR repository `ai-sandbox-action-resolver` exists and push the image to:

```
<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/ai-sandbox-action-resolver:latest
```

To create the required secrets:

1. Create an IAM user with programmatic access and `AmazonEC2ContainerRegistryFullAccess` (or a scoped policy allowing `ecr:CreateRepository`, `ecr:DescribeRepositories`, and `ecr:PutImage`) and capture the access key ID and secret access key.
2. In GitHub, go to Settings → Secrets → Actions and add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`, and optionally `AWS_REGION`.

Security note: prefer scoped IAM permissions and rotate credentials regularly. Alternatively use OIDC federation for short-lived credentials in GitHub Actions (advanced setup).

# AI_Sandbox