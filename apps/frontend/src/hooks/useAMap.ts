import { useEffect, useState, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { AMAP_KEY } from '../utils/config';

export const useAMap = (containerId: string) => {
    const [map, setMap] = useState<any>(null);
    const [AMapInstance, setAMapInstance] = useState<any>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        // 如果没有传入containerId，不初始化地图
        if (!containerId) {
            return;
        }

        // 检查容器是否存在
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`地图容器 #${containerId} 不存在，等待下次渲染`);
            return;
        }

        // 避免重复初始化
        if (mapInstanceRef.current) {
            return;
        }

        AMapLoader.load({
            key: AMAP_KEY,
            version: '2.0',
            plugins: ['AMap.MoveAnimation', 'AMap.Polyline', 'AMap.Marker', 'AMap.Scale', 'AMap.ToolBar', 'AMap.GeometryUtil'],
        })
            .then((AMap) => {
                setAMapInstance(AMap);
                
                // 等待一小段时间确保 DOM 完全渲染
                setTimeout(() => {
                    try {
                        const mapInstance = new AMap.Map(containerId, {
                            zoom: 11,
                            center: [116.397428, 39.90923],
                            viewMode: '3D',
                            pitch: 20,
                        });
                        
                        // 等待地图完全加载
                        mapInstance.on('complete', () => {
                            console.log('地图加载完成');
                            try {
                                mapInstance.addControl(new AMap.Scale());
                                mapInstance.addControl(new AMap.ToolBar());
                            } catch (error) {
                                console.warn('添加地图控件失败:', error);
                            }
                        });
                        
                        setMap(mapInstance);
                        mapInstanceRef.current = mapInstance;
                    } catch (error) {
                        console.error('创建地图实例失败:', error);
                    }
                }, 100);
            })
            .catch((e) => console.error('地图加载失败:', e));

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        };
    }, [containerId]);

    return { map, AMap: AMapInstance };
};
