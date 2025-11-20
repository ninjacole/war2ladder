// TypeScript interfaces
interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export class MapColors {
    private UNIT_TYPES = {
        GOLD_MINE: 0x5C,      // 92 decimal
        OIL_PATCH: 0x5D,      // 93 decimal
        HUMAN_START: 0x5E,    // 94 decimal
        ORC_START: 0x5F       // 95 decimal
    };

    private FOREST_COLORS: Record<number, [number, number, number]> = {
        0x0010: [0x04, 0x38, 0x75], 0x0020: [0x04, 0x34, 0x71], 0x0030: [0x6d, 0x41, 0x00],
        0x0040: [0x61, 0x38, 0x00], 0x0050: [0x28, 0x55, 0x0c], 0x0060: [0x24, 0x49, 0x04],
        0x0070: [0x00, 0x4d, 0x00], 0x0080: [0x18, 0x18, 0x18], 0x0090: [0x51, 0x51, 0x51]
    };

    getPlayerColor(playerId: number): Color {
        const colors: Color[] = [
            { r: 255, g: 0, b: 0, a: 255 },     // Red
            { r: 0, g: 0, b: 255, a: 255 },     // Blue
            { r: 0, g: 255, b: 0, a: 255 },     // Green
            { r: 255, g: 255, b: 0, a: 255 },   // Yellow
            { r: 255, g: 165, b: 0, a: 255 },   // Orange
            { r: 128, g: 0, b: 128, a: 255 },   // Purple
            { r: 255, g: 255, b: 255, a: 255 }, // White
            { r: 0, g: 0, b: 0, a: 255 }        // Black
        ];
        return colors[playerId % colors.length];
    }

    getUnitColor(unitType: number, playerId: number): Color {
        // Special resource nodes get their own colors
        if (unitType === this.UNIT_TYPES.GOLD_MINE) {
            return { r: 255, g: 255, b: 0, a: 255 }; // Bright yellow for gold
        }
        if (unitType === this.UNIT_TYPES.OIL_PATCH) {
            return { r: 0, g: 0, b: 0, a: 255 }; // Black for oil
        }

        // Regular units use player colors
        return this.getPlayerColor(playerId);
    }

    getTileColor(era: number, tileId: number): Color {
        const baseTile = tileId & 0xFFF0;
        const color = this.FOREST_COLORS[baseTile];

        if (color) {
            return { r: color[0], g: color[1], b: color[2], a: 255 };
        }

        // Default colors
        switch (era) {
            case 1: return { r: 200, g: 200, b: 220, a: 255 }; // Winter
            case 2: return { r: 150, g: 100, b: 60, a: 255 };  // Wasteland
            case 3: return { r: 80, g: 120, b: 60, a: 255 };   // Swamp
            default: return { r: 60, g: 120, b: 40, a: 255 };  // Forest
        }
    }

    isResourceNode(unitType: number): boolean {
        return unitType === this.UNIT_TYPES.GOLD_MINE || unitType === this.UNIT_TYPES.OIL_PATCH;
    }

    isStartLocation(unitType: number): boolean {
        return unitType === this.UNIT_TYPES.HUMAN_START || unitType === this.UNIT_TYPES.ORC_START;
    }
}