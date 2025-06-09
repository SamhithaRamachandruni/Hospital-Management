# First stage: generate lock file and install dependencies
FROM node:18-alpine AS deps

WORKDIR /app

# Copy only package.json files
COPY package*.json ./

# Generate package-lock.json (if missing) and install dependencies
RUN npm install --package-lock-only && \
    npm ci

# Second stage: build application
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency tree (including lock file and node_modules)
COPY --from=deps /app .

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Final stage: production image with nginx
FROM nginx:alpine

# Copy built app to nginx public directory
COPY --from=build /app/dist/healthcare-frontend /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
