import React, { useState, useEffect } from "react";

interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  error?: string;
  showStrength?: boolean;
  id?: string;
  name?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  placeholder = "Enter your password",
  value,
  onChange,
  className = "",
  error,
  showStrength = false,
  id,
  name,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Debounce password strength calculation for performance optimization
  useEffect(() => {
    const timer = setTimeout(() => {
      let strengthScore = 0;
      if (value.length >= 8) strengthScore++;
      if (/[A-Z]/.test(value)) strengthScore++;
      if (/[a-z]/.test(value)) strengthScore++;
      if (/[0-9]/.test(value)) strengthScore++;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) strengthScore++;
      setStrength(strengthScore);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Helper function to determine strength label
  const getStrengthLabel = () => {
    if (strength === 0) return "Weak";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Average";
    if (strength === 4) return "Good";
    return "Strong";
  };

  // Helper function to determine bar color based on strength
  const getStrengthColor = () => {
    if (strength === 0) return "bg-red-500";
    if (strength <= 2) return "bg-red-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength === 4) return "bg-blue-400";
    return "bg-green-500";
  };

  // Calculate width percentage based on strength
  const getStrengthWidth = () => {
    return `${Math.max(5, (strength / 5) * 100)}%`;
  };

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-small text-slate-600 mb-1 font-semibold"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          id={id}
          name={name}
          autoComplete="new-password"
          aria-describedby={showStrength ? "password-strength" : undefined}
          className={`w-full px-3 py-2.5 border border-[#94BBFF] rounded-3xl bg-[#E1E9F2] focus:outline-none focus:ring-1 focus:ring-[#94BBFF] text-black text-sm${
            error ? "border-red-500" : ""
          }`}
        />

        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
          aria-label="Toggle password visibility"
        >
          {showPassword ? "👁️" : "🔒"}
        </button>
      </div>

      {/* Password Strength Indicator as a horizontal bar */}
      {showStrength && value.length > 0 && (
        <div id="password-strength" className="mt-2">
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getStrengthColor()} transition-all duration-300 ease-in-out`}
              style={{ width: getStrengthWidth() }}
            ></div>
          </div>
          <p className="text-xs text-white mt-1 text-right">
            {getStrengthLabel()}
          </p>
        </div>
      )}

      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default PasswordInput;
