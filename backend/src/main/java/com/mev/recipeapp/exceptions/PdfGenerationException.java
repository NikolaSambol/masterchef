package com.mev.recipeapp.exceptions;

/**
 * Thrown when iText fails to build a PDF. GlobalExceptionHandler turns it into "500 Internal Server Error".
 *
 * <p>It's unchecked (extends RuntimeException) so the service and controller don't need try/catch blocks:
 * the error travels up to the one place that handles errors for the whole API.
 */
public class PdfGenerationException extends RuntimeException {

    public PdfGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
