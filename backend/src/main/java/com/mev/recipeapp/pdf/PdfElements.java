package com.mev.recipeapp.pdf;

import com.itextpdf.text.Element;
import com.itextpdf.text.Image;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;

/**
 * Small building blocks (titles, tables, cells) that every document uses. Before the refactor this code was
 * copied into each of the three PDF methods; now each piece exists once.
 */
final class PdfElements {

    private PdfElements() {
    }

    /** Big centred heading at the top of a document. */
    static Paragraph title(String text) {
        Paragraph title = new Paragraph(orEmpty(text), PdfStyles.TITLE);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20f);
        return title;
    }

    /** Heading above a section, e.g. "Komponente". */
    static Paragraph sectionTitle(String text) {
        Paragraph title = new Paragraph(text, PdfStyles.SUBTITLE);
        title.setSpacingBefore(15f);
        title.setSpacingAfter(10f);
        return title;
    }

    /** A plain line of text. */
    static Paragraph text(String text) {
        return new Paragraph(text, PdfStyles.REGULAR);
    }

    /** A grey italic remark, e.g. "Nema sastojaka." */
    static Paragraph note(String text) {
        return new Paragraph(text, PdfStyles.ITALIC);
    }

    /** Two columns without borders for "Label: value" rows, used for a recipe's or user's details. */
    static PdfPTable labelValueTable() {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(15f);
        table.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        return table;
    }

    static void addLabelValue(PdfPTable table, String label, String value) {
        table.addCell(new Phrase(label, PdfStyles.SUBTITLE));
        table.addCell(new Phrase(orEmpty(value), PdfStyles.REGULAR));
    }

    /**
     * A full-width table with the given relative column widths, e.g. {@code dataTable(3, 2)} makes the first
     * column 1.5 times as wide as the second.
     */
    static PdfPTable dataTable(float... relativeColumnWidths) {
        PdfPTable table = new PdfPTable(relativeColumnWidths);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10f);
        return table;
    }

    /** Adds the blue header row of a data table. */
    static void addHeaderRow(PdfPTable table, String... columnTitles) {
        for (String columnTitle : columnTitles) {
            PdfPCell cell = new PdfPCell(new Phrase(columnTitle, PdfStyles.TABLE_HEADER));
            cell.setBackgroundColor(PdfStyles.PRIMARY);
            cell.setPadding(8f);
            table.addCell(cell);
        }
    }

    /** One normal table cell. Null becomes an empty cell instead of crashing the document. */
    static PdfPCell bodyCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(orEmpty(text), PdfStyles.REGULAR));
        cell.setBackgroundColor(PdfStyles.ROW_BACKGROUND);
        cell.setPadding(6f);
        return cell;
    }

    /** A table cell showing a small image. */
    static PdfPCell imageCell(Image image) {
        PdfPCell cell = new PdfPCell(image, true);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(4f);
        return cell;
    }

    /** A centred "-" for table cells that have nothing to show. */
    static PdfPCell placeholderCell() {
        PdfPCell cell = new PdfPCell(new Phrase("-", PdfStyles.REGULAR));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    /** How a user's enabled flag is shown in the PDFs. */
    static String statusText(boolean enabled) {
        return enabled ? "Aktivan" : "Neaktivan";
    }

    private static String orEmpty(String text) {
        return text == null ? "" : text;
    }
}
