import React, { useState, useEffect } from "react";

interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  id?: string;
  name?: string;
  showStrength?: boolean;
  validate?: (value: string) => string | null;
  error?: string | null;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  placeholder = "Enter your password",
  value,
  onChange,
  className = "",
  id,
  name,
  showStrength = false,
  validate = (value) => {
    if (!value.trim()) return "Password is required.";
    if (value.length < 8) return "Password must be at least 8 characters.";
    return null;
  },
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strength, setStrength] = useState(0);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleBlur = () => {
    setError(validate(value));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);

    if (error) {
      setError(validate(e.target.value));
    }
  };

  // password strength calc
  useEffect(() => {
    const timer = setTimeout(() => {
      let score = 0;
      if (value.length >= 8) score++;
      if (/[A-Z]/.test(value)) score++;
      if (/[a-z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;
      setStrength(score);
    }, 200);

    return () => clearTimeout(timer);
  }, [value]);

  const getStrengthLabel = () => {
    if (strength <= 2) return "Weak";
    if (strength === 3) return "Average";
    if (strength === 4) return "Good";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (strength <= 2) return "bg-red-500";
    if (strength === 3) return "bg-yellow-500";
    if (strength === 4) return "bg-[#5865F2]";
    return "bg-green-500";
  };

  const Requirement = ({ ok, label }: { ok: boolean; label: string }) => (
    <div className="flex items-center gap-1">
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          ok ? "bg-green-500" : "bg-slate-300"
        }`}
      />
      <span className={ok ? "text-slate-700" : ""}>{label}</span>
    </div>
  );

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
          type={showPassword ? "text" : "password"}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          autoComplete="new-password"
          className={inputClasses}
        />

        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500"
        >
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-3 space-y-2">
          {/* Strength bars */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  strength >= level ? getStrengthColor() : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* Label */}
          <div className="flex justify-between items-center">
            <span
              className={`text-xs font-medium ${
                strength <= 2
                  ? "text-red-500"
                  : strength === 3
                    ? "text-yellow-500"
                    : strength === 4
                      ? "text-blue-500"
                      : "text-green-500"
              }`}
            >
              {getStrengthLabel()} password
            </span>

            {/* score */}
            <span className="text-[10px] text-slate-400">{strength}/5</span>
          </div>

          {/* Requirements checklist */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <Requirement ok={value.length >= 8} label="8+ characters" />
            <Requirement ok={/[A-Z]/.test(value)} label="Uppercase" />
            <Requirement ok={/[a-z]/.test(value)} label="Lowercase" />
            <Requirement ok={/[0-9]/.test(value)} label="Number" />
            <Requirement ok={/[!@#$%^&*]/.test(value)} label="Symbol" />
          </div>
        </div>
      )}

      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default PasswordInput;
