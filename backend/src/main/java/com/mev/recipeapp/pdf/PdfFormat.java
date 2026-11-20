package com.mev.recipeapp.pdf;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/** Text formatting used by the PDF export. Pure functions, so they're easy to unit-test. */
public final class PdfFormat {

    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private PdfFormat() {
    }

    /**
     * Formats a date from the DTOs ("2025-06-01" or "2025-06-01T12:30:00") as "01.06.2025".
     * Anything that isn't a date is returned unchanged; null becomes an empty string.
     */
    public static String formatDate(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        try {
            return LocalDate.parse(value).format(DISPLAY_DATE);
        } catch (DateTimeParseException notADate) {
            // fall through: maybe it's a date with a time
        }
        try {
            return LocalDateTime.parse(value).format(DISPLAY_DATE);
        } catch (DateTimeParseException notADateTime) {
            return value;
        }
    }

    /**
     * Turns any text into a safe file name: "Čokoladni kolač" → "Cokoladni_kolac".
     * Croatian letters lose their accents (č → c, đ → d) and everything except ASCII letters, digits,
     * '.', '_' and '-' becomes '_'. ASCII-only names work in every browser and operating system.
     */
    public static String safeFileName(String value) {
        if (value == null || value.isBlank()) {
            return "dokument";
        }
        // NFD splits "č" into "c" + an accent mark; \p{M} then removes the marks. "đ" has no such split.
        String withoutAccents = Normalizer.normalize(value.replace('đ', 'd').replace('Đ', 'D'), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutAccents.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
