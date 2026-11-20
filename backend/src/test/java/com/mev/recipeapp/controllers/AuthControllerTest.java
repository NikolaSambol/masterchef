package com.mev.recipeapp.controllers;

import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.Role;
import com.mev.recipeapp.models.User;
import com.mev.recipeapp.repository.ComponentRepository;
import com.mev.recipeapp.repository.RecipeRepository;
import com.mev.recipeapp.repository.RoleRepository;
import com.mev.recipeapp.repository.UserRepository;
import com.mev.recipeapp.security.CustomUserDetailsService;
import com.mev.recipeapp.security.jwt.JwtUtil;
import com.mev.recipeapp.testsupport.WebLayerTestConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static com.mev.recipeapp.testsupport.TestData.principal;
import static com.mev.recipeapp.testsupport.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(AuthController.class)
@Import(WebLayerTestConfig.class)
class AuthControllerTest {

    @Autowired private MockMvc mvc;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    @MockitoBean private UserRepository userRepository;
    @MockitoBean private RoleRepository roleRepository;
    @MockitoBean private CustomUserDetailsService userDetailsService;
    @MockitoBean private RecipeRepository recipeRepository;
    @MockitoBean private ComponentRepository componentRepository;

    @Nested
    class Signup {

        @BeforeEach
        void setUp() {
            when(roleRepository.findByRoleName(AppRole.ROLE_USER)).thenReturn(Optional.of(new Role(AppRole.ROLE_USER)));
        }

        @Test
        void newUserIsSavedWithAHashedPasswordAndTheUserRole() throws Exception {
            mvc.perform(post("/auth/public/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Ana", "surname": "Anić", "email": "ana@test.hr", "password": "lozinka123"}
                                    """))
                    .andExpect(status().isOk())
                    .andExpect(content().string("User registered successfully!"));

            ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
            verify(userRepository).save(saved.capture());
            User user = saved.getValue();
            assertThat(user.getEmail()).isEqualTo("ana@test.hr");
            assertThat(user.getRole().getRoleName()).isEqualTo(AppRole.ROLE_USER);
            assertThat(user.isEnabled()).isTrue();
            // The password must never be stored in plain text.
            assertThat(user.getPassword()).isNotEqualTo("lozinka123");
            assertThat(passwordEncoder.matches("lozinka123", user.getPassword())).isTrue();
        }

        @Test
        void existingEmailIsRejected() throws Exception {
            when(userRepository.existsByEmail("ana@test.hr")).thenReturn(true);

            mvc.perform(post("/auth/public/signup")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name": "Ana", "surname": "Anić", "email": "ana@test.hr", "password": "lozinka123"}
                                    """))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Email address already in use!"));

            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    class Signin {

        private User ana;

        @BeforeEach
        void setUp() {
            ana = user(1L, "ana@test.hr", AppRole.ROLE_USER);
            ana.setPassword(passwordEncoder.encode("lozinka123"));
        }

        @Test
        void correctPasswordReturnsAJwtForTheUser() throws Exception {
            when(userDetailsService.loadUserByUsername("ana@test.hr")).thenReturn(principal(ana));

            String body = mvc.perform(post("/auth/public/signin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\": \"ana@test.hr\", \"password\": \"lozinka123\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("ana@test.hr"))
                    .andReturn().getResponse().getContentAsString();

            // The returned token must be valid and belong to Ana.
            String token = com.jayway.jsonpath.JsonPath.read(body, "$.jwtToken");
            assertThat(jwtUtil.validateJwtToken(token)).isTrue();
            assertThat(jwtUtil.getUserNameFromJwtToken(token)).isEqualTo("ana@test.hr");
        }

        @Test
        void wrongPasswordIsRejected() throws Exception {
            when(userDetailsService.loadUserByUsername("ana@test.hr")).thenReturn(principal(ana));

            mvc.perform(post("/auth/public/signin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\": \"ana@test.hr\", \"password\": \"wrong\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Invalid username/password supplied!"));
        }

        @Test
        void unknownEmailIsRejected() throws Exception {
            when(userDetailsService.loadUserByUsername("nobody@test.hr"))
                    .thenThrow(new UsernameNotFoundException("not found"));

            mvc.perform(post("/auth/public/signin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\": \"nobody@test.hr\", \"password\": \"lozinka123\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void suspendedUserCannotSignInEvenWithTheRightPassword() throws Exception {
            ana.setEnabled(false);
            when(userDetailsService.loadUserByUsername("ana@test.hr")).thenReturn(principal(ana));

            mvc.perform(post("/auth/public/signin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\": \"ana@test.hr\", \"password\": \"lozinka123\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void currentUserEndpointReturnsTheLoggedInUser() throws Exception {
        User ana = user(1L, "ana@test.hr", AppRole.ROLE_USER);
        when(userRepository.findByEmailWithRole("ana@test.hr")).thenReturn(ana);

        mvc.perform(get("/auth/user").with(user(principal(ana))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("ana@test.hr"))
                .andExpect(jsonPath("$.role[0]").value("ROLE_USER"))
                .andExpect(jsonPath("$.enabled").value(true));
    }

    @Test
    void currentUserEndpointRequiresLogin() throws Exception {
        mvc.perform(get("/auth/user"))
                .andExpect(status().isUnauthorized())
                // AuthEntryPointJwt answers with a JSON error body.
                .andExpect(jsonPath("$.message").exists());
    }
}
