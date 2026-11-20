import { type FormEvent, useEffect, useRef, useState } from "react";
import { BiSolidFoodMenu } from "react-icons/bi";
import { CgLogOut } from "react-icons/cg";
import { FaRegUserCircle, FaSearch, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import { ImProfile } from "react-icons/im";
import { RiAdminFill } from "react-icons/ri";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fullName } from "../../utils/format";

const menuItemClass = "flex w-full items-center gap-2 px-4 py-2 transition-colors hover:bg-gray-100";

export function Navbar() {
    const { isAuthenticated, isAdmin, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [search, setSearch] = useState("");
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close all menus whenever the page changes.
    useEffect(() => {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Close the user dropdown when clicking outside of it.
    useEffect(() => {
        if (!isUserMenuOpen) return;
        const onPointerDown = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [isUserMenuOpen]);

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const query = search.trim();
        if (!query) return;
        navigate(`/allrecipes?q=${encodeURIComponent(query)}`);
        setSearch("");
        setIsMobileMenuOpen(false);
    };

    const handleLogout = () => {
        navigate("/");
        logout();
    };

    return (
        <nav className="fixed top-0 left-0 z-50 h-24 w-full bg-[#4056A1] px-4 py-4 text-white shadow-md">
            <div className="relative flex h-16 items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 text-3xl font-bold hover:underline">
                    <BiSolidFoodMenu className="text-5xl" aria-hidden="true" />
                    Masterchef
                </Link>

                {/* Search + "all recipes" link (desktop) */}
                <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 md:flex">
                    <form onSubmit={handleSearchSubmit} role="search" className="relative">
                        <input
                            type="search"
                            aria-label="Pretraži recepte"
                            placeholder="Pretraži recepte..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-64 rounded-full border border-gray-100 bg-transparent py-1 pr-4 pl-10 text-white placeholder-white focus:ring-2 focus:ring-white focus:outline-none"
                        />
                        <button type="submit" aria-label="Traži" className="absolute top-1/2 left-3 -translate-y-1/2">
                            <FaSearch />
                        </button>
                    </form>

                    <NavLink
                        to="/allrecipes"
                        className={({ isActive }) => `text-lg hover:underline ${isActive ? "font-semibold" : ""}`}
                    >
                        Svi recepti
                    </NavLink>
                </div>

                {/* User menu */}
                <div className="flex items-center gap-4">
                    {user && <span className="hidden sm:inline">{fullName(user)}</span>}
                    <div className="relative" ref={userMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsUserMenuOpen((open) => !open)}
                            aria-label="Korisnički izbornik"
                            aria-haspopup="menu"
                            aria-expanded={isUserMenuOpen}
                            className="text-3xl text-white"
                        >
                            <FaRegUserCircle />
                        </button>

                        {isUserMenuOpen && (
                            <div
                                role="menu"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="absolute right-0 z-50 mt-2 w-44 rounded-lg bg-white py-2 text-black shadow-lg"
                            >
                                {!isAuthenticated && (
                                    <>
                                        <Link to="/signin" role="menuitem" className={menuItemClass}>
                                            <FaSignInAlt /> Prijava
                                        </Link>
                                        <Link to="/signup" role="menuitem" className={menuItemClass}>
                                            <FaUserPlus /> Registracija
                                        </Link>
                                    </>
                                )}
                                {isAdmin && (
                                    <Link to="/admin" role="menuitem" className={menuItemClass}>
                                        <RiAdminFill /> Admin
                                    </Link>
                                )}
                                {isAuthenticated && (
                                    <>
                                        <Link to="/useredit" role="menuitem" className={menuItemClass}>
                                            <ImProfile /> Moj profil
                                        </Link>
                                        <Link to="/alluserrecipes" role="menuitem" className={menuItemClass}>
                                            <BiSolidFoodMenu /> Moji recepti
                                        </Link>
                                        <button
                                            type="button"
                                            role="menuitem"
                                            onClick={handleLogout}
                                            className={menuItemClass}
                                        >
                                            <CgLogOut /> Odjava
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating menu button with search (mobile only) */}
            <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2 md:hidden">
                {isMobileMenuOpen && (
                    <div className="mb-2 flex w-72 flex-col items-end rounded-lg bg-white p-4 shadow-lg">
                        <form onSubmit={handleSearchSubmit} role="search" className="relative mb-3 w-full">
                            <input
                                type="search"
                                aria-label="Pretraži recepte"
                                placeholder="Pretraži recepte..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-full rounded-full bg-gray-100 py-2 pr-4 pl-10 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#4056A1] focus:outline-none"
                            />
                            <button
                                type="submit"
                                aria-label="Traži"
                                className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
                            >
                                <FaSearch />
                            </button>
                        </form>

                        <Link
                            to="/allrecipes"
                            className="w-full rounded-full bg-[#5a6fc1] px-4 py-2 text-center text-sm text-white shadow-md transition-all duration-200 hover:bg-[#6d80e0]"
                        >
                            Svi recepti
                        </Link>
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                    aria-label={isMobileMenuOpen ? "Zatvori izbornik" : "Otvori izbornik"}
                    aria-expanded={isMobileMenuOpen}
                    className="flex h-14 w-14 flex-col items-center justify-center gap-[4px] rounded-full bg-[#4056A1] text-white shadow-lg"
                >
                    <span className="h-0.5 w-6 bg-white" />
                    <span className="h-0.5 w-6 bg-white" />
                    <span className="h-0.5 w-6 bg-white" />
                </button>
            </div>
        </nav>
    );
}
