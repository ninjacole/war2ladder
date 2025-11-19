import React, { useCallback, useEffect, useRef, useState } from 'react';

// TypeScript interfaces
interface PudData {
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

interface Unit {
    x: number;
    y: number;
    type: number;
    player: number;
    alter: number;
}

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

// PUD Parser class
class PudParser {
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

            // Debug logging
            console.log('Header bytes:', Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' '));
            console.log('Header as string:', new TextDecoder().decode(header));
            console.log('Expected bytes:', Array.from(expectedHeader).map(b => b.toString(16).padStart(2, '0')).join(' '));

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

// Color mapping
const FOREST_COLORS: Record<number, [number, number, number]> = {
    0x0010: [0x04, 0x38, 0x75], 0x0020: [0x04, 0x34, 0x71], 0x0030: [0x6d, 0x41, 0x00],
    0x0040: [0x61, 0x38, 0x00], 0x0050: [0x28, 0x55, 0x0c], 0x0060: [0x24, 0x49, 0x04],
    0x0070: [0x00, 0x4d, 0x00], 0x0080: [0x18, 0x18, 0x18], 0x0090: [0x51, 0x51, 0x51]
};

const UNIT_TYPES = {
    GOLD_MINE: 0x5C,      // 92 decimal
    OIL_PATCH: 0x5D,      // 93 decimal
    HUMAN_START: 0x5E,    // 94 decimal
    ORC_START: 0x5F       // 95 decimal
};

function getTileColor(era: number, tileId: number): Color {
    const baseTile = tileId & 0xFFF0;
    const color = FOREST_COLORS[baseTile];

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

function getUnitColor(unitType: number, playerId: number): Color {
    // Special resource nodes get their own colors
    if (unitType === UNIT_TYPES.GOLD_MINE) {
        return { r: 255, g: 255, b: 0, a: 255 }; // Bright yellow for gold
    }
    if (unitType === UNIT_TYPES.OIL_PATCH) {
        return { r: 0, g: 0, b: 0, a: 255 }; // Black for oil
    }

    // Regular units use player colors
    return getPlayerColor(playerId);
}

function getPlayerColor(playerId: number): Color {
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

// Props interface
interface PudRendererProps {
    pudFile?: File | null;
    pudArrayBuffer?: ArrayBuffer | null;
    className?: string;
    style?: React.CSSProperties;
}

// Component styles
const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    } as React.CSSProperties,
    controls: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        marginBottom: '20px',
    },
    controlGroup: {
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        gap: '8px',
    },
    label: {
        marginBottom: '5px',
        fontWeight: 'bold',
    },
    input: {
        padding: '5px',
        border: '1px solid #ccc',
        borderRadius: '4px',
    },
    canvasContainer: {
        border: '1px solid #ccc',
        display: 'inline-block',
        maxWidth: '100%',
        overflow: 'auto',
        marginBottom: '20px',
    },
    canvas: {
        border: 'none',
        imageRendering: 'pixelated' as const,
    },
    infoPanel: {
        padding: '15px',
        borderRadius: '4px',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
    },
    exportButtons: {
        marginTop: '15px',
        display: 'flex',
        gap: '10px',
    },
    button: {
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    error: {
        color: 'red',
        fontWeight: 'bold',
        margin: '10px 0',
    },
};

// Main component
const PudRenderer: React.FC<PudRendererProps> = ({
    pudFile,
    pudArrayBuffer,
    className = '',
    style = {}
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pudData, setPudData] = useState<PudData | null>(null);
    const [error, setError] = useState<string>('');

    // Render settings
    const [tileSize, setTileSize] = useState(4);
    const [showResources, setShowResources] = useState(true);
    const [showStartLocations, setShowStartLocations] = useState(true);

    // Parse PUD file
    const parsePudFile = useCallback(async (file: File) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const parser = new PudParser(arrayBuffer);
            const data = parser.parse();
            setPudData(data);
            setError('');
        } catch (err) {
            setError(`Error loading PUD file: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setPudData(null);
        }
    }, []);

    const parsePudArrayBuffer = useCallback((arrayBuffer: ArrayBuffer) => {
        try {
            const parser = new PudParser(arrayBuffer);
            const data = parser.parse();
            setPudData(data);
            setError('');
        } catch (err) {
            setError(`Error loading PUD data: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setPudData(null);
        }
    }, []);

    // Effect to handle file changes
    useEffect(() => {
        if (pudFile) {
            parsePudFile(pudFile);
        } else if (pudArrayBuffer) {
            parsePudArrayBuffer(pudArrayBuffer);
        }
    }, [pudFile, pudArrayBuffer, parsePudFile, parsePudArrayBuffer]);

