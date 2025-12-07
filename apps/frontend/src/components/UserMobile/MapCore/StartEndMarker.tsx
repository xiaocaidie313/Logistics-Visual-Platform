import React, { useEffect, useRef } from 'react';

interface StartEndMarkerProps {
  map: any;
  AMap: any;
  startPosition: [number, number] | null;
  endPosition: [number, number] | null;
  startLabel?: string;
  endLabel?: string;
}

const StartEndMarker: React.FC<StartEndMarkerProps> = ({
  map,
  AMap,
  startPosition,
  endPosition,
  startLabel = '起点',
  endLabel = '终点',
}) => {
  const startMarkerRef = useRef<any>(null);
  const endMarkerRef = useRef<any>(null);

  // 创建起点标记
  useEffect(() => {
    if (!map || !AMap || !startPosition) return;

    // 创建起点标记（绿色圆点）
    // 使用 encodeURIComponent 处理 SVG 中的中文字符
    const startSvg = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#52c41a" stroke="#fff" stroke-width="2"/>
      <text x="16" y="20" font-size="12" fill="#fff" text-anchor="middle" font-weight="bold">起</text>
    </svg>`;
    const startSvgBase64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(startSvg);
    
    const startMarker = new AMap.Marker({
      map: map,
      position: startPosition,
      icon: new AMap.Icon({
        size: new AMap.Size(32, 32),
        image: startSvgBase64,
        imageSize: new AMap.Size(32, 32),
      }),
      offset: new AMap.Pixel(-16, -16),
      zIndex: 200,
    });

    // 添加起点文本标签（使用 Marker 的 label 属性）
    startMarker.setLabel({
      content: `<div style="background: #fff; padding: 4px 8px; border: 1px solid #52c41a; border-radius: 4px; font-size: 12px; color: #333; white-space: nowrap;">${startLabel}</div>`,
      direction: 'right',
      offset: new AMap.Pixel(20, 0),
    });

    startMarkerRef.current = startMarker;

    return () => {
      if (startMarker) {
        startMarker.setMap(null);
      }
      startMarkerRef.current = null;
    };
  }, [map, AMap, startPosition, startLabel]);

  // 创建终点标记
  useEffect(() => {
    if (!map || !AMap || !endPosition) return;

    // 创建终点标记（红色圆点）
    // 使用 encodeURIComponent 处理 SVG 中的中文字符
    const endSvg = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#ff4d4f" stroke="#fff" stroke-width="2"/>
      <text x="16" y="20" font-size="12" fill="#fff" text-anchor="middle" font-weight="bold">终</text>
    </svg>`;
    const endSvgBase64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(endSvg);
    
    const endMarker = new AMap.Marker({
      map: map,
      position: endPosition,
      icon: new AMap.Icon({
        size: new AMap.Size(32, 32),
        image: endSvgBase64,
        imageSize: new AMap.Size(32, 32),
      }),
      offset: new AMap.Pixel(-16, -16),
      zIndex: 200,
    });

    // 添加终点文本标签（使用 Marker 的 label 属性）
    endMarker.setLabel({
      content: `<div style="background: #fff; padding: 4px 8px; border: 1px solid #ff4d4f; border-radius: 4px; font-size: 12px; color: #333; white-space: nowrap;">${endLabel}</div>`,
      direction: 'right',
      offset: new AMap.Pixel(20, 0),
    });

    endMarkerRef.current = endMarker;

    return () => {
      if (endMarker) {
        endMarker.setMap(null);
      }
      endMarkerRef.current = null;
    };
  }, [map, AMap, endPosition, endLabel]);

  return null;
};

export default StartEndMarker;

