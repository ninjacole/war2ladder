import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useEffect, useState } from "react";
import '../../styles/map-list.css';
import { SortDirection, SortField } from "../utils/Sorting";
import MapSelectionBar from "./MapSelectionBar";
import { PudMapItem } from "./MapTypes";
import { Pagination } from "./Pagination";
import { Toolbar } from "./Toolbar";
import { useManifest } from "./useManifest";

export interface MapListProps {
    onFocusMap?: (item: PudMapItem | null) => void;
}

export const MapList: React.FC<MapListProps> = ({ onFocusMap }) => {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [filterText, setFilterText] = useState("");
    const [playerFilter, setPlayerFilter] = useState<number[]>([]);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [focusedMapName, setFocusedMapName] = useState<string | null>(null);
    const { maps, isLoading } = useManifest();

    const pageSize = 15;

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

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }

            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }

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
    const visibleMaps = filteredMaps.slice(start, start + pageSize);

    const toggleSelect = (mapName: string) => {
        setSelected(prev => {
            const newSet = new Set(prev);

            if (newSet.has(mapName)) {
                newSet.delete(mapName);
                setFocusedMapName(null); // Clear focus when deselecting
            } else {
                newSet.add(mapName);
                setFocusedMapName(mapName); // Set focus when selecting
            }

            return newSet;
        });
    };

    // Handle focus map changes as a side effect
    useEffect(() => {
        if (onFocusMap) {
            if (focusedMapName) {
                const map = maps.find(m => m.name === focusedMapName);
                if (map) {
                    onFocusMap(map);
                }
            } else {
                onFocusMap(null);
            }
        }
    }, [focusedMapName, maps, onFocusMap]);

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
        if (sortField !== field) {
            return '';
        }

        return <span className="sort-icon">
            {sortDirection === 'asc' ? '↑' : '↓'}
        </span>
    };

    const getHeaderClass = (field: SortField) => {
        const baseClass = 'table-header-cell';
        const alignClass = field === 'players' || field === 'dimensions' || field === 'size' ? 'table-header-cell-center' : 'table-header-cell-left';
        return `${baseClass} ${alignClass}`;
    };

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [filterText, playerFilter]);

    if (isLoading) {
        return <div className='table-container'>
            <div className="loading-container">
                <div>Loading maps...</div>
            </div>
        </div>
    }

    return <div className='table-container'>
        <div className="table-header">
            <Toolbar
                filterText={filterText}
                onFilterChange={setFilterText}
                playerFilter={playerFilter}
                onPlayerFilterChange={setPlayerFilter}
            />

            <MapSelectionBar
                selectionCount={selected.size}
                filteredMapCount={filteredMaps.length}
                onDownload={handleDownload}
            />
        </div>

        <div className="table-content">
            <table className='map-table'>
                <thead>
                    <tr>
                        <th className="table-header-checkbox">
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
                                className="header-checkbox"
                            />
                        </th>
                        <th className={getHeaderClass('name')} onClick={() => handleSort('name')}>
                            Name{getSortIcon('name')}
                        </th>
                        <th className={getHeaderClass('players')} onClick={() => handleSort('players')}>
                            Players{getSortIcon('players')}
                        </th>
                        <th className={getHeaderClass('dimensions')} onClick={() => handleSort('dimensions')}>
                            Dimensions{getSortIcon('dimensions')}
                        </th>
                        <th className={getHeaderClass('size')} onClick={() => handleSort('size')}>
                            Size (KB){getSortIcon('size')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {visibleMaps.map((map) => (
                        <tr key={map.name} onClick={() => toggleSelect(map.name)}>
                            <td className="map-table-cell-checkbox">
                                <input
                                    type="checkbox"
                                    checked={selected.has(map.name)}
                                    className="map-checkbox"
                                    onChange={(evt) => {
                                        evt.stopPropagation();
                                        toggleSelect(map.name)
                                    }}
                                />
                            </td>
                            <td className="map-table-cell">{map.name}</td>
                            <td className="map-table-cell map-table-cell-center">
                                {map.players || '-'}
                            </td>
                            <td className="map-table-cell map-table-cell-center">
                                {map.dimensions || '-'}
                            </td>
                            <td className="map-table-cell map-table-cell-center">
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
};
