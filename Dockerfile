# ═══════════════════════════════════════════════════════════════
# ElectIQ — Multi-stage production Dockerfile
# Stage 1: Install production dependencies only
# Stage 2: Minimal runtime image running as non-root user
# Compatible with Google Cloud Run
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: dependency installation ──────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package manifests first — maximises Docker layer cache reuse
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production && npm cache clean --force

# ── Stage 2: lean production runtime ──────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Security: create and use a dedicated non-root user
RUN addgroup --system --gid 1001 electiq \
 && adduser  --system --uid 1001 --ingroup electiq electiq

# Copy production node_modules from deps stage
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy application source and frontend assets
COPY backend/ ./backend/
COPY public/  ./public/

# Transfer ownership to the non-root user
RUN chown -R electiq:electiq /app

USER electiq

# Cloud Run injects PORT automatically; default to 3001
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Health check — Cloud Run uses this to determine instance readiness
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

CMD ["node", "backend/src/server.js"]
