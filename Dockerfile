FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --ignore-scripts
RUN npx playwright install --with-deps chromium
COPY . .
RUN mkdir -p data && chown -R node:node /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4400 CODINGVIBES_ENABLE_BROWSER=true CODINGVIBES_RUNTIME=daytona
USER node
EXPOSE 4400
CMD ["node","src/server.js"]
