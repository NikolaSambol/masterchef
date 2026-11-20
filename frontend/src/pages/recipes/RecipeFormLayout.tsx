import type { ReactNode } from "react";

interface RecipeFormLayoutProps {
    instructionsTitle: string;
    instructions: string[];
    children: ReactNode;
}

/** Two-column layout used by "add recipe" and "add components": instructions on the left, form on the right. */
export function RecipeFormLayout({ instructionsTitle, instructions, children }: RecipeFormLayoutProps) {
    return (
        <div className="flex min-h-screen justify-center bg-[#FCFAF9]">
            <div className="grid h-full w-full gap-4 p-4 md:w-[90%] md:p-8 lg:w-[80%] lg:grid-cols-10">
                <aside className="flex flex-col items-start rounded bg-[#CECECE] p-4 shadow lg:col-span-3">
                    <h2 className="mb-2 self-center text-3xl font-bold lg:text-4xl">Upute za unos</h2>
                    <img src="/images/recipeImage.png" alt="" width={150} className="self-center" />
                    <h3 className="mt-8 mb-4 text-2xl text-black lg:text-3xl">{instructionsTitle}</h3>
                    <ul className="list-inside list-disc pb-6 text-left text-lg text-gray-700 md:text-xl">
                        {instructions.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </aside>

                <section className="rounded bg-[#BAE0FF] p-4 shadow lg:col-span-7">{children}</section>
            </div>
        </div>
    );
}
