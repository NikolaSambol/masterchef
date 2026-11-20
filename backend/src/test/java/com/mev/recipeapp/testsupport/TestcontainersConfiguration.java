package com.mev.recipeapp.testsupport;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Starts a real MySQL database in Docker for integration tests.
 *
 * <p>How it works:
 * <ul>
 *   <li>Testcontainers downloads (once) and starts the {@code mysql:8.0} Docker image on a random free port.</li>
 *   <li>{@code @ServiceConnection} tells Spring Boot to point {@code spring.datasource.*} at that container,
 *       so no URL, user or password has to be configured anywhere.</li>
 *   <li>The container is a Spring bean, so it starts with the test's application context and stops with it.
 *       Spring caches contexts between test classes, so several test classes share one database.</li>
 * </ul>
 *
 * <p>Use it with {@code @Import(TestcontainersConfiguration.class)}. Docker must be running.
 *
 * <p>Why not an in-memory database like H2? The entities use MySQL-specific column types (LONGBLOB) and the
 * schema relies on MySQL behaviour (column defaults, unique index on VARCHAR). Testing against the same database
 * as production catches problems H2 would hide.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    MySQLContainer<?> mysqlContainer() {
        return new MySQLContainer<>(DockerImageName.parse("mysql:8.0"));
    }
}
