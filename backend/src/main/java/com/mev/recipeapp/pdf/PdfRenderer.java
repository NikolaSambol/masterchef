package com.mev.recipeapp.pdf;

import com.itextpdf.text.BadElementException;
import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.ExceptionConverter;
import com.itextpdf.text.Image;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfWriter;
import com.mev.recipeapp.exceptions.PdfGenerationException;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Optional;

/**
 * Base class for all PDF documents. It handles the parts every PDF needs (creating the document, margins,
 * opening, closing, error handling); subclasses only fill in the content.
 *
 * <p>This is the <b>Template Method</b> design pattern: {@link #render} is the fixed "recipe" of steps, and
 * {@link #writeContent} is the one step each subclass provides.
 *
 * @param <T> the data the document shows, e.g. a RecipeDTO
 */
@Slf4j
public abstract class PdfRenderer<T> {

    /** Builds the whole document and returns the PDF file's bytes. */
    public byte[] render(T data) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(pageSize(), 40, 40, 50, 50);
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            writeContent(document, data);
            document.close();
        } catch (DocumentException | ExceptionConverter e) {
            throw new PdfGenerationException("Could not generate PDF in " + getClass().getSimpleName(), e);
        }
        return out.toByteArray();
    }

    /** Portrait A4 by default; override for landscape documents. */
    protected Rectangle pageSize() {
        return PageSize.A4;
    }

    /** Adds the document's content: titles, tables, images. */
    protected abstract void writeContent(Document document, T data) throws DocumentException;

    /**
     * Turns a Base64 image from the DTOs back into an image for the PDF. A broken or unsupported image is
     * skipped (and logged) instead of failing the whole document.
     */
    protected Optional<Image> decodeImage(String base64) {
        if (base64 == null || base64.isEmpty()) {
            return Optional.empty();
        }
        try {
            return Optional.of(Image.getInstance(Base64.getDecoder().decode(base64)));
        } catch (IOException | BadElementException | IllegalArgumentException e) {
            log.warn("Image skipped in PDF: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
