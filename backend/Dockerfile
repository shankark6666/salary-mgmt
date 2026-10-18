# syntax=docker/dockerfile:1.7
# ACME Salary API. Tests run in CI (they need Docker for Testcontainers), not in this build.

# ── build ────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
COPY salary-common salary-common
COPY salary-employee salary-employee
COPY salary-insights salary-insights
COPY salary-identity salary-identity
COPY salary-app salary-app
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q -DskipTests package \
 && java -Djarmode=tools -jar salary-app/target/salary-app-*.jar extract --layers --launcher --destination /layers

# ── runtime ──────────────────────────────────────────────────────────────────
# JRE only (no compiler, no Maven), non-root. Layers ordered from least to most frequently
# changed, so a code change re-ships only the small application layer.
FROM eclipse-temurin:21-jre-alpine
# Take Alpine security patches as soon as they ship, not when the base image is next rebuilt.
RUN apk upgrade --no-cache \
 && addgroup -S app && adduser -S -G app -H app
WORKDIR /app
COPY --from=build /layers/dependencies/ ./
COPY --from=build /layers/spring-boot-loader/ ./
COPY --from=build /layers/snapshot-dependencies/ ./
COPY --from=build /layers/application/ ./
USER app
EXPOSE 8080
# Size the heap from the container's memory limit; crash fast (and get restarted) on OOM.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError" \
    COOKIE_SECURE=true
HEALTHCHECK --interval=10s --timeout=3s --start-period=60s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health | grep -q '"UP"' || exit 1
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
