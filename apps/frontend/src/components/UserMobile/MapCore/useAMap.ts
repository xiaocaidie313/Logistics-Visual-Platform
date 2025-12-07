import { useEffect, useState, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { AMAP_KEY } from '../../../utils/config';

export const useAMap = (containerId: string) => {
    const [map, setMap] = useState<any>(null);
    const [AMapInstance, setAMapInstance] = useState<any>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        AMapLoader.load({
            key: AMAP_KEY,
            version: '2.0',
            plugins: ['AMap.MoveAnimation', 'AMap.Polyline', 'AMap.Marker', 'AMap.Scale', 'AMap.ToolBar', 'AMap.GeometryUtil'],
        })
            .then((AMap) => {
                setAMapInstance(AMap);
                const mapInstance = new AMap.Map(containerId, {
                    zoom: 11,
                    center: [116.397428, 39.90923],
                    viewMode: '3D',
                    pitch: 50, // 增加倾斜角，3D效果更强
                });
                mapInstance.addControl(new AMap.Scale());
                mapInstance.addControl(new AMap.ToolBar());
                setMap(mapInstance);
                mapInstanceRef.current = mapInstance;
            })
            .catch((e) => console.error(e));

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
        };
    }, [containerId]);

    return { map, AMap: AMapInstance };
};

