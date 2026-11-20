package com.mev.recipeapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Provides "the current time" as a bean.
 *
 * <p>Code that asks a Clock for the time ({@code LocalDateTime.now(clock)}) instead of calling
 * {@code LocalDateTime.now()} can be tested with a fixed clock, so results that contain the time
 * (like PDF file names) become predictable in tests.
 */
@Configuration
public class ClockConfig {

    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
