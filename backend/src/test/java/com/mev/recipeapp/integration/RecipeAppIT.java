package com.mev.recipeapp.integration;

import com.jayway.jsonpath.JsonPath;
import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.Category;
import com.mev.recipeapp.models.User;
import com.mev.recipeapp.repository.CategoryRepository;
import com.mev.recipeapp.repository.RecipeRepository;
import com.mev.recipeapp.repository.RoleRepository;
import com.mev.recipeapp.repository.UserRepository;
import com.mev.recipeapp.testsupport.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("integration")
class RecipeAppIT {

    private static final AtomicInteger UNIQUE = new AtomicInteger();
    private static final byte[] IMAGE = {(byte) 0x89, 'P', 'N', 'G'};
    private static final byte[] VIDEO = {0, 0, 0, 32, 'f', 't', 'y', 'p'};

    @Autowired private MockMvc mvc;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private RecipeRepository recipeRepository;

    private long dessertsId;

    @BeforeEach
    void setUp() {
        dessertsId = categoryRepository.save(new Category("Slastice")).getId();
    }

    @Test
    @DisplayName("a user publishes a recipe with components, edits it, and the video survives the edit")
    void userPublishesAndEditsARecipe() throws Exception {
        String ana = signUpAndSignIn("ana");

        // 1. Create the recipe (step 1 in the frontend)
        long recipeId = createRecipe(ana, "Čokoladni kolač", VIDEO);

        // 2. Add components (step 2 in the frontend)
        mvc.perform(multipart("/components/{id}", recipeId)
                        .param("components[0][name]", "Tijesto")
                        .param("components[0][instructions]", "Umijesiti brašno i jaja.")
                        .param("components[0][ingredients][0]", "200 g brašna")
                        .param("components[0][ingredients][1]", "3 jaja")
                        .header("Authorization", ana))
                .andExpect(status().isOk());

        // 3. Anyone can read it
        mvc.perform(get("/recipes/public/{id}", recipeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipeName").value("Čokoladni kolač"))
                .andExpect(jsonPath("$.category.categoryName").value("Slastice"))
                .andExpect(jsonPath("$.creationDate").isNotEmpty())
                .andExpect(jsonPath("$.image").value(base64(IMAGE)))
                .andExpect(jsonPath("$.components", hasSize(1)))
                .andExpect(jsonPath("$.components[0].ingredients").value("200 g brašna, 3 jaja"));

        // 4. Rename it without touching the video
        mvc.perform(multipart("/recipes/update/{id}", recipeId)
                        .param("name", "Čokoladni kolač s đumbirom")
                        .header("Authorization", ana))
                .andExpect(status().isOk());

        mvc.perform(get("/recipes/public/{id}", recipeId))
                .andExpect(jsonPath("$.recipeName").value("Čokoladni kolač s đumbirom"))
                .andExpect(jsonPath("$.video").value(base64(VIDEO))) // regression test for the "video deleted" bug
                .andExpect(jsonPath("$.preparationTime").value("45 min"));

        // 5. It shows up in search and in "my recipes"
        mvc.perform(get("/recipes/public").param("recipeName", "đumbir"))
                .andExpect(jsonPath("$.content[*].id", org.hamcrest.Matchers.hasItem((int) recipeId)));
        mvc.perform(get("/recipes/user").header("Authorization", ana))
                .andExpect(jsonPath("$", hasSize(1)));

        // 6. Delete it
        mvc.perform(delete("/recipes/delete/{id}", recipeId).header("Authorization", ana))
                .andExpect(status().isOk());
        mvc.perform(get("/recipes/public/{id}", recipeId))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("another user can't edit, extend or delete someone else's recipe")
    void otherUsersCannotTouchSomeoneElsesRecipe() throws Exception {
        String ana = signUpAndSignIn("ana");
        String bruno = signUpAndSignIn("bruno");
        long recipeId = createRecipe(ana, "Anin kolač", null);

        mvc.perform(multipart("/recipes/update/{id}", recipeId).param("name", "Hakirano").header("Authorization", bruno))
                .andExpect(status().isForbidden());
        mvc.perform(multipart("/components/{id}", recipeId)
                        .param("components[0][name]", "Spam")
                        .param("components[0][instructions]", "Spam spam spam.")
                        .header("Authorization", bruno))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/recipes/delete/{id}", recipeId).header("Authorization", bruno))
                .andExpect(status().isForbidden());

        // Nothing changed in the database.
        mvc.perform(get("/recipes/public/{id}", recipeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipeName").value("Anin kolač"))
                .andExpect(jsonPath("$.components", hasSize(0)));
    }

    @Test
    void adminCanDeleteAnyRecipe() throws Exception {
        String ana = signUpAndSignIn("ana");
        String admin = signUpAndSignInAsAdmin();
        long recipeId = createRecipe(ana, "Neprimjeren recept", null);

        mvc.perform(delete("/recipes/delete/{id}", recipeId).header("Authorization", admin))
                .andExpect(status().isOk());

        assertThat(recipeRepository.findById(recipeId)).isEmpty();
    }

    @Test
    @DisplayName("a suspended user is locked out immediately, even with a token that hasn't expired")
    void suspendedUserIsLockedOutImmediately() throws Exception {
        String email = uniqueEmail("bruno");
        String bruno = signUpAndSignIn(email, "lozinka123");
        String admin = signUpAndSignInAsAdmin();
        long brunoId = userRepository.findByEmailWithRole(email).getId();

        mvc.perform(get("/auth/user").header("Authorization", bruno)).andExpect(status().isOk());

        mvc.perform(post("/admin/suspend-user/{id}", brunoId).header("Authorization", admin))
                .andExpect(status().isOk());

        // The same token no longer works...
        mvc.perform(get("/auth/user").header("Authorization", bruno)).andExpect(status().isUnauthorized());
        // ...and signing in again is refused.
        mvc.perform(post("/auth/public/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials(email, "lozinka123")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("deleting a category that recipes still use is refused, and the recipes survive")
    void categoryInUseCannotBeDeleted() throws Exception {
        String ana = signUpAndSignIn("ana");
        String admin = signUpAndSignInAsAdmin();
        long recipeId = createRecipe(ana, "Kolač", null);

        mvc.perform(delete("/categories/{id}", dessertsId).header("Authorization", admin))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/recipes/public/{id}", recipeId)).andExpect(status().isOk());
    }

    @Test
    void usersChangeTheirPasswordOnlyWithTheOldOne() throws Exception {
        String email = uniqueEmail("ana");
        String ana = signUpAndSignIn(email, "staraLozinka");
        long anaId = userRepository.findByEmailWithRole(email).getId();

        mvc.perform(post("/auth/change-password/{id}", anaId)
                        .header("Authorization", ana)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"oldPassword\": \"pogresna\", \"newPassword\": \"novaLozinka\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/auth/change-password/{id}", anaId)
                        .header("Authorization", ana)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"oldPassword\": \"staraLozinka\", \"newPassword\": \"novaLozinka\"}"))
                .andExpect(status().isOk());

        signIn(email, "novaLozinka"); // works
        mvc.perform(post("/auth/public/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials(email, "staraLozinka")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aRecipeCanBeExportedAsPdf() throws Exception {
        String ana = signUpAndSignIn("ana");
        long recipeId = createRecipe(ana, "Čokoladni kolač", null);

        byte[] pdf = mvc.perform(get("/pdf/public/{id}", recipeId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        startsWith("attachment; filename=\"Cokoladni_kolac_")))
                .andReturn().getResponse().getContentAsByteArray();

        // Every PDF file starts with "%PDF".
        assertThat(new String(pdf, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }


    private String uniqueEmail(String name) {
        return name + "-" + UNIQUE.incrementAndGet() + "@test.hr";
    }

    /** Registers a new user and returns the "Authorization" header value for them ("Bearer <jwt>"). */
    private String signUpAndSignIn(String name) throws Exception {
        return signUpAndSignIn(uniqueEmail(name), "lozinka123");
    }

    private String signUpAndSignIn(String email, String password) throws Exception {
        mvc.perform(post("/auth/public/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Test", "surname": "Korisnik", "email": "%s", "password": "%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk());
        return signIn(email, password);
    }

    private String signIn(String email, String password) throws Exception {
        String body = mvc.perform(post("/auth/public/signin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials(email, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + JsonPath.read(body, "$.jwtToken");
    }

    private String signUpAndSignInAsAdmin() throws Exception {
        String email = uniqueEmail("admin");
        String token = signUpAndSignIn(email, "lozinka123");
        User user = userRepository.findByEmailWithRole(email);
        user.setRole(roleRepository.findByRoleName(AppRole.ROLE_ADMIN).orElseThrow());
        userRepository.save(user);
        return token; // the role is read from the database on every request, so the same token now acts as admin
    }

    private long createRecipe(String authorization, String name, byte[] video) throws Exception {
        MockMultipartHttpServletRequestBuilder request = multipart("/recipes");
        request.file(new MockMultipartFile("image", "image.png", "image/png", IMAGE));
        if (video != null) {
            request.file(new MockMultipartFile("video", "video.mp4", "video/mp4", video));
        }
        String id = mvc.perform(request
                        .param("name", name)
                        .param("preparationTime", "45 min")
                        .param("category", String.valueOf(dessertsId))
                        .header("Authorization", authorization))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(id);
    }

    private static String credentials(String email, String password) {
        return "{\"email\": \"%s\", \"password\": \"%s\"}".formatted(email, password);
    }

    private static String base64(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes);
    }
}
