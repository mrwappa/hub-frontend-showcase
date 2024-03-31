import React from 'react';
import {
    GoogleMap, LoadScript, Marker, MarkerClusterer
} from '@react-google-maps/api';
import { Button } from 'semantic-ui-react';

const googleMapsApiKey = 'AIzaSyDpH4UoBlDDjbWyZaB_xxPm8niU957nI1c';

console.log('googleMapsApiKey', googleMapsApiKey);
const mapContainerStyle = {
    width: '100%',
    height: '92vh' // Use '100vh' to make the container stretch to fill the viewport height
};

const center = {
    lat: 37.7749,
    lng: -122.4194
};

const options = {
    mapTypeId: 'hybrid'
};

const DeviceMap = () => {


    function onMarkerClustererClick(markerClusterer) {
        const clickedMarkers = markerClusterer.getMarkers();
        console.log(`Current clicked markers length: ${clickedMarkers.length}`);
        console.log(clickedMarkers);
    }


    const markers = [
        { photo_id: 1, latitude: 38.7749, longitude: -122.4194 },
        { photo_id: 2, latitude: 39.7833, longitude: -122.4167 },
        { photo_id: 3, latitude: 40.7749, longitude: -122.4313 }
    ];
    
    return (
        <LoadScript googleMapsApiKey={googleMapsApiKey}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={10}
                options={options}
            >
                <MarkerClusterer
                    onClick={onMarkerClustererClick}
                    averageCenter
                    enableRetinaIcons
                    gridSize={60}
                >
                    {markers.map(marker => (
                        <Marker
                            key={marker.photo_id}
                            position={{ lat: marker.latitude, lng: marker.longitude }}
                        />
                    ))}
                </MarkerClusterer>
            </GoogleMap>
        </LoadScript>
    );
};

export default DeviceMap;