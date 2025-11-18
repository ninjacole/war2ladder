import { MapList } from "../components/maps/MapList";
import { Welcome } from "../components/Welcome";


export const ComponentToMenuMap: Record<string, React.FC> = {
    welcome: Welcome,
    maps: MapList,
    // 'players-list': PlayersList,
    // 'players-stats': PlayersStats,
    // 'players-search': PlayersSearch,
    // form: FormPage,
    // 'map-browser': MapBrowser,
    // 'upload-map': UploadMap,
    // 'ladder-standings': LadderStandings,
    // 'ladder-rules': LadderRules,
    // 'sharkfight-records': SharkfightRecords,
    // upcoming: EventsUpcoming,
    // past: EventsPast,
    // '100prize': PrizeDraw,
    // 'mystery-allies': MysteryAllies,
    // 'race-to-lust': RaceToLust
};