export default function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-red-200 bg-red-50 px-6 py-16 text-center">
      <h3 className="font-display text-xl text-red-800">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-red-600">
        {description || "An unexpected error occurred. Please try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="focus-ring mt-6 rounded-card border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}
