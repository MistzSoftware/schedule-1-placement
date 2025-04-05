import React, { useState } from 'react';

// Dynamically import all JSON files from the maps folder
const mapFiles = import.meta.glob('../assets/maps/*.json', { eager: true });
let maps = Object.values(mapFiles);

const MapDrawer = ({ onMapChange }: { onMapChange: (map: any) => void }) => {
    const [currentMap, setCurrentMap] = useState(maps[0]); // Manage currentMap state here

    const handleMapChange = (map: any) => {
        setCurrentMap(map);
        onMapChange(map);
    };

    return (
        <div className="drawer maps-drawer">
        <h2>Maps</h2>
        {maps.map((map: any) => (
            <button key={map.name} className="map-button" onClick={() => handleMapChange(map)}>
            {map.name}
            </button>
        ))}
        </div>
    );
};

export default MapDrawer;