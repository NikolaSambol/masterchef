/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Base URL of the backend API, e.g. http://localhost:8080/api (set in .env / .env.production). */
    readonly VITE_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
