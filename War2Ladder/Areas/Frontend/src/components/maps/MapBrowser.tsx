import { useState } from "react";
import { MapList, PudMapItem } from "./MapList";
import { fetchAndParsePud } from "./PudParser";
import PudRenderer from "./PudRenderer";

export const MapBrowser: React.FC = () => {
    const [pud, setPud] = useState<ArrayBuffer | null>(null);
    const [currentMapId, setCurrentMapId] = useState<number | null>(null);
    const [pudCache, setPudCache] = useState<Map<number, ArrayBuffer>>(new Map());

    const handleFocusMap = async (item: PudMapItem | null) => {
        if (!item) {
            // Clear preview when no map is selected
            setPud(null);
            setCurrentMapId(null);
            return;
        }

        // If we're already showing this map, don't refetch
        if (currentMapId === item.id) {
            return;
        }

        // Check cache first
        const cached = pudCache.get(item.id);
        if (cached) {
            setPud(cached);
            setCurrentMapId(item.id);
            return;
        }

        try {
            const pudArrayBuffer = await fetchAndParsePud(item.url);

            // Cache the result
            setPudCache(prev => new Map(prev).set(item.id, pudArrayBuffer));
            setPud(pudArrayBuffer);
            setCurrentMapId(item.id);
        } catch (err) {
            setPud(null);
            setCurrentMapId(null);
        }
    };

    return (
        <div className="map-browser">
            <div className="map-list-container">
                <MapList onFocusMap={handleFocusMap} />
            </div>
            <div className="pud-renderer-container">
                {pud ? (
                    <PudRenderer pudArrayBuffer={pud} />
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '300px',
                        color: '#cccccc',
                        fontStyle: 'italic',
                        textAlign: 'center'
                    }}>
                        Click a map in the table to show a preview
                    </div>
                )}
            </div>
        </div>
    );
};
