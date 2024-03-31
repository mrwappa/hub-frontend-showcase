import React, { useEffect, useState } from 'react';
import { setInnerState } from 'services/ReactUtilities';
import { Segment, Header, Button, Table, Input, Icon, Checkbox, Popup } from 'semantic-ui-react';
import { Map, Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoLocationOptions, createMarker, defaultMarkerColors, limitDecimal } from 'services/UtilityService';
import clone from 'lodash.clone';

import { api } from 'services/ApiService';
import { deviceLocationsHook } from '../hooks/ApiQueryHooks';
import { baseMutationHook } from '../hooks/ApiPostHooks';
import { toastSuccess } from '../services/Toaster';
import config from '../config';

function filterInvalid(obj) {
	for (let k in obj) if (typeof obj[k] !== 'number') delete obj[k];
	return obj;
}

const createClusterCustomIcon = function (cluster) {
	return L.divIcon({
		html: `<span>${cluster.getChildCount()}</span>`,
		className: 'marker-cluster-custom',
		iconSize: L.point(40, 40, true),
	});
};

let state = {
	location: {
		latitude: 0,
		longitude: 0,
		altitude: 0,
		locked: false
	},
	originalLocation: {},
	zoom: 12,
	form: {
		retrievingLocation: false,
		watchPositionId: null,
	},
	allDeviceLocations: []
};

