import Select, { type StylesConfig } from "react-select";
import type { Category } from "../../types";

interface Option {
    value: number;
    label: string;
}

interface CategorySelectProps {
    categories: Category[];
    value: number | null | undefined;
    onChange: (categoryId: number | null) => void;
    onBlur?: () => void;
    inputId?: string;
    isLoading?: boolean;
}

const styles: StylesConfig<Option, false> = {
    control: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "white" : "rgba(255, 255, 255, 0.1)",
        borderColor: "black",
        borderWidth: "2px",
        borderRadius: "0.5rem",
        boxShadow: state.isFocused ? "0 0 0 1px black" : "none",
        padding: "2px",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "#E5E5E5" : "white",
        color: "black",
        padding: "10px",
    }),
    singleValue: (base) => ({ ...base, color: "black" }),
    placeholder: (base) => ({ ...base, color: "black" }),
    dropdownIndicator: (base) => ({ ...base, color: "black" }),
    indicatorSeparator: () => ({ display: "none" }),
};

/** Searchable category dropdown used by the add and edit recipe forms. */
export function CategorySelect({ categories, value, onChange, onBlur, inputId, isLoading }: CategorySelectProps) {
    const options: Option[] = categories.map((category) => ({ value: category.id, label: category.categoryName }));

    return (
        <Select<Option, false>
            inputId={inputId}
            options={options}
            value={options.find((option) => option.value === value) ?? null}
            onChange={(option) => onChange(option?.value ?? null)}
            onBlur={onBlur}
            isLoading={isLoading}
            placeholder="Pretraži ili odaberi..."
            noOptionsMessage={() => "Nema kategorija"}
            isClearable
            styles={styles}
        />
    );
}
