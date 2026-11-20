import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls to the top on every page change (the browser doesn't do this for client-side navigation). */
export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
