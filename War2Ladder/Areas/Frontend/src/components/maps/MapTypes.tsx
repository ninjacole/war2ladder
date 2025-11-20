export interface PudMapItem {
    id: number;
    name: string;
    filename: string; // original filename for downloads
    size: number; // bytes
    url: string;  // public URL for download/fetch
    dimensions?: string;
    players?: number;
}