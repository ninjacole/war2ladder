// Toolbar.tsx
import React from "react";

interface ToolbarProps {
    selectedCount: number;
    onDownload: () => void;
    filterText: string;
    onFilterChange: (value: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    selectedCount,
    onDownload,
    filterText,
    onFilterChange,
}) => {
    return (
        <div className="toolbar">
            <button
                className="download-btn"
                style={{ width: "120px" }}
                onClick={onDownload}
                disabled={selectedCount === 0}
            >
                ⬇ Download
            </button>

            <span className="selected-count">
                {selectedCount} selected
            </span>

            <input
                type="text"
                className="filter-input"
                placeholder="Filter by name..."
                value={filterText}
                onChange={(e) => onFilterChange(e.target.value)}
            />
        </div>
    );
};
