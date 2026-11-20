package com.mev.recipeapp.service.impl;

import com.mev.recipeapp.dtos.RecipeDTO;
import com.mev.recipeapp.dtos.RecipeSummaryDTO;
import com.mev.recipeapp.dtos.requests.CreateRecipeRequest;
import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.Category;
import com.mev.recipeapp.models.Recipe;
import com.mev.recipeapp.models.User;
import com.mev.recipeapp.repository.CategoryRepository;
import com.mev.recipeapp.repository.ComponentRepository;
import com.mev.recipeapp.repository.RecipeRepository;
import com.mev.recipeapp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.*;

import static com.mev.recipeapp.testsupport.TestData.category;
import static com.mev.recipeapp.testsupport.TestData.component;
import static com.mev.recipeapp.testsupport.TestData.recipe;
import static com.mev.recipeapp.testsupport.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecipeServiceImplTest {

    private static final byte[] IMAGE = {1, 2, 3};
    private static final byte[] OLD_VIDEO = {7, 7, 7};
    private static final byte[] NEW_VIDEO = {9, 9};

    @Mock private RecipeRepository recipeRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private ComponentRepository componentRepository;

    @InjectMocks
    private RecipeServiceImpl recipeService;

    private User ana;
    private Category desserts;

    @BeforeEach
    void setUp() {
        ana = user(1L, "ana@test.hr", AppRole.ROLE_USER);
        desserts = category(5L, "Slastice");

        lenient().when(recipeRepository.save(any(Recipe.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Nested
    class CreateRecipe {

        @Test
        void savesTheRecipeWithItsAuthorCategoryAndImage() {
            when(userRepository.findByEmailWithRole("ana@test.hr")).thenReturn(ana);
            when(categoryRepository.findById(5L)).thenReturn(Optional.of(desserts));

            CreateRecipeRequest request = request("Kolač", "45 min", 5L);
            request.setImage(new MockMultipartFile("image", "cake.png", "image/png", IMAGE));

            Recipe saved = recipeService.createRecipe(request, "ana@test.hr");

            assertThat(saved.getRecipeName()).isEqualTo("Kolač");
            assertThat(saved.getPreparationTime()).isEqualTo("45 min");
            assertThat(saved.getUser()).isSameAs(ana);
            assertThat(saved.getCategory()).isSameAs(desserts);
            assertThat(saved.getImage()).isEqualTo(IMAGE);
            assertThat(saved.getVideo()).isNull();
        }

        @Test
        void unknownAuthorIsRejectedAndNothingIsSaved() {
            CreateRecipeRequest request = request("Kolač", "45 min", 5L);

            assertThatThrownBy(() -> recipeService.createRecipe(request, "ghost@test.hr"))
                    .hasMessageContaining("ghost@test.hr");
            verify(recipeRepository, never()).save(any());
        }

        @Test
        void unknownCategoryIsRejectedAndNothingIsSaved() {
            when(userRepository.findByEmailWithRole("ana@test.hr")).thenReturn(ana);
            when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> recipeService.createRecipe(request("Kolač", "45 min", 99L), "ana@test.hr"))
                    .hasMessageContaining("99");
            verify(recipeRepository, never()).save(any());
        }
    }

    @Nested
    class UpdateRecipe {

        private Recipe existing;

        @BeforeEach
        void setUp() {
            existing = recipe(10L, "Stari naziv", ana, desserts);
            existing.setVideo(OLD_VIDEO);
            when(recipeRepository.findById(10L)).thenReturn(Optional.of(existing));
        }

        /** Regression test: before the fix, every update without a new video deleted the old one. */
        @Test
        @DisplayName("renaming a recipe keeps its existing video")
        void renamingKeepsTheVideo() {
            Recipe updated = recipeService.updateRecipe(10L, request("Novi naziv", null, null));

            assertThat(updated.getRecipeName()).isEqualTo("Novi naziv");
            assertThat(updated.getVideo()).isEqualTo(OLD_VIDEO);
        }

        @Test
        void videoIsRemovedOnlyWhenExplicitlyRequested() {
            CreateRecipeRequest request = request(null, null, null);
            request.setDeleteVideo(true);

            assertThat(recipeService.updateRecipe(10L, request).getVideo()).isNull();
        }

        @Test
        void newVideoReplacesTheOldOne() {
            CreateRecipeRequest request = request(null, null, null);
            request.setVideo(new MockMultipartFile("video", "clip.mp4", "video/mp4", NEW_VIDEO));

            assertThat(recipeService.updateRecipe(10L, request).getVideo()).isEqualTo(NEW_VIDEO);
        }

        @Test
        void blankFieldsKeepTheirOldValues() {
            Recipe updated = recipeService.updateRecipe(10L, request("  ", "", null));

            assertThat(updated.getRecipeName()).isEqualTo("Stari naziv");
            assertThat(updated.getPreparationTime()).isEqualTo("30 min");
            assertThat(updated.getCategory()).isSameAs(desserts);
            // The category wasn't sent, so the category table must not even be queried.
            verifyNoInteractions(categoryRepository);
        }

        @Test
        void categoryIsChangedWhenSent() {
            Category soups = category(6L, "Juhe");
            when(categoryRepository.findById(6L)).thenReturn(Optional.of(soups));

            assertThat(recipeService.updateRecipe(10L, request(null, null, 6L)).getCategory()).isSameAs(soups);
        }

        @Test
        void updatedRecipeIsSaved() {
            recipeService.updateRecipe(10L, request("Novi naziv", null, null));
            Integer[] nums = new Integer[0];

            ArgumentCaptor<Recipe> saved = ArgumentCaptor.forClass(Recipe.class);
            verify(recipeRepository).save(saved.capture());
            assertThat(saved.getValue().getId()).isEqualTo(10L);
        }
    }

    @Test
    void updatingAnUnknownRecipeFails() {
        when(recipeRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> recipeService.updateRecipe(404L, request("x", null, null)))
                .hasMessageContaining("404");
    }

    @Nested
    class GetRecipeWithDetails {

        @Test
        void mapsTheRecipeAndItsComponentsToADto() {
            Recipe cake = recipe(10L, "Kolač", ana, desserts);
            cake.setImage(IMAGE);
            cake.getComponents().add(component(1L, "Tijesto", cake, "brašno, jaja", "Umijesiti."));
            when(recipeRepository.findRecipeWithComponents(10L)).thenReturn(Optional.of(cake));

            RecipeDTO dto = recipeService.getRecipeWithDetails(10L);

            assertThat(dto.getRecipeName()).isEqualTo("Kolač");
            assertThat(dto.getCreationDate()).isEqualTo("2025-06-01");
            assertThat(dto.getImage()).isEqualTo(Base64.getEncoder().encodeToString(IMAGE));
            assertThat(dto.getVideo()).isNull();
            assertThat(dto.getCategory().getCategoryName()).isEqualTo("Slastice");
            assertThat(dto.getUser().getEmail()).isEqualTo("ana@test.hr");
            assertThat(dto.getComponents())
                    .singleElement()
                    .satisfies(c -> {
                        assertThat(c.getComponentName()).isEqualTo("Tijesto");
                        assertThat(c.getIngredients()).isEqualTo("brašno, jaja");
                        assertThat(c.getInstruction()).isEqualTo("Umijesiti.");
                    });
        }

        @Test
        void unknownRecipeThrowsIllegalArgumentException() {
            when(recipeRepository.findRecipeWithComponents(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> recipeService.getRecipeWithDetails(404L))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    void recipeSummariesOfAUserContainIdNameAndDate() {
        when(recipeRepository.findByUserId(1L)).thenReturn(List.of(
                recipe(10L, "Kolač", ana, desserts),
                recipe(11L, "Juha", ana, desserts)));

        List<RecipeSummaryDTO> summaries = recipeService.getRecipeSummaryByUserId(1L);

        assertThat(summaries)
                .extracting(RecipeSummaryDTO::getId, RecipeSummaryDTO::getRecipeName, RecipeSummaryDTO::getCreationDate)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(10L, "Kolač", "2025-06-01"),
                        org.assertj.core.groups.Tuple.tuple(11L, "Juha", "2025-06-01"));
    }

    @Test
    void deletingARecipeDelegatesToTheRepository() {
        recipeService.deleteRecipeById(10L);

        verify(recipeRepository).deleteById(10L);
    }

    private static CreateRecipeRequest request(String name, String preparationTime, Long categoryId) {
        CreateRecipeRequest request = new CreateRecipeRequest();
        request.setName(name);
        request.setPreparationTime(preparationTime);
        request.setCategory(categoryId);
        return request;
    }
}
