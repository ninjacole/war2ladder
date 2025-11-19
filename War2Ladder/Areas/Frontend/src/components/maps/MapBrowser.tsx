import { useState } from "react";
import { MapList, PudMapItem } from "./MapList";
import { fetchAndParsePud } from "./PudParser";
import PudRenderer from "./PudRenderer";

export const MapBrowser: React.FC = () => {
    const [pud, setPud] = useState<ArrayBuffer | null>(null);

    const handleFocusMap = async (item: PudMapItem) => {
        try {
            const pudArrayBuffer = await fetchAndParsePud(item.url);
            setPud(pudArrayBuffer);
        } catch (err) {
            console.error("Failed to load map:", err);
            setPud(null);
        }
    };

    return (
        <div className="map-browser">
            <div className="map-list-container">
                <MapList onFocusMap={handleFocusMap} />
            </div>
            <div className="pud-renderer-container">
                <PudRenderer pudArrayBuffer={pud} />
            </div>
        </div>
    );
};
