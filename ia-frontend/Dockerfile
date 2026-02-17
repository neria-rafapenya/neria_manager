FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || (rm -f package-lock.json && npm install)

FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG BUILD_MODE=spa
ENV BUILD_MODE=$BUILD_MODE
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN if [ "$BUILD_MODE" = "widget" ]; then npm run build:widget; else npm run build; fi
RUN test -f dist/index.html || (echo "⚠️ No dist/index.html (quizá widget). Contenido dist:" && ls -la dist)

FROM nginx:alpine AS runner
ENV PORT=8080
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
