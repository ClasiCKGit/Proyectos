# frontend/Dockerfile

# ── Stage 1: builder (desarrollo con hot reload) ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .

ENV VITE_API_URL=http://localhost:3000/api
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--strictPort", "false"]

# ── Stage 2: build (para producción) ───────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .

# VITE_API_URL se pasa como build arg para que quede embebido en el bundle
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 3: runner (producción con nginx) ────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Custom nginx config para SPA (todas las rutas redirigen a index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
