import { Link } from "react-router-dom";
import type { Recipe } from "../../types";
import { formatDate, fullName } from "../../utils/format";
import { imageSrc } from "../../utils/media";

/** One recipe tile in a grid: image, name, author, preparation time and date. */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
    return (
        <Link
            to={`/recipedetails/${recipe.id}`}
            className="flex flex-col rounded-lg border border-gray-200 bg-[#BAE0FF] shadow-sm transition-transform hover:-translate-y-1 hover:bg-blue-300 hover:shadow-lg"
        >
            {recipe.image ? (
                <img
                    className="h-48 w-full rounded-t-lg object-cover"
                    src={imageSrc(recipe.image)}
                    alt={recipe.recipeName}
                    loading="lazy"
                />
            ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-gray-300">
                    <span className="text-gray-600">Nema slike</span>
                </div>
            )}

            <div className="p-4 text-left text-black">
                <h3 className="mb-2 text-2xl font-bold tracking-tight">{recipe.recipeName}</h3>
                <p className="mb-1">Autor: {fullName(recipe.user)}</p>
                <p className="mb-1">Vrijeme pripreme: {recipe.preparationTime}</p>
                <p>Datum objave: {formatDate(recipe.creationDate)}</p>
            </div>
        </Link>
    );
}

export function RecipeCardSkeleton() {
    return (
        <div aria-hidden="true" className="flex animate-pulse flex-col rounded-lg bg-gray-200 shadow-sm">
            <div className="h-48 w-full rounded-t-lg bg-gray-300" />
            <div className="space-y-2 p-4">
                <div className="h-6 w-3/4 rounded bg-gray-300" />
                <div className="h-4 w-1/2 rounded bg-gray-300" />
                <div className="h-4 w-2/3 rounded bg-gray-300" />
            </div>
        </div>
    );
}
