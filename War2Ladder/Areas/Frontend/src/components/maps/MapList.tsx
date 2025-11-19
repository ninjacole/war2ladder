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
}

export interface MapListProps {
    onFocusMap?: (item: PudMapItem) => void;
}

export const MapList: React.FC<MapListProps> = ({ onFocusMap }) => {
    const [maps, setMaps] = useState<PudMapItem[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [filterText, setFilterText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const pageSize = 20;

    useEffect(() => {
        async function loadMaps() {
            setIsLoading(true);
            try {
                const res = await fetch("/maps/manifest.json");
                const manifest: { id: number; name: string; filename: string; path: string; size: number }[] = await res.json();

                // Create map items directly from manifest - no HEAD requests needed
                const enriched: PudMapItem[] = manifest.map((entry) => {
                    // URL encode the path for when it's actually needed
                    const encodedPath = entry.path.split('/').map((part, index) =>
                        index === 0 || part === '' ? part : encodeURIComponent(part)
                    ).join('/');
                    
                    return {
                        id: entry.id,
                        name: entry.name,
                        filename: entry.filename,
                        size: entry.size || 0,
                        url: encodedPath
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

    const filteredMaps = maps.filter(m =>
        m.name.toLowerCase().includes(filterText.toLowerCase())
    );

    const totalPages = Math.ceil(filteredMaps.length / pageSize);
    const start = page * pageSize;
    const current = filteredMaps.slice(start, start + pageSize);


    const toggleSelect = (mapName: string) => {
        setSelected(prev => {
            const newSet = new Set(prev);

            if (newSet.has(mapName)) {
                newSet.delete(mapName);
                // If you want to clear preview when deselecting the focused map:
                if (onFocusMap) {
                    const stillSelected = maps.find(m => newSet.has(m.name)) || null;
                    if (stillSelected) {
                        onFocusMap(stillSelected);
                    }
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

    // Reset page when filter changes
    useEffect(() => {
        setPage(0);
    }, [filterText]);

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
            <Toolbar
                selectedCount={selected.size}
                onDownload={handleDownload}
                filterText={filterText}
                onFilterChange={setFilterText}
            />

            <table className='map-table-tbody' style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
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
                            />
                        </th>
                        <th style={{ border: "1px solid #ccc", padding: "8px" }}>File Name</th>
                        <th style={{ border: "1px solid #ccc", padding: "8px" }}>Size (KB)</th>
                    </tr>
                </thead>
                <tbody>
                    {current.map((map) => (
                        <tr key={map.name} onClick={() => toggleSelect(map.name)}>
                            <td style={{ border: "1px solid #eee", padding: "8px", textAlign: "center" }}>
                                <input
                                    type="checkbox"
                                    checked={selected.has(map.name)}
                                />
                            </td>
                            <td style={{ border: "1px solid #eee", padding: "8px" }}>{map.name}</td>
                            <td style={{ border: "1px solid #eee", padding: "8px" }}>
                                {(map.size / 1024).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
};
