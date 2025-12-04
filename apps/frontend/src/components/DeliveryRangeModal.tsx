import { Modal, Form, Switch, Button, Cascader, Space, Card, message, InputNumber, Radio } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';
import { DeliveryMethods } from '../services/merchantService';
import { areaData } from '../utils/areaData';

// 声明高德地图类型
declare global {
    interface Window {
        AMap: any;
        AMapLoader: any;
    }
}

interface DeliveryRangeModalProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (deliveryMethods: DeliveryMethods) => Promise<void>;
    initialValues?: DeliveryMethods;
    merchantName: string;
}

const DeliveryRangeModal: React.FC<DeliveryRangeModalProps> = ({
    visible,
    onCancel,
    onSubmit,
    initialValues,
    merchantName,
}) => {
    const [form] = Form.useForm();
    const [expressEnabled, setExpressEnabled] = useState(true);
    const [instantEnabled, setInstantEnabled] = useState(false);
    const [currentInstantArea, setCurrentInstantArea] = useState<any>(null);
    const [showMapModal, setShowMapModal] = useState(false);
    
    // 地图相关状态
    const mapRef = useRef<any>(null);
    const mapInstanceRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const markerIconRef = useRef<any>(null);
    
    // 多边形相关引用
    const polygonRef = useRef<any>(null);
    const mouseToolRef = useRef<any>(null);
    const polygonEditorRef = useRef<any>(null);

    // 状态
    const [drawType, setDrawType] = useState<'circle' | 'polygon'>('circle');
    const drawTypeRef = useRef<'circle' | 'polygon'>('circle'); // 增加 ref 追踪 drawType
    const currentRadiusRef = useRef(5000);  
    const [currentRadius, setCurrentRadius] = useState(5000); 
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (visible && initialValues) {
            form.setFieldsValue({
                expressEnabled: initialValues.express.enabled,
                instantEnabled: initialValues.instant.enabled,
                expressCoverageAreas: initialValues.express.coverageAreas.map((area) => [
                    area.province,
                    area.city,
                    area.district,
                ]),
                instantCoverageAreas: initialValues.instant.coverageAreas,
            });
            setExpressEnabled(initialValues.express.enabled);
            setInstantEnabled(initialValues.instant.enabled);
        } else if (visible) {
            form.resetFields();
            form.setFieldsValue({
                expressEnabled: true,
                instantEnabled: false,
                expressCoverageAreas: [],
                instantCoverageAreas: [],
            });
            setExpressEnabled(true);
            setInstantEnabled(false);
        }
    }, [visible, initialValues, form]);

    // 监听地图弹窗打开，初始化地图
    useEffect(() => {
        if (showMapModal && mapRef.current) {
            const timer = setTimeout(() => {
                const instantAreas = form.getFieldValue('instantCoverageAreas') || [];
                const existingArea = currentInstantArea?.index !== undefined && instantAreas[currentInstantArea.index]
                    ? instantAreas[currentInstantArea.index]
                    : null;
                
                initMap(existingArea);
            }, 300); 
            return () => clearTimeout(timer);
        } else if (!showMapModal) {
            clearMapResources();
        }
    }, [showMapModal]);

    // 清理地图资源
    const clearMapResources = () => {
        if (mouseToolRef.current) {
            mouseToolRef.current.close(true);
            mouseToolRef.current = null;
        }
        if (polygonEditorRef.current) {
            polygonEditorRef.current.close();
            polygonEditorRef.current = null;
        }
        if (mapInstanceRef.current) {
            try {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
                markerRef.current = null;
                circleRef.current = null;
                polygonRef.current = null;
            } catch (error) {
                console.error('清理地图资源失败:', error);
            }
        }
        setIsDrawing(false);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            // 处理快递配送范围
            const expressCoverageAreas = (values.expressCoverageAreas || []).map((area: string[]) => ({
                province: area[0],
                city: area[1],
                district: area[2],
            }));

            const deliveryMethods: DeliveryMethods = {
                express: {
                    enabled: values.expressEnabled || false,
                    coverageAreas: expressCoverageAreas,
                },
                instant: {
                    enabled: values.instantEnabled || false,
                    coverageAreas: values.instantCoverageAreas || [],
                },
            };

            await onSubmit(deliveryMethods);
            form.resetFields();
        } catch (error) {
            console.error('表单验证失败:', error);
            message.error('请完善配送范围配置');
        }
    };

    // 加载高德地图
    const loadAMap = async () => {
        if (window.AMap) {
            return;
        }

        const amapKey = import.meta.env.VITE_AMAP_KEY || 'YOUR_AMAP_KEY_HERE';
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}&plugin=AMap.DistrictSearch,AMap.Circle,AMap.Geocoder,AMap.MouseTool,AMap.PolygonEditor`;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // 打开地图选择弹窗
    const handleOpenMapModal = async (index?: number) => {
        try {
            await loadAMap();
            
            const instantAreas = form.getFieldValue('instantCoverageAreas') || [];
            if (index !== undefined && instantAreas[index]) {
                setCurrentInstantArea({ ...instantAreas[index], index });
                const area = instantAreas[index];
                
                // 判断是圆形还是多边形
                if (area.polygon && area.polygon.length > 0) {
                    setDrawType('polygon');
                    drawTypeRef.current = 'polygon'; // 同步 ref
                } else {
                    setDrawType('circle');
                    drawTypeRef.current = 'circle'; // 同步 ref
                    const radius = area.radius || 5000;
                    setCurrentRadius(radius);
                    currentRadiusRef.current = radius;
                }
            } else {
                setCurrentInstantArea({ index: instantAreas.length });
                setDrawType('circle'); 
                drawTypeRef.current = 'circle'; // 同步 ref
                setCurrentRadius(5000);
                currentRadiusRef.current = 5000;
            }
            
            setShowMapModal(true);
        } catch (error) {
            message.error('加载地图失败，请检查网络连接或 API Key 配置');
            console.error('加载地图失败:', error);
        }
    };

    // 统一创建配送中心标记
    const addCenterMarker = (map: any, lng: number, lat: number) => {
        if (!window.AMap) return null;
        
        if (!markerIconRef.current) {
            markerIconRef.current = new window.AMap.Icon({
                size: new window.AMap.Size(25, 34),
                imageSize: new window.AMap.Size(25, 34),
                image: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
            });
        }
        
        // 清除旧标记
        if (markerRef.current) {
            map.remove(markerRef.current);
        }

        const marker = new window.AMap.Marker({
            position: [lng, lat],
            title: '配送中心',
            anchor: 'bottom-center',
            icon: markerIconRef.current,
        });
        
        map.add(marker);
        markerRef.current = marker;
        return marker;
    };

    const extractLngLat = (position: any) => {
        if (!position) return { lng: 0, lat: 0 };
        if (typeof position.getLng === 'function' && typeof position.getLat === 'function') {
            return { lng: position.getLng(), lat: position.getLat() };
        }
        return {
            lng: position.lng ?? position.longitude ?? 0,
            lat: position.lat ?? position.latitude ?? 0,
        };
    };

    const resolveCityInfo = (addressComponent: any) => {
        const normalize = (value?: string | string[] | number) => {
            if (Array.isArray(value)) {
                const found = value.find((item) => item && item.toString().trim());
                return found ? found.toString().trim() : '';
            }
            if (typeof value === 'number') return value.toString().trim();
            return value ? value.trim() : '';
        };

        const cityName =
            normalize(addressComponent?.city) ||
            normalize(addressComponent?.district) ||
            normalize(addressComponent?.township) ||
            normalize(addressComponent?.province) ||
            '';

        const cityCode = normalize(addressComponent?.adcode) || normalize(addressComponent?.citycode);

        return { cityName, cityCode };
    };

    // 初始化地图
    const initMap = (existingArea?: any) => {
        if (!window.AMap || !mapRef.current) return;

        try {
            const center = existingArea?.center
                ? [existingArea.center.lng, existingArea.center.lat]
                : [116.397428, 39.90923]; 

            const map = new window.AMap.Map(mapRef.current, {
                zoom: existingArea ? 13 : 12,
                center: center,
                viewMode: '2D',
                resizeEnable: true,
            });

            mapInstanceRef.current = map;

            map.on('complete', () => {
                if (existingArea) {
                    addCenterMarker(map, existingArea.center.lng, existingArea.center.lat);
                    
                    if (existingArea.polygon && existingArea.polygon.length > 0) {
                        // 绘制多边形
                        drawPolygon(map, existingArea.polygon);
                        setDrawType('polygon');
                        drawTypeRef.current = 'polygon'; // 同步 ref
                    } else if (existingArea.radius) {
                        // 绘制圆形
                        drawCircle(map, existingArea.center, existingArea.radius);
                        setDrawType('circle');
                        drawTypeRef.current = 'circle'; // 同步 ref
                    }
                } else {
                    // 如果是新建，且默认为圆形模式
                    if(drawTypeRef.current === 'circle') {
                         // 默认不绘制，等点击
                    } else {
                        startDrawPolygon(map);
                    }
                }
            });

            // 绑定点击事件（仅在圆形模式下用于定点）
            map.on('click', (e: any) => {
                if (drawTypeRef.current === 'circle') {
                    const lng = e.lnglat.getLng();
                    const lat = e.lnglat.getLat();
                    const latestRadius = currentRadiusRef.current;
                    
                    addCenterMarker(map, lng, lat);
                    drawCircle(map, { lng, lat }, latestRadius);
                }
            });

        } catch (error) {
            console.error('地图初始化错误:', error);
            message.error('地图初始化失败');
        }
    };

    // 切换绘制模式
    const handleDrawTypeChange = (e: any) => {
        const type = e.target.value;
        setDrawType(type);
        drawTypeRef.current = type; // 同步 ref
        
        const map = mapInstanceRef.current;
        if (!map) return;

        // 清除所有覆盖物
        if (circleRef.current) {
            map.remove(circleRef.current);
            circleRef.current = null;
        }
        if (polygonRef.current) {
            map.remove(polygonRef.current);
            polygonRef.current = null;
        }
        if (polygonEditorRef.current) {
            polygonEditorRef.current.close();
            polygonEditorRef.current = null;
        }
        if (mouseToolRef.current) {
            mouseToolRef.current.close(true);
        }

        if (type === 'polygon') {
            setIsDrawing(true);
            startDrawPolygon(map);
        } else {
            setIsDrawing(false);
            // 切换回圆形，如果之前有标记点，则以此为圆心画圆
            if (markerRef.current) {
                const { lng, lat } = extractLngLat(markerRef.current.getPosition());
                drawCircle(map, { lng, lat }, currentRadiusRef.current);
            }
        }
    };

    // 绘制圆形
    const drawCircle = (map: any, center: { lng: number; lat: number }, radius: number) => {
        if (circleRef.current) map.remove(circleRef.current);

        const circle = new window.AMap.Circle({
            center: [center.lng, center.lat],
            radius: radius,
            fillColor: '#1890ff',
            fillOpacity: 0.4,
            strokeColor: '#0050b3',
            strokeWeight: 3,
            strokeOpacity: 0.9,
            zIndex: 10,
        });

        map.add(circle);
        circleRef.current = circle;

        // 圆形点击逻辑保持一致
        circle.on('click', (e: any) => {
            if(drawTypeRef.current === 'circle') {
                const lng = e.lnglat.getLng();
                const lat = e.lnglat.getLat();
                const latestRadius = currentRadiusRef.current;
                addCenterMarker(map, lng, lat);
                drawCircle(map, { lng, lat }, latestRadius);
            }
        });
        
        map.setFitView([circle], false, [60, 60, 60, 60]);
    };

    // 绘制多边形（用于回显）
    const drawPolygon = (map: any, path: any[]) => {
        if (polygonRef.current) map.remove(polygonRef.current);

        const polygon = new window.AMap.Polygon({
            path: path.map(p => [p.lng, p.lat]),
            fillColor: '#1890ff',
            fillOpacity: 0.4,
            strokeColor: '#0050b3',
            strokeWeight: 3,
            strokeOpacity: 0.9,
            zIndex: 10,
        });

        map.add(polygon);
        polygonRef.current = polygon;
        
        // 初始化编辑器
        initPolygonEditor(map, polygon);
        
        map.setFitView([polygon], false, [60, 60, 60, 60]);
    };

    // 初始化多边形编辑器
    const initPolygonEditor = (map: any, polygon: any) => {
        if (polygonEditorRef.current) {
            polygonEditorRef.current.close();
        }
        
        const polygonEditor = new window.AMap.PolygonEditor(map, polygon);
        polygonEditorRef.current = polygonEditor;
        polygonEditor.open();
        setIsDrawing(false);
    };

    // 开始绘制新多边形
    const startDrawPolygon = (map: any) => {
        if (!window.AMap.MouseTool) return;

        if (mouseToolRef.current) {
            mouseToolRef.current.close(true);
        }

        const mouseTool = new window.AMap.MouseTool(map);
        mouseToolRef.current = mouseTool;

        mouseTool.polygon({
            fillColor: '#1890ff',
            fillOpacity: 0.4,
            strokeColor: '#0050b3',
            strokeWeight: 3,
            strokeOpacity: 0.9,
        });

        message.info('请在地图上点击绘制多边形，双击结束绘制');

        mouseTool.on('draw', (event: any) => {
            // 绘制完成后
            const polygon = event.obj;
            polygonRef.current = polygon;
            
            // 关闭绘制工具
            mouseTool.close(false); // false保留覆盖物
            
            // 开启编辑模式
            initPolygonEditor(map, polygon);
            
            // 计算多边形中心点作为标记点
            const path = polygon.getPath();
            const center = calculateCentroid(path);
            addCenterMarker(map, center.lng, center.lat);
        });
    };

    // 重新绘制多边形
    const handleRedrawPolygon = () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        if (polygonRef.current) {
            map.remove(polygonRef.current);
            polygonRef.current = null;
        }
        if (polygonEditorRef.current) {
            polygonEditorRef.current.close();
            polygonEditorRef.current = null;
        }
        
        setIsDrawing(true);
        startDrawPolygon(map);
    };

    // 计算多边形质心
    const calculateCentroid = (path: any[]) => {
        let lngSum = 0;
        let latSum = 0;
        const len = path.length;
        path.forEach(p => {
            lngSum += extractLngLat(p).lng;
            latSum += extractLngLat(p).lat;
        });
        return {
            lng: lngSum / len,
            lat: latSum / len
        };
    };

    // 保存即时配送区域
    const handleSaveInstantArea = () => {
        let center: { lng: number; lat: number } | null = null;
        let radius: number | undefined = undefined;
        let polygonPath: Array<{ lng: number; lat: number }> | undefined = undefined;

        if (drawType === 'circle') {
            if (!circleRef.current || !markerRef.current) {
                message.warning('请在地图上点击选择配送中心位置');
                return;
            }
            radius = circleRef.current.getRadius();
            center = extractLngLat(markerRef.current.getPosition());
        } else {
            if (!polygonRef.current) {
                message.warning('请绘制配送多边形范围');
                return;
            }
            // 获取编辑后的多边形路径
            const path = polygonRef.current.getPath();
            if (!path || path.length < 3) {
                message.warning('多边形至少需要3个点');
                return;
            }
            
            polygonPath = path.map((p: any) => extractLngLat(p));
            // 如果有标记点用标记点，没有则计算质心
            if (markerRef.current) {
                center = extractLngLat(markerRef.current.getPosition());
            } else {
                center = calculateCentroid(path);
            }
        }

        if (!center) return;

        // 使用高德地图的逆地理编码获取城市信息
        window.AMap.plugin('AMap.Geocoder', () => {
            const geocoder = new window.AMap.Geocoder();
            geocoder.getAddress([center!.lng, center!.lat], (status: string, result: any) => {
                let cityName = '未知城市';
                let cityCode = '';

                if (status === 'complete' && result.info === 'OK') {
                    const { cityName: resolvedCityName, cityCode: resolvedCityCode } = resolveCityInfo(
                        result.regeocode.addressComponent,
                    );
                    if (resolvedCityName) cityName = resolvedCityName;
                    if (resolvedCityCode) cityCode = resolvedCityCode;
                }

                const newArea = {
                    cityName,
                    cityCode,
                    center: center!,
                    radius: drawType === 'circle' ? radius : undefined,
                    polygon: drawType === 'polygon' ? polygonPath : undefined,
                };

                const instantAreas = form.getFieldValue('instantCoverageAreas') || [];
                if (currentInstantArea?.index !== undefined) {
                    instantAreas[currentInstantArea.index] = newArea;
                } else {
                    instantAreas.push(newArea);
                }

                form.setFieldsValue({ instantCoverageAreas: instantAreas });
                setShowMapModal(false);
                message.success('配送区域保存成功');
            });
        });
    };

    // 删除即时配送区域
    const handleDeleteInstantArea = (index: number) => {
        const instantAreas = form.getFieldValue('instantCoverageAreas') || [];
        instantAreas.splice(index, 1);
        form.setFieldsValue({ instantCoverageAreas: instantAreas });
    };

    const handleRadiusChange = (radius: number) => {
        const radiusInMeters = radius * 1000;
        setCurrentRadius(radiusInMeters);
        currentRadiusRef.current = radiusInMeters;
        
        if (drawType === 'circle' && circleRef.current && markerRef.current && mapInstanceRef.current) {
            const { lng, lat } = extractLngLat(markerRef.current.getPosition());
            drawCircle(mapInstanceRef.current, { lng, lat }, radiusInMeters);
        }
    };

    return (
        <>
            <Modal
                title={`配置 ${merchantName} 的配送范围`}
                open={visible}
                onCancel={onCancel}
                onOk={handleSubmit}
                width={900}
                okText="保存"
                cancelText="取消"
            >
                <Form form={form} layout="vertical">
                    <Card title="快递配送" style={{ marginBottom: 16 }}>
                        <Form.Item
                            label="启用快递配送"
                            name="expressEnabled"
                            valuePropName="checked"
                        >
                            <Switch onChange={setExpressEnabled} />
                        </Form.Item>

                        {expressEnabled && (
                            <Form.List name="expressCoverageAreas">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map((field) => {
                                            const { key, ...restField } = field;
                                            return (
                                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }}>
                                                    <Form.Item
                                                        {...restField}
                                                        rules={[{ required: true, message: '请选择配送区域' }]}
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <Cascader
                                                            options={areaData}
                                                            placeholder="请选择省市区"
                                                            style={{ width: 300 }}
                                                        />
                                                    </Form.Item>
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => remove(field.name)}
                                                    />
                                                </Space>
                                            );
                                        })}
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            icon={<PlusOutlined />}
                                            style={{ width: '100%' }}
                                        >
                                            添加配送区域
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        )}
                    </Card>

                    <Card title="即时配送">
                        <Form.Item
                            label="启用即时配送"
                            name="instantEnabled"
                            valuePropName="checked"
                        >
                            <Switch onChange={setInstantEnabled} />
                        </Form.Item>

                        {instantEnabled && (
                            <Form.Item
                                label="配送区域"
                                name="instantCoverageAreas"
                            >
                                <div>
                                    <Form.Item noStyle shouldUpdate>
                                        {() => {
                                            const areas = form.getFieldValue('instantCoverageAreas') || [];
                                            return areas.map((area: any, index: number) => (
                                                <Card
                                                    key={index}
                                                    size="small"
                                                    style={{ marginBottom: 8 }}
                                                    extra={
                                                        <Space>
                                                            <Button
                                                                type="link"
                                                                size="small"
                                                                onClick={() => handleOpenMapModal(index)}
                                                            >
                                                                编辑
                                                            </Button>
                                                            <Button
                                                                type="link"
                                                                danger
                                                                size="small"
                                                                onClick={() => handleDeleteInstantArea(index)}
                                                            >
                                                                删除
                                                            </Button>
                                                        </Space>
                                                    }
                                                >
                                                    <div>
                                                        <div>城市: {area.cityName}</div>
                                                        {area.polygon ? (
                                                             <div>类型: 多边形范围</div>
                                                        ) : (
                                                             <div>类型: 圆形 (半径: {(area.radius / 1000).toFixed(1)} km)</div>
                                                        )}
                                                        <div>
                                                            中心坐标: ({area.center.lng.toFixed(6)}, {area.center.lat.toFixed(6)})
                                                        </div>
                                                    </div>
                                                </Card>
                                            ));
                                        }}
                                    </Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => handleOpenMapModal()}
                                        icon={<PlusOutlined />}
                                        style={{ width: '100%', marginTop: 8 }}
                                    >
                                        在地图上选择配送区域
                                    </Button>
                                </div>
                            </Form.Item>
                        )}
                    </Card>
                </Form>
            </Modal>

            {/* 地图选择弹窗 */}
            <Modal
                title="选择配送范围"
                open={showMapModal}
                onCancel={() => setShowMapModal(false)}
                onOk={handleSaveInstantArea}
                width={800}
                okText="确定"
                cancelText="取消"
            >
                <div style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                            <span>区域类型:</span>
                            <Radio.Group value={drawType} onChange={handleDrawTypeChange}>
                                <Radio.Button value="circle">圆形区域</Radio.Button>
                                <Radio.Button value="polygon">多边形区域</Radio.Button>
                            </Radio.Group>
                        </Space>

                        {drawType === 'circle' ? (
                            <Space>
                                <span>配送半径（公里）:</span>
                                <InputNumber
                                    min={0.5}
                                    max={50}
                                    step={0.5}
                                    value={currentRadius / 1000}
                                    onChange={(value) => handleRadiusChange(value || 5)}
                                />
                                <span style={{ color: '#999', fontSize: 12 }}>
                                    当前: {(currentRadius / 1000).toFixed(1)} 公里
                                </span>
                            </Space>
                        ) : (
                            <Space>
                                <Button onClick={handleRedrawPolygon} size="small" icon={<EditOutlined />}>
                                    重新绘制
                                </Button>
                                <span style={{ color: '#666', fontSize: 12 }}>
                                    {isDrawing ? '请在地图点击绘制点，双击完成' : '拖动白色节点调整形状'}
                                </span>
                            </Space>
                        )}
                        
                        <div style={{ color: '#999', fontSize: 12 }}>
                            {drawType === 'circle' 
                                ? '💡 点击地图选择中心点，拖动滑块调整半径' 
                                : '💡 绘制闭合多边形表示配送范围，支持编辑调整'}
                        </div>
                    </Space>
                </div>
                <div
                    ref={mapRef}
                    style={{
                        width: '100%',
                        height: '500px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        position: 'relative'
                    }}
                />
            </Modal>
        </>
    );
};

export default DeliveryRangeModal;
