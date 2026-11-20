import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { recipeApi } from "../../api/recipeApi";
import { CategorySelect } from "../../components/recipe/CategorySelect";
import { FormField } from "../../components/ui/FormField";
import { useCategories } from "../../hooks/useCategories";
import type { Recipe } from "../../types";
import { getErrorMessage } from "../../utils/errors";
import { maxFileSize } from "../../utils/files";
import { imageSrc, videoSrc } from "../../utils/media";

interface UpdateRecipeFormProps {
    recipe: Recipe;
    onSaved: () => void;
    onCancel: () => void;
}

interface FormValues {
    name: string;
    preparationTime: string;
    category: number | null;
    image: FileList;
    video: FileList;
}

const inputClass = "mb-1 w-full rounded border border-gray-300 px-3 py-2";

export function UpdateRecipeForm({ recipe, onSaved, onCancel }: UpdateRecipeFormProps) {
    const { categories, isLoading: categoriesLoading } = useCategories();
    const [deleteVideo, setDeleteVideo] = useState(false);

    // The details endpoint only returns the category name, so look the id up by name.
    const initialCategoryId =
        categories.find((category) => category.categoryName === recipe.category?.categoryName)?.id ?? null;

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: { name: recipe.recipeName, preparationTime: recipe.preparationTime, category: null },
    });

    const onSubmit = async (data: FormValues) => {
        try {
            await recipeApi.update(recipe.id, {
                name: data.name,
                preparationTime: data.preparationTime,
                category: data.category ?? initialCategoryId,
                image: data.image?.[0] ?? null,
                video: data.video?.[0] ?? null,
                deleteVideo,
            });
            toast.success("Recept je ažuriran!");
            onSaved();
        } catch (error) {
            toast.error(getErrorMessage(error, "Recept nije ažuriran."));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <h2 className="text-2xl font-semibold">Ažuriraj recept</h2>

            <FormField label="Naziv recepta" htmlFor="edit-name" error={errors.name?.message}>
                <input
                    id="edit-name"
                    type="text"
                    className={inputClass}
                    {...register("name", {
                        required: "Naziv je obavezan.",
                        minLength: { value: 3, message: "Naziv mora imati najmanje 3 znaka." },
                    })}
                />
            </FormField>

            <FormField label="Nova slika (opcionalno)" htmlFor="edit-image" error={errors.image?.message}>
                <input
                    id="edit-image"
                    type="file"
                    accept="image/png, image/jpeg"
                    {...register("image", { validate: maxFileSize })}
                />
                {recipe.image && (
                    <img src={imageSrc(recipe.image)} alt="Trenutna slika" className="mt-2 h-auto w-32 rounded" />
                )}
            </FormField>

            <FormField label="Video pripreme (opcionalno)" htmlFor="edit-video" error={errors.video?.message}>
                <input
                    id="edit-video"
                    type="file"
                    accept="video/mp4, video/webm"
                    {...register("video", { validate: maxFileSize })}
                />
                {recipe.video && !deleteVideo && (
                    <div className="mt-2">
                        <video controls src={videoSrc(recipe.video)} className="mb-2 h-40 w-64 rounded" />
                        <button
                            type="button"
                            onClick={() => setDeleteVideo(true)}
                            className="rounded bg-red-500 px-3 py-1 text-white"
                        >
                            Obriši video
                        </button>
                    </div>
                )}
                {deleteVideo && (
                    <p className="mt-2 text-red-600">
                        Video će biti obrisan.{" "}
                        <button type="button" onClick={() => setDeleteVideo(false)} className="underline">
                            Poništi
                        </button>
                    </p>
                )}
            </FormField>

            <FormField label="Vrijeme pripreme" htmlFor="edit-time" error={errors.preparationTime?.message}>
                <input
                    id="edit-time"
                    type="text"
                    className={inputClass}
                    {...register("preparationTime", {
                        required: "Vrijeme pripreme je obavezno.",
                        minLength: { value: 2, message: "Vrijeme pripreme mora imati najmanje 2 znaka." },
                    })}
                />
            </FormField>

            <FormField label="Kategorija" htmlFor="edit-category">
                <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                        <CategorySelect
                            inputId="edit-category"
                            categories={categories}
                            isLoading={categoriesLoading}
                            // Until the user picks something, show the recipe's current category.
                            value={field.value ?? initialCategoryId}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                        />
                    )}
                />
            </FormField>

            <div className="flex justify-end gap-4 pt-2">
                <button type="button" onClick={onCancel} className="rounded bg-gray-300 px-4 py-2">
                    Odustani
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                >
                    {isSubmitting ? "Spremanje..." : "Spremi"}
                </button>
            </div>
        </form>
    );
}
