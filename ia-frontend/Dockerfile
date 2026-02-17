# ========= deps =========
FROM node:22-bookworm-slim AS deps
WORKDIR /work/ia-frontend

COPY ia-frontend/package.json ia-frontend/package-lock.json* ./
RUN npm ci || (rm -f package-lock.json && npm install)

# ========= build =========
FROM node:22-bookworm-slim AS build
WORKDIR /work/ia-frontend

ARG BUILD_MODE=spa
ENV BUILD_MODE=$BUILD_MODE

COPY --from=deps /work/ia-frontend/node_modules ./node_modules
COPY ia-frontend/ ./

RUN if [ "$BUILD_MODE" = "widget" ]; then npm run build:widget; else npm run build; fi

RUN test -f dist/index.html || (echo "❌ dist/index.html NO existe (¿se ha hecho build de widget?)" && ls -la dist && exit 1)

# ========= runner =========
FROM nginx:alpine AS runner
ENV PORT=8080

# Copiamos el dist
COPY --from=build /work/ia-frontend/dist /usr/share/nginx/html

# Creamos la plantilla de Nginx aquí mismo (sin depender del repo)
RUN mkdir -p /etc/nginx/templates && \
    cat > /etc/nginx/templates/default.conf.template <<'NGINX'
server {
  listen ${PORT} default_server;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
NGINX

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
