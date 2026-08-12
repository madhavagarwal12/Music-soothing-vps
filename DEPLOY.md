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

   `GITHUB_TOKEN` is automatic — no need to add it; it's used to push to GHCR
   from CI. The VPS doesn't need any credentials to pull — see below.
3. Under **Settings → Actions → General → Workflow permissions**, make sure
   "Read and write permissions" is enabled so the `GITHUB_TOKEN` can push to GHCR.
4. Package visibility: GHCR packages default to **private** even when the
   repo is public, so the first push from CI creates a private package —
   after that first push, go to the package's own Settings (from your
   GitHub profile → Packages → music-soothing-vps → Package settings) and
   change visibility to **public**. Once public, the VPS can `docker compose
   pull` with no login/credentials at all (verified — anonymous `docker
   pull ghcr.io/madhavagarwal12/music-soothing-vps:latest` works).

## 2. One-time VPS setup

```bash
mkdir -p /opt/auraflow && cd /opt/auraflow
# Only docker-compose.prod.yml is needed here — the VPS never builds the app.
curl -O https://raw.githubusercontent.com/madhavagarwal12/Music-soothing-vps/main/docker-compose.prod.yml
cat > .env <<'EOF'
IMAGE=ghcr.io/madhavagarwal12/music-soothing-vps:latest
EOF
docker compose -f docker-compose.prod.yml up -d
```

No `docker login` needed — the package is public.

### Reverse proxy (Traefik)

This VPS already runs Traefik (`root-traefik-1`) fronting other apps
(`helios`, `n8n`) via Host-header routing on the shared `app-network`
Docker network — `docker-compose.prod.yml` joins that same network and
carries the matching labels, so `auraflow` publishes **no host port at
all**; Traefik reaches it directly over `app-network` on its internal
port 8080, exactly like `helios` reaches its container on port 3000.

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=app-network"
  - "traefik.http.routers.auraflow.rule=Host(`music.autopilot-studio.com`)"
  - "traefik.http.routers.auraflow.entrypoints=web,websecure"
  - "traefik.http.routers.auraflow.tls=true"
  - "traefik.http.routers.auraflow.tls.certresolver=mytlschallenge"
  - "traefik.http.services.auraflow.loadbalancer.server.port=8080"
```

### DNS (Hostinger)

Add an **A record** in Hostinger's hPanel → Domains → `autopilot-studio.com`
→ DNS / Nameservers:

| Type | Name | Points to | TTL |
|---|---|---|---|
| A | `music` | `69.62.79.214` | 300 (or default) |

That's the same IP `test.autopilot-studio.com` already resolves to — this
just adds a second A record for the `music` subdomain pointing at the
same VPS. Once it propagates (usually a few minutes, sometimes longer),
Traefik's `mytlschallenge` resolver will issue a Let's Encrypt cert for
`music.autopilot-studio.com` automatically on first request.

## 3. Normal deploy flow

Merge to `main` → GitHub Actions runs `ci.yml` (lint, build, Docker build
check) → on success, builds and pushes `ghcr.io/madhavagarwal12/music-soothing-vps:latest`
and `:sha-<commit>` → SSHes into the VPS, `docker compose pull && up -d`, then
hits `/health`.

## 4. Rollback

Every image is tagged with both `latest` and the full commit SHA, so the
previous build is never overwritten. To roll back:

```bash
ssh <user>@<vps>
cd /opt/auraflow
docker compose -f docker-compose.prod.yml pull  # or manually:
IMAGE=ghcr.io/madhavagarwal12/music-soothing-vps:sha-<previous-commit> docker compose -f docker-compose.prod.yml up -d
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
