FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 8080

# Dev server. For production: RUN npm run build, then serve dist/
CMD ["npm", "run", "dev"]
