FROM sigoden/node:14-native
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm install --only=prod && rm -rf .npmrc

FROM sigoden/node:14-slim
WORKDIR /app
COPY --from=0 /app .
COPY . .
CMD ["node", "./dist/index.js"]