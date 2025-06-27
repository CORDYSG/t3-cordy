import React from "react";
import { getRandomAccentBg } from "@/lib/utils";

interface SelectableInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  groupName?: string;
  value?: string;
  checked: boolean;
  inputType: "checkbox" | "radio";
  other?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  otherValue?: string;
  onOtherChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  maxSelectable?: number;
  currentSelectedCount?: number;
}

const SelectableInput: React.FC<SelectableInputProps> = ({
  label,
  value,
  groupName,
  checked,
  inputType,
  other,
  onChange,
  otherValue,
  onOtherChange,
  maxSelectable,
  currentSelectedCount = 0,
  ...props
}) => {
  const disableCheckbox =
    inputType === "checkbox" &&
    !checked &&
    typeof maxSelectable === "number" &&
    currentSelectedCount >= maxSelectable;

  return (
    <div>
      <label
        key={value}
        className={`flex w-fit cursor-pointer items-center space-x-3 rounded-lg border-2 p-3 transition-all ${
          checked
            ? `shadow-brand-bottom ${getRandomAccentBg()}`
            : "border-2 bg-white hover:bg-gray-50"
        } ${disableCheckbox ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <input
          type={inputType}
          name={groupName}
          value={value}
          checked={checked}
          onChange={disableCheckbox ? undefined : onChange}
          disabled={disableCheckbox}
          {...props}
          className="sr-only"
        />
        <span className={`text-sm ${checked ? "font-black" : "font-medium"}`}>
          {label}
        </span>
      </label>

      {other && checked && (
        <input
          type="text"
          placeholder="Please specify..."
          className="mt-2 block w-full rounded border border-gray-300 px-3 py-2"
          value={otherValue || ""}
          onChange={onOtherChange}
        />
      )}
    </div>
  );
};

export default SelectableInput;
