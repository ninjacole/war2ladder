import '../../styles/map-selection-bar.css';

interface IMapSelectionbarProps {
    selectionCount: number;
    filteredMapCount: number;
    onDownload: () => void;
}

const MapSelectionBar = (props: IMapSelectionbarProps) => {
    const { selectionCount, filteredMapCount, onDownload } = props;

    return <div className="selection-bar">
        <span className="selection-text">
            {selectionCount} of {filteredMapCount} selected
        </span>
        <button
            onClick={onDownload}
            disabled={selectionCount === 0}
            className={`download-button ${selectionCount > 0 ? 'download-button-enabled' : 'download-button-disabled'}`}
        >
            ⬇ Download ({selectionCount})
        </button>
    </div>
}

export default MapSelectionBar;