# Dos etapas: una compila el frontend, la otra sólo lleva lo que hace falta
# para servirlo. La imagen final no arrastra Vite ni las dependencias de build.

FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Sólo las dependencias de producción: aquí dentro eso es el driver de Postgres.
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY servidor ./servidor
COPY src/data ./src/data
COPY src/lib/modelo.js ./src/lib/modelo.js

# No correr como root.
USER node

EXPOSE 3000
CMD ["node", "servidor/indice.js"]
