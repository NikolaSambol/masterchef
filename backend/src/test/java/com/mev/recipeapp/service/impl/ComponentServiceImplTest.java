package com.mev.recipeapp.service.impl;

import com.mev.recipeapp.dtos.ComponentDTO;
import com.mev.recipeapp.dtos.requests.CreateComponentRequest;
import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.Component;
import com.mev.recipeapp.models.Recipe;
import com.mev.recipeapp.repository.ComponentRepository;
import com.mev.recipeapp.service.RecipeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.mev.recipeapp.testsupport.TestData.category;
import static com.mev.recipeapp.testsupport.TestData.component;
import static com.mev.recipeapp.testsupport.TestData.recipe;
import static com.mev.recipeapp.testsupport.TestData.user;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComponentServiceImplTest {

    @Mock private ComponentRepository componentRepository;
    @Mock private RecipeService recipeService;

    @InjectMocks
    private ComponentServiceImpl componentService;

    /**
     * parseComponents() is pure logic (form fields in, objects out), which makes it ideal for unit tests:
     * no mocks needed at all.
     */
    @Nested
    class ParseComponents {

        private final MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        private final Map<String, MultipartFile> files = new HashMap<>();

        @Test
        void readsEveryComponentWithItsIngredientsAndImage() {
            form.add("components[0][name]", "Tijesto");
            form.add("components[0][instructions]", "Umijesiti.");
            form.add("components[0][ingredients][0]", "brašno");
            form.add("components[0][ingredients][1]", "jaja");
            form.add("components[1][name]", "Nadjev");
            form.add("components[1][instructions]", "Pomiješati.");
            form.add("components[1][ingredients][0]", "sir");
            MockMultipartFile image = new MockMultipartFile("components[0][image]", "dough.png", "image/png", new byte[]{1});
            files.put("components[0][image]", image);

            List<CreateComponentRequest> result = componentService.parseComponents(form, files);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getName()).isEqualTo("Tijesto");
            assertThat(result.get(0).getInstructions()).isEqualTo("Umijesiti.");
            assertThat(result.get(0).getIngredients()).containsExactly("brašno", "jaja");
            assertThat(result.get(0).getImage()).isSameAs(image);
            assertThat(result.get(1).getName()).isEqualTo("Nadjev");
            assertThat(result.get(1).getIngredients()).containsExactly("sir");
            assertThat(result.get(1).getImage()).isNull();
        }

        @Test
        void stopsAtTheFirstMissingIndex() {
            form.add("components[0][name]", "Prva");
            form.add("components[2][name]", "Treća – nedostaje components[1]");

            assertThat(componentService.parseComponents(form, files))
                    .extracting(CreateComponentRequest::getName)
                    .containsExactly("Prva");
        }

        @Test
        void ignoresEmptyImageUploads() {
            form.add("components[0][name]", "Tijesto");
            files.put("components[0][image]", new MockMultipartFile("components[0][image]", new byte[0]));

            assertThat(componentService.parseComponents(form, files).get(0).getImage()).isNull();
        }

        @Test
        void emptyFormGivesNoComponents() {
            assertThat(componentService.parseComponents(form, files)).isEmpty();
        }
    }

    @Nested
    class SaveComponents {

        private Recipe cake;

        @BeforeEach
        void setUp() {
            cake = recipe(10L, "Kolač", user(1L, "ana@test.hr", AppRole.ROLE_USER), category(1L, "Slastice"));
            when(recipeService.getRecipeById(10L)).thenReturn(cake);
        }

        @Test
        void storesIngredientsAsOneCommaSeparatedStringWithoutBlanks() {
            componentService.saveComponents(10L, List.of(
                    request("Tijesto", "Umijesiti.", List.of("brašno", " ", "jaja", ""))));

            ArgumentCaptor<Component> saved = ArgumentCaptor.forClass(Component.class);
            verify(componentRepository).save(saved.capture());
            Component component = saved.getValue();
            assertThat(component.getComponentName()).isEqualTo("Tijesto");
            assertThat(component.getIngredients().getDescription()).isEqualTo("brašno, jaja");
            assertThat(component.getInstruction().getDescription()).isEqualTo("Umijesiti.");
            assertThat(component.getRecipe()).isSameAs(cake);
            assertThat(component.getImage()).isNull();
        }

        @Test
        void storesTheUploadedImageBytes() {
            CreateComponentRequest withImage = request("Tijesto", "Umijesiti.", List.of("brašno"));
            withImage.setImage(new MockMultipartFile("image", "x.png", "image/png", new byte[]{4, 2}));

            componentService.saveComponents(10L, List.of(withImage));

            ArgumentCaptor<Component> saved = ArgumentCaptor.forClass(Component.class);
            verify(componentRepository).save(saved.capture());
            assertThat(saved.getValue().getImage()).containsExactly(4, 2);
        }

        @Test
        void savesEveryComponent() {
            componentService.saveComponents(10L, List.of(
                    request("Tijesto", "Umijesiti.", List.of("brašno")),
                    request("Nadjev", "Pomiješati.", List.of("sir"))));

            verify(componentRepository, times(2)).save(org.mockito.ArgumentMatchers.any(Component.class));
        }
    }

    /**
     * updateComponents() matches incoming components to existing ones BY POSITION (index 0 updates the first
     * existing component, and so on). These tests document that behaviour, including its limits.
     */
    @Nested
    class UpdateComponents {

        private Recipe cake;
        private Component dough;
        private Component filling;

        @BeforeEach
        void setUp() {
            cake = recipe(10L, "Kolač", user(1L, "ana@test.hr", AppRole.ROLE_USER), category(1L, "Slastice"));
            dough = component(1L, "Tijesto", cake, "brašno", "Umijesiti.");
            filling = component(2L, "Nadjev", cake, "sir", "Pomiješati.");
            when(recipeService.getRecipeById(10L)).thenReturn(cake);
            when(componentRepository.findByRecipeId(10L)).thenReturn(new ArrayList<>(List.of(dough, filling)));
        }

        @Test
        void updatesExistingComponentsInOrder() {
            componentService.updateComponents(10L, List.of(
                    request("Prhko tijesto", "Umijesiti hladan maslac.", List.of("brašno", "maslac")),
                    request("Nadjev", "Pomiješati.", List.of("sir", "šećer"))));

            assertThat(dough.getComponentName()).isEqualTo("Prhko tijesto");
            assertThat(dough.getIngredients().getDescription()).isEqualTo("brašno, maslac");
            assertThat(dough.getInstruction().getDescription()).isEqualTo("Umijesiti hladan maslac.");
            assertThat(filling.getIngredients().getDescription()).isEqualTo("sir, šećer");
            verify(componentRepository).save(dough);
            verify(componentRepository).save(filling);
        }

        @Test
        void blankValuesDoNotOverwriteExistingOnes() {
            componentService.updateComponents(10L, List.of(request(" ", "", List.of(" "))));

            assertThat(dough.getComponentName()).isEqualTo("Tijesto");
            assertThat(dough.getIngredients().getDescription()).isEqualTo("brašno");
            assertThat(dough.getInstruction().getDescription()).isEqualTo("Umijesiti.");
        }

        @Test
        void extraIncomingComponentsAreCreated() {
            componentService.updateComponents(10L, List.of(
                    request("Tijesto", "Umijesiti.", List.of("brašno")),
                    request("Nadjev", "Pomiješati.", List.of("sir")),
                    request("Glazura", "Otopiti čokoladu.", List.of("čokolada"))));

            ArgumentCaptor<Component> saved = ArgumentCaptor.forClass(Component.class);
            verify(componentRepository, times(3)).save(saved.capture());
            Component created = saved.getAllValues().get(2);
            assertThat(created.getId()).isNull(); // a new entity, not one of the existing ones
            assertThat(created.getComponentName()).isEqualTo("Glazura");
            assertThat(created.getRecipe()).isSameAs(cake);
        }

        @Test
        void sendingFewerComponentsDoesNotDeleteTheRest() {
            // Deleting is a separate request (DELETE /components/delete/{id}); update never removes rows.
            componentService.updateComponents(10L, List.of(request("Tijesto", "Umijesiti.", List.of("brašno"))));

            verify(componentRepository).save(dough);
            verify(componentRepository, times(1)).save(org.mockito.ArgumentMatchers.any(Component.class));
            assertThat(filling.getComponentName()).isEqualTo("Nadjev");
        }
    }

    @Test
    void componentsForARecipeAreReturnedAsDtosWithBase64Images() {
        Recipe cake = recipe(10L, "Kolač", user(1L, "ana@test.hr", AppRole.ROLE_USER), category(1L, "Slastice"));
        Component dough = component(1L, "Tijesto", cake, "brašno", "Umijesiti.");
        dough.setImage(new byte[]{1, 2, 3});
        when(componentRepository.findByRecipeId(10L)).thenReturn(List.of(dough));

        List<ComponentDTO> result = componentService.getComponentsForRecipe(10L);

        assertThat(result).singleElement().satisfies(dto -> {
            assertThat(dto.getId()).isEqualTo(1L);
            assertThat(dto.getComponentName()).isEqualTo("Tijesto");
            assertThat(dto.getImagePath()).isEqualTo(Base64.getEncoder().encodeToString(new byte[]{1, 2, 3}));
            assertThat(dto.getIngredients()).isEqualTo("brašno");
            assertThat(dto.getInstruction()).isEqualTo("Umijesiti.");
        });
    }

    @Test
    void deletingAComponentDelegatesToTheRepository() {
        componentService.deleteComponent(7L);

        verify(componentRepository).deleteById(7L);
    }

    private static CreateComponentRequest request(String name, String instructions, List<String> ingredients) {
        CreateComponentRequest request = new CreateComponentRequest();
        request.setName(name);
        request.setInstructions(instructions);
        request.setIngredients(ingredients);
        return request;
    }
}
