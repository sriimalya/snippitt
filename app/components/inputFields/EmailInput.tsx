import React, { useState } from "react";

interface EmailInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  id?: string;
  name?: string;
  validate?: (value: string) => string | null;
  error?: string | null;
}

const EmailInput: React.FC<EmailInputProps> = ({
  label,
  placeholder = "Enter your email",
  value,
  onChange,
  className = "",
  id,
  name,
  validate = (value) => {
    if (!value.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(value)) return "Enter a valid email.";
    return null;
  },
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    setError(validate(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);

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
        <input
          type="email"
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClasses}
        />
      </div>

      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default EmailInput;
