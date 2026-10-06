FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts
RUN npx playwright install --with-deps chromium
COPY . .
RUN mkdir -p data && chown -R node:node /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4400 CODINGVIBES_ENABLE_BROWSER=true CODINGVIBES_RUNTIME=daytona CODINGVIBES_MEDIA_ROOT=/app/data/media
USER node
EXPOSE 4400
VOLUME ["/app/data"]
CMD ["node","src/server.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:4400/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
