package com.mev.recipeapp.controllers;

import com.mev.recipeapp.dtos.CategoryDTO;
import com.mev.recipeapp.dtos.ComponentDTO;
import com.mev.recipeapp.dtos.RecipeDTO;
import com.mev.recipeapp.dtos.UserDTO;
import com.mev.recipeapp.dtos.requests.CreateRecipeRequest;
import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.CustomUserDetails;
import com.mev.recipeapp.models.Recipe;
import com.mev.recipeapp.repository.ComponentRepository;
import com.mev.recipeapp.repository.RecipeRepository;
import com.mev.recipeapp.repository.UserRepository;
import com.mev.recipeapp.security.CustomUserDetailsService;
import com.mev.recipeapp.service.RecipeService;
import com.mev.recipeapp.testsupport.WebLayerTestConfig;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static com.mev.recipeapp.testsupport.TestData.principal;
import static com.mev.recipeapp.testsupport.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(RecipeController.class)
@Import(WebLayerTestConfig.class)
class RecipeControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean private RecipeService recipeService;
    @MockitoBean private UserRepository userRepository;
    // Needed by the imported security beans (see WebLayerTestConfig):
    @MockitoBean private CustomUserDetailsService userDetailsService;
    @MockitoBean private RecipeRepository recipeRepository;
    @MockitoBean private ComponentRepository componentRepository;

    private final CustomUserDetails ana = principal(user(1L, "ana@test.hr", AppRole.ROLE_USER));

    @Test
    void recipeDetailsArePublicAndReturnedAsJson() throws Exception {
        when(recipeService.getRecipeWithDetails(10L)).thenReturn(new RecipeDTO(
                10L, "Kolač", "2025-06-01", "aW1n", null, "45 min",
                List.of(new ComponentDTO(1L, "Tijesto", null, "brašno, jaja", "Umijesiti.")),
                new CategoryDTO("Slastice"),
                new UserDTO("Ana", "Anić", "ana@test.hr")));

        // No .with(user(...)) here: the endpoint must work without logging in.
        mvc.perform(get("/recipes/public/10"))
                .andExpect(status().isOk())
                // jsonPath checks individual fields of the JSON response ($ = the root object).
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.recipeName").value("Kolač"))
                .andExpect(jsonPath("$.creationDate").value("2025-06-01"))
                .andExpect(jsonPath("$.category.categoryName").value("Slastice"))
                .andExpect(jsonPath("$.user.email").value("ana@test.hr"))
                .andExpect(jsonPath("$.components", hasSize(1)))
                .andExpect(jsonPath("$.components[0].ingredients").value("brašno, jaja"));
    }

    @Test
    void unknownRecipeGives400() throws Exception {
        when(recipeService.getRecipeWithDetails(404L)).thenThrow(new IllegalArgumentException("Recipe not found"));

        mvc.perform(get("/recipes/public/404"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Recipe not found")));
    }

    @Test
    void recipeListPassesFiltersAndPagingToTheService() throws Exception {
        when(recipeService.getAllRecipes(eq(5L), eq("kolač"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(2, 6), 13));

        mvc.perform(get("/recipes/public")
                        .param("categoryId", "5")
                        .param("recipeName", "kolač")
                        .param("page", "2")
                        .param("size", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(13))
                .andExpect(jsonPath("$.totalPages").value(3));

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(recipeService).getAllRecipes(eq(5L), eq("kolač"), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isEqualTo(2);
        assertThat(pageable.getValue().getPageSize()).isEqualTo(6);
    }

    @Test
    void creatingARecipeRequiresLogin() throws Exception {
        mvc.perform(multipart("/recipes").param("name", "Kolač"))
                .andExpect(status().isUnauthorized());

        verify(recipeService, never()).createRecipe(any(), anyString());
    }

    @Test
    void creatingARecipeUsesTheLoggedInUserAsAuthorAndReturnsTheNewId() throws Exception {
        Recipe created = new Recipe();
        created.setId(42L);
        when(recipeService.createRecipe(any(CreateRecipeRequest.class), eq("ana@test.hr"))).thenReturn(created);

        // multipart() builds a multipart/form-data request, like the frontend's FormData.
        mvc.perform(multipart("/recipes")
                        .file(new MockMultipartFile("image", "cake.png", "image/png", new byte[]{1, 2}))
                        .param("name", "Kolač")
                        .param("preparationTime", "45 min")
                        .param("category", "5")
                        .with(user(ana)))
                .andExpect(status().isOk())
                .andExpect(content().string("42"));

        // Check that the form fields were bound to CreateRecipeRequest correctly.
        ArgumentCaptor<CreateRecipeRequest> request = ArgumentCaptor.forClass(CreateRecipeRequest.class);
        verify(recipeService).createRecipe(request.capture(), eq("ana@test.hr"));
        assertThat(request.getValue().getName()).isEqualTo("Kolač");
        assertThat(request.getValue().getPreparationTime()).isEqualTo("45 min");
        assertThat(request.getValue().getCategory()).isEqualTo(5L);
        assertThat(request.getValue().getImage().getBytes()).containsExactly(1, 2);
    }

    @Test
    void myRecipesUsesTheLoggedInUser() throws Exception {
        when(userRepository.findByEmailWithRole("ana@test.hr")).thenReturn(user(1L, "ana@test.hr", AppRole.ROLE_USER));
        when(recipeService.getRecipesByUserId(1L)).thenReturn(List.of());

        mvc.perform(get("/recipes/user").with(user(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(recipeService).getRecipesByUserId(1L);
    }

    @Test
    void recipesOfAUserWithoutRecipesGive404() throws Exception {
        when(recipeService.getRecipeSummaryByUserId(7L)).thenReturn(List.of());

        mvc.perform(get("/recipes/7").with(user(ana)))
                .andExpect(status().isNotFound());
    }
}
