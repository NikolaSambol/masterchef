import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { recipeApi } from "../../api/recipeApi";
import { CategorySelect } from "../../components/recipe/CategorySelect";
import { FormField, inputClassName } from "../../components/ui/FormField";
import { useCategories } from "../../hooks/useCategories";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import { getErrorMessage } from "../../utils/errors";
import { maxFileSize } from "../../utils/files";
import { RecipeFormLayout } from "./RecipeFormLayout";

interface AddRecipeForm {
    name: string;
    preparationTime: string;
    image: FileList;
    video: FileList;
    category: number | null;
}

const fieldClass = "mb-6 text-lg md:px-6";

export default function AddRecipePage() {
    const navigate = useNavigate();
    const { categories, isLoading: categoriesLoading } = useCategories();

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<AddRecipeForm>({ defaultValues: { category: null } });

    const imagePreview = useObjectUrl(watch("image")?.[0]);

    const onSubmit = async (data: AddRecipeForm) => {
        try {
            const recipeId = await recipeApi.create({
                name: data.name,
                preparationTime: data.preparationTime,
                category: data.category,
                image: data.image[0],
                video: data.video?.[0] ?? null,
            });
            toast.success(`Recept "${data.name}" je kreiran! Sada dodajte komponente.`);
            navigate(`/recipe/${recipeId}/addcomponent`);
        } catch (error) {
            toast.error(getErrorMessage(error, "Recept nije spremljen."));
        }
    };

    return (
        <RecipeFormLayout
            instructionsTitle="Unesite sljedeće podatke:"
            instructions={[
                "Naziv recepta (obavezno)",
                "Slika recepta (obavezno)",
                "Video (opcionalno)",
                "Vrijeme pripreme (obavezno)",
                "Kategorija recepta (obavezno)",
            ]}
        >
            <h1 className="mb-6 text-center text-4xl font-bold">Unos recepta</h1>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField label="Naziv recepta" htmlFor="name" error={errors.name?.message} className={fieldClass}>
                    <input
                        id="name"
                        type="text"
                        placeholder="Unesi naziv"
                        className={inputClassName}
                        {...register("name", { required: "Naziv je obavezan" })}
                    />
                </FormField>

                <FormField label="Slika recepta" htmlFor="image" error={errors.image?.message} className={fieldClass}>
                    <input
                        id="image"
                        type="file"
                        accept="image/png, image/jpeg"
                        className={inputClassName}
                        {...register("image", {
                            validate: {
                                required: (files) => files?.length > 0 || "Slika je obavezna",
                                maxSize: maxFileSize,
                            },
                        })}
                    />
                    {imagePreview && (
                        <img src={imagePreview} alt="Pregled slike" className="mt-3 h-32 rounded object-cover" />
                    )}
                </FormField>

                <FormField
                    label="Video pripreme recepta (opcionalno)"
                    htmlFor="video"
                    error={errors.video?.message}
                    className={fieldClass}
                >
                    <input
                        id="video"
                        type="file"
                        accept="video/mp4, video/webm"
                        className={inputClassName}
                        {...register("video", { validate: maxFileSize })}
                    />
                </FormField>

                <FormField
                    label="Vrijeme pripreme"
                    htmlFor="preparationTime"
                    error={errors.preparationTime?.message}
                    className={fieldClass}
                >
                    <input
                        id="preparationTime"
                        type="text"
                        placeholder="npr. 45 minuta"
                        className={inputClassName}
                        {...register("preparationTime", { required: "Vrijeme pripreme je obavezno" })}
                    />
                </FormField>

                <FormField
                    label="Kategorija"
                    htmlFor="category"
                    error={errors.category?.message}
                    className={`${fieldClass} md:w-1/2`}
                >
                    <Controller
                        control={control}
                        name="category"
                        rules={{ validate: (value) => value != null || "Kategorija je obavezna" }}
                        render={({ field }) => (
                            <CategorySelect
                                inputId="category"
                                categories={categories}
                                isLoading={categoriesLoading}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                            />
                        )}
                    />
                </FormField>

                <div className="mb-4 flex justify-center">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-[#4CAF50] px-4 py-2 text-xl text-white hover:bg-green-500 disabled:opacity-60"
                    >
                        {isSubmitting ? "Spremanje..." : "Spremi recept"}
                    </button>
                </div>
            </form>
        </RecipeFormLayout>
    );
}
