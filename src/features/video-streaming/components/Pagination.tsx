/**
 * Pagination Component
 * 
 * A reusable pagination component that matches the dashboard template's styling patterns.
 * Provides page navigation with first/last, previous/next, and numbered page buttons.
 */

import React from 'react';
import { type PaginationProps } from '../types';

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  className = '',
}) => {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  // Calculate visible page numbers
  const getVisiblePages = (): number[] => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Button base classes matching dashboard template
  const baseButtonClasses = "inline-flex items-center justify-center px-3 py-2 text-sm font-medium transition rounded-lg border";

  // Active page button classes
  const activeButtonClasses = "bg-brand-500 text-white border-brand-500 hover:bg-brand-600 shadow-theme-xs";

  // Inactive page button classes
  const inactiveButtonClasses = "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";

  // Disabled button classes
  const disabledButtonClasses = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50";

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* First Page Button */}
      {showFirstLast && !isFirstPage && (
        <button
          onClick={() => handlePageClick(1)}
          className={`${baseButtonClasses} ${inactiveButtonClasses}`}
          aria-label="Go to first page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Previous Page Button */}
      {showPrevNext && (
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={isFirstPage}
          className={`${baseButtonClasses} ${isFirstPage ? disabledButtonClasses : inactiveButtonClasses}`}
          aria-label="Go to previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Page Number Buttons */}
      {visiblePages.map((page) => (
        <button
          key={page}
          onClick={() => handlePageClick(page)}
          className={`${baseButtonClasses} ${page === currentPage ? activeButtonClasses : inactiveButtonClasses
            } min-w-[40px]`}
          aria-label={`Go to page ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {/* Next Page Button */}
      {showPrevNext && (
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={isLastPage}
          className={`${baseButtonClasses} ${isLastPage ? disabledButtonClasses : inactiveButtonClasses}`}
          aria-label="Go to next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Last Page Button */}
      {showFirstLast && !isLastPage && (
        <button
          onClick={() => handlePageClick(totalPages)}
          className={`${baseButtonClasses} ${inactiveButtonClasses}`}
          aria-label="Go to last page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Page info component to show current page and total
export const PageInfo: React.FC<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
}> = ({ currentPage, totalPages, totalItems, itemsPerPage, className = '' }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      Showing {startItem} to {endItem} of {totalItems} results (Page {currentPage} of {totalPages})
    </div>
  );
};
