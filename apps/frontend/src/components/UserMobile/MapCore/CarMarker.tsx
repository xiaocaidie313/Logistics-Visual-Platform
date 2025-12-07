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

        // 创建 Marker
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

        // 组件卸载时，停止动画并移除 Marker
        return () => {
            if (marker) {
                marker.stopMove(); // 先停止移动
                marker.setMap(null); // 从地图移除
                markerRef.current = null;
            }
        };
    }, [map, AMap]); // 注意：这里依赖去掉了 position，只在 map 初始化时创建一次

    // 单独监听位置变化来移动
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
    }, [position, AMap]); // 这里只监听 position 变化

    return null;
};

export default CarMarker;