    // Render the map
    const renderMap = useCallback(() => {
        if (!pudData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const canvasWidth = pudData.mapWidth * tileSize;
        const canvasHeight = pudData.mapHeight * tileSize;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Clear canvas
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Render tiles
        for (let y = 0; y < pudData.mapHeight; y++) {
            for (let x = 0; x < pudData.mapWidth; x++) {
                const tileIndex = y * pudData.mapWidth + x;
                if (tileIndex < pudData.tilesMap.length) {
                    const tileId = pudData.tilesMap[tileIndex];
                    const color = getTileColor(pudData.era, tileId);

                    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }

        // Render units, resources, and start locations
        const unitSize = 3; // Fixed unit size
        for (const unit of pudData.units) {
            const isResource = (unit.type === UNIT_TYPES.GOLD_MINE || unit.type === UNIT_TYPES.OIL_PATCH);
            const isStartLocation = (unit.type === UNIT_TYPES.HUMAN_START || unit.type === UNIT_TYPES.ORC_START);

            const shouldRender = (isResource && showResources) || (isStartLocation && showStartLocations);

            if (shouldRender) {
                const centerX = unit.x * tileSize;
                const centerY = unit.y * tileSize;

                if (isStartLocation) {
                    // Render start locations as circles
                    const radius = Math.max(4, tileSize * unitSize * 0.8);
                    const color = getUnitColor(unit.type, unit.player);

                    // Draw filled circle
                    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                    ctx.fill();

                    // Draw border
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Add inner border
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                } else {
                    // Render resources as squares
                    const color = getUnitColor(unit.type, unit.player);
                    const size = Math.max(1, tileSize * unitSize);

                    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
                    ctx.fillRect(
                        centerX - size / 2,
                        centerY - size / 2,
                        size,
                        size
                    );

                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        centerX - size / 2,
                        centerY - size / 2,
                        size,
                        size
                    );
                }
            }
        }
    }, [pudData, tileSize, showResources, showStartLocations]);

    // Effect to render when settings change
    useEffect(() => {
        renderMap();
    }, [renderMap]);

    // Export functions
    const exportPng = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'warcraft2_map.png';
        link.href = canvasRef.current.toDataURL('image/png');
        link.click();
    };

    const exportJpeg = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'warcraft2_map.jpg';
        link.href = canvasRef.current.toDataURL('image/jpeg', 0.8);
        link.click();
    };

    // Calculate map statistics
    const getMapStats = () => {
        if (!pudData) return null;

        const eras = ['Forest', 'Winter', 'Wasteland', 'Swamp'];
        let goldMines = 0;
        let oilPatches = 0;
        let startLocations = 0;

        for (const unit of pudData.units) {
            if (unit.type === UNIT_TYPES.GOLD_MINE) goldMines++;
            if (unit.type === UNIT_TYPES.OIL_PATCH) oilPatches++;
            if (unit.type === UNIT_TYPES.HUMAN_START || unit.type === UNIT_TYPES.ORC_START) startLocations++;
        }

        return {
            description: pudData.description || 'No description',
            era: eras[pudData.era] || 'Unknown',
            dimensions: `${pudData.mapWidth}x${pudData.mapHeight}`,
            version: pudData.version,
            totalUnits: pudData.units.length,
            goldMines,
            oilPatches,
            startLocations,
            tag: '0x' + pudData.tag.toString(16).toUpperCase()
        };
    };

    const mapStats = getMapStats();

    return (
        <div className={className} style={{ ...styles.container, ...style }}>
            {error && <div style={styles.error}>{error}</div>}

            {pudData && (
                <>
                    <div style={styles.controls}>
                        <div style={styles.controlGroup}>
                            <input
                                type="checkbox"
                                checked={showResources}
                                onChange={(e) => setShowResources(e.target.checked)}
                            />
                            <label style={styles.label}>Resources</label>
                        </div>

                        <div style={styles.controlGroup}>
                            <input
                                type="checkbox"
                                checked={showStartLocations}
                                onChange={(e) => setShowStartLocations(e.target.checked)}
                            />
                            <label style={styles.label}>Start Locations</label>
                        </div>
                    </div>

                    <div style={styles.canvasContainer}>
                        <canvas ref={canvasRef} style={styles.canvas} />
                    </div>

                    {mapStats && (
                        <div style={styles.infoPanel}>
                            <h3>Map Information</h3>
                            <div style={styles.infoRow}>
                                <span>Description:</span>
                                <span>{mapStats.description}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span>Era:</span>
                                <span>{mapStats.era}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span>Dimensions:</span>
                                <span>{mapStats.dimensions}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span>Version:</span>
                                <span>{mapStats.version}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span>Total Units:</span>
                                <span>{mapStats.totalUnits}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span>Gold Mines:</span>
                                <span>{mapStats.goldMines}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span>Oil Patches:</span>
                                <span>{mapStats.oilPatches}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span>Start Locations:</span>
                                <span>{mapStats.startLocations}</span>
                            </div>
                            <div style={styles.infoRow}>
                                <span>Tag:</span>
                                <span>{mapStats.tag}</span>
                            </div>

                            <div style={styles.exportButtons}>
                                <button style={styles.button} onClick={exportPng}>
                                    Export as PNG
                                </button>
                                <button style={styles.button} onClick={exportJpeg}>
                                    Export as JPEG
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PudRenderer;