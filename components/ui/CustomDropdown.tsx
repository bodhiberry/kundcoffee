"use client";
import { useState, useRef, useEffect, ReactNode } from "react";

interface Option {
  id: string;
  name: string;
}

interface CustomDropdownProps {
  label?: string;
  options: Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  placeholder?: string;
  icon?: ReactNode; // Added icon prop to support <Users /> or other icons
}

export const CustomDropdown = ({
  label,
  options,
  value,
  onChange,
  onAddNew,
  addNewLabel = "Create New...",
  placeholder = "Select an option",
  icon,
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="mb-1 block text-sm font-bold text-black">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Trigger Button matching the target select design */}
        <button
          type="button"
          className={`relative w-full cursor-pointer bg-white border border-black py-3 pr-10 text-left text-sm font-bold outline-none focus:ring-1 focus:ring-black focus:border-black ${
            icon ? "pl-9" : "pl-4"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Icon rendering */}
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 flex items-center justify-center pointer-events-none">
              {icon}
            </span>
          )}

          {/* Selected Value */}
          <span
            className={`block truncate ${!selectedOption ? "text-zinc-400 font-bold" : "text-black"}`}
          >
            {selectedOption ? selectedOption.name : placeholder}
          </span>

          {/* Dropdown Chevron */}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <svg
              className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </button>

        {/* Dropdown Menu (Styled sharply to match the border-black aesthetic) */}
        {isOpen && (
          <div className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto bg-white border border-black py-1 text-sm shadow-md focus:outline-none">
            {options.map((option) => (
              <div
                key={option.id}
                className={`relative cursor-pointer select-none py-3 pl-4 pr-9 hover:bg-zinc-100 ${
                  option.id === value
                    ? "bg-zinc-50 font-bold text-black"
                    : "font-medium text-black"
                }`}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
              >
                <span className="block truncate">{option.name}</span>
                {option.id === value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-black">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))}

            {onAddNew && (
              <div
                className="relative cursor-pointer select-none border-t border-black py-3 pl-4 pr-9 text-black hover:bg-zinc-100 font-bold transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
              >
                + {addNewLabel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};