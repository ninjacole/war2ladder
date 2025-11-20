// MapList.tsx
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useEffect, useState } from "react";
import '../../styles/maps.css'; // adjusted path
import { Pagination } from "./Pagination";
import { Toolbar } from "./Toolbar";

export interface PudMapItem {
    id: number;
    name: string;
    filename: string; // original filename for downloads
    size: number; // bytes
    url: string;  // public URL for download/fetch
    dimensions?: string;
    players?: number;
}

export interface MapListProps {
    onFocusMap?: (item: PudMapItem | null) => void;
}

type SortField = 'name' | 'players' | 'dimensions' | 'size';
type SortDirection = 'asc' | 'desc';

export const MapList: React.FC<MapListProps> = ({ onFocusMap }) => {
    const [maps, setMaps] = useState<PudMapItem[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [filterText, setFilterText] = useState("");
    const [playerFilter, setPlayerFilter] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const pageSize = 12;

    useEffect(() => {
        async function loadMaps() {
            setIsLoading(true);
            try {
                const res = await fetch("/maps/manifest.json");
                const manifest: {
                    id: number;
                    name: string;
                    filename: string;
                    path: string;
                    size: number;
                    dimensions?: string;
                    players?: number;
                }[] = await res.json();

                // Create map items directly from manifest - S3 URLs don't need encoding
                const enriched: PudMapItem[] = manifest.map((entry) => {
                    return {
                        id: entry.id,
                        name: entry.name,
                        filename: entry.filename,
                        size: entry.size || 0,
                        url: entry.path, // S3 URL used directly
                        dimensions: entry.dimensions,
                        players: entry.players
                    };
                });

                setMaps(enriched);
            } catch (error) {
                console.error('Failed to load maps:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadMaps();
    }, []);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setPage(0); // Reset to first page when sorting changes
    };

    const getSortedMaps = (mapsToSort: PudMapItem[]) => {
        return [...mapsToSort].sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (sortField) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'players':
                    aValue = a.players || 0;
                    bValue = b.players || 0;
                    break;
                case 'size':
                    aValue = a.size;
                    bValue = b.size;
                    break;
                case 'dimensions':
                    // Sort dimensions by area (width * height)
                    const getDimensionArea = (dim?: string) => {
                        if (!dim || dim === '-') return 0;
                        const [width, height] = dim.split('x').map(Number);
                        return (width || 0) * (height || 0);
                    };
                    aValue = getDimensionArea(a.dimensions);
                    bValue = getDimensionArea(b.dimensions);
                    break;
                default:
                    aValue = 0;
                    bValue = 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const filteredMaps = getSortedMaps(
        maps.filter(m => {
            const nameMatch = m.name.toLowerCase().includes(filterText.toLowerCase());
            const playerMatch = playerFilter.length === 0 || (m.players && playerFilter.includes(m.players));
            return nameMatch && playerMatch;
        })
    );

    const totalPages = Math.ceil(filteredMaps.length / pageSize);
    const start = page * pageSize;
    const current = filteredMaps.slice(start, start + pageSize);


    const toggleSelect = (mapName: string) => {
        setSelected(prev => {
            const newSet = new Set(prev);

            if (newSet.has(mapName)) {
                newSet.delete(mapName);
                // Clear preview when deselecting - pass null to indicate no selection
                if (onFocusMap) {
                    onFocusMap(null as any);
                }
            } else {
                newSet.add(mapName);
                // Notify parent with the newly selected map
                const map = maps.find(m => m.name === mapName) || null;
                if (map && onFocusMap) onFocusMap(map);
            }

            return newSet;
        });
    };

    const handleDownload = async () => {
        if (selected.size === 0) return;

        const zip = new JSZip();

        // Add each selected file to the zip
        for (const mapName of selected) {
            const map = maps.find(m => m.name === mapName);
            if (!map) continue;

            const response = await fetch(map.url);

            const blob = await response.blob();
            // Use original filename for the zip entry
            zip.file(map.filename, blob);
        }

        // Generate zip and trigger download
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "selected-maps.zip");
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return '';
        return (
            <span style={{ marginLeft: '4px', fontSize: '16px', fontWeight: 'bold' }}>
                {sortDirection === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    const getHeaderStyle = (field: SortField) => ({
        border: "1px solid #3c3c3c",
        padding: "12px 8px",
        cursor: "pointer",
        userSelect: "none" as const,
        textAlign: field === 'players' || field === 'dimensions' || field === 'size' ? "center" as const : "left" as const,
        backgroundColor: "#252526",
        color: "#cccccc",
        fontSize: "14px",
        fontWeight: "600",
        transition: "background-color 0.2s ease"
    });

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [filterText, playerFilter]);

    if (isLoading) {
        return (
            <div className='table-container'>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div>Loading maps...</div>
                </div>
            </div>
        );
    }

    return (
        <div className='table-container'>
            <div className="table-header">
                <Toolbar
                    filterText={filterText}
                    onFilterChange={setFilterText}
                    playerFilter={playerFilter}
                    onPlayerFilterChange={setPlayerFilter}
                />

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#2d2d30',
                    borderBottom: '1px solid #3c3c3c'
                }}>
                    <span style={{ fontSize: '14px', color: '#cccccc', fontWeight: '400' }}>
                        {selected.size} of {filteredMaps.length} selected
                    </span>
                    <button
                        onClick={handleDownload}
                        disabled={selected.size === 0}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: selected.size > 0 ? '#007acc' : '#6e6e6e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'background-color 0.2s ease',
                            boxShadow: selected.size > 0 ? '0 2px 4px rgba(0,122,204,0.3)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            const target = e.target as HTMLButtonElement;
                            if (selected.size > 0) {
                                target.style.backgroundColor = '#005a9e';
                            }
                        }}
                        onMouseLeave={(e) => {
                            const target = e.target as HTMLButtonElement;
                            if (selected.size > 0) {
                                target.style.backgroundColor = '#007acc';
                            }
                        }}
                    >
                        ⬇ Download ({selected.size})
                    </button>
                </div>
            </div>

            <div className="table-content">
                <table className='map-table-tbody' style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr>
                            <th style={{
                                border: "1px solid #3c3c3c",
                                padding: "12px 8px",
                                textAlign: "center",
                                backgroundColor: "#252526",
                                width: "50px"
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selected.size === filteredMaps.length && filteredMaps.length > 0}
                                    onChange={() => {
                                        if (selected.size === filteredMaps.length) {
                                            setSelected(new Set());
                                        } else {
                                            setSelected(new Set(filteredMaps.map(m => m.name)));
                                        }
                                    }}
                                    style={{ accentColor: '#0078d4' }}
                                />
                            </th>
                            <th style={getHeaderStyle('name')} onClick={() => handleSort('name')}>
                                Name{getSortIcon('name')}
                            </th>
                            <th style={getHeaderStyle('players')} onClick={() => handleSort('players')}>
                                Players{getSortIcon('players')}
                            </th>
                            <th style={getHeaderStyle('dimensions')} onClick={() => handleSort('dimensions')}>
                                Dimensions{getSortIcon('dimensions')}
                            </th>
                            <th style={getHeaderStyle('size')} onClick={() => handleSort('size')}>
                                Size (KB){getSortIcon('size')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {current.map((map) => (
                            <tr key={map.name} onClick={() => toggleSelect(map.name)}>
                                <td style={{
                                    border: "1px solid #3c3c3c",
                                    padding: "12px 8px",
                                    textAlign: "center",
                                    backgroundColor: "#1e1e1e"
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={selected.has(map.name)}
                                        style={{ accentColor: '#007acc' }}
                                    />
                                </td>
                                <td style={{
                                    border: "1px solid #3c3c3c",
                                    padding: "12px 8px",
                                    backgroundColor: "#1e1e1e",
                                    color: "#cccccc"
                                }}>{map.name}</td>
                                <td style={{
                                    border: "1px solid #3c3c3c",
                                    padding: "12px 8px",
                                    textAlign: "center",
                                    backgroundColor: "#1e1e1e",
                                    color: "#cccccc"
                                }}>
                                    {map.players || '-'}
                                </td>
                                <td style={{
                                    border: "1px solid #3c3c3c",
                                    padding: "12px 8px",
                                    textAlign: "center",
                                    backgroundColor: "#1e1e1e",
                                    color: "#cccccc"
                                }}>
                                    {map.dimensions || '-'}
                                </td>
                                <td style={{
                                    border: "1px solid #3c3c3c",
                                    padding: "12px 8px",
                                    textAlign: "center",
                                    backgroundColor: "#1e1e1e",
                                    color: "#cccccc"
                                }}>
                                    {(map.size / 1024).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="table-footer">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
        </div>
    );
};
