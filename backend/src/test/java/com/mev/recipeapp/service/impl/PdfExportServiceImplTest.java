package com.mev.recipeapp.service.impl;

import com.mev.recipeapp.dtos.RecipeDTO;
import com.mev.recipeapp.dtos.RecipeSummaryDTO;
import com.mev.recipeapp.dtos.response.UserInfoResponse;
import com.mev.recipeapp.pdf.GeneratedPdf;
import com.mev.recipeapp.pdf.RecipePdfRenderer;
import com.mev.recipeapp.pdf.UserListPdfRenderer;
import com.mev.recipeapp.pdf.UserPdfRenderer;
import com.mev.recipeapp.pdf.UserReport;
import com.mev.recipeapp.service.RecipeService;
import com.mev.recipeapp.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Tests the service's own job: loading the right data, picking the renderer and naming the file.
 * The renderers are mocked, so this test doesn't care what the PDFs look like (their own tests do).
 */
@ExtendWith(MockitoExtension.class)
class PdfExportServiceImplTest {

    /** A clock stopped at 1 June 2025, 10:30:45 – so the timestamp in file names is always the same. */
    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2025-06-01T10:30:45Z"), ZoneOffset.UTC);
    private static final byte[] PDF = {'%', 'P', 'D', 'F'};

    @Mock private RecipeService recipeService;
    @Mock private UserService userService;
    @Mock private RecipePdfRenderer recipePdfRenderer;
    @Mock private UserPdfRenderer userPdfRenderer;
    @Mock private UserListPdfRenderer userListPdfRenderer;

    private PdfExportServiceImpl service;

    // Built by hand instead of with @InjectMocks, because the Clock is a real object, not a mock.
    @BeforeEach
    void setUp() {
        service = new PdfExportServiceImpl(recipeService, userService,
                recipePdfRenderer, userPdfRenderer, userListPdfRenderer, FIXED_CLOCK);
    }

    @Test
    void recipeExportIsNamedAfterTheRecipeAndTheTime() {
        RecipeDTO recipe = new RecipeDTO();
        recipe.setRecipeName("Čokoladni kolač");
        when(recipeService.getRecipeWithDetails(1L)).thenReturn(recipe);
        when(recipePdfRenderer.render(recipe)).thenReturn(PDF);

        GeneratedPdf pdf = service.exportRecipe(1L);

        assertThat(pdf.filename()).isEqualTo("Cokoladni_kolac_20250601_103045.pdf");
        assertThat(pdf.content()).isSameAs(PDF);
    }

    @Test
    void unknownRecipeIsNeverRendered() {
        when(recipeService.getRecipeWithDetails(404L)).thenThrow(new IllegalArgumentException("Recipe not found"));

        assertThatThrownBy(() -> service.exportRecipe(404L)).isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(recipePdfRenderer);
    }

    @Test
    void userExportUsesRecipeSummariesNotFullRecipes() {
        UserInfoResponse ivana = new UserInfoResponse(5L, "Ivana", "Đurić", "ivana@example.com",
                List.of("ROLE_USER"), true, "2025-06-01T12:30:00");
        List<RecipeSummaryDTO> summaries = List.of(new RecipeSummaryDTO(1L, "Kolač", "2025-06-01"));
        when(userService.getUserById(5L)).thenReturn(ivana);
        when(recipeService.getRecipeSummaryByUserId(5L)).thenReturn(summaries);
        when(userPdfRenderer.render(any())).thenReturn(PDF);

        GeneratedPdf pdf = service.exportUser(5L);

        assertThat(pdf.filename()).isEqualTo("Ivana_Duric_20250601_103045.pdf");
        ArgumentCaptor<UserReport> report = ArgumentCaptor.forClass(UserReport.class);
        verify(userPdfRenderer).render(report.capture());
        assertThat(report.getValue().user()).isSameAs(ivana);
        assertThat(report.getValue().recipes()).isEqualTo(summaries);
        // Full recipes would load and Base64-encode every image just to print names and dates.
        verify(recipeService, never()).getRecipesByUserId(anyLong());
    }

    @Test
    void allUsersExportIsNamedKorisnici() {
        when(userService.getAllUsers()).thenReturn(List.of());
        when(userListPdfRenderer.render(List.of())).thenReturn(PDF);

        assertThat(service.exportAllUsers().filename()).isEqualTo("korisnici_20250601_103045.pdf");
    }
}
