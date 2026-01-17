import React, { useState } from "react";

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
  id?: string;
  name?: string;
  validate?: (value: string) => string | null;
  textarea?: boolean; // New prop
  rows?: number; // For textarea only
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  placeholder = "Enter text",
  value,
  onChange,
  className = "",
  id,
  name,
  validate = (value) => (!value.trim() ? "This field cannot be empty." : null),
  textarea = false, // Default to false
  rows = 3, // Default rows for textarea
}) => {
  const [error, setError] = useState<string | null>(null);
  // const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    // setTouched(true);
    setError(validate(value));
  };

  // Keep all original styling classes exactly as they were
  const inputClasses = `w-full px-3 py-2.5 border rounded-3xl bg-[#E1E9F2] focus:outline-none focus:ring-1 focus:ring-[#94BBFF] focus:border-[#94BBFF] text-black text-sm transition-all ${
    error ? "border-red-500 focus:ring-red-500" : "border-[#94BBFF]"
  }`;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-small font-semibold text-slate-600 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {textarea ? (
          <textarea
            id={id}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={handleBlur}
            rows={rows}
            className={inputClasses} // Using the same classes
          />
        ) : (
          <input
            type="text"
            id={id}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onBlur={handleBlur}
            className={inputClasses} // Original styling preserved
          />
        )}
      </div>

      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default TextInput;