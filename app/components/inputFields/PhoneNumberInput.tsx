import React from "react";
import PhoneInput, { CountryData } from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { CSSProperties } from "react";

interface PhoneNumberInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, country: CountryData) => void;
  className?: string;
  error?: string;
  id?: string;
  name?: string;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  label,
  placeholder = "Enter your phone number",
  value,
  onChange,
  className = "",
  error,
  id,
  name,
}) => {
  // Define all styles with proper types
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
      minHeight: "2.5rem",
      padding: "0.5rem 0.75rem",
      paddingLeft: "3rem",
      backgroundColor: "#E1E9F2",
      borderColor: "#94BBFF",
      borderRadius: "1.5rem",
      color: "black",
      fontSize: "1rem",
      lineHeight: "1.5",
      boxSizing: "border-box",
    },
    buttonStyle: {
      //Changing Here to Avoid Error
      // position: 'absolute' as 'absolute',
      position: "absolute",
      left: 0,
      height: "100%",
      padding: "0 0.5rem",
      backgroundColor: "transparent",
      borderRight: "none",
      borderRadius: "1.5rem 0 0 1.5rem",
      zIndex: 1,
    },
    dropdownStyle: {
      marginTop: "4px",
      backgroundColor: "#E1E9F2",
      color: "black",
      borderRadius: "0.5rem",
      borderColor: "#94BBFF",
    },
    searchStyle: {
      backgroundColor: "#E1E9F2",
      color: "black",
      borderColor: "#94BBFF",
      borderRadius: "0.25rem",
    },
  };

  React.useEffect(() => {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = `
      /* Remove white background from flags */
      .react-tel-input .flag-dropdown {
        background-color: transparent !important;
        border: none !important;
      }
      .react-tel-input .selected-flag {
        background-color: transparent !important;
      }
      .react-tel-input .flag {
        background-color: transparent !important;
      }
      .react-tel-input .country-list .country {
        background-color: transparent !important;
      }
      .react-tel-input .country-list .country .flag {
        background-color: transparent !important;
      }
    `;
    document.head.appendChild(styleTag);

    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label className="block text-sm font-small text-slate-600 mb-1 font-semibold">
          {label}
        </label>
      )}
      <div className="relative">
        <PhoneInput
          country={"in"}
          value={value}
          onChange={onChange}
          inputProps={{
            id,
            name,
            placeholder,
          }}
          countryCodeEditable={false}
          enableSearch={true}
          containerStyle={customStyles.containerStyle}
          inputStyle={customStyles.inputStyle}
          buttonStyle={customStyles.buttonStyle}
          dropdownStyle={customStyles.dropdownStyle}
          searchStyle={customStyles.searchStyle}
          containerClass="!block"
          inputClass={`!focus:outline-none !focus:ring-1 !focus:ring-[#94BBFF] ${
            error ? "!border-red-500 !focus:ring-red-500" : ""
          }`}
        />
      </div>

      {/* Error Message */}
      {error && <p className="mt-1 px-2 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default PhoneNumberInput;
