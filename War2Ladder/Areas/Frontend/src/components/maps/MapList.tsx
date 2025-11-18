// MapList.tsx
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useEffect, useState } from "react";
import '../../styles/maps.css'; // adjusted path
import { Pagination } from "./Pagination";
import { Toolbar } from "./Toolbar";

export interface PudMapItem {
    name: string;
    size: number; // bytes
    url: string;  // public URL for download/fetch
}

export const MapList: React.FC = () => {
    const [maps, setMaps] = useState<PudMapItem[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(0);
    const [filterText, setFilterText] = useState("");
    const pageSize = 25;

    useEffect(() => {
        async function loadMaps() {
            const res = await fetch("/maps/manifest.json");
            const manifest: { name: string; path: string }[] = await res.json();

            const enriched: PudMapItem[] = await Promise.all(
                manifest.map(async (entry) => {
                    const head = await fetch(entry.path, { method: "HEAD" });
                    const size = parseInt(head.headers.get("Content-Length") || "0", 10);
                    return { name: entry.name, size, url: entry.path };
                })
            );

            setMaps(enriched);
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
            newSet.has(mapName) ? newSet.delete(mapName) : newSet.add(mapName);
            return newSet;
        });
    };



    // ...

    const handleDownload = async () => {
        if (selected.size === 0) return;

        const zip = new JSZip();

        // Add each selected file to the zip
        for (const mapName of selected) {
            const map = maps.find(m => m.name === mapName);
            if (!map) continue;

            const response = await fetch(map.url);
            const blob = await response.blob();
            zip.file(map.name, blob);
        }

        // Generate zip and trigger download
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "selected-maps.zip");
    };

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
                        <tr key={map.name}>
                            <td style={{ border: "1px solid #eee", padding: "8px", textAlign: "center" }}>
                                <input
                                    type="checkbox"
                                    checked={selected.has(map.name)}
                                    onChange={() => toggleSelect(map.name)}
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
