FROM registry.jiasuyunkeji.com/backend/docker-node:12-native
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm install --only=prod && rm -rf .npmrc

FROM registry.jiasuyunkeji.com/backend/docker-node:12-slim
WORKDIR /app
COPY --from=0 /app .
COPY . .
CMD ["node", "./dist/index.js"]