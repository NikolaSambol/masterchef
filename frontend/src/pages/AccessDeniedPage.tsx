import { FaExclamationTriangle } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function AccessDeniedPage() {
    return (
        <div className="flex flex-1 items-center justify-center bg-gray-100 px-4 py-16">
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <div className="mb-4 flex justify-center text-6xl text-yellow-500">
                    <FaExclamationTriangle aria-hidden="true" />
                </div>
                <h1 className="mb-2 text-3xl font-bold">Pristup odbijen</h1>
                <p className="mb-6 text-gray-600">Nemate prava pristupa ovoj stranici.</p>
                <Link
                    to="/"
                    className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition duration-200 hover:bg-blue-700"
                >
                    Natrag na početnu stranicu
                </Link>
            </div>
        </div>
    );
}
