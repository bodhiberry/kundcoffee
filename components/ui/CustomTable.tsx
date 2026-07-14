"use client";

import React from "react";

export function CustomTable<T>({
  columns,
  data,
  onRowClick,
}: {
  columns: {
    header: string;
    accessor: (row: T, i: number) => any;
    align?: "left" | "right";
  }[];
  data: T[];
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="bg-white border border-zinc-200 overflow-auto max-h-[calc(100vh-250px)]">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`pos-table-header ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.length > 0 ? (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className="hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                {columns.map((col, j) => {
                  const cell = col.accessor(row, i);
                  const isNumber = typeof cell === "number";

                  return (
                    <td
                      key={j}
                      className={`pos-table-cell ${
                        col.align === "right" || isNumber
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {cell ?? "-"}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="pos-table-cell text-center text-zinc-400 py-12"
              >
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
