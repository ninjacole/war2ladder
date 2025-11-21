import { useState } from "react";
import "../../styles/maps/map-browser.css";
import { MapList } from "./MapList";
import { PudMapItem } from "./MapTypes";
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
            // Fetch the PUD file directly - PudRenderer will handle parsing
            const response = await fetch(item.url);
            const pudArrayBuffer = await response.arrayBuffer();

            // Cache the result
            setPudCache(prev => new Map(prev).set(item.id, pudArrayBuffer));
            setPud(pudArrayBuffer);
            setCurrentMapId(item.id);
        } catch (err) {
            setPud(null);
            setCurrentMapId(null);
        }
    };

    return <div className="map-browser">
        <div className="map-list-container">
            <MapList onFocusMap={handleFocusMap} />
        </div>
        <div className="pud-renderer-wrapper">
            <PudRenderer pudArrayBuffer={pud} />
        </div>
    </div>
};
