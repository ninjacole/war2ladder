// Pagination.tsx
import React from "react";
import '../../styles/maps/map-pager.css';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
    const maxVisible = 5; // how many page numbers to show at once
    const start = Math.max(0, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible);

    const pages = [];
    for (let i = start; i < end; i++) {
        pages.push(i);
    }

    return (
        <div className="table-pagination">
            <button onClick={() => onPageChange(0)} disabled={page === 0}>
                « First
            </button>

            <button onClick={() => onPageChange(page - 1)} disabled={page === 0}>
                ‹ Prev
            </button>

            {start > 0 && (
                <>
                    <button onClick={() => onPageChange(0)}>1</button>
                    {start > 1 && <span className="ellipsis">…</span>}
                </>
            )}

            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={p === page ? "active" : ""}
                >
                    {p + 1}
                </button>
            ))}

            {end < totalPages && (
                <>
                    {end < totalPages - 1 && <span className="ellipsis">…</span>}
                    <button onClick={() => onPageChange(totalPages - 1)}>
                        {totalPages}
                    </button>
                </>
            )}

            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>
                Next ›
            </button>

            <button onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1}>
                Last »
            </button>
        </div>
    );
};
