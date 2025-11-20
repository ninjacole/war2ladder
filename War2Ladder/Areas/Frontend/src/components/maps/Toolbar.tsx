// Toolbar.tsx
import React from "react";
import "../../styles/map-toolbar.css";
interface ToolbarProps {
    filterText: string;
    onFilterChange: (value: string) => void;
    playerFilter: number[];
    onPlayerFilterChange: (players: number[]) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    filterText,
    onFilterChange,
    playerFilter,
    onPlayerFilterChange
}) => {
    const [showPlayerDropdown, setShowPlayerDropdown] = React.useState(false);
    const playerOptions = [1, 2, 3, 4, 5, 6, 7, 8];

    const togglePlayer = (player: number) => {
        if (playerFilter.includes(player)) {
            onPlayerFilterChange(playerFilter.filter(p => p !== player));
        } else {
            onPlayerFilterChange([...playerFilter, player]);
        }
    };

    const getPlayerFilterText = () => {
        if (playerFilter.length === 0) return 'Any players';
        if (playerFilter.length === 8) return 'Any players';
        return `${playerFilter.length} selected`;
    };

    return (
        <div className="toolbar" style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: '#252526',
            borderBottom: '1px solid #3c3c3c'
        }}>
            <input
                type="text"
                className="filter-input"
                placeholder="Filter by name..."
                value={filterText}
                onChange={(e) => onFilterChange(e.target.value)}
                style={{
                    padding: '8px 12px',
                    border: '1px solid #464647',
                    borderRadius: '4px',
                    minWidth: '200px',
                    backgroundColor: '#1e1e1e',
                    fontSize: '14px',
                    color: '#cccccc',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#007acc'}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#464647'}
            />

            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid #464647',
                        borderRadius: '4px',
                        background: '#1e1e1e',
                        color: '#cccccc',
                        cursor: 'pointer',
                        minWidth: '120px',
                        textAlign: 'left',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: showPlayerDropdown ? '0 0 0 1px #007acc' : 'none'
                    }}
                    onMouseEnter={(e) => {
                        const target = e.target as HTMLButtonElement;
                        if (!showPlayerDropdown) {
                            target.style.backgroundColor = '#2d2d30';
                            target.style.borderColor = '#5a5a5a';
                        }
                    }}
                    onMouseLeave={(e) => {
                        const target = e.target as HTMLButtonElement;
                        if (!showPlayerDropdown) {
                            target.style.backgroundColor = '#1e1e1e';
                            target.style.borderColor = '#464647';
                        }
                    }}
                >
                    {getPlayerFilterText()} ▼
                </button>

                {showPlayerDropdown && (
                    <>
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 999
                            }}
                            onClick={() => setShowPlayerDropdown(false)}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            background: '#1e1e1e',
                            color: '#cccccc',
                            border: '1px solid #464647',
                            borderRadius: '4px',
                            padding: '8px',
                            zIndex: 9999,
                            minWidth: '140px',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)'
                        }}>
                            {playerOptions.map(player => (
                                <label key={player} style={{
                                    display: 'block',
                                    padding: '6px 4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#cccccc',
                                    borderRadius: '2px',
                                    transition: 'background-color 0.1s ease'
                                }}
                                    onMouseEnter={(e) => (e.target as HTMLLabelElement).style.backgroundColor = '#2d2d30'}
                                    onMouseLeave={(e) => (e.target as HTMLLabelElement).style.backgroundColor = 'transparent'}
                                >
                                    <input
                                        type="checkbox"
                                        checked={playerFilter.includes(player)}
                                        onChange={() => togglePlayer(player)}
                                        style={{ marginRight: '8px', accentColor: '#007acc' }}
                                    />
                                    {player} player{player !== 1 ? 's' : ''}
                                </label>
                            ))}

                            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #464647' }} />

                            <button
                                onClick={() => {
                                    onPlayerFilterChange([]);
                                    setShowPlayerDropdown(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: '#007acc',
                                    borderRadius: '2px',
                                    transition: 'background-color 0.1s ease'
                                }}
                                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2d2d30'}
                                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                            >
                                Clear all
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
