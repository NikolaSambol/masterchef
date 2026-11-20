export function PageLoader({ text = "Učitavanje..." }: { text?: string }) {
    return (
        <div role="status" className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gray-600">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-[#4056A1]" />
            <span>{text}</span>
        </div>
    );
}
