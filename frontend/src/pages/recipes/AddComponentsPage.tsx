import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { type ComponentFormValues, componentApi } from "../../api/componentApi";
import { FormField, inputClassName } from "../../components/ui/FormField";
import { getErrorMessage } from "../../utils/errors";
import { maxFileSize } from "../../utils/files";
import { RecipeFormLayout } from "./RecipeFormLayout";

interface ComponentForm {
    name: string;
    image: FileList;
    ingredients: { value: string }[];
    instructions: string;
}

const EMPTY_COMPONENT: ComponentForm = {
    name: "",
    image: undefined as unknown as FileList,
    ingredients: [{ value: "" }],
    instructions: "",
};

const fieldClass = "mb-6 text-lg md:px-6";

/**
 * Second step of creating a recipe: the user adds one or more components
 * (e.g. "dough", "filling"), each with its own ingredients and instructions,
 * and then saves them all at once.
 */
export default function AddComponentsPage() {
    const recipeId = Number(useParams().id);
    const navigate = useNavigate();

    const [components, setComponents] = useState<ComponentFormValues[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<ComponentForm>({ defaultValues: EMPTY_COMPONENT });

    const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });

    const addComponent = (data: ComponentForm) => {
        setComponents((prev) => [
            ...prev,
            {
                name: data.name.trim(),
                instructions: data.instructions.trim(),
                ingredients: data.ingredients.map((ingredient) => ingredient.value.trim()).filter(Boolean),
                image: data.image?.[0] ?? null,
            },
        ]);
        reset(EMPTY_COMPONENT);
        setIsFormOpen(false);
    };

    const saveAll = async () => {
        setIsSaving(true);
        try {
            await componentApi.create(recipeId, components);
            toast.success("Komponente su spremljene!");
            navigate(`/recipedetails/${recipeId}`);
        } catch (error) {
            // Stay on the page so the user doesn't lose what they entered.
            toast.error(getErrorMessage(error, "Komponente nisu spremljene."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <RecipeFormLayout
            instructionsTitle="Unesite jednu ili više komponenti:"
            instructions={[
                "Naziv komponente (obavezno)",
                "Slika komponente (opcionalno)",
                "Sastojci (barem jedan)",
                "Upute (obavezno)",
            ]}
        >
            <div className="flex min-h-[70vh] flex-col justify-between">
                {components.length > 0 && (
                    <div>
                        <h1 className="mb-4 text-center text-4xl font-bold">Komponente</h1>
                        <ol className="mb-8 list-inside list-decimal space-y-2 text-xl font-semibold md:px-6">
                            {components.map((component, index) => (
                                <li key={`${component.name}-${index}`}>
                                    <span className="inline-flex w-[calc(100%-2rem)] items-center justify-between">
                                        {component.name}
                                        <button
                                            type="button"
                                            onClick={() => setComponents((prev) => prev.filter((_, i) => i !== index))}
                                            className="ml-4 rounded-lg bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-700"
                                        >
                                            Obriši
                                        </button>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {!isFormOpen ? (
                    <div className="mb-8 md:px-6">
                        {components.length === 0 && (
                            <h2 className="mt-4 mb-4 text-3xl text-black">Ovaj recept još nema komponenti.</h2>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(true)}
                            className="rounded-lg bg-green-500 px-4 py-2 text-xl text-white hover:bg-green-700"
                        >
                            Dodaj komponentu
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(addComponent)} noValidate>
                        <h2 className="mb-6 text-center text-4xl font-bold">Unos komponente</h2>

                        <FormField
                            label="Naziv komponente"
                            htmlFor="component-name"
                            error={errors.name?.message}
                            className={fieldClass}
                        >
                            <input
                                id="component-name"
                                placeholder="npr. Tijesto"
                                className={inputClassName}
                                {...register("name", {
                                    required: "Naziv je obavezan",
                                    minLength: { value: 3, message: "Naziv mora imati barem 3 znaka" },
                                })}
                            />
                        </FormField>

                        <FormField
                            label="Slika komponente (opcionalno)"
                            htmlFor="component-image"
                            error={errors.image?.message}
                            className={fieldClass}
                        >
                            <input
                                id="component-image"
                                type="file"
                                accept="image/png, image/jpeg"
                                className={inputClassName}
                                {...register("image", { validate: maxFileSize })}
                            />
                        </FormField>

                        <fieldset className={fieldClass}>
                            <legend className="mb-2 font-medium text-gray-800">Sastojci</legend>
                            {fields.map((field, index) => (
                                <div key={field.id} className="mb-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            aria-label={`Sastojak ${index + 1}`}
                                            placeholder={`Sastojak ${index + 1}`}
                                            className={inputClassName}
                                            {...register(`ingredients.${index}.value`, {
                                                validate: (value) => value.trim() !== "" || "Sastojak je obavezan",
                                            })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            disabled={fields.length === 1}
                                            aria-label={`Ukloni sastojak ${index + 1}`}
                                            className="rounded-lg bg-red-500 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-40"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    {errors.ingredients?.[index]?.value && (
                                        <p role="alert" className="mt-1 text-sm text-red-500">
                                            {errors.ingredients[index]?.value?.message}
                                        </p>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => append({ value: "" })}
                                className="mt-2 rounded-lg bg-indigo-500 px-4 py-2 text-white hover:bg-indigo-700"
                            >
                                Dodaj sastojak
                            </button>
                        </fieldset>

                        <FormField
                            label="Upute"
                            htmlFor="component-instructions"
                            error={errors.instructions?.message}
                            className={fieldClass}
                        >
                            <textarea
                                id="component-instructions"
                                rows={5}
                                placeholder="Opišite postupak pripreme"
                                className={inputClassName}
                                {...register("instructions", {
                                    required: "Upute su obavezne",
                                    minLength: { value: 10, message: "Upute moraju imati barem 10 znakova" },
                                })}
                            />
                        </FormField>

                        <div className="mb-8 flex justify-center gap-4">
                            <button
                                type="submit"
                                className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
                            >
                                Dodaj na popis
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    reset(EMPTY_COMPONENT);
                                    setIsFormOpen(false);
                                }}
                                className="rounded-lg bg-[#E30C37] px-4 py-2 text-white hover:bg-red-500"
                            >
                                Odustani
                            </button>
                        </div>
                    </form>
                )}

                {components.length > 0 && !isFormOpen && (
                    <div className="mt-auto flex justify-center pt-4">
                        <button
                            type="button"
                            onClick={saveAll}
                            disabled={isSaving}
                            className="rounded-lg bg-green-600 px-6 py-3 text-xl text-white hover:bg-green-700 disabled:opacity-60"
                        >
                            {isSaving ? "Spremanje..." : "Spremi komponente"}
                        </button>
                    </div>
                )}
            </div>
        </RecipeFormLayout>
    );
}
