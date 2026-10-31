# ==========================================
# ETAPA 1: Build do Frontend React (Vite)
# ==========================================
FROM node:22-alpine AS build-frontend
WORKDIR /app/frontend

COPY rifas-web/package*.json ./
RUN npm install

COPY rifas-web/ ./
RUN npm run build

# ==========================================
# ETAPA 2: Build do Backend Java (Maven)
# ==========================================
FROM maven:3.9-eclipse-temurin-17 AS build-backend
WORKDIR /app/backend

COPY rifas-api/pom.xml ./
RUN mvn dependency:go-offline -B

COPY rifas-api/src ./src

# Injeta os arquivos estáticos compilados do React no Spring Boot
COPY --from=build-frontend /app/frontend/dist ./src/main/resources/static/

RUN mvn clean package -DskipTests

# ==========================================
# ETAPA 3: Imagem Final de Execução
# ==========================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

COPY --from=build-backend /app/backend/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]

