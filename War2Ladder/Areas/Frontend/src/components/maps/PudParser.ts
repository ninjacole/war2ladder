// PudParser.ts - Comprehensive PUD file parser for Warcraft II maps

// TypeScript interfaces
export interface PudData {
    version: number;
    description: string;
    tag: number;
    era: number;
    dimensions: number;
    mapWidth: number;
    mapHeight: number;
    tiles: number;
    tilesMap: Uint16Array;
    units: Unit[];
}

export interface Unit {
    x: number;
    y: number;
    type: number;
    player: number;
    alter: number;
}

// PUD Parser class
export class PudParser {
    private data: Uint8Array;
    private offset: number = 0;

    constructor(arrayBuffer: ArrayBuffer) {
        this.data = new Uint8Array(arrayBuffer);
        this.offset = 0;
    }

    private readUint8(): number {
        if (this.offset >= this.data.length) throw new Error("Read beyond buffer");
        return this.data[this.offset++];
    }

    private readUint16(): number {
        const low = this.readUint8();
        const high = this.readUint8();
        return low | (high << 8);
    }

    private readUint32(): number {
        const b1 = this.readUint8();
        const b2 = this.readUint8();
        const b3 = this.readUint8();
        const b4 = this.readUint8();
        return b1 | (b2 << 8) | (b3 << 16) | (b4 << 24);
    }

    private readBuffer(length: number): Uint8Array {
        if (this.offset + length > this.data.length) {
            throw new Error("Read beyond buffer");
        }
        const result = this.data.slice(this.offset, this.offset + length);
        this.offset += length;
        return result;
    }

    private readString(length: number): string {
        const buffer = this.readBuffer(length);
        let actualLength = length;
        for (let i = 0; i < length; i++) {
            if (buffer[i] === 0) {
                actualLength = i;
                break;
            }
        }
        return new TextDecoder().decode(buffer.slice(0, actualLength));
    }

    private findSection(sectionName: string): { offset: number; size: number } | null {
        let searchOffset = 0;
        const sectionBytes = new TextEncoder().encode(sectionName);

        while (searchOffset < this.data.length - 8) {
            let found = true;
            for (let i = 0; i < 4; i++) {
                if (this.data[searchOffset + i] !== sectionBytes[i]) {
                    found = false;
                    break;
                }
            }

            if (found) {
                const size = (this.data[searchOffset + 4]) |
                    (this.data[searchOffset + 5] << 8) |
                    (this.data[searchOffset + 6] << 16) |
                    (this.data[searchOffset + 7] << 24);

                return { offset: searchOffset + 8, size: size };
            }
            searchOffset++;
        }
        return null;
    }

    private goToSection(sectionName: string): number {
        const section = this.findSection(sectionName);
        if (!section) return 0;
        this.offset = section.offset;
        return section.size;
    }

    public parse(): PudData {
        const result: PudData = {
            version: 0,
            description: "",
            tag: 0,
            era: 0,
            dimensions: 0,
            mapWidth: 32,
            mapHeight: 32,
            tiles: 0,
            tilesMap: new Uint16Array(0),
            units: []
        };

        // Parse TYPE section
        const typeSize = this.goToSection("TYPE");
        if (typeSize) {
            const header = this.readBuffer(12);
            const expectedHeader = new TextEncoder().encode("WAR2 MAP\0\0");

            for (let i = 0; i < 10; i++) {
                if (header[i] !== expectedHeader[i]) {
                    throw new Error("Invalid PUD file - not a WAR2 MAP");
                }
            }
            result.tag = this.readUint32();
        }

        // Parse VER section
        const verSize = this.goToSection("VER ");
        if (verSize) {
            result.version = this.readUint16();
        }

        // Parse DESC section
        const descSize = this.goToSection("DESC");
        if (descSize) {
            result.description = this.readString(32);
        }

        // Parse ERA/ERAX section
        let eraSize = this.goToSection("ERAX");
        if (!eraSize) {
            eraSize = this.goToSection("ERA ");
        }
        if (eraSize) {
            const eraValue = this.readUint16();
            if (eraValue === 0x01) result.era = 1; // Winter
            else if (eraValue === 0x02) result.era = 2; // Wasteland
            else if (eraValue === 0x03) result.era = 3; // Swamp
            else result.era = 0; // Forest
        }

        // Parse DIM section
        const dimSize = this.goToSection("DIM ");
        if (dimSize) {
            const x = this.readUint16();
            const y = this.readUint16();

            result.mapWidth = x;
            result.mapHeight = y;
            result.tiles = x * y;

            if (x === 64 && y === 64) result.dimensions = 1;
            else if (x === 96 && y === 96) result.dimensions = 2;
            else if (x === 128 && y === 128) result.dimensions = 3;
            else result.dimensions = 0;
        }

        // Parse MTXM section (tile map)
        const mtxmSize = this.goToSection("MTXM");
        if (mtxmSize) {
            const tileCount = mtxmSize / 2;
            result.tilesMap = new Uint16Array(tileCount);

            for (let i = 0; i < tileCount; i++) {
                result.tilesMap[i] = this.readUint16();
            }
        }

        // Parse UNIT section
        const unitSize = this.goToSection("UNIT");
        if (unitSize) {
            const unitCount = unitSize / 8;
            result.units = [];

            for (let i = 0; i < unitCount; i++) {
                const unit: Unit = {
                    x: this.readUint16(),
                    y: this.readUint16(),
                    type: this.readUint8(),
                    player: this.readUint8(),
                    alter: this.readUint16()
                };
                result.units.push(unit);
            }
        }

        return result;
    }
}
