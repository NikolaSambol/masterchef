import { useCallback, useEffect, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useSearchParams } from "react-router-dom";
import { recipeApi } from "../../api/recipeApi";
import { AddRecipeFab } from "../../components/recipe/AddRecipeFab";
import { RecipeGrid } from "../../components/recipe/RecipeGrid";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { useAsync } from "../../hooks/useAsync";
import { useCategories } from "../../hooks/useCategories";

const PAGE_SIZE = 6;

/**
 * Paginated, filterable list of all recipes.
 *
 * The search text, category and page live in the URL (?q=...&category=...&page=...),
 * so filtered results can be bookmarked or shared, and the browser back button works.
 */
export default function AllRecipesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get("q") ?? "";
    const categoryId = searchParams.get("category") ? Number(searchParams.get("category")) : null;
    const page = Math.max(Number(searchParams.get("page") ?? 0) || 0, 0);

    const [searchInput, setSearchInput] = useState(query);
    // Keep the input in sync when the query changes from outside (e.g. the navbar search).
    useEffect(() => setSearchInput(query), [query]);

    const { categories } = useCategories();

    const loadRecipes = useCallback(
        (signal: AbortSignal) => recipeApi.getPage({ page, size: PAGE_SIZE, categoryId, recipeName: query }, signal),
        [page, categoryId, query],
    );
    const { data, isLoading, error, reload } = useAsync(loadRecipes);
    const totalPages = data?.totalPages ?? 0;

    /** Updates some URL params; any filter change jumps back to the first page. */
    const updateParams = (changes: Record<string, string | null>) => {
        setSearchParams((params) => {
            const next = new URLSearchParams(params);
            Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
            if (!("page" in changes)) next.delete("page");
            return next;
        });
    };

    return (
        <div className="w-full">
            <form
                role="search"
                onSubmit={(event) => {
                    event.preventDefault();
                    updateParams({ q: searchInput.trim() || null });
                }}
                className="mx-auto mt-4 flex max-w-7xl flex-col gap-4 px-5 md:flex-row"
            >
                <input
                    type="search"
                    aria-label="Pretraži po nazivu"
                    placeholder="Pretraži po nazivu..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="flex-1 rounded border p-2"
                />
                <button type="submit" className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600">
                    Traži
                </button>
                <select
                    aria-label="Kategorija"
                    value={categoryId ?? ""}
                    onChange={(event) => updateParams({ category: event.target.value || null })}
                    className="w-full rounded border p-2 md:w-auto"
                >
                    <option value="">Sve kategorije</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.categoryName}
                        </option>
                    ))}
                </select>
            </form>

            {error ? (
                <ErrorMessage error={error} onRetry={reload} />
            ) : (
                <RecipeGrid
                    recipes={data?.content ?? []}
                    isLoading={isLoading}
                    skeletonCount={PAGE_SIZE}
                    emptyMessage="Nema recepata koji odgovaraju pretrazi."
                />
            )}

            {totalPages > 1 && (
                <nav aria-label="Stranice" className="mt-6 mb-10 flex items-center justify-center gap-4">
                    <button
                        type="button"
                        onClick={() => updateParams({ page: String(page - 1) })}
                        disabled={page === 0}
                        aria-label="Prethodna stranica"
                        className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                    >
                        <IoIosArrowBack size={24} />
                    </button>
                    <span className="font-semibold text-black">
                        Stranica {page + 1} od {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => updateParams({ page: String(page + 1) })}
                        disabled={page + 1 >= totalPages}
                        aria-label="Sljedeća stranica"
                        className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                    >
                        <IoIosArrowForward size={24} />
                    </button>
                </nav>
            )}

            <AddRecipeFab />
        </div>
    );
}
