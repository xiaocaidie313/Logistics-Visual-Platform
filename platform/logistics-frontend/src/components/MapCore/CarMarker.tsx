import { useEffect, useRef } from 'react';
// import carImg from '../../assets/car.png'; // 如果你有本地图片请解开这行
const carImg = "https://webapi.amap.com/images/car.png"; // 临时网络图片

interface CarMarkerProps {
    map: any;
    AMap: any;
    position: [number, number];
}

const CarMarker: React.FC<CarMarkerProps> = ({ map, AMap, position }) => {
    const markerRef = useRef<any>(null);

    // 初始化 Marker
    useEffect(() => {
        if (!map || !AMap) return;
        if (!markerRef.current) {
            markerRef.current = new AMap.Marker({
                map: map,
                position: position,
                icon: new AMap.Icon({
                    size: new AMap.Size(52, 26),
                    image: carImg,
                    imageSize: new AMap.Size(26, 13),
                }),
                offset: new AMap.Pixel(-13, -6.5),
                autoRotation: true,
                angle: -90,
            });
        }
        return () => {
            if (markerRef.current) map.remove(markerRef.current);
        };
    }, [map, AMap]);

    // 监听位置变化执行动画
    useEffect(() => {
        if (markerRef.current && position) {
            markerRef.current.moveTo(position, {
                duration: 1000, // 动画时长1秒，配合WebSocket频率
                autoRotation: true,
            });
        }
    }, [position]);

    return null;
};

export default CarMarker;