import React, { useEffect, useRef } from 'react';

const carImg = "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png";

interface CarMarkerProps {
    map: any;
    AMap: any;
    position: [number, number];
}

const CarMarker: React.FC<CarMarkerProps> = ({ map, AMap, position }) => {
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (!map || !AMap || !position) return;

        const marker = new AMap.Marker({
            map: map,
            position: position,
            icon: new AMap.Icon({
                size: new AMap.Size(52, 26),
                image: carImg,
                imageSize: new AMap.Size(26, 13),
            }),
            offset: new AMap.Pixel(-13, -6.5),
            autoRotation: true,
            angle: 0,
            zIndex: 100,
        });
        markerRef.current = marker;

        return () => {
            if (marker) {
                marker.stopMove();
                marker.setMap(null);
                markerRef.current = null;
            }
        };
    }, [map, AMap]);

    useEffect(() => {
        if (markerRef.current && position) {
            const currentPos = markerRef.current.getPosition();
            const distance = AMap.GeometryUtil.distance([currentPos.lng, currentPos.lat], position);

            if (distance > 5000) {
                markerRef.current.setPosition(position);
            } else {
                if (markerRef.current.moveTo) {
                    markerRef.current.moveTo(position, { duration: 2000, autoRotation: true });
                } else {
                    markerRef.current.setPosition(position);
                }
            }
        }
    }, [position, AMap]);

    return null;
};

export default CarMarker;
