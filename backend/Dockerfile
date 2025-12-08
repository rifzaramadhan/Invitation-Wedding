FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# Use entrypoint to run migrations, then start the app
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
