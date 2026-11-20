package com.mev.recipeapp.controllers;

import com.mev.recipeapp.exceptions.PdfGenerationException;
import com.mev.recipeapp.models.AppRole;
import com.mev.recipeapp.models.CustomUserDetails;
import com.mev.recipeapp.pdf.GeneratedPdf;
import com.mev.recipeapp.repository.ComponentRepository;
import com.mev.recipeapp.repository.RecipeRepository;
import com.mev.recipeapp.security.CustomUserDetailsService;
import com.mev.recipeapp.service.PdfExportService;
import com.mev.recipeapp.testsupport.WebLayerTestConfig;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static com.mev.recipeapp.testsupport.TestData.principal;
import static com.mev.recipeapp.testsupport.TestData.user;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(RecipePdfController.class)
@Import(WebLayerTestConfig.class)
class RecipePdfControllerTest {

    private static final byte[] PDF = {'%', 'P', 'D', 'F'};

    @Autowired private MockMvc mvc;

    @MockitoBean private PdfExportService pdfExportService;
    // Needed by the imported security beans (see WebLayerTestConfig):
    @MockitoBean private CustomUserDetailsService userDetailsService;
    @MockitoBean private RecipeRepository recipeRepository;
    @MockitoBean private ComponentRepository componentRepository;

    private final CustomUserDetails normalUser = principal(user(1L, "ana@test.hr", AppRole.ROLE_USER));
    private final CustomUserDetails admin = principal(user(9L, "admin@test.hr", AppRole.ROLE_ADMIN));

    @Test
    void anyoneCanDownloadARecipeAsAPdfFile() throws Exception {
        when(pdfExportService.exportRecipe(1L)).thenReturn(new GeneratedPdf("Kolac_20250601_103045.pdf", PDF));

        mvc.perform(get("/pdf/public/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                // "attachment" tells the browser to save the file instead of showing it.
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"Kolac_20250601_103045.pdf\""))
                .andExpect(content().bytes(PDF));
    }

    @Test
    void unknownRecipeGives400LikeTheRestOfTheApi() throws Exception {
        when(pdfExportService.exportRecipe(404L)).thenThrow(new IllegalArgumentException("Recipe not found"));

        mvc.perform(get("/pdf/public/404"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void aFailureInThePdfLibraryGives500WithAClearMessage() throws Exception {
        when(pdfExportService.exportRecipe(1L))
                .thenThrow(new PdfGenerationException("iText failed", new RuntimeException("internal detail")));

        mvc.perform(get("/pdf/public/1"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().string(containsString("generiranju PDF-a")))
                // The internal error message must not leak to the user.
                .andExpect(content().string(not(containsString("internal detail"))));
    }

    /** The export of all users is admin-only (SecurityConfig: /pdf/** needs ROLE_ADMIN). */
    @Nested
    class AllUsersExport {

        @Test
        void anonymousVisitorsMustLogIn() throws Exception {
            mvc.perform(get("/pdf/users")).andExpect(status().isUnauthorized());
        }

        @Test
        void normalUsersAreForbidden() throws Exception {
            mvc.perform(get("/pdf/users").with(user(normalUser))).andExpect(status().isForbidden());

            verify(pdfExportService, never()).exportAllUsers();
        }

        @Test
        void adminsGetTheFile() throws Exception {
            when(pdfExportService.exportAllUsers()).thenReturn(new GeneratedPdf("korisnici_20250601_103045.pdf", PDF));

            mvc.perform(get("/pdf/users").with(user(admin)))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"korisnici_20250601_103045.pdf\""));
        }
    }
}
