package com.mev.recipeapp.service;

import com.mev.recipeapp.pdf.GeneratedPdf;

/**
 * Builds the PDF exports. Each method loads the data, renders the document and names the file.
 *
 * <p>Errors: an unknown recipe or user throws IllegalArgumentException (→ 400, same as the rest of the API),
 * and a failure inside the PDF library throws PdfGenerationException (→ 500).
 */
public interface PdfExportService {

    GeneratedPdf exportRecipe(Long recipeId);

    GeneratedPdf exportUser(Long userId);

    GeneratedPdf exportAllUsers();
}
