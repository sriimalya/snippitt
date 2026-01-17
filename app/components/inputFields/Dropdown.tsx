import React from "react";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  error?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  className = "",
  error,
  id,
  name,
  placeholder = "Select an option",
  required = false,
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}

      {/* Dropdown Container */}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          id={id}
          name={name}
          required={required}
          className={`w-full px-4 py-3 rounded-xl border-2 bg-[#F8FAFD] focus:bg-white transition-all duration-200
            text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#94BBFF]/30 appearance-none
            ${
              error
                ? "border-red-300 hover:border-red-400 focus:border-red-300"
                : "border-gray-200 hover:border-[#94BBFF]/50 focus:border-[#5865F2]"
            }
            ${!value ? "text-gray-400" : "text-gray-900"}`}
        >
          <option value="" disabled className="text-gray-400">
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="text-gray-900 bg-white py-2"
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom Dropdown Arrow */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200
            ${error ? "text-red-400" : "text-gray-400"}`}
          />
        </div>

        {/* Focus Border Effect */}
        <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
          <div
            className={`absolute inset-0 border-2 border-transparent rounded-xl transition-all duration-300
            ${
              error
                ? "group-focus-within:border-red-300"
                : "group-focus-within:border-[#5865F2]"
            }`}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center text-red-600 text-sm">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
          {error}
        </div>
      )}

      {/* Selected Value Indicator */}
      {value && !error && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-[#5865F2] rounded-full mr-2"></div>
          <span>
            Selected: {options.find((opt) => opt.value === value)?.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
