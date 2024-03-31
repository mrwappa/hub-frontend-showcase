import React from 'react';
import L from 'leaflet';
import { Map, LayersControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
//import { GoogleMutant } from 'react-leaflet-googlemutant';

import 'react-leaflet-markercluster/dist/styles.min.css';
import 'leaflet/dist/leaflet.css';
delete L.Icon.Default.prototype._getIconUrl;

const defaultMapCenter = [50, 9];
const defaultMapZoom = 4;
const { BaseLayer } = LayersControl;


export default function DeviceMap() {

    return (
        <Map
            center={defaultMapCenter}
            zoom={defaultMapZoom}
            //bounds={}
            //style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
            /*ref={(mapRef) => {
                this.map = mapRef;
            }}*/>

            <LayersControl position='topright'>
                {/*<BaseLayer checked name='Google Maps Hybrid' default>
                    <GoogleMutant type="hybrid" default />
                </BaseLayer>
                <BaseLayer name='Google Maps Roads'>
                    <GoogleMutant type="roadmap" />
                </BaseLayer>
                <BaseLayer name='Google Maps Terrain'>
                    <GoogleMutant type="terrain" />
                </BaseLayer>
                <BaseLayer name='Google Maps Satellite'>
                    <GoogleMutant type="satellite" />
        </BaseLayer>*/}
            </LayersControl>
        </Map>);
}