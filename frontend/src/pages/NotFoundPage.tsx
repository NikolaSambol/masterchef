import { FaUtensils } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-16">
            <FaUtensils className="mb-4 text-7xl text-green-500" aria-hidden="true" />
            <h1 className="mb-2 text-3xl font-bold">Oops!</h1>
            <p className="mb-6 max-w-md text-center text-gray-600">
                Izgleda da ono što ste tražili nije pronađeno. Možda je sadržaj obrisan ili premješten.
            </p>
            <Link to="/" className="rounded bg-green-500 px-6 py-2 text-white shadow hover:bg-green-600">
                Vrati se na početnu stranicu
            </Link>
        </div>
    );
}
