package com.mev.recipeapp.pdf;

/**
 * A finished PDF file: the name the browser should save it under, and its bytes.
 * The service returns this; the controller turns it into an HTTP download.
 */
public record GeneratedPdf(String filename, byte[] content) {
}
