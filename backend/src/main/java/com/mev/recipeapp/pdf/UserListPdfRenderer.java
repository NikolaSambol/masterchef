package com.mev.recipeapp.pdf;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfPTable;
import com.mev.recipeapp.dtos.response.UserInfoResponse;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.mev.recipeapp.pdf.PdfElements.addHeaderRow;
import static com.mev.recipeapp.pdf.PdfElements.bodyCell;
import static com.mev.recipeapp.pdf.PdfElements.dataTable;
import static com.mev.recipeapp.pdf.PdfElements.note;
import static com.mev.recipeapp.pdf.PdfElements.statusText;
import static com.mev.recipeapp.pdf.PdfElements.title;
import static com.mev.recipeapp.pdf.PdfFormat.formatDate;

/** A table of all users (admin only). Landscape, because the table has seven columns. */
@Component
public class UserListPdfRenderer extends PdfRenderer<List<UserInfoResponse>> {

    @Override
    protected Rectangle pageSize() {
        return PageSize.A4.rotate();
    }

    @Override
    protected void writeContent(Document document, List<UserInfoResponse> users) throws DocumentException {
        document.add(title("Popis svih korisnika"));

        if (users == null || users.isEmpty()) {
            document.add(note("Nema korisnika."));
            return;
        }

        PdfPTable table = dataTable(1.5f, 2.5f, 2.5f, 4f, 3f, 2f, 3f);
        addHeaderRow(table, "ID", "Ime", "Prezime", "Email", "Uloge", "Status", "Datum kreiranja");
        for (UserInfoResponse user : users) {
            table.addCell(bodyCell(String.valueOf(user.getId())));
            table.addCell(bodyCell(user.getName()));
            table.addCell(bodyCell(user.getSurname()));
            table.addCell(bodyCell(user.getEmail()));
            table.addCell(bodyCell(String.join(", ", user.getRole())));
            table.addCell(bodyCell(statusText(user.isEnabled())));
            table.addCell(bodyCell(formatDate(user.getCreationDate())));
        }
        document.add(table);
    }
}
