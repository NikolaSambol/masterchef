import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { componentApi } from "../../api/componentApi";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { PageLoader } from "../../components/ui/PageLoader";
import { useAsync } from "../../hooks/useAsync";
import type { RecipeComponent } from "../../types";
import { getErrorMessage } from "../../utils/errors";
import { isFileTooLarge, MAX_UPLOAD_MB } from "../../utils/files";
import { imageSrc } from "../../utils/media";

interface UpdateComponentsFormProps {
    recipeId: number;
    onSaved: () => void;
    onCancel: () => void;
}

/** A component as edited in the form. `id` is null for components that aren't saved yet. */
interface EditableComponent {
    key: string;
    id: number | null;
    name: string;
    instructions: string;
    ingredients: string[];
    imagePath: string | null;
    newImage: File | null;
}

type Errors = Record<string, string>;

let nextKey = 0;
const newKey = () => `new-${nextKey++}`;

function toEditable(component: RecipeComponent): EditableComponent {
    return {
        key: `existing-${component.id}`,
        id: component.id,
        name: component.componentName,
        instructions: component.instruction ?? "",
        // The backend stores ingredients as one comma-separated string.
        ingredients: component.ingredients
            ? component.ingredients
                  .split(",")
                  .map((ingredient) => ingredient.trim())
                  .filter(Boolean)
            : [""],
        imagePath: component.imagePath,
        newImage: null,
    };
}

function validate(components: EditableComponent[]): Errors {
    const errors: Errors = {};
    components.forEach((component) => {
        if (!component.name.trim()) errors[`${component.key}.name`] = "Naziv komponente je obavezan.";
        if (component.instructions.trim().length < 10) {
            errors[`${component.key}.instructions`] = "Upute moraju imati najmanje 10 znakova.";
        }
        if (component.ingredients.every((ingredient) => !ingredient.trim())) {
            errors[`${component.key}.ingredients`] = "Potreban je barem jedan sastojak.";
        }
        if (isFileTooLarge(component.newImage)) {
            errors[`${component.key}.image`] = `Slika je prevelika (najviše ${MAX_UPLOAD_MB} MB).`;
        }
    });
    return errors;
}

/** Loads the recipe's components, then shows the editor. */
export function UpdateComponentsForm({ recipeId, onSaved, onCancel }: UpdateComponentsFormProps) {
    const load = useCallback((signal: AbortSignal) => componentApi.getForRecipe(recipeId, signal), [recipeId]);
    const { data, isLoading, error, reload } = useAsync(load);

    if (isLoading) return <PageLoader text="Učitavanje komponenti..." />;
    if (error || !data) return <ErrorMessage error={error} onRetry={reload} />;

    return (
        <ComponentsEditor recipeId={recipeId} initial={data.map(toEditable)} onSaved={onSaved} onCancel={onCancel} />
    );
}

interface ComponentsEditorProps extends UpdateComponentsFormProps {
    initial: EditableComponent[];
}

