import React, { useEffect, useRef } from 'react';
import carImg from '../../../assets/images/car.png';
import './CarMarker.css';

// const carImg = "https://a.amap.com/jsapi_demos/static/demo-center-v2/car.png";
interface CarMarkerProps {
    map: any;
    AMap: any;
    position: [number, number];
}

const CarMarker: React.FC<CarMarkerProps> = ({ map, AMap, position }) => {
    const markerRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isAnimatingRef = useRef(false);

    useEffect(() => {
        if (!map || !AMap || !position) return;
        
        // 检查地图是否已经完全初始化
        if (!map.getSize || typeof map.getSize !== 'function') {
            console.warn('地图实例尚未完全初始化');
            return;
        }

        // 检查必要的 AMap 类是否存在
        if (!AMap.Marker || !AMap.Icon || !AMap.Size || !AMap.Pixel) {
            console.warn('AMap 插件尚未完全加载');
            return;
        }

        // 创建 Marker
        let marker: any;
        try {
            marker = new AMap.Marker({
            map: map,
            position: position,
            icon: new AMap.Icon({
                size: new AMap.Size(70, 50),
                image: carImg,
                imageSize: new AMap.Size(26, 13),
            }),
            offset: new AMap.Pixel(-13, -6.5),
            autoRotation: true,
            angle: 0,
            zIndex: 100,
            });
            markerRef.current = marker;
        } catch (error) {
            console.error('创建 Marker 失败:', error);
            return;
        }

        // 组件卸载时，停止动画并移除 Marker
        return () => {
            isAnimatingRef.current = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (marker) {
                try {
                    if (typeof marker.stopMove === 'function') {
                        marker.stopMove(); // 先停止移动
                    }
                    marker.setMap(null); // 从地图移除
                } catch (error) {
                    console.warn('CarMarker 清理失败:', error);
                }
                markerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, AMap]); // position 只在初始化时使用，后续通过单独的 useEffect 更新

    // 平滑插值移动函数
    const smoothMove = (startPos: [number, number], endPos: [number, number], duration: number) => {
        if (isAnimatingRef.current) {
            return; // 如果正在动画，不启动新的动画
        }
        
        isAnimatingRef.current = true;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用 ease-out cubic 缓动函数，让移动更平滑
            const eased = 1 - Math.pow(1 - progress, 3);
            
            const currentPos: [number, number] = [
                startPos[0] + (endPos[0] - startPos[0]) * eased,
                startPos[1] + (endPos[1] - startPos[1]) * eased
            ];
            
            if (markerRef.current) {
                try {
                    markerRef.current.setPosition(currentPos);
                    
                    // 计算角度并设置旋转
                    if (progress > 0 && progress < 1) {
                        const angle = Math.atan2(
                            endPos[1] - startPos[1],
                            endPos[0] - startPos[0]
                        ) * 180 / Math.PI;
                        markerRef.current.setAngle(angle);
                    }
                } catch (error) {
                    console.warn('CarMarker 动画更新失败:', error);
                    isAnimatingRef.current = false;
                    return;
                }
            }
            
            if (progress < 1 && markerRef.current) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                isAnimatingRef.current = false;
                if (markerRef.current) {
                    try {
                        markerRef.current.setPosition(endPos);
                    } catch (error) {
                        console.warn('CarMarker 最终位置设置失败:', error);
                    }
                }
            }
        };
        
        animate();
    };

    // 单独监听位置变化来移动（优化移动阈值）
    useEffect(() => {
        if (!markerRef.current || !position || !AMap || !AMap.GeometryUtil) return;
        
        try {
            const currentPos = markerRef.current.getPosition();
            if (!currentPos) return;
            
            const distance = AMap.GeometryUtil.distance(
                [currentPos.lng, currentPos.lat], 
                position
            );

            // 优化移动阈值
            if (distance > 10000) {
                // 超过10公里，直接跳转
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    isAnimatingRef.current = false;
                }
                markerRef.current.setPosition(position);
            } else if (distance > 100) {
                // 100米到10公里之间，使用平滑插值动画
                const speed = 80; // 米/秒
                const duration = Math.max(300, Math.min(2500, (distance / speed) * 1000));
                
                // 停止之前的动画
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                
                // 使用平滑插值移动
                smoothMove(
                    [currentPos.lng, currentPos.lat],
                    position,
                    duration
                );
            } else if (distance > 10) {
                // 10米到100米之间，快速移动
                const duration = Math.max(200, (distance / 100) * 1000);
                smoothMove(
                    [currentPos.lng, currentPos.lat],
                    position,
                    duration
                );
            } else {
                // 小于10米，直接设置位置
                markerRef.current.setPosition(position);
            }
        } catch (error) {
            console.warn('CarMarker 位置更新失败:', error);
        }
    }, [position, AMap]); // 这里只监听 position 变化

    return null;
};

export default CarMarker;

