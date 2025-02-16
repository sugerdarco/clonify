FROM ubuntu:latest

RUN apt-get update
RUN apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install nodejs -y

WORKDIR /home/app
COPY main.sh main.sh
COPY index.js index.js
COPY package*.json .

RUN npm install
RUN chmod +x main.sh
RUN chmod +x index.js

ENTRYPOINT ["/home/app/main.sh"]