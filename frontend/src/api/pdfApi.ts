import { filenameFromContentDisposition, saveBlob } from "../utils/download";
import { apiClient } from "./client";

async function downloadPdf(url: string, fallbackName: string): Promise<void> {
    const response = await apiClient.get<Blob>(url, { responseType: "blob" });
    const filename = filenameFromContentDisposition(response.headers["content-disposition"], fallbackName);
    saveBlob(new Blob([response.data], { type: "application/pdf" }), filename);
}

export const pdfApi = {
    downloadRecipe: (recipeId: number) => downloadPdf(`/pdf/public/${recipeId}`, `recept_${recipeId}.pdf`),
    /** Admin only. */
    downloadUser: (userId: number) => downloadPdf(`/pdf/user/${userId}`, `korisnik_${userId}.pdf`),
    /** Admin only. */
    downloadAllUsers: () => downloadPdf("/pdf/users", "korisnici.pdf"),
};
