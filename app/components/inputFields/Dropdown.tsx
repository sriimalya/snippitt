import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  validate?: (value: string) => string | null;
  error?: string | null;
  required?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  className = "",
  id,
  name,
  placeholder = "Select an option",
  required = false,
  validate = (value) => (!value ? "This field cannot be empty." : null),
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    setError(validate(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e);

    if (error) {
      setError(validate(e.target.value));
    }
  };

  const inputClasses = `w-full px-3 py-2.5 border rounded-3xl bg-[#F4F6FF]
  focus:outline-none focus:ring-1 focus:ring-[#5865F2] focus:border-[#5865F2]
  text-black text-sm transition-all appearance-none ${
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
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClasses}
        >
          <option value="" disabled>
            {placeholder}
          </option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Arrow */}
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Dropdown;
