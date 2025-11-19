// pudParser.ts

export interface ParsedPud {
    tiles: number[];
    width: number;
    height: number;
    terrain: string; // normalized to remastered asset prefix
}

const ERA_MAP: Record<number, string> = {
    0: "forest",    // summer/forest
    1: "iceland",   // winter
    2: "wasteland", // wasteland
    3: "swamp",     // swamp
};

export async function fetchAndParsePud(url: string): Promise<ArrayBuffer> {
    // URL encode the path to handle special characters
    const encodedUrl = url.split('/').map((part, index) =>
        index === 0 || part === '' ? part : encodeURIComponent(part)
    ).join('/');
    console.log('Original URL:', url);
    console.log('Encoded URL:', encodedUrl);
    const res = await fetch(encodedUrl);
    return res.arrayBuffer();
}

export function parsePud(buffer: ArrayBuffer): ParsedPud {
    const view = new DataView(buffer);
    let offset = 0;
    const tiles: number[] = [];
    let width = 64;
    let height = 64;
    let terrain = "forest";

    while (offset < buffer.byteLength) {
        // Read 4‑byte chunk ID
        const id = String.fromCharCode(
            view.getUint8(offset),
            view.getUint8(offset + 1),
            view.getUint8(offset + 2),
            view.getUint8(offset + 3)
        );

        // Read 4‑byte chunk length (little‑endian)
        const length = view.getUint32(offset + 4, true);
        offset += 8;

        if (id === "DIM ") {
            width = view.getUint16(offset, true);
            height = view.getUint16(offset + 2, true);
        }

        if (id === "MTXM") {
            // Each tile is 2 bytes
            const count = length / 2;
            for (let i = 0; i < count; i++) {
                tiles.push(view.getUint16(offset + i * 2, true));
            }
        }

        if (id === "ERA ") {
            const eraCode = view.getUint16(offset, true);
            terrain = ERA_MAP[eraCode] ?? "forest";
            console.log("Parsed terrain:", terrain, "(code:", eraCode, ")");
        }

        // Advance offset by chunk length
        offset += length;

        // Align to 4‑byte boundary (chunks are padded)
        while (offset % 4 !== 0) {
            offset++;
        }
    }

    return { tiles, width, height, terrain };
}
