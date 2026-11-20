package com.mev.recipeapp.controllers;

import com.mev.recipeapp.dtos.CategoryDTO;
import com.mev.recipeapp.dtos.response.UserInfoResponse;
import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.CustomUserDetails;
import com.mev.recipeapp.repository.ComponentRepository;
import com.mev.recipeapp.repository.RecipeRepository;
import com.mev.recipeapp.security.CustomUserDetailsService;
import com.mev.recipeapp.service.CategoryService;
import com.mev.recipeapp.service.UserService;
import com.mev.recipeapp.testsupport.WebLayerTestConfig;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static com.mev.recipeapp.testsupport.TestData.principal;
import static com.mev.recipeapp.testsupport.TestData.user;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest({CategoryController.class, AdminController.class})
@Import(WebLayerTestConfig.class)
class AdminAndCategoryControllerTest {

    @Autowired private MockMvc mvc;

    @MockitoBean private CategoryService categoryService;
    @MockitoBean private UserService userService;
    @MockitoBean private CustomUserDetailsService userDetailsService;
    @MockitoBean private RecipeRepository recipeRepository;
    @MockitoBean private ComponentRepository componentRepository;

    private final CustomUserDetails normalUser = principal(user(1L, "ana@test.hr", AppRole.ROLE_USER));
    private final CustomUserDetails admin = principal(user(9L, "admin@test.hr", AppRole.ROLE_ADMIN));

    @Nested
    class Categories {

        @Test
        void anyoneCanListCategories() throws Exception {
            when(categoryService.getAllCategories()).thenReturn(List.of(new CategoryDTO(1L, "Slastice")));

            mvc.perform(get("/categories/public"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].categoryName").value("Slastice"));
        }

        @Test
        void anonymousVisitorCannotCreateCategories() throws Exception {
            mvc.perform(post("/categories").contentType(MediaType.APPLICATION_JSON).content("{\"categoryName\":\"Juhe\"}"))
                    .andExpect(status().isUnauthorized()); // 401 = "who are you?"

            verify(categoryService, never()).createNewCategory(anyString());
        }

        @Test
        void normalUserCannotCreateCategories() throws Exception {
            mvc.perform(post("/categories")
                            .with(user(normalUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"categoryName\":\"Juhe\"}"))
                    .andExpect(status().isForbidden()); // 403 = "I know who you are, but you may not"

            verify(categoryService, never()).createNewCategory(anyString());
        }

        @Test
        void adminCanCreateRenameAndDeleteCategories() throws Exception {
            mvc.perform(post("/categories")
                            .with(user(admin))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"categoryName\":\"Juhe\"}"))
                    .andExpect(status().isOk());
            verify(categoryService).createNewCategory("Juhe");

            mvc.perform(post("/categories/update/3")
                            .with(user(admin))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"categoryName\":\"Juhe i variva\"}"))
                    .andExpect(status().isOk());
            verify(categoryService).updateCategory(3L, "Juhe i variva");

            mvc.perform(delete("/categories/3").with(user(admin)))
                    .andExpect(status().isOk());
            verify(categoryService).deleteCategoryById(3L);
        }
    }

    @Nested
    class AdminEndpoints {

        @Test
        void normalUserCannotListAllUsers() throws Exception {
            mvc.perform(get("/admin/users").with(user(normalUser)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void adminCanListAllUsers() throws Exception {
            when(userService.getAllUsers()).thenReturn(List.of(new UserInfoResponse(
                    1L, "Ana", "Anić", "ana@test.hr", List.of("ROLE_USER"), true, "2025-06-01T12:00")));

            mvc.perform(get("/admin/users").with(user(admin)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].email").value("ana@test.hr"));
        }

        @Test
        void normalUserCannotSuspendAnyone() throws Exception {
            mvc.perform(post("/admin/suspend-user/2").with(user(normalUser)))
                    .andExpect(status().isForbidden());

            verify(userService, never()).suspendUser(anyLong());
        }

        @Test
        void adminCanSuspendAUser() throws Exception {
            mvc.perform(post("/admin/suspend-user/2").with(user(admin)))
                    .andExpect(status().isOk());

            verify(userService).suspendUser(2L);
        }
    }
}
