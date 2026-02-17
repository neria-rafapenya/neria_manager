FROM node:22-bullseye-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN rm -f package-lock.json && npm install --include=optional

FROM node:22-bullseye-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN test -f dist/index.html || (echo "❌ dist/index.html NO existe" && ls -la dist && exit 1)

FROM nginx:alpine AS runner
ENV PORT=8080
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
