# 1. Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci installs exactly what package-lock.json says, so builds are reproducible.
RUN npm ci
COPY . .
RUN npm run build

# 2. Serve stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
