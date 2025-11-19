interface AtlasFrame {
    frame: { x: number; y: number; w: number; h: number };
    rotated: boolean;
    trimmed: boolean;
    spriteSourceSize: { x: number; y: number; w: number; h: number };
    sourceSize: { w: number; h: number };
}

interface Atlas {
    frames: Record<string, AtlasFrame>;
    meta: any;
}

/**
 * Load atlas JSON + PNG and return a lookup function.
 */
export async function loadAtlas(
    jsonUrl: string,
    imageUrl: string
): Promise<{
    image: HTMLImageElement;
    getFrame: (key: string) => AtlasFrame | undefined;
}> {
    const atlas: Atlas = await fetch(jsonUrl).then((r) => r.json());

    const image = new Image();
    image.src = imageUrl;
    await new Promise((resolve) => {
        image.onload = resolve;
    });

    return {
        image,
        getFrame: (key: string) => atlas.frames[key],
    };
}