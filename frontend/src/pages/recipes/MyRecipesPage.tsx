import { Link } from "react-router-dom";
import { recipeApi } from "../../api/recipeApi";
import { AddRecipeFab } from "../../components/recipe/AddRecipeFab";
import { RecipeGrid } from "../../components/recipe/RecipeGrid";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { useAsync } from "../../hooks/useAsync";

export default function MyRecipesPage() {
    const { data: recipes, isLoading, error, reload } = useAsync(recipeApi.getMine);

    return (
        <div className="w-full">
            <h1 className="mt-6 text-center text-3xl font-bold text-[#2D3748]">Moji recepti</h1>
            {error ? (
                <ErrorMessage error={error} onRetry={reload} />
            ) : (
                <RecipeGrid
                    recipes={recipes ?? []}
                    isLoading={isLoading}
                    emptyMessage={
                        <>
                            Još niste dodali nijedan recept.{" "}
                            <Link to="/addrecipe" className="font-medium text-[#4056A1] underline">
                                Dodajte prvi!
                            </Link>
                        </>
                    }
                />
            )}
            <AddRecipeFab />
        </div>
    );
}
