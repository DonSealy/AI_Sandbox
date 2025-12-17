FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Install all deps (dev + prod) for build
COPY package.json package.json
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /usr/src/app

# Install only production deps
COPY package.json package.json
RUN npm install --production

# Copy compiled output
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000
CMD ["node","dist/index.js"]
