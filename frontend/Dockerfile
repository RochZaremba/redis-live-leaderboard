FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
