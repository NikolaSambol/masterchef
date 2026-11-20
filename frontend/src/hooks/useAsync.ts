import { useCallback, useEffect, useState } from "react";

interface AsyncState<T> {
    data: T | undefined;
    error: unknown;
    isLoading: boolean;
}

/**
 * Runs an async loader when the component mounts (and whenever the loader changes),
 * and tracks its data / loading / error state.
 *
 * Wrap the loader in `useCallback` so it only changes when its inputs change:
 *
 *   const loadRecipe = useCallback((signal: AbortSignal) => recipeApi.getById(id, signal), [id]);
 *   const { data: recipe, isLoading, error, reload } = useAsync(loadRecipe);
 *
 * The AbortSignal cancels the request when the component unmounts or the inputs change,
 * so a slow old response can never overwrite a newer one.
 */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>) {
    const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: undefined, isLoading: true });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

        loader(controller.signal).then(
            (data) => {
                if (!controller.signal.aborted) setState({ data, error: undefined, isLoading: false });
            },
            (error: unknown) => {
                if (!controller.signal.aborted) setState({ data: undefined, error, isLoading: false });
            },
        );

        return () => controller.abort();
    }, [loader, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    /** Update the data locally, e.g. to remove a deleted row without re-fetching. */
    const setData = useCallback((update: (prev: T | undefined) => T) => {
        setState((prev) => ({ ...prev, data: update(prev.data) }));
    }, []);

    return { ...state, reload, setData };
}
