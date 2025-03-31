FROM node:18-slim

# Install keyring first to fix invalid signature errors
RUN apt-get update && apt-get install -y --no-install-recommends \
    debian-archive-keyring && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install required packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    python3 \
    make \
    g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --os=linux --cpu=arm64 sharp
RUN npm install --os=linux --cpu=arm64
RUN npm install --include=optional sharp

COPY . .

EXPOSE 8080
CMD ["node", "index.js"]
