# ===== deps =====
FROM node:18-bullseye-slim AS deps
WORKDIR /work

# Copiamos SOLO los manifests de ia-frontend para cachear bien
COPY ia-frontend/package.json ia-frontend/package-lock.json* ./ia-frontend/
WORKDIR /work/ia-frontend

RUN rm -f package-lock.json && npm install --include=optional

# ===== build =====
FROM node:18-bullseye-slim AS build
WORKDIR /work

COPY --from=deps /work/ia-frontend/node_modules ./ia-frontend/node_modules

# Copiamos el código de ia-frontend (no todo el repo)
COPY ia-frontend ./ia-frontend

WORKDIR /work/ia-frontend

# Si quieres inyectar envs en build, usa ARGs (Railway Variables no llegan a Vite en runtime)
# ARG VITE_API_URL
# ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ===== runner =====
FROM nginx:alpine AS runner
# Railway te inyecta PORT; si no existe, default 8080
ENV PORT=8080

# Copiamos el dist REAL del build
COPY --from=build /work/ia-frontend/dist /usr/share/nginx/html

# Plantilla de nginx con envsubst
COPY ia-frontend/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
