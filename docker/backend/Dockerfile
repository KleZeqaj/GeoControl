FROM node:latest

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install

COPY . .

COPY prep.sh /prep.sh
RUN chmod +x /prep.sh

EXPOSE 5000

CMD ["sh", "./prep.sh"]