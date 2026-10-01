import { useEffect } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FlyToPlace({ place }) {
  const map = useMap();

  useEffect(() => {
    if (!place) return;
    map.flyTo([place.latitude, place.longitude], 10, {
      animate: true,
      duration: 1.7,
      easeLinearity: 0.2,
    });
  }, [map, place]);

  return null;
}

export default function TravelMap({ place }) {
  return (
    <div className="map-frame" aria-label="Interactive global destination map">
      <div className="map-kicker">
        <span className="map-live-dot" /> GLOBAL MAP <span className="map-kicker-line" /> DRAG TO
        EXPLORE
      </div>
      <MapContainer
        center={[18, 4]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={false}
        zoomControl={false}
        worldCopyJump
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />
        <FlyToPlace place={place} />
        {place && (
          <CircleMarker
            center={[place.latitude, place.longitude]}
            radius={11}
            pathOptions={{ color: '#fbf4df', weight: 4, fillColor: '#e68153', fillOpacity: 1 }}
          >
            <Popup>
              <strong>{place.name}</strong>
              <br />
              {[place.admin1, place.country].filter(Boolean).join(', ')}
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
      <div className="map-coordinate-note">
        {place ? (
          <>
            <span className="coordinate-pulse" /> {place.latitude.toFixed(2)}°,{' '}
            {place.longitude.toFixed(2)}°
          </>
        ) : (
          'Pick a destination to take a closer look'
        )}
      </div>
    </div>
  );
}
