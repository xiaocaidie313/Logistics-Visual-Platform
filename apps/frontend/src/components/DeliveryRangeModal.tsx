import { Modal, Form, Switch, Button, Cascader, Space, Card, message, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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
    
    const mapRef = useRef<any>(null);
    const mapInstanceRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const markerIconRef = useRef<any>(null);
    const currentRadiusRef = useRef(5000); // 使用 ref 存储最新的半径值
    const [currentRadius, setCurrentRadius] = useState(5000); // 当前配送半径（用于显示）

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
            // 延迟初始化，确保 DOM 完全渲染
            const timer = setTimeout(() => {
                const instantAreas = form.getFieldValue('instantCoverageAreas') || [];
                const existingArea = currentInstantArea?.index !== undefined && instantAreas[currentInstantArea.index]
                    ? instantAreas[currentInstantArea.index]
                    : null;
                
                console.log('准备初始化地图，已有区域:', existingArea);
                initMap(existingArea);
            }, 300); // 增加延迟确保DOM完全渲染
            return () => clearTimeout(timer);
        } else if (!showMapModal) {
            // 关闭弹窗时清理地图资源
            if (mapInstanceRef.current) {
                try {
                    mapInstanceRef.current.destroy();
                    mapInstanceRef.current = null;
                    markerRef.current = null;
                    circleRef.current = null;
                } catch (error) {
                    console.error('清理地图资源失败:', error);
                }
            }
        }
    }, [showMapModal]);

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

        // 从环境变量获取高德地图 API Key
        const amapKey = import.meta.env.VITE_AMAP_KEY || 'YOUR_AMAP_KEY_HERE';
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}&plugin=AMap.DistrictSearch,AMap.Circle,AMap.Geocoder`;
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
                const radius = instantAreas[index].radius || 5000;
                setCurrentRadius(radius);
                currentRadiusRef.current = radius; // 同步更新 ref
            } else {
                setCurrentInstantArea({ index: instantAreas.length });
                setCurrentRadius(5000);
                currentRadiusRef.current = 5000; // 同步更新 ref
            }
            
            setShowMapModal(true);
        } catch (error) {
            message.error('加载地图失败，请检查网络连接或 API Key 配置');
            console.error('加载地图失败:', error);
        }
    };

    // 统一创建配送中心标记，确保图标一致
    const addCenterMarker = (map: any, lng: number, lat: number) => {
        if (!window.AMap) {
            return null;
        }
        
        if (!markerIconRef.current) {
            markerIconRef.current = new window.AMap.Icon({
                size: new window.AMap.Size(25, 34),
                imageSize: new window.AMap.Size(25, 34),
                image: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
            });
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
        if (!position) {
            return { lng: 0, lat: 0 };
        }
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
            if (typeof value === 'number') {
                return value.toString().trim();
            }
            return value ? value.trim() : '';
        };

        const cityName =
            normalize(addressComponent?.city) ||
            normalize(addressComponent?.district) ||
            normalize(addressComponent?.township) ||
            normalize(addressComponent?.province) ||
            '';

        const cityCode = normalize(addressComponent?.adcode) || normalize(addressComponent?.citycode);

        return {
            cityName,
            cityCode,
        };
    };

    // 初始化地图
    const initMap = (existingArea?: any) => {
        if (!window.AMap || !mapRef.current) {
            console.error('地图初始化失败：AMap 或 mapRef 不可用');
            return;
        }

        try {
            // 清理现有地图
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }

            const center = existingArea?.center
                ? [existingArea.center.lng, existingArea.center.lat]
                : [116.397428, 39.90923]; // 默认北京

            console.log('初始化地图，中心点:', center, '已有区域:', existingArea);

            const map = new window.AMap.Map(mapRef.current, {
                zoom: existingArea ? 13 : 12,
                center: center,
                viewMode: '2D',
                resizeEnable: true,
            });

            mapInstanceRef.current = map;

            // 等待地图完全加载
            map.on('complete', () => {
                console.log('地图加载完成');
                
                // 如果有现有区域，绘制圆形和标记
                if (existingArea && existingArea.center && existingArea.radius) {
                    console.log('绘制已有配送区域 - 中心:', existingArea.center, '半径:', existingArea.radius);
                    
                    // 先延迟一下，确保地图完全渲染
                    setTimeout(() => {
                        // 添加中心点标记
                        addCenterMarker(map, existingArea.center.lng, existingArea.center.lat);
                        
                        // 再延迟绘制圆形
                        setTimeout(() => {
                            drawCircle(map, existingArea.center, existingArea.radius);
                            console.log('已有配送区域绘制完成');
                        }, 100);
                    }, 100);
                } else {
                    console.log('无已有区域，等待用户点击地图选择');
                }
            });

            // 添加点击事件
            map.on('click', (e: any) => {
                const lng = e.lnglat.getLng();
                const lat = e.lnglat.getLat();
                
                // 从 ref 获取最新的半径值，避免闭包问题
                const latestRadius = currentRadiusRef.current;
                console.log('地图点击位置:', lng, lat, '使用半径:', latestRadius, '米');

                // 清除旧的标记和圆形
                if (markerRef.current) {
                    map.remove(markerRef.current);
                }
                if (circleRef.current) {
                    map.remove(circleRef.current);
                }

                // 添加新标记
                addCenterMarker(map, lng, lat);

                // 使用最新的半径值绘制圆形
                drawCircle(map, { lng, lat }, latestRadius);
            });

            console.log('地图初始化成功');
        } catch (error) {
            console.error('地图初始化错误:', error);
            message.error('地图初始化失败');
        }
    };

    // 绘制圆形区域
    const drawCircle = (map: any, center: { lng: number; lat: number }, radius: number) => {
        try {
            console.log('开始绘制圆形 - 中心:', center, '半径(米):', radius);
            
            // 清除旧的圆形
            if (circleRef.current) {
                map.remove(circleRef.current);
                circleRef.current = null;
            }

            // 创建圆形覆盖物
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

            // 添加到地图
            map.add(circle);
            circleRef.current = circle;

            // 在圆形上绑定点击事件，支持点击蓝色区域重新选择配送中心
            circle.on('click', (e: any) => {
                const lng = e.lnglat.getLng();
                const lat = e.lnglat.getLat();

                const latestRadius = currentRadiusRef.current;
                console.log('圆形点击位置:', lng, lat, '使用半径:', latestRadius, '米');

                // 清除旧的标记和圆形
                if (markerRef.current) {
                    map.remove(markerRef.current);
                }
                if (circleRef.current) {
                    map.remove(circleRef.current);
                }

                // 添加新标记
                addCenterMarker(map, lng, lat);

                // 使用最新的半径值重新绘制圆形
                drawCircle(map, { lng, lat }, latestRadius);
            });
            
            console.log('圆形已添加到地图');
            
            // 调整视野以适应圆形
            setTimeout(() => {
                try {
                    map.setFitView([circle], false, [60, 60, 60, 60]);
                    console.log('视野已调整');
                } catch (e) {
                    console.error('调整视野失败:', e);
                }
            }, 100);

            console.log('圆形绘制成功');
        } catch (error) {
            console.error('绘制圆形失败:', error);
            message.error('绘制配送范围失败');
        }
    };

    // 保存即时配送区域
    const handleSaveInstantArea = () => {
        if (!circleRef.current || !markerRef.current) {
            message.warning('请在地图上点击选择配送中心位置');
            return;
        }

        const radius = circleRef.current.getRadius();
        const { lng, lat } = extractLngLat(markerRef.current.getPosition());

        // 使用高德地图的逆地理编码获取城市信息
        window.AMap.plugin('AMap.Geocoder', () => {
            const geocoder = new window.AMap.Geocoder();
            geocoder.getAddress([lng, lat], (status: string, result: any) => {
                let cityName = '未知城市';
                let cityCode = '';

                if (status === 'complete' && result.info === 'OK') {
                    const { cityName: resolvedCityName, cityCode: resolvedCityCode } = resolveCityInfo(
                        result.regeocode.addressComponent,
                    );
                    if (resolvedCityName) {
                        cityName = resolvedCityName;
                    }
                    if (resolvedCityCode) {
                        cityCode = resolvedCityCode;
                    }
                }

                const newArea = {
                    cityName,
                    cityCode,
                    center: {
                        lng,
                        lat,
                    },
                    radius,
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

    // 更新半径
    const handleRadiusChange = (radius: number) => {
        const radiusInMeters = radius * 1000;
        setCurrentRadius(radiusInMeters);
        currentRadiusRef.current = radiusInMeters; // 同步更新 ref，确保地图点击事件能获取最新值
        
        console.log('半径已更新为:', radiusInMeters, '米');
        
        if (circleRef.current && markerRef.current && mapInstanceRef.current) {
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
                                                        <div>配送半径: {(area.radius / 1000).toFixed(1)} 公里</div>
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
                    <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                        💡 <strong>使用说明:</strong>
                        <br />
                        • <strong>编辑模式:</strong> 地图将自动显示已有的配送范围（蓝色圆圈）
                        <br />
                        • <strong>修改位置:</strong> 点击地图上的新位置重新选择配送中心
                        <br />
                        • <strong>调整半径:</strong> 使用上方滑块调整配送半径，圆圈会实时更新
                    </div>
                </div>
                <div
                    ref={mapRef}
                    style={{
                        width: '100%',
                        height: '500px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                    }}
                />
            </Modal>
        </>
    );
};

export default DeliveryRangeModal;
