import { useEffect, useRef } from 'react';

// 使用高德官方的红色小车图片，确保地址没问题
const carImg = "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png";

interface CarMarkerProps {
    map: any;
    AMap: any;
    position: [number, number];
}

const CarMarker: React.FC<CarMarkerProps> = ({ map, AMap, position }) => {
    const markerRef = useRef<any>(null);

    // 1. 初始化 Marker
    useEffect(() => {
        if (!map || !AMap) return;

        // 只有当 ref 为空时才创建
        if (!markerRef.current) {
            console.log("正在创建小车 Marker...", position); // 添加日志方便调试

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
                angle: 0,
                zIndex: 150, // 确保层级足够高
            });
        }

        // --- 核心修复：清理函数 ---
        return () => {
            if (markerRef.current) {
                map.remove(markerRef.current);
                markerRef.current = null; // 【关键】必须手动置空，否则热更新或严格模式下会导致不再重新创建
            }
        };
    }, [map, AMap]); // 依赖项不要加 position，因为创建只需要一次

    // 2. 移动动画逻辑
    useEffect(() => {
        if (markerRef.current && position) {
            // 检查 AMap.MoveAnimation 插件是否加载，如果没加载，用 setPosition 代替以防报错
            if (markerRef.current.moveTo) {
                markerRef.current.moveTo(position, {
                    duration: 1000,
                    autoRotation: true,
                });
            } else {
                // 降级方案：直接设置位置
                markerRef.current.setPosition(position);
            }
        }
    }, [position]);

    return null;
};

export default CarMarker;