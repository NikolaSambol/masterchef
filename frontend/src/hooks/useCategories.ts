import { categoryApi } from "../api/categoryApi";
import { useAsync } from "./useAsync";

export function useCategories() {
    const { data, isLoading, error, reload } = useAsync(categoryApi.getAll);
    return { categories: data ?? [], isLoading, error, reload };
}
