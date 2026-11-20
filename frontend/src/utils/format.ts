const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Formats a backend date ("2025-06-01" or "2025-06-01T12:30:00") as "01.06.2025".
 *
 * The date part is read directly from the string instead of going through `new Date()`,
 * because `new Date("2025-06-01")` is interpreted as UTC midnight and can show the
 * previous day in time zones west of UTC.
 */
export function formatDate(value: string | null | undefined): string {
    if (!value) return "";
    const match = ISO_DATE.exec(value);
    if (!match) return value;
    const [, year, month, day] = match;
    return `${day}.${month}.${year}`;
}

export function fullName(person: { name: string; surname: string } | null | undefined): string {
    return person ? `${person.name} ${person.surname}`.trim() : "";
}
