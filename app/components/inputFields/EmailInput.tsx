import React from "react";

interface EmailInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  error?: string;
  id?: string;
  name?: string;
}

const EmailInput: React.FC<EmailInputProps> = ({
  label,
  placeholder = "Enter your email",
  value,
  onChange,
  className = "",
  error,
  id,
  name,
}) => {
  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label className="block text-sm font-small text-slate-600 font-semibold mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          id={id}
          name={name}
          className={`w-full px-3 py-2.5 border border-[#94BBFF] rounded-3xl bg-[#E1E9F2] focus:outline-none focus:ring-1 focus:ring-[#94BBFF] focus:border-[#94BBFF] text-black text-sm ${
            error ? "border-red-500" : ""
          }`}
        />
      </div>

      {/* Error Message */}
      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default EmailInput;
