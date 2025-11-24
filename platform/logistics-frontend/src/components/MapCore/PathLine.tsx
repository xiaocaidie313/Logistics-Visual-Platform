import { useEffect } from 'react';

interface PathLineProps {
    map: any;
    AMap: any;
    path: [number, number][];
}

const PathLine: React.FC<PathLineProps> = ({ map, AMap, path }) => {
    useEffect(() => {
        if (!map || !AMap || path.length === 0) return;

        const polyline = new AMap.Polyline({
            path: path,
            isOutline: true,
            outlineColor: '#ffeeff',
            borderWeight: 2,
            strokeColor: '#1677ff', // Ant Design Blue
            strokeOpacity: 1,
            strokeWeight: 6,
            strokeStyle: 'solid',
            showDir: true,
            zIndex: 50,
        });

        map.add(polyline);
        map.setFitView([polyline]); // 自动缩放视野

        return () => map.remove(polyline);
    }, [map, AMap, path]);

    return null;
};

export default PathLine;