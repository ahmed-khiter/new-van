FROM node:21-alpine

RUN addgroup -g 111 appuser && \
    adduser -D -u 111 -G appuser appuser

WORKDIR /app

COPY . .

# Install dependencies
RUN npm install  --legacy-peer-deps
RUN chmod -R 755 node_modules/.bin
RUN node node_modules/prisma/build/index.js generate

# Prepare writable directories for runtime logs
RUN mkdir -p /app/logs && chown -R appuser:appuser /app/logs

#RUN npm run build

USER appuser


# Start Next.js production server
CMD ["npm", "run", "live"]


