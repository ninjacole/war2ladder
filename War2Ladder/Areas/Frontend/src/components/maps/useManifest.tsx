import { useEffect, useState } from "react";
import { PudMapItem } from "./MapTypes";

interface IManifest {
    id: number;
    name: string;
    filename: string;
    path: string;
    size: number;
    dimensions?: string;
    players?: number;
}

const useManifest = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [maps, setMaps] = useState<PudMapItem[]>([]);

    useEffect(() => {
        async function loadMaps() {
            setIsLoading(true);
            try {
                const res: Response = await fetch("/maps/manifest.json");
                const manifest: IManifest[] = await res.json();

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

    return { isLoading, maps };
}

export { useManifest };

