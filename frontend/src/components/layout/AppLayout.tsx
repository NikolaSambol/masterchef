import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router-dom";
import { PageLoader } from "../ui/PageLoader";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { ScrollToTop } from "./ScrollToTop";

/** Shared page frame: navbar on top, footer at the bottom, the current page in between. */
export function AppLayout() {
    return (
        <>
            <ScrollToTop />
            <Navbar />
            <Toaster position="bottom-center" />
            <main className="mt-24 flex min-h-[calc(100vh-96px)] flex-col">
                {/* Pages are loaded lazily (see App.tsx); show a spinner while their code downloads. */}
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </main>
            <Footer />
        </>
    );
}
