FROM node:18-bullseye-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN rm -f package-lock.json && npm install --include=optional

FROM node:18-bullseye-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- CHECKS (si no hay dist/index.html, el build falla y lo verás en Railway) ---
RUN ls -la
RUN ls -la dist || (echo "❌ dist/ NO existe. Revisa el output de Vite (build.outDir)" && exit 1)
RUN test -f dist/index.html || (echo "❌ dist/index.html NO existe" && exit 1)
# ------------------------------------------------------------------------------

FROM nginx:alpine AS runner
ENV PORT=8080

# Limpia el HTML por defecto de nginx para evitar el welcome
RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
