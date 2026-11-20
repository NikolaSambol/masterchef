FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
# Copy the pom first so dependencies are cached as their own layer
# and only re-downloaded when pom.xml changes.
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q clean package -DskipTests

# The runtime only needs a JRE, not a full JDK (smaller image, smaller attack surface).
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 spring
COPY --from=build /app/target/*.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
