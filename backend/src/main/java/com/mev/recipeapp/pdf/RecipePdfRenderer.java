package com.mev.recipeapp.pdf;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Element;
import com.itextpdf.text.Image;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.pdf.PdfPTable;
import com.mev.recipeapp.dtos.ComponentDTO;
import com.mev.recipeapp.dtos.RecipeDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

import static com.mev.recipeapp.pdf.PdfElements.addHeaderRow;
import static com.mev.recipeapp.pdf.PdfElements.addLabelValue;
import static com.mev.recipeapp.pdf.PdfElements.bodyCell;
import static com.mev.recipeapp.pdf.PdfElements.dataTable;
import static com.mev.recipeapp.pdf.PdfElements.imageCell;
import static com.mev.recipeapp.pdf.PdfElements.labelValueTable;
import static com.mev.recipeapp.pdf.PdfElements.note;
import static com.mev.recipeapp.pdf.PdfElements.placeholderCell;
import static com.mev.recipeapp.pdf.PdfElements.sectionTitle;
import static com.mev.recipeapp.pdf.PdfElements.title;
import static com.mev.recipeapp.pdf.PdfFormat.formatDate;

/** One recipe: picture, details, and a table of its components. */
@Component
public class RecipePdfRenderer extends PdfRenderer<RecipeDTO> {

    @Override
    protected void writeContent(Document document, RecipeDTO recipe) throws DocumentException {
        addRecipeImage(document, recipe);
        document.add(title(recipe.getRecipeName()));
        document.add(details(recipe));
        document.add(sectionTitle("Komponente"));
        addComponents(document, recipe.getComponents());
    }

    private void addRecipeImage(Document document, RecipeDTO recipe) throws DocumentException {
        Optional<Image> image = decodeImage(recipe.getImage());
        if (image.isPresent()) {
            image.get().scaleToFit(500, 300);
            image.get().setAlignment(Element.ALIGN_CENTER);
            document.add(image.get());
            document.add(new Paragraph("\n")); // space below the picture
        }
    }

    private PdfPTable details(RecipeDTO recipe) {
        PdfPTable table = labelValueTable();
        addLabelValue(table, "Datum objave recepta:", formatDate(recipe.getCreationDate()));
        addLabelValue(table, "Vrijeme pripreme:", recipe.getPreparationTime());
        if (recipe.getCategory() != null) {
            addLabelValue(table, "Kategorija:", recipe.getCategory().getCategoryName());
        }
        if (recipe.getUser() != null) {
            addLabelValue(table, "Autor:", recipe.getUser().getName() + " " + recipe.getUser().getSurname());
        }
        return table;
    }

    private void addComponents(Document document, List<ComponentDTO> components) throws DocumentException {
        if (components == null || components.isEmpty()) {
            document.add(note("Nema sastojaka."));
            return;
        }

        // The image column is only shown when at least one component has a picture.
        boolean withImages = components.stream().anyMatch(c -> c.getImagePath() != null && !c.getImagePath().isEmpty());
        PdfPTable table = withImages ? dataTable(2, 2, 3, 2) : dataTable(2, 2, 3);
        table.setSpacingAfter(20f);
        addHeaderRow(table, "Naziv komponente", "Sastojci", "Upute");
        if (withImages) {
            addHeaderRow(table, "Slika komponente");
        }

        for (ComponentDTO component : components) {
            table.addCell(bodyCell(component.getComponentName()));
            table.addCell(bodyCell(component.getIngredients()));
            table.addCell(bodyCell(component.getInstruction()));
            if (withImages) {
                Optional<Image> image = decodeImage(component.getImagePath());
                if (image.isPresent()) {
                    image.get().scaleToFit(60, 60);
                    table.addCell(imageCell(image.get()));
                } else {
                    table.addCell(placeholderCell());
                }
            }
        }
        document.add(table);
    }
}
