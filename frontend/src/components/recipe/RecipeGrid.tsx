import type { ReactNode } from "react";
import type { Recipe } from "../../types";
import { RecipeCard, RecipeCardSkeleton } from "./RecipeCard";

interface RecipeGridProps {
    recipes: Recipe[];
    isLoading?: boolean;
    /** How many skeleton tiles to show while loading. */
    skeletonCount?: number;
    emptyMessage?: ReactNode;
}

export function RecipeGrid({ recipes, isLoading = false, skeletonCount = 6, emptyMessage }: RecipeGridProps) {
    if (!isLoading && recipes.length === 0) {
        return <div className="py-10 text-center text-gray-600">{emptyMessage ?? "Nema recepata."}</div>;
    }

    return (
        <div className="mx-auto grid w-full max-w-7xl place-items-stretch gap-6 px-5 py-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading
                ? Array.from({ length: skeletonCount }, (_, i) => <RecipeCardSkeleton key={i} />)
                : recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
    );
}
