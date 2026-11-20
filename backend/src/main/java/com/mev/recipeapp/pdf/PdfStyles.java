package com.mev.recipeapp.pdf;

import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Font;
import com.itextpdf.text.pdf.BaseFont;

/**
 * The look of every PDF in one place: colours and fonts.
 * Change a colour here and all documents change with it.
 *
 * <p>Package-private on purpose: only the renderers in this package should need it.
 */
final class PdfStyles {

    static final BaseColor PRIMARY = new BaseColor(52, 152, 219);
    static final BaseColor SECONDARY = new BaseColor(64, 86, 161);
    static final BaseColor ROW_BACKGROUND = new BaseColor(245, 245, 245);

    // Built-in Helvetica uses WinAnsi (CP1252) by default, which has no č, ć or đ.
    // CP1250 is the Central European code page and covers all Croatian letters.
    private static final BaseFont HELVETICA = loadFont(BaseFont.HELVETICA);
    private static final BaseFont HELVETICA_BOLD = loadFont(BaseFont.HELVETICA_BOLD);
    private static final BaseFont HELVETICA_OBLIQUE = loadFont(BaseFont.HELVETICA_OBLIQUE);

    // Shared by all documents. Treat them as read-only: never call a setter on them.
    static final Font TITLE = new Font(HELVETICA_BOLD, 24, Font.NORMAL, PRIMARY);
    static final Font SUBTITLE = new Font(HELVETICA_BOLD, 14, Font.NORMAL, SECONDARY);
    static final Font REGULAR = new Font(HELVETICA, 12, Font.NORMAL, BaseColor.BLACK);
    static final Font ITALIC = new Font(HELVETICA_OBLIQUE, 12, Font.NORMAL, BaseColor.DARK_GRAY);
    static final Font TABLE_HEADER = new Font(HELVETICA_BOLD, 12, Font.NORMAL, BaseColor.WHITE);

    private PdfStyles() {
    }

    private static BaseFont loadFont(String name) {
        try {
            return BaseFont.createFont(name, BaseFont.CP1250, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot create PDF font " + name, e);
        }
    }
}
