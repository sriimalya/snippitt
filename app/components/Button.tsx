import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md" | "lg";
  variant?:
    | "black-white"
    | "black-gradient"
    | "gradient-blue"
    | "danger"
    | "yellow"
    | "custom-blue"
    | "google-oauth"
    | "outline"
    | "theme-primary" // New variant added
    | "theme-gradient"; // New variant added
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  size = "md",
  variant = "black-white",
  icon,
}) => {
  // Base styles - added letter spacing for better readability
  const baseStyles =
    "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 tracking-wide";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm",
    md: "px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-base",
    lg: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg",
  };

  const variantStyles = {
    "black-white":
      "bg-black text-white hover:bg-gray-900 focus:ring-gray-500 shadow-sm",
    "black-gradient":
      "bg-black text-[#5865F2] hover:bg-gray-900 focus:ring-[#5865F2] shadow-sm",
    "gradient-blue":
      "bg-gradient-to-bl from-[#8b9dff] via-[#6b7ef5] to-[#5865F2] text-white hover:from-[#7a8cff] hover:to-[#4854e0] focus:ring-[#5865F2]/50 shadow-md",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    yellow:
      "bg-yellow-400 text-black hover:bg-yellow-500 focus:ring-yellow-500 shadow-sm",
    "custom-blue":
      "bg-[#5865F2] text-white hover:bg-[#4854e0] focus:ring-[#5865F2]/50 shadow-sm",
    "google-oauth":
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-[#5865F2]/30 shadow-sm flex items-center justify-center gap-2",
    outline:
      "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-[#5865F2]/30 shadow-sm",
    // NEW VARIANTS ADDED:
    "theme-primary":
      "bg-[#5865F2] text-white hover:from-[#4854e0] hover:to-[#7aa4ff] focus:ring-[#94BBFF]/50 hover:shadow-lg shadow-md",
    "theme-gradient":
      "bg-gradient-to-r from-[#5865F2] via-[#7AA4FF] to-[#94BBFF] text-white hover:from-[#4854e0] hover:to-[#7aa4ff] focus:ring-[#94BBFF]/50 hover:shadow-lg shadow-md",
  };

  // Combine all styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${combinedStyles} ${
        disabled
          ? "opacity-50 cursor-not-allowed hover:shadow-none"
          : "hover:translate-y-[-1px] active:translate-y-0"
      }`}
    >
      {variant === "google-oauth" && !icon && (
        <svg
          width="18"
          height="18"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
      )}
      {icon && icon}
      {children}
    </button>
  );
};

export default Button;
