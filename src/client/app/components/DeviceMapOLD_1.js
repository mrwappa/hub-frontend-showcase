import React from "react";
import GoogleMapReact from 'google-map-react';
import { Image } from 'semantic-ui-react';

const AnyReactComponent = ({ text }) => (
  <div style={{ fontSize: '80px', transformOrigin: 'center'}}>
    {text}
  </div>
);

export default function SimpleMap(){
  const defaultProps = {
    center: {
      lat: 10.99835602,
      lng: 77.01502627
    },
    zoom: 11
  };

  return (
    // Important! Always set the container height explicitly
    <div style={{ height: '100vh', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: "AIzaSyDpH4UoBlDDjbWyZaB_xxPm8niU957nI1c" }}
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
        options={{ mapTypeId: 'hybrid' }}
      >
        <AnyReactComponent
          lat={10.99835602}
          lng={77.01502627}
          text="My Marker"
        />

      </GoogleMapReact>
    </div>
  );
}