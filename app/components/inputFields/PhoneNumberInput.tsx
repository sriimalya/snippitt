import React, { useState, useEffect } from "react";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { CSSProperties } from "react";

interface PhoneNumberInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, country: CountryData) => void;
  className?: string;
  id?: string;
  name?: string;
  validate?: (value: string) => string | null;
  error?: string | null;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  label,
  placeholder = "Enter your phone number",
  value,
  onChange,
  className = "",
  id,
  name,
  validate = (value) =>
    !value || value.length < 8 ? "Enter a valid phone number." : null,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    setError(validate(value));
  };

  const handleChange = (val: string, country: CountryData) => {
    onChange(val, country);

    if (error) {
      setError(validate(val));
    }
  };

  const customStyles: {
    containerStyle: CSSProperties;
    inputStyle: CSSProperties;
    buttonStyle: CSSProperties;
    dropdownStyle: CSSProperties;
    searchStyle: CSSProperties;
  } = {
    containerStyle: {
      width: "100%",
    },
    inputStyle: {
      width: "100%",
      padding: "10px 12px",
      paddingLeft: "52px",
      backgroundColor: "#F4F6FF",
      borderRadius: "1.5rem",
      border: error ? "1px solid #ef4444" : "1px solid rgba(88,101,242,0.4)",
      fontSize: "0.875rem",
      color: "black",
      height: "44px",
    },
    buttonStyle: {
      backgroundColor: "transparent",
      border: "none",
      borderRadius: "1.5rem 0 0 1.5rem",
    },
    dropdownStyle: {
      borderRadius: "0.75rem",
      border: "1px solid rgba(88,101,242,0.2)",
    },
    searchStyle: {
      borderRadius: "0.5rem",
    },
  };

  // remove white flag bg
  useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      .react-tel-input .flag-dropdown { background: transparent !important; border:none!important;}
      .react-tel-input .selected-flag { background: transparent !important;}
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

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
        <PhoneInput
          country={"in"}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          inputProps={{
            id,
            name,
            placeholder,
          }}
          countryCodeEditable={false}
          enableSearch
          containerStyle={customStyles.containerStyle}
          inputStyle={customStyles.inputStyle}
          buttonStyle={customStyles.buttonStyle}
          dropdownStyle={customStyles.dropdownStyle}
          searchStyle={customStyles.searchStyle}
        />
      </div>

      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default PhoneNumberInput;
