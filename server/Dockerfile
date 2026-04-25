# ============================================
# ClearCorex backend — production Docker image
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install only production deps
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy backend source
COPY server.js ./
COPY test-email.js ./

# Frontend lives at the project root (one level up). docker-compose
# bind-mounts it. The /downloads volume is also bind-mounted so installers
# can be swapped without rebuilding the image.
RUN mkdir -p data downloads

# Drop privileges
USER node

EXPOSE 3000
CMD ["node", "server.js"]
