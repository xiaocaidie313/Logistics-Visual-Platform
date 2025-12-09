import React, { useEffect, useRef } from 'react';

interface PathLineProps {
    map: any;
    AMap: any;
    path: [number, number][];
    currentPosition: [number, number] | null;
}

const PathLine: React.FC<PathLineProps> = ({ map, AMap, path, currentPosition }) => {
    const bgPolylineRef = useRef<any>(null);
    const passedPolylineRef = useRef<any>(null);

    useEffect(() => {
        if (!map || !AMap || path.length === 0) return;

        // 创建背景线（完整路线）
        const bgLine = new AMap.Polyline({
            map: map,
            path: path,
            strokeColor: '#999999',
            strokeOpacity: 0.8,
            strokeWeight: 6,
            zIndex: 10,
        });
        bgPolylineRef.current = bgLine;

        // 创建进度线（已行驶路线）
        const passedLine = new AMap.Polyline({
            map: map,
            path: [],
            strokeColor: '#1677ff',
            strokeOpacity: 1,
            strokeWeight: 6,
            zIndex: 11,
        });
        passedPolylineRef.current = passedLine;

        map.setFitView([bgLine]);

        return () => {
            if (bgLine) {
                bgLine.setMap(null);
                bgPolylineRef.current = null;
            }
            if (passedLine) {
                passedLine.setMap(null);
                passedPolylineRef.current = null;
            }
        };
    }, [map, AMap, path]);

    useEffect(() => {
        if (!passedPolylineRef.current || !currentPosition || path.length === 0) return;

        let closestIndex = -1;
        let minDistance = Infinity;
        path.forEach((point, index) => {
            const dist = Math.pow(point[0] - currentPosition[0], 2) + Math.pow(point[1] - currentPosition[1], 2);
            if (dist < minDistance) {
                minDistance = dist;
                closestIndex = index;
            }
        });

        if (closestIndex !== -1) {
            const passedPath = path.slice(0, closestIndex + 1);
            passedPath.push(currentPosition);
            passedPolylineRef.current.setPath(passedPath);
        }
    }, [currentPosition, path]);

    return null;
};

export default PathLine;
