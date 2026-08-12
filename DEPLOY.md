# Deploying AuraFlow

Static frontend, packaged as a Docker image (nginx serving the Vite build). CI builds
and pushes the image to GHCR on every merge to `main`, then SSHes into the VPS to pull
and restart it.

## 1. One-time GitHub setup

1. Push this repo to GitHub.
2. Under **Settings → Secrets and variables → Actions**, add:
   | Secret | Value |
   |---|---|
   | `VPS_HOST` | VPS IP or hostname |
   | `VPS_USER` | SSH user with docker permissions on the VPS |
   | `VPS_SSH_KEY` | Private key (PEM) for that user — generate a dedicated deploy key, don't reuse your personal one |
   | `VPS_PORT` | SSH port, only needed if not 22 |
   | `VPS_DEPLOY_PATH` | Absolute path on the VPS containing `docker-compose.prod.yml` (e.g. `/opt/auraflow`) |

   `GITHUB_TOKEN` is automatic — no need to add it; it's used both to push to
   GHCR and (via SSH) to let the VPS pull the (public or private) image.
3. Under **Settings → Actions → General → Workflow permissions**, make sure
   "Read and write permissions" is enabled so the `GITHUB_TOKEN` can push to GHCR.
4. Package visibility: by default GHCR images are private. Either make the
   package public (Settings on the package itself), or make sure the VPS
   `docker login ghcr.io` step in `deploy.yml` runs before every pull (it
   already does).

## 2. One-time VPS setup

```bash
mkdir -p /opt/auraflow && cd /opt/auraflow
# Only docker-compose.prod.yml is needed here — the VPS never builds the app.
curl -O https://raw.githubusercontent.com/OWNER/REPO/main/docker-compose.prod.yml
curl -o .env https://raw.githubusercontent.com/OWNER/REPO/main/.env.example
# edit .env: set IMAGE=ghcr.io/OWNER/REPO:latest and HOST_PORT if needed
docker compose -f docker-compose.prod.yml up -d
```

Replace `OWNER/REPO` with your actual GitHub path everywhere above, and in
`.env` / `docker-compose.prod.yml`'s default `IMAGE` value.

### Reverse proxy

`docker-compose.prod.yml` publishes the container on `HOST_PORT` (default
`8080`). Point your existing reverse proxy at it:

- **Traefik** (Docker-aware): uncomment the `networks:`/`labels:` block in
  `docker-compose.prod.yml`, join the same external network your Traefik
  instance uses, and drop the `ports:` block.
- **Nginx**: add a `location`/`proxy_pass http://127.0.0.1:8080;` server
  block (with your own TLS/domain config) on the host.
- **Caddy**: `your-domain.example { reverse_proxy 127.0.0.1:8080 }`.

## 3. Normal deploy flow

Merge to `main` → GitHub Actions runs `ci.yml` (lint, build, Docker build
check) → on success, builds and pushes `ghcr.io/OWNER/REPO:latest` and
`:sha-<commit>` → SSHes into the VPS, `docker compose pull && up -d`, then
hits `/health`.

## 4. Rollback

Every image is tagged with both `latest` and the full commit SHA, so the
previous build is never overwritten. To roll back:

```bash
ssh <user>@<vps>
cd /opt/auraflow
docker compose -f docker-compose.prod.yml pull  # or manually:
IMAGE=ghcr.io/OWNER/REPO:sha-<previous-commit> docker compose -f docker-compose.prod.yml up -d
```

Since this app has no database, rollback is just "redeploy the previous
image" — no migration/data concerns.

## 4b. Alternative: build directly from git (no GHCR)

If you'd rather not set up CI/registry secrets at all, `Dockerfile.git` +
`docker-compose.git.yml` clone this repo *inside* the Docker build, so the
VPS only needs those two files — no `git clone` of the full repo, no GHCR,
no GitHub Actions secrets:

```bash
mkdir -p /opt/auraflow && cd /opt/auraflow
curl -O https://raw.githubusercontent.com/madhavagarwal12/Music-soothing-vps/main/Dockerfile.git
curl -O https://raw.githubusercontent.com/madhavagarwal12/Music-soothing-vps/main/docker-compose.git.yml
docker compose -f docker-compose.git.yml up -d --build
```

To redeploy after new commits, rerun the same `up -d --build` — it re-clones
`main` and rebuilds from scratch. Simpler, but every deploy rebuilds on the
VPS itself (slower, uses VPS CPU) instead of pulling a prebuilt image built
once in CI. This only works because the repo is public — if you make it
private again, `Dockerfile.git` will need credential wiring (SSH agent
forwarding or a PAT passed as a BuildKit `--secret`) to clone.

## 5. Local verification

```bash
npm run lint
npm run build
docker build -t auraflow:local .
docker run --rm -p 8080:8080 auraflow:local
curl http://localhost:8080/health
```
