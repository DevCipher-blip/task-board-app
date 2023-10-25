FROM node:18

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .
RUN npm ci --ignore-scripts

COPY . .

CMD ["npm", "start"]
