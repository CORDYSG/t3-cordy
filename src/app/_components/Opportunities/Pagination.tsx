"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  return (
    <div className="container my-16 flex w-3/4 flex-col justify-center">
      <div className="mb-8 flex w-full justify-between">
        <div>
          {currentPage > 1 && (
            <button
              type="button"
              className="btn-brand-white flex items-center text-sm uppercase"
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ArrowLeft size={20} />
              <p className="hidden md:block">PREVIOUS PAGE</p>
            </button>
          )}
        </div>
        <div>
          {currentPage !== totalPages && (
            <button
              type="button"
              className="btn-brand-white flex text-sm uppercase"
              onClick={() => onPageChange(currentPage + 1)}
            >
              <p className="hidden md:block">NEXT PAGE</p>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <p className="mr-5 hidden font-semibold text-black md:block">Page</p>
        {(() => {
          const maxRange = 1;
          let pages = [];

          // Add pages before the current page
          for (
            let i = Math.max(1, currentPage - maxRange);
            i < currentPage;
            i++
          ) {
            pages.push(i);
          }

          // Add the current page
          pages.push(currentPage);

          // Add pages after the current page
          for (
            let i = currentPage + 1;
            i <= Math.min(totalPages, currentPage + maxRange);
            i++
          ) {
            pages.push(i);
          }

          // Add "..." if there are missing numbers before or after
          if (currentPage - maxRange > 1) {
            pages = [1, "...", ...pages];
          }
          if (currentPage + maxRange < totalPages) {
            pages = [...pages, "...", totalPages];
          }

          return pages.map((pageNumber, index) => (
            <button
              key={index}
              onClick={() =>
                typeof pageNumber === "number" && onPageChange(pageNumber)
              }
              className={`cursor-pointer text-lg ${
                currentPage === pageNumber
                  ? "bg-primary mx-2 flex aspect-square h-9 w-9 items-center justify-center rounded-full border-2 text-center font-black text-black"
                  : pageNumber === "..."
                    ? "cursor-move px-2"
                    : "hover:text-primary px-2 py-2 font-semibold text-black hover:underline"
              }`}
              disabled={pageNumber === "..."}
            >
              {pageNumber}
            </button>
          ));
        })()}
      </div>
    </div>
  );
};

export default Pagination;
