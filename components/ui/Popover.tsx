"use client";
import React, { FC, ReactNode, useEffect, useRef, useState } from "react";

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  align?: "left" | "right" | "center";
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  className?: string;
}

export const Popover: FC<PopoverProps> = ({
  trigger,
  content,
  align = "left",
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen,
  className = "",
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = isControlled ? controlledSetIsOpen : setInternalIsOpen;

  const toggle = () => setIsOpen && setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        if (setIsOpen) setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative inline-block text-left " ref={popoverRef}>
      <div onClick={toggle}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-72 rounded-xl bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
            align === "right"
              ? "right-0 origin-top-right"
              : align === "center"
              ? "left-1/2 -translate-x-1/2 origin-top"
              : "left-0 origin-top-left"
          } ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
