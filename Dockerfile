FROM node:18-slim

RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --os=linux --cpu=arm64 sharp
RUN npm install --os=linux --cpu=arm64
RUN npm install --include=optional sharp

COPY . .

EXPOSE 8080
CMD ["node", "index.js"]
