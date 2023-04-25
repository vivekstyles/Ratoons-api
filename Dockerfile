FROM 027502230729.dkr.ecr.us-east-1.amazonaws.com/ssk-node-base:latest

COPY package*.json ./

RUN npm install

RUN npm i libnpx

RUN npm i -g nodemon

COPY . .

CMD npm run prod
