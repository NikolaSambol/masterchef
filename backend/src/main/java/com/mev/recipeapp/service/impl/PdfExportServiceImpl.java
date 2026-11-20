package com.mev.recipeapp.service.impl;

import com.mev.recipeapp.dtos.RecipeDTO;
import com.mev.recipeapp.dtos.response.UserInfoResponse;
import com.mev.recipeapp.pdf.GeneratedPdf;
import com.mev.recipeapp.pdf.PdfFormat;
import com.mev.recipeapp.pdf.RecipePdfRenderer;
import com.mev.recipeapp.pdf.UserListPdfRenderer;
import com.mev.recipeapp.pdf.UserPdfRenderer;
import com.mev.recipeapp.pdf.UserReport;
import com.mev.recipeapp.service.PdfExportService;
import com.mev.recipeapp.service.RecipeService;
import com.mev.recipeapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Decides WHAT goes into each PDF and WHAT the file is called. HOW a document looks is the renderers' job,
 * and turning the result into an HTTP download is the controller's job.
 */
@Service
@RequiredArgsConstructor
public class PdfExportServiceImpl implements PdfExportService {

    private static final DateTimeFormatter FILE_TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private final RecipeService recipeService;
    private final UserService userService;
    private final RecipePdfRenderer recipePdfRenderer;
    private final UserPdfRenderer userPdfRenderer;
    private final UserListPdfRenderer userListPdfRenderer;
    /** Injected instead of calling LocalDateTime.now() directly, so tests can use a fixed time. */
    private final Clock clock;

    @Override
    public GeneratedPdf exportRecipe(Long recipeId) {
        RecipeDTO recipe = recipeService.getRecipeWithDetails(recipeId);
        return new GeneratedPdf(fileName(recipe.getRecipeName()), recipePdfRenderer.render(recipe));
    }

    @Override
    public GeneratedPdf exportUser(Long userId) {
        UserInfoResponse user = userService.getUserById(userId);
        // Summaries are enough for the list (name + date) and don't load every recipe's image.
        UserReport report = new UserReport(user, recipeService.getRecipeSummaryByUserId(userId));
        return new GeneratedPdf(fileName(user.getName() + "_" + user.getSurname()), userPdfRenderer.render(report));
    }

    @Override
    public GeneratedPdf exportAllUsers() {
        return new GeneratedPdf(fileName("korisnici"), userListPdfRenderer.render(userService.getAllUsers()));
    }

    /** "Čokoladni kolač" → "Cokoladni_kolac_20251118_221500.pdf" */
    private String fileName(String baseName) {
        return PdfFormat.safeFileName(baseName) + "_" + LocalDateTime.now(clock).format(FILE_TIMESTAMP) + ".pdf";
    }
}
