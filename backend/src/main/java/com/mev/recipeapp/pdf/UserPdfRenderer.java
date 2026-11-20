package com.mev.recipeapp.pdf;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.pdf.PdfPTable;
import com.mev.recipeapp.dtos.RecipeSummaryDTO;
import com.mev.recipeapp.dtos.response.UserInfoResponse;
import org.springframework.stereotype.Component;

import static com.mev.recipeapp.pdf.PdfElements.addHeaderRow;
import static com.mev.recipeapp.pdf.PdfElements.addLabelValue;
import static com.mev.recipeapp.pdf.PdfElements.bodyCell;
import static com.mev.recipeapp.pdf.PdfElements.dataTable;
import static com.mev.recipeapp.pdf.PdfElements.labelValueTable;
import static com.mev.recipeapp.pdf.PdfElements.sectionTitle;
import static com.mev.recipeapp.pdf.PdfElements.statusText;
import static com.mev.recipeapp.pdf.PdfElements.text;
import static com.mev.recipeapp.pdf.PdfElements.title;
import static com.mev.recipeapp.pdf.PdfFormat.formatDate;

/** One user's details and the list of their recipes (admin only). */
@Component
public class UserPdfRenderer extends PdfRenderer<UserReport> {

    @Override
    protected void writeContent(Document document, UserReport report) throws DocumentException {
        UserInfoResponse user = report.user();

        document.add(title("Korisnički podaci"));

        PdfPTable details = labelValueTable();
        addLabelValue(details, "ID:", String.valueOf(user.getId()));
        addLabelValue(details, "Ime:", user.getName());
        addLabelValue(details, "Prezime:", user.getSurname());
        addLabelValue(details, "Email:", user.getEmail());
        addLabelValue(details, "Uloge:", String.join(", ", user.getRole()));
        addLabelValue(details, "Status:", statusText(user.isEnabled()));
        addLabelValue(details, "Datum kreiranja:", formatDate(user.getCreationDate()));
        document.add(details);

        document.add(sectionTitle("Recepti korisnika"));

        if (report.recipes() == null || report.recipes().isEmpty()) {
            document.add(text("Korisnik nema recepata."));
            return;
        }

        PdfPTable recipes = dataTable(3, 2);
        recipes.setSpacingAfter(20f);
        addHeaderRow(recipes, "Naziv recepta", "Datum kreiranja");
        for (RecipeSummaryDTO recipe : report.recipes()) {
            recipes.addCell(bodyCell(recipe.getRecipeName()));
            recipes.addCell(bodyCell(formatDate(recipe.getCreationDate())));
        }
        document.add(recipes);
    }
}