function ComponentsEditor({ recipeId, initial, onSaved, onCancel }: ComponentsEditorProps) {
    const [components, setComponents] = useState<EditableComponent[]>(
        initial.length > 0 ? initial : [emptyComponent()],
    );
    /** Saved components the user removed; they are deleted on the server when saving. */
    const [removedIds, setRemovedIds] = useState<number[]>([]);
    const [errors, setErrors] = useState<Errors>({});
    const [isSaving, setIsSaving] = useState(false);

    // All updates create new objects instead of mutating state, so React re-renders correctly.
    const update = (key: string, changes: Partial<EditableComponent>) =>
        setComponents((prev) => prev.map((c) => (c.key === key ? { ...c, ...changes } : c)));

    const updateIngredient = (key: string, index: number, value: string) =>
        setComponents((prev) =>
            prev.map((c) =>
                c.key === key ? { ...c, ingredients: c.ingredients.map((ing, i) => (i === index ? value : ing)) } : c,
            ),
        );

    const removeComponent = (component: EditableComponent) => {
        if (components.length === 1) {
            toast.error("Recept mora imati barem jednu komponentu.");
            return;
        }
        setComponents((prev) => prev.filter((c) => c.key !== component.key));
        if (component.id !== null) setRemovedIds((prev) => [...prev, component.id as number]);
    };

    const save = async () => {
        const validationErrors = validate(components);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            toast.error("Ispunite sva obavezna polja.");
            return;
        }

        setIsSaving(true);
        try {
            await Promise.all(removedIds.map((id) => componentApi.remove(id)));
            setRemovedIds([]);
            // New components are always at the end of the list, so the remaining saved components
            // keep their original order — the backend matches them to existing rows by position.
            await componentApi.update(
                recipeId,
                components.map((c) => ({
                    name: c.name.trim(),
                    instructions: c.instructions.trim(),
                    ingredients: c.ingredients.map((ing) => ing.trim()).filter(Boolean),
                    image: c.newImage,
                })),
            );
            toast.success("Komponente su ažurirane!");
            onSaved();
        } catch (error) {
            toast.error(getErrorMessage(error, "Komponente nisu ažurirane."));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form
            noValidate
            onSubmit={(event) => {
                event.preventDefault();
                void save();
            }}
        >
            <h2 className="mb-6 text-center text-2xl font-bold">Ažuriraj komponente</h2>

            {components.map((component, index) => (
                <section key={component.key} className="mb-8 border-b pb-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Komponenta {index + 1}</h3>
                        <button
                            type="button"
                            onClick={() => removeComponent(component)}
                            className="rounded bg-red-500 px-3 py-1 text-white"
                        >
                            Ukloni komponentu
                        </button>
                    </div>

                    <label htmlFor={`${component.key}-name`} className="mb-1 block font-semibold">
                        Naziv
                    </label>
                    <input
                        id={`${component.key}-name`}
                        type="text"
                        value={component.name}
                        onChange={(event) => update(component.key, { name: event.target.value })}
                        className="mb-1 w-full rounded border border-gray-300 px-3 py-2"
                    />
                    <FieldError message={errors[`${component.key}.name`]} />

                    <label htmlFor={`${component.key}-image`} className="mt-3 mb-1 block font-semibold">
                        Nova slika (opcionalno)
                    </label>
                    <input
                        id={`${component.key}-image`}
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(event) => update(component.key, { newImage: event.target.files?.[0] ?? null })}
                    />
                    {component.imagePath && !component.newImage && (
                        <img
                            src={imageSrc(component.imagePath)}
                            alt={`Trenutna slika: ${component.name}`}
                            className="mt-2 h-auto w-32 rounded"
                        />
                    )}
                    <FieldError message={errors[`${component.key}.image`]} />

                    <p className="mt-3 mb-1 font-semibold">Sastojci</p>
                    {component.ingredients.map((ingredient, ingredientIndex) => (
                        <div key={ingredientIndex} className="mb-2 flex gap-2">
                            <input
                                type="text"
                                aria-label={`Sastojak ${ingredientIndex + 1}`}
                                value={ingredient}
                                onChange={(event) =>
                                    updateIngredient(component.key, ingredientIndex, event.target.value)
                                }
                                className="flex-1 rounded border border-gray-300 px-3 py-2"
                            />
                            <button
                                type="button"
                                disabled={component.ingredients.length === 1}
                                onClick={() =>
                                    update(component.key, {
                                        ingredients: component.ingredients.filter((_, i) => i !== ingredientIndex),
                                    })
                                }
                                aria-label={`Ukloni sastojak ${ingredientIndex + 1}`}
                                className="rounded bg-red-500 px-3 py-1 text-white disabled:opacity-40"
                            >
                                −
                            </button>
                        </div>
                    ))}
                    <FieldError message={errors[`${component.key}.ingredients`]} />
                    <button
                        type="button"
                        onClick={() => update(component.key, { ingredients: [...component.ingredients, ""] })}
                        className="mb-4 rounded bg-green-500 px-3 py-1 text-white"
                    >
                        Dodaj sastojak
                    </button>

                    <label htmlFor={`${component.key}-instructions`} className="mb-1 block font-semibold">
                        Upute
                    </label>
                    <textarea
                        id={`${component.key}-instructions`}
                        rows={4}
                        value={component.instructions}
                        onChange={(event) => update(component.key, { instructions: event.target.value })}
                        className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                    <FieldError message={errors[`${component.key}.instructions`]} />
                </section>
            ))}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={() => setComponents((prev) => [...prev, emptyComponent()])}
                    className="rounded bg-green-500 px-4 py-2 text-white"
                >
                    Dodaj novu komponentu
                </button>
                <div className="flex gap-4">
                    <button type="button" onClick={onCancel} className="rounded bg-gray-300 px-4 py-2">
                        Odustani
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
                    >
                        {isSaving ? "Spremanje..." : "Spremi komponente"}
                    </button>
                </div>
            </div>
        </form>
    );
}

function emptyComponent(): EditableComponent {
    return { key: newKey(), id: null, name: "", instructions: "", ingredients: [""], imagePath: null, newImage: null };
}

function FieldError({ message }: { message?: string }) {
    return message ? (
        <p role="alert" className="mb-2 text-sm text-red-500">
            {message}
        </p>
    ) : null;
}
