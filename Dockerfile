FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY . .

RUN mkdir -p images

ENV PORT=8765
EXPOSE 8765

# Збережіть контент між перезапусками (див. docker-compose)
VOLUME ["/app/data", "/app/images"]

CMD ["node", "server.js"]
