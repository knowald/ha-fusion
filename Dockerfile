# first stage, can't use alpine for building armv7
FROM node:22 AS builder
WORKDIR /app

# copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* ./

# install pnpm and dependencies
RUN npm install -g pnpm && \
  pnpm install

# copy source files
COPY . .

# build and prune dev dependencies
RUN pnpm run build && \
  pnpm prune --prod

# second stage
FROM node:22-alpine
WORKDIR /app

# copy files to /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server.js .
COPY --from=builder /app/package.json .

# set environment
ENV PORT=5050 \
  NODE_ENV=production \
  ADDON=false

EXPOSE 5050
CMD ["node", "server.js"]
