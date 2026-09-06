export default function FormField({
  label,
  htmlFor,
  error,
  helpText,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink/80">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="mt-1 text-xs text-ink/40">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`focus-ring w-full rounded-sm border border-ink/20 bg-parchment px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40 ${className}`}
      {...props}
    />
  );
}
