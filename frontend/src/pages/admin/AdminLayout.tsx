import { useEffect, useState } from "react";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { FaBars, FaUsers } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded px-4 py-2.5 transition duration-200 hover:bg-gray-700 ${
        isActive ? "bg-gray-700" : ""
    }`;

/** Admin area: sidebar on the left, the selected admin page on the right. */
export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { pathname } = useLocation();

    // Close the mobile sidebar after navigating.
    useEffect(() => setIsSidebarOpen(false), [pathname]);

    return (
        <div className="flex min-h-screen bg-[#FCFAF9]">
            <aside
                className={`w-64 shrink-0 space-y-6 bg-gray-800 px-2 py-7 text-white ${
                    isSidebarOpen ? "block" : "hidden"
                } md:block`}
            >
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-2xl font-semibold">Admin panel</h2>
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Zatvori izbornik"
                        className="text-2xl md:hidden"
                    >
                        <IoMdClose />
                    </button>
                </div>
                <nav className="mt-6">
                    <NavLink to="users" className={linkClass}>
                        <FaUsers /> Svi korisnici
                    </NavLink>
                    <NavLink to="categories" className={linkClass}>
                        <BiSolidCategoryAlt /> Kategorije recepata
                    </NavLink>
                </nav>
            </aside>

            <div className="flex-1 p-4 md:p-8">
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Otvori izbornik"
                    className="mb-4 text-xl md:hidden"
                >
                    <FaBars />
                </button>
                <Outlet />
            </div>
        </div>
    );
}

/** Shown at /admin before a section is chosen. */
export function AdminWelcome() {
    return (
        <div className="flex h-full flex-col items-center justify-center text-center">
            <h1 className="mb-4 text-4xl font-bold text-gray-800">Dobrodošli u admin panel</h1>
            <p className="max-w-xl text-lg text-gray-600">
                Ovdje možete upravljati korisnicima i kategorijama recepata. Koristite izbornik s lijeve strane za
                navigaciju.
            </p>
        </div>
    );
}
