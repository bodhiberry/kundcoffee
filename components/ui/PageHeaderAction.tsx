"use client";

import { Button } from "@/components/ui/Button";
import { FC, ReactNode } from "react";

interface PageHeaderActionProps {
  title: string;
  description?: string;
  onSearch?: (query: string) => void;
  onExport?: () => void;
  actionButton?: ReactNode;
}

export const PageHeaderAction: FC<PageHeaderActionProps> = ({
  title,
  description,
  onSearch,
  onExport,
  actionButton,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {onSearch && (
          <div className="relative group flex-1 sm:flex-initial w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search..."
              className="w-full sm:w-64 rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-gray-400"
              onChange={(e) => onSearch(e.target.value)}
            />
            <svg
              className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-red-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}

        {onExport && (
          <Button
            variant="secondary"
            onClick={onExport}
            className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </Button>
        )}

        {actionButton && (
          <div className="flex-1 sm:flex-initial [&>button]:w-full">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};
