# first stage: build natively on the build host - the bundle is plain JS and
# all production deps are pure JS, so the output is architecture-independent.
# Building under qemu segfaults 32-bit node (armv7) since the bundle grew.
#
# Node stays on 22 until armv7 is dropped from the publish platform list:
# node:24 has no linux/arm/v7 image, so the runtime stage cannot resolve.
FROM --platform=$BUILDPLATFORM node:22 AS builder
WORKDIR /app

# copy package files first for better layer caching
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./

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
