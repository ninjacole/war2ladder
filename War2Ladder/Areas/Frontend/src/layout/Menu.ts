import { IMenuNodeProps } from "./MenuNode";

export const MENU: IMenuNodeProps[] = [
    {
        id: 'wc2players',
        label: 'Warcraft 2 Players',
        children: [
            { id: 'players-list', label: 'Player List', href: '#' },
            { id: 'players-stats', label: 'Player Stats', href: '#' },
            { id: 'players-search', label: 'Search', href: '#' }
        ]
    },
    { id: 'form', label: 'Form', href: '#' },
    {
        id: 'maps',
        label: 'Maps',
        children: [
            { id: 'map-browser', label: 'Map Browser', href: '#' },
            { id: 'upload-map', label: 'Upload Map', href: '#' }
        ]
    },
    {
        id: 'sharkfight-ladder-2025',
        label: 'Sharkfight Ladder 2025',
        children: [
            { id: 'ladder-standings', label: 'Standings', href: '#' },
            { id: 'ladder-rules', label: 'Rules', href: '#' }
        ]
    },
    { id: 'sharkfight-records', label: 'Sharkfight Records', href: '#' },
    {
        id: 'events',
        label: 'Events',
        children: [
            { id: 'upcoming', label: 'Upcoming', href: '#' },
            { id: 'past', label: 'Past Events', href: '#' }
        ]
    },
    { id: '100prize', label: '$100 Prize Draw', href: '#' },
    { id: 'mystery-allies', label: 'Mystery Allies Tournament', href: '#' },
    { id: 'race-to-lust', label: 'Race to Lust Challenge', href: '#' }
];