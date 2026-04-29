"use client";
import React from 'react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    hasNextPage, 
    hasPrevPage 
}) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (startPage > 1) {
                pages.push(1);
                if (startPage > 2) {
                    pages.push('...');
                }
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pages.push('...');
                }
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    if (totalPages <= 1) return null;

    return (
        <nav aria-label="Pagination" className="d-flex justify-content-center">
            <div className="d-flex align-items-center gap-2">
                {/* Previous Button */}
                <button
                    className={`${!hasPrevPage ? 'btn btn-outline-secondary disabled' : 'custom_btn_outline--small'} btn-sm rounded-pill px-3 py-2`}
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                    style={{ 
                        opacity: !hasPrevPage ? 0.6 : 1,
                        cursor: !hasPrevPage ? 'not-allowed' : 'pointer'
                    }}
                >
                    <i className="bi bi-chevron-left me-1"></i>
                    Previous
                </button>

                {/* Page Numbers */}
                <div className="d-flex gap-1">
                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className="btn btn-outline-secondary disabled btn-sm rounded-pill px-3 py-2">
                                    ...
                                </span>
                            ) : (
                                <button
                                    className={`${page === currentPage ? 'custom_btn_solid' : 'custom_btn_outline--small'} btn-sm rounded-pill px-3 py-2`}
                                    onClick={() => onPageChange(page)}
                                    style={{ 
                                        minWidth: '40px',
                                        fontWeight: page === currentPage ? '600' : '400'
                                    }}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Next Button */}
                <button
                    className={`${!hasNextPage ? 'btn btn-outline-secondary disabled' : 'custom_btn_outline--small'} btn-sm rounded-pill px-3 py-2`}
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                    style={{ 
                        opacity: !hasNextPage ? 0.6 : 1,
                        cursor: !hasNextPage ? 'not-allowed' : 'pointer'
                    }}
                >
                    Next
                    <i className="bi bi-chevron-right ms-1"></i>
                </button>
            </div>
        </nav>
    );
};

export default Pagination;
