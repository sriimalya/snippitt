import React, { useState } from "react";

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  className?: string;
  id?: string;
  name?: string;
  validate?: (value: string) => string | null;
  textarea?: boolean;
  rows?: number;
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
  textarea = false,
  rows = 3,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    setError(validate(value));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(e);

    // revalidate while typing
    if (error) {
      setError(validate(e.target.value));
    }
  };
  const inputClasses = `w-full px-3 py-2.5 border rounded-3xl bg-[#F4F6FF] 
  focus:outline-none focus:ring-1 focus:ring-[#5865F2] focus:border-[#5865F2] 
  text-black text-sm transition-all ${
    error ? "border-red-500 focus:ring-red-500" : "border-[#5865F2]/40"
  }`;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-slate-600 mb-1"
        >
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
            onChange={handleChange}
            onBlur={handleBlur}
            rows={rows}
            className={inputClasses}
          />
        ) : (
          <input
            type="text"
            id={id}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            className={inputClasses}
          />
        )}
      </div>

      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default TextInput;
