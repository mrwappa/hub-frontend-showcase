import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, Circle, Rectangle, FeatureGroup } from 'react-leaflet';
//React leaflet used to be 2.8.0

const center = [51.505, -0.09];
const rectangle = [
    [51.49, -0.08],
    [51.5, -0.06]
];

export default function DeviceMap() {
    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={false}>
            <TileLayer
                url='https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
                maxZoom={20}
                subdomains={['mt1', 'mt2', 'mt3']}
            />
            <LayersControl position="topright">
                <LayersControl.Overlay name="Marker with popup">
                    <Marker position={center}>
                        <Popup>
                            A pretty CSS3 popup. <br /> Easily customizable.
                        </Popup>
                    </Marker>
                </LayersControl.Overlay>

                <LayersControl.Overlay checked name="Layer group with circles">
                    <LayerGroup>
                        <Circle
                            center={center}
                            pathOptions={{ fillColor: 'blue' }}
                            radius={200}
                        />
                        <Circle
                            center={center}
                            pathOptions={{ fillColor: 'red' }}
                            radius={100}
                            stroke={false}
                        />
                        <LayerGroup>
                            <Circle
                                center={[51.51, -0.08]}
                                pathOptions={{ color: 'green', fillColor: 'green' }}
                                radius={100}
                            />
                        </LayerGroup>
                    </LayerGroup>
                </LayersControl.Overlay>
                <LayersControl.Overlay name="Feature group">
                    <FeatureGroup pathOptions={{ color: 'purple' }}>
                        <Popup>Popup in FeatureGroup</Popup>
                        <Circle center={[51.51, -0.06]} radius={200} />
                        <Rectangle bounds={rectangle} />
                    </FeatureGroup>
                </LayersControl.Overlay>
            </LayersControl>
        </MapContainer>
    );
}