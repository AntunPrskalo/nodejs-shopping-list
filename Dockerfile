FROM node:12.10

RUN mkdir -p /usr/app
WORKDIR /usr/app
COPY package.json tsconfig.json tslint.json src wait.sh ./
RUN chmod +x ./wait.sh
RUN npm install

RUN ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
RUN openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub

EXPOSE 8000
CMD ./wait.sh && npm start