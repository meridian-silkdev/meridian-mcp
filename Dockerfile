FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS release
LABEL io.modelcontextprotocol.server.name="io.github.meridian-silkdev/meridian-mcp"
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules
ENTRYPOINT ["node", "dist/index.js"]
