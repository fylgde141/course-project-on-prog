FROM node:18

WORKDIR /app
COPY package.json .
RUN npm install --force
COPY . .
CMD ["npm", "run", "dev"]