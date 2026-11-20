package com.mev.recipeapp.testsupport;

import com.mev.recipeapp.filters.AuthTokenFilter;
import com.mev.recipeapp.security.OwnershipService;
import com.mev.recipeapp.security.SecurityConfig;
import com.mev.recipeapp.security.jwt.AuthEntryPointJwt;
import com.mev.recipeapp.security.jwt.JwtUtil;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;

/**
 * Brings the REAL security setup into a {@code @WebMvcTest}.
 *
 * <p>{@code @WebMvcTest} only starts the web layer (controllers, filters, exception handlers). Our own
 * security classes are not picked up automatically, so this imports them. Without it the tests would run with
 * Spring's default security instead of ours, and wouldn't tell us whether OUR rules work.
 *
 * <p>The beans these classes need (CustomUserDetailsService, RecipeRepository, ComponentRepository) must be
 * provided as {@code @MockitoBean}s in each test class.
 */
@TestConfiguration
@Import({SecurityConfig.class, AuthTokenFilter.class, AuthEntryPointJwt.class, JwtUtil.class, OwnershipService.class})
public class WebLayerTestConfig {
}
