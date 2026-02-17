# ========= deps =========
FROM node:22-bookworm-slim AS deps
WORKDIR /work/ia-frontend

# Copiamos solo manifests para cachear dependencias
COPY ia-frontend/package.json ia-frontend/package-lock.json* ./

# Si no quieres lockfile, OK. Si lo tienes, mejor NO borrarlo.
RUN npm ci || (rm -f package-lock.json && npm install)

# ========= build (SPA por defecto) =========
FROM node:22-bookworm-slim AS build
WORKDIR /work/ia-frontend

ARG BUILD_MODE=spa
ENV BUILD_MODE=$BUILD_MODE

COPY --from=deps /work/ia-frontend/node_modules ./node_modules
COPY ia-frontend/ ./

# SPA: npm run build  -> dist/index.html
# WIDGET: npm run build:widget -> dist/index.js
RUN if [ "$BUILD_MODE" = "widget" ]; then npm run build:widget; else npm run build; fi

# sanity check
RUN test -f dist/index.html || (echo "⚠️ No dist/index.html (quizá widget). Contenido dist:" && ls -la dist)

# ========= runner =========
FROM nginx:alpine AS runner

# Railway te inyecta PORT. Nginx official template lo sustituye.
ENV PORT=8080

# Copiamos build SPA a Nginx
COPY --from=build /work/ia-frontend/dist /usr/share/nginx/html

# Plantilla de config para SPA (fallback a index.html)
COPY ia-frontend/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