export default function LocationSegment({
	device,
	projectId,
	refetchDevices
}) {

	const [location, setLocation] = useState(state.location);
	const [originalLocation, setOriginalLocation] = useState(state.originalLocation);
	const [form, setForm] = useState(state.form);
	const [zoom, setZoom] = useState(state.zoom);
	const [allDeviceLocations, setAllDeviceLocations] = useState(state.allDeviceLocations);
	const [mapRef, setMapRef] = useState(null);
	const [refmarker, setRefmarker] = useState(null);

	deviceLocationsHook(projectId, {
		onSuccess: (data) => {
			let devices = data.filter((dev) => {
				return dev.id !== device.id;
			});
			setAllDeviceLocations(devices);
		}
	});

	useEffect(() => {
		setLocation(clone(device.location));
		setOriginalLocation(clone(device.location));

	}, [device.id]);

	useEffect(() => {
		return () => {
			navigator.geolocation.clearWatch(form.watchPositionId);
		};
	}, []);

	const saveLocation = baseMutationHook({
		apiReq: async (aLocation) => await api.put('devices/' + device.id, { location: aLocation }),
		onSuccess: (data) => {
			setOriginalLocation(clone(data.location));
			toastSuccess('Location Saved');
			onClickStopRetrievePosition();
			refetchDevices();
		}
	});

	function onMapRetreivePosition(latitude, longitude) {
		let aLocation = clone(location);
		aLocation.latitude = latitude;
		aLocation.longitude = longitude;
		setLocation(aLocation);
	}

	function onClickMap(event) {
		if (mapRef) {
			let zoom = mapRef.leafletElement.getZoom();
			setZoom(zoom);
		}
		onMapRetreivePosition(event.latlng.lat, event.latlng.lng);
	}

	function isLocationChanged() {
		return !(originalLocation.latitude === location.latitude &&
			originalLocation.longitude === location.longitude &&
			originalLocation.altitude === location.altitude &&
			originalLocation.locked === location.locked &&
			originalLocation.accuracy === location.accuracy);
	}

	function isGeolocationAvailable() {
		return 'geolocation' in navigator;
	}

	async function onClickSavePosition() {

		let formatLocation = {
			altitude: Number(location.altitude),
			latitude: Number(location.latitude),
			longitude: Number(location.longitude),
			accuracy: location.accuracy ? Number(location.accuracy) : 0,
			locked: location.locked
		};

		saveLocation.mutate(formatLocation);

		if (form.retrievingLocation) {
			navigator.geolocation.clearWatch(form.watchPositionId);
			setInnerState(form, setForm, {
				retrievingLocation: false
			});
		}

	}

	function onClickStopRetrievePosition() {
		setInnerState(form, setForm, {
			retrievingLocation: false
		});

		navigator.geolocation.clearWatch(form.watchPositionId);
	}

	function getWatchPositionId() {
		let watchPositionId = navigator.geolocation.watchPosition(
			(position) => {
				if ((location.accuracy && (position.coords.accuracy < location.accuracy)) || !location.accuracy) {
					setZoom(16);
					setLocation(filterInvalid({
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						altitude: position.coords.altitude || 0,
						accuracy: position.coords.accuracy,
						locked: location.locked
					}));
				}
			},
			() => {
				setInnerState(form, setForm, {
					retrievingLocation: false
				});
			},
			GeoLocationOptions
		);

		return watchPositionId;
	}

	function onClickRetrievePosition() {

		let watchPositionId = getWatchPositionId();

		setForm({
			watchPositionId,
			retrievingLocation: true
		});
	}

	function onClickCancel() {
		if (form.retrievingLocation) {
			navigator.geolocation.clearWatch(form.watchPositionId);
		}
		setLocation(clone(originalLocation));
		onClickStopRetrievePosition();
	}

	function onLocationChange(field, event) {
		let aLocation = clone(location);
		aLocation[field] = Number(event.target.value);
		aLocation.accuracy = 0;
		setLocation(aLocation);
	}

	function onLockChange(e, { checked }) {
		let aLocation = clone(location);
		aLocation.locked = checked;
		setLocation(aLocation);
	}

	function updatePosition() {
		if (refmarker && mapRef) {
			const { lat, lng } = refmarker.leafletElement.getLatLng();
			let zoom = mapRef.leafletElement.getZoom();
			setZoom(zoom);
			onMapRetreivePosition(lat, lng);
		}
	}

	const position = [location.latitude, location.longitude];
	const markerPosition = [location.latitude, location.longitude];

	let markers = null;
	if (allDeviceLocations.length > 0) {
		markers =
			<MarkerClusterGroup
				iconCreateFunction={createClusterCustomIcon}
				disableClusteringAtZoom={'17'}
				spiderfyOnMaxZoom={false} >
				{allDeviceLocations.map((marker) => (
					<Marker key={marker.id} position={[marker.location.latitude, marker.location.longitude]} icon={createMarker(defaultMarkerColors.gray)} />
				))}
			</MarkerClusterGroup>;
	}

	return (
		<Segment>
			<Header as='h3' floated='left'>
				<Header.Content>
					Location information
				</Header.Content>
			</Header>
			<Header as='h3' floated='right'>
				<Header.Content>
					<Button color='blue' onClick={form.retrievingLocation ? onClickStopRetrievePosition : onClickRetrievePosition} disabled={!isGeolocationAvailable()}>
						{
							form.retrievingLocation ? "Stop Retrieving Position " : "Retrieve Position"
						}
						{
							form.retrievingLocation &&
							<Icon loading name="spinner"></Icon>
						}
					</Button>
					<Button onClick={onClickCancel} disabled={!isLocationChanged()}>Cancel</Button>
					<Button loading={saveLocation.isLoading} color='green' onClick={onClickSavePosition} disabled={!isLocationChanged()}>Save</Button>
				</Header.Content>
			</Header>
			<Table unstackable>
				<Table.Body>
					<Table.Row>
						<Table.Cell>Latitude</Table.Cell>
						<Table.Cell><Input type='number' min={-90} max={90} step='any' value={location.latitude} onChange={(e) => onLocationChange('latitude', e)} /></Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>Longitude</Table.Cell>
						<Table.Cell><Input type='number' min={-180} max={180} step='any' value={location.longitude} onChange={(e) => onLocationChange('longitude', e)} /></Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>Altitude</Table.Cell>
						<Table.Cell><Input type='number' min={-1000} max={10000} step='any' value={location.altitude} onChange={(e) => onLocationChange('altitude', e)} /></Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>Accuracy</Table.Cell>
						<Table.Cell>{<Input disabled value={location.accuracy ? limitDecimal(location.accuracy, 3) + ' meter(s)' : ''} />}</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>Locked</Table.Cell>
						<Popup
							trigger={<Table.Cell>{<Checkbox checked={location.locked} onChange={onLockChange} />}</Table.Cell>}
							content='Locking the location prevents it from being overwritten by devices with integrated GPS'
						/>
					</Table.Row>
				</Table.Body>
			</Table>
			<Segment style={{ minHeight: 350 }}>
				<Map
					center={position}
					zoom={zoom}
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 0
					}}
					ref={(aMapRef) => {
						setMapRef(aMapRef);
					}}
					onClick={onClickMap}
				>
					<ReactLeafletGoogleLayer googleMapsLoaderConf={{ KEY: config.googleApiKey }} type={'hybrid'} />

					<Marker
						icon={createMarker(defaultMarkerColors.blue)}
						draggable
						onDragend={updatePosition}
						position={markerPosition}
						ref={(aRefmarker) => {
							setRefmarker(aRefmarker);
						}} />
					{markers}
				</Map>
			</Segment>
		</Segment>
	);
}