package com.mev.recipeapp.controllers;

import com.mev.recipeapp.pdf.GeneratedPdf;
import com.mev.recipeapp.service.PdfExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HTTP layer of the PDF export: maps each URL to the service and sends the result as a file download.
 * Building the documents happens in {@link PdfExportService} and the renderers in the {@code pdf} package.
 *
 * <p>Who may call what is decided in SecurityConfig: {@code /pdf/public/**} is open to everyone,
 * the rest is admin-only.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/pdf")
public class RecipePdfController {

    private final PdfExportService pdfExportService;

    @GetMapping("/public/{recipeId}")
    public ResponseEntity<byte[]> generatePdf(@PathVariable Long recipeId) {
        return download(pdfExportService.exportRecipe(recipeId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<byte[]> generateUserPdf(@PathVariable Long userId) {
        return download(pdfExportService.exportUser(userId));
    }

    @GetMapping("/users")
    public ResponseEntity<byte[]> generateAllUsersPdf() {
        return download(pdfExportService.exportAllUsers());
    }

    /** Wraps a PDF in a response the browser saves as a file: {@code Content-Disposition: attachment}. */
    private static ResponseEntity<byte[]> download(GeneratedPdf pdf) {
        ContentDisposition attachment = ContentDisposition.attachment().filename(pdf.filename()).build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, attachment.toString())
                .body(pdf.content());
    }
}
