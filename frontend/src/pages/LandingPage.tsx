import { useCallback } from "react";
import { Link } from "react-router-dom";
import { recipeApi } from "../api/recipeApi";
import { AddRecipeFab } from "../components/recipe/AddRecipeFab";
import { RecipeGrid } from "../components/recipe/RecipeGrid";
import { useAuth } from "../context/AuthContext";
import { useAsync } from "../hooks/useAsync";

const LATEST_COUNT = 3;
const buttonClass =
    "rounded-xl bg-[#4056A1] px-6 py-3 text-lg font-semibold text-white shadow transition hover:bg-[#857dff]";

export default function LandingPage() {
    const { isAuthenticated } = useAuth();

    // The front page endpoint returns recipes oldest first; show the newest few, newest first.
    const loadLatest = useCallback(
        async (signal: AbortSignal) => (await recipeApi.getFrontPage(signal)).slice(-LATEST_COUNT).reverse(),
        [],
    );
    const { data: recipes, isLoading } = useAsync(loadLatest);

    return (
        <div className="min-h-screen bg-[#FFF9F5] p-6">
            <section className="mx-auto max-w-5xl py-10 text-center">
                <h1 className="mb-6 text-5xl font-bold text-[#2D3748]">
                    Dobrodošli u <span className="text-[#E30C37]">Masterchef App</span>!
                </h1>
                <p className="mb-4 text-lg text-[#4A5568]">
                    Masterchef App je vaša kulinarska oaza – otkrijte raznovrsne recepte, pronađite novu inspiraciju,
                    učite kroz savjete drugih članova i postanite dio zajednice zaljubljenika u kuhanje.
                </p>

                <div className="mb-10 flex flex-col justify-center gap-4 pt-4 md:flex-row">
                    <Link to="/allrecipes" className={buttonClass}>
                        Pregledaj sve recepte
                    </Link>
                    {isAuthenticated && (
                        <Link to="/addrecipe" className={buttonClass}>
                            Dodaj novi recept
                        </Link>
                    )}
                </div>

                {!isAuthenticated && (
                    <>
                        <p className="mb-8 text-lg text-[#4A5568]">
                            Pregledajte našu bogatu kolekciju recepata ili se pridružite zajednici – registrirajte se i
                            podijelite vlastite kulinarske kreacije. Već ste član? Prijavite se i nastavite s
                            istraživanjem!
                        </p>
                        <div className="mb-6 flex flex-col justify-center gap-4 md:flex-row">
                            <Link to="/signin" className={buttonClass}>
                                Prijava
                            </Link>
                            <Link to="/signup" className={buttonClass}>
                                Registracija
                            </Link>
                        </div>
                    </>
                )}
            </section>

            <section className="mx-auto max-w-7xl px-4 py-6">
                <h2 className="mb-6 text-center text-3xl font-bold text-[#2D3748]">
                    Istraži najnovije recepte iz naše zajednice
                </h2>
                <RecipeGrid
                    recipes={recipes ?? []}
                    isLoading={isLoading}
                    skeletonCount={LATEST_COUNT}
                    emptyMessage="Još nema recepata. Budite prvi koji će ga dodati!"
                />
            </section>

            <AddRecipeFab />
        </div>
    );
}
