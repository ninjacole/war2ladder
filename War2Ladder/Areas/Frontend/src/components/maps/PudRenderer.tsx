import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../../styles/maps/pud-renderer.css';
import { MapColors } from './MapColors';
import { PudData, PudParser } from './PudParser';

interface IPudRendererProps {
    pudArrayBuffer?: ArrayBuffer | null;
    className?: string;
    style?: React.CSSProperties;
}

const PudRenderer: React.FC<IPudRendererProps> = (props: IPudRendererProps) => {
    const { pudArrayBuffer, className, style } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pudData, setPudData] = useState<PudData | null>(null);
    const [error, setError] = useState<string>('');

    // Render settings
    const [tileSize] = useState(4);
    const [showResources, setShowResources] = useState(true);
    const [showStartLocations, setShowStartLocations] = useState(true);

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
        if (pudArrayBuffer) {
            parsePudArrayBuffer(pudArrayBuffer);
        }
    }, [pudArrayBuffer, parsePudArrayBuffer]);

    // Render the map
    const renderMap = useCallback(() => {
        const mapColors = new MapColors();

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
                    const color = mapColors.getTileColor(pudData.era, tileId);

                    ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
                    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                }
            }
        }

        // Render units, resources, and start locations
        const unitSize = 3; // Fixed unit size
        for (const unit of pudData.units) {
            const isResource = mapColors.isResourceNode(unit.type);
            const isStartLocation = mapColors.isStartLocation(unit.type);

            const shouldRender = (isResource && showResources) || (isStartLocation && showStartLocations);

            if (shouldRender) {
                const centerX = unit.x * tileSize;
                const centerY = unit.y * tileSize;

                if (isStartLocation) {
                    // Render start locations as circles
                    const radius = Math.max(4, tileSize * unitSize * 0.8);
                    const color = mapColors.getUnitColor(unit.type, unit.player);

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
                    const color = mapColors.getUnitColor(unit.type, unit.player);
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

    if (!pudArrayBuffer) {
        return <div className="preview-text">Click a map in the table to show a preview</div>;
    }

    return <div className={`pud-renderer-container ${className}`} style={style}>
        {error && <div className="pud-renderer-error">{error}</div>}

        {pudData && <>
            <div className="pud-renderer-controls">
                <div className="pud-renderer-control-group">
                    <input
                        type="checkbox"
                        checked={showResources}
                        onChange={(e) => setShowResources(e.target.checked)}
                    />
                    <label className="pud-renderer-label">Resources</label>
                </div>

                <div className="pud-renderer-control-group">
                    <input
                        type="checkbox"
                        checked={showStartLocations}
                        onChange={(e) => setShowStartLocations(e.target.checked)}
                    />
                    <label className="pud-renderer-label">Start Locations</label>
                </div>
            </div>

            <div className="pud-renderer-canvas-container">
                <canvas ref={canvasRef} className="pud-renderer-canvas" />
            </div>

            <div className="pud-renderer-export-buttons">
                <button className="pud-renderer-button" onClick={exportPng}>
                    Export as PNG
                </button>
                <button className="pud-renderer-button" onClick={exportJpeg}>
                    Export as JPEG
                </button>
            </div>
        </>}
    </div>
};

export default PudRenderer;