/**
 * Types that mirror the DTOs returned by the Spring Boot backend.
 * Keep them in one place so every page agrees on the shape of the data.
 */

export type Role = "ROLE_USER" | "ROLE_ADMIN";

/** Author info embedded in recipes (backend: UserDTO). */
export interface UserSummary {
    name: string;
    surname: string;
    email: string;
}

/** Full user info (backend: UserInfoResponse). */
export interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
    role: Role[];
    enabled: boolean;
    creationDate: string;
}

export interface Category {
    id: number;
    categoryName: string;
}

/** Backend: ComponentDTO. `imagePath` actually holds a Base64-encoded image. */
export interface RecipeComponent {
    id: number;
    componentName: string;
    imagePath: string | null;
    ingredients: string;
    instruction: string;
}

/**
 * Backend: RecipeDTO. List endpoints leave `video`, `components` and `category` empty;
 * only the details endpoint fills them.
 */
export interface Recipe {
    id: number;
    recipeName: string;
    creationDate: string;
    image: string | null;
    video: string | null;
    preparationTime: string;
    components: RecipeComponent[] | null;
    category: { id: number | null; categoryName: string } | null;
    user: UserSummary;
}

/** Backend: RecipeSummaryDTO. */
export interface RecipeSummary {
    id: number;
    recipeName: string;
    creationDate: string;
}

/** Spring Data `Page<T>` (only the fields we use). */
export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

export interface LoginResponse {
    jwtToken: string;
    email: string;
}
