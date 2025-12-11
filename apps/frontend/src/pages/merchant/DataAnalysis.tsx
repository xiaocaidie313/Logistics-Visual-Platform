import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, message, Select } from 'antd';
import { ShoppingOutlined, DollarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getOrderStatistics, getOrderTrendStatistics, getOrderHourStatistics } from '../../services/orderService';
import { getProductStatistics, getProductSalesRanking } from '../../services/productService';

interface DataAnalysisProps {
  analysisType?: 'product' | 'order' | 'order-trend';
  useAllData?: boolean; // 是否使用全部数据（管理员端）
}

// 订单状态中文映射
const orderStatusMap: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  confirmed: '已确认',
  delivered: '已送达',
  cancelled: '已取消',
  refunded: '已退款',
};

// 商品状态中文映射
const productStatusMap: Record<string, string> = {
  active: '在售',
  inactive: '下架',
  out_of_stock: '缺货',
};

interface OrderStatistics {
  total: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
}

interface ProductStatistics {
  total: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalSales: number;
  }>;
  byCategory: Array<{
    _id: string;
    count: number;
  }>;
}

const DataAnalysis: React.FC<DataAnalysisProps> = ({ analysisType, useAllData = false }) => {
  const [orderStats, setOrderStats] = useState<OrderStatistics | null>(null);
  const [productStats, setProductStats] = useState<ProductStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [merchantId, setMerchantId] = useState<string>('');
  
  // 新增状态
  const [orderTrendData, setOrderTrendData] = useState<Array<{ _id: string; count: number; totalAmount: number }>>([]);
  const [orderHourData, setOrderHourData] = useState<Array<{ _id: number; count: number; totalAmount: number }>>([]);
  const [productRanking, setProductRanking] = useState<Array<{ _id?: string; productName: string; salesCount: number; category: string }>>([]);
  const [trendPeriod, setTrendPeriod] = useState<'day' | 'week' | 'month'>('day');

  // 获取商户ID（如果不是管理员端）
  useEffect(() => {
    if (!useAllData) {
      const user = localStorage.getItem('userInfo');
      if (user) {
        const userInfo = JSON.parse(user);
        setMerchantId(userInfo._id || '');
      }
    }
  }, [useAllData]);

  // 获取订单统计
  useEffect(() => {
    if (analysisType === 'order' || !analysisType) {
      setLoading(true);
      // 管理员端不传 merchantId，获取全部数据
      const merchantIdParam = useAllData ? undefined : (merchantId || undefined);
      getOrderStatistics(merchantIdParam)
        .then((res) => {
          if (res.code === 200) {
            console.log(" getOrderStatistics ",res.data);
            setOrderStats(res.data);
          } else {
            message.error(res.message || '获取订单统计失败');
          }
        })
        .catch((err) => {
          console.error('获取订单统计失败:', err);
          message.error('获取订单统计失败');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [analysisType, merchantId, useAllData]);

  // 获取商品统计
  useEffect(() => {
    // 管理员端直接获取，商家端需要等待 merchantId
    if (analysisType === 'product' || !analysisType) {
      if (useAllData || merchantId) {
        setLoading(true);
        const merchantIdParam = useAllData ? undefined : merchantId;
        getProductStatistics(merchantIdParam)
          .then((res) => {
            if (res.code === 200) {
              setProductStats(res.data);
            } else {
              message.error(res.message || '获取商品统计失败');
            }
          })
          .catch((err) => {
            console.error('获取商品统计失败:', err);
            message.error('获取商品统计失败');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [analysisType, merchantId, useAllData]);

  // 获取订单时间趋势统计
  useEffect(() => {
    if (analysisType === 'order-trend') {
      if (useAllData || merchantId) {
        setLoading(true);
        const merchantIdParam = useAllData ? undefined : merchantId;
        getOrderTrendStatistics(merchantIdParam, trendPeriod)
          .then((res) => {
            if (res.code === 200) {
              setOrderTrendData(res.data);
            } else {
              message.error(res.message || '获取订单趋势统计失败');
            }
          })
          .catch((err) => {
            console.error('获取订单趋势统计失败:', err);
            message.error('获取订单趋势统计失败');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [analysisType, merchantId, trendPeriod, useAllData]);

  // 获取订单时段分析
  useEffect(() => {
    if (analysisType === 'order-trend') {
      if (useAllData || merchantId) {
        const merchantIdParam = useAllData ? undefined : merchantId;
        getOrderHourStatistics(merchantIdParam)
          .then((res) => {
            if (res.code === 200) {
              setOrderHourData(res.data);
            } else {
              message.error(res.message || '获取订单时段统计失败');
            }
          })
          .catch((err) => {
            console.error('获取订单时段统计失败:', err);
            message.error('获取订单时段统计失败');
          });
      }
    }
  }, [analysisType, merchantId, useAllData]);

  // 获取商品销售排行
  useEffect(() => {
    if (analysisType === 'product' || !analysisType) {
      if (useAllData || merchantId) {
        const merchantIdParam = useAllData ? undefined : merchantId;
        getProductSalesRanking(merchantIdParam, 10)
          .then((res) => {
            if (res.code === 200) {
              setProductRanking(res.data);
            }
          })
          .catch((err) => {
            console.error('获取商品销售排行失败:', err);
          });
      }
    }
  }, [analysisType, merchantId, useAllData]);

  // 订单状态分布饼图配置
  const getOrderStatusPieOption = () => {
    if (!orderStats?.byStatus) return {};
    
    const data = orderStats.byStatus.map((item) => ({
      value: item.count,
      name: orderStatusMap[item._id] || item._id,
    }));

    return {
      title: {
        text: '订单状态分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: '订单状态',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {c}\n({d}%)',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data,
        },
      ],
    };
  };

  // 订单金额统计柱状图配置
  const getOrderAmountBarOption = () => {
    if (!orderStats?.byStatus) return {};
    
    const data = orderStats.byStatus.map((item) => ({
      name: orderStatusMap[item._id] || item._id,
      value: item.totalAmount || 0,
    }));

    return {
      title: {
        text: '各状态订单金额统计',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: unknown) => {
          const param = Array.isArray(params) ? params[0] : params;
          if (param && typeof param === 'object' && 'name' in param && 'value' in param && 'seriesName' in param) {
            return `${param.name}<br/>${param.seriesName}: ¥${Number(param.value).toFixed(2)}`;
          }
          return '';
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.name),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}',
        },
      },
      series: [
        {
          name: '订单金额',
          type: 'bar',
          data: data.map((item) => item.value),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#83bff6' },
                { offset: 0.5, color: '#188df0' },
                { offset: 1, color: '#188df0' },
              ],
            },
          },
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#2378f7' },
                  { offset: 0.7, color: '#2378f7' },
                  { offset: 1, color: '#83bff6' },
                ],
              },
            },
          },
        },
      ],
    };
  };

  // 商品状态分布饼图配置
  const getProductStatusPieOption = () => {
    if (!productStats?.byStatus) return {};
    
    const data = productStats.byStatus.map((item) => ({
      value: item.count,
      name: productStatusMap[item._id] || item._id,
    }));

    return {
      title: {
        text: '商品状态分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: '商品状态',
          type: 'pie',
          radius: '70%',
          data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  };

  // 商品分类分布柱状图配置
  const getProductCategoryBarOption = () => {
    if (!productStats?.byCategory) return {};
    
    const data = productStats.byCategory.map((item) => ({
      name: item._id || '未分类',
      value: item.count,
    }));

    return {
      title: {
        text: '商品分类分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.name),
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '商品数量',
          type: 'bar',
          data: data.map((item) => item.value),
          itemStyle: {
            color: '#52c41a',
          },
        },
      ],
    };
  };

  // 计算订单统计卡片数据
  const getOrderCardData = () => {
    if (!orderStats) return null;
    
    const deliveredCount = orderStats.byStatus?.find((item) => item._id === 'delivered')?.count || 0;
    const totalAmount = orderStats.byStatus?.reduce((sum, item) => sum + (item.totalAmount || 0), 0) || 0;
    const cancelledCount = orderStats.byStatus?.find((item) => item._id === 'cancelled')?.count || 0;
    
    return {
      total: orderStats.total || 0,
      delivered: deliveredCount,
      totalAmount,
      cancelled: cancelledCount,
    };
  };

  // 计算商品统计卡片数据
  const getProductCardData = () => {
    if (!productStats) return null;
    
    const activeCount = productStats.byStatus?.find((item) => item._id === 'active')?.count || 0;
    const outOfStockCount = productStats.byStatus?.find((item) => item._id === 'out_of_stock')?.count || 0;
    const totalSales = productStats.byStatus?.reduce((sum, item) => sum + (item.totalSales || 0), 0) || 0;
    
    return {
      total: productStats.total || 0,
      active: activeCount,
      outOfStock: outOfStockCount,
      totalSales,
    };
  };

  // 订单时间趋势折线图配置
  const getOrderTrendOption = () => {
    if (!orderTrendData || orderTrendData.length === 0) return {};
    
    const dates = orderTrendData.map((item) => item._id);
    const counts = orderTrendData.map((item) => item.count);
    const amounts = orderTrendData.map((item) => item.totalAmount);

    return {
      title: {
        text: '订单时间趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
      },
      legend: {
        data: ['订单数量', '订单金额'],
        top: 40,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '订单数量',
          position: 'left',
        },
        {
          type: 'value',
          name: '订单金额(元)',
          position: 'right',
          axisLabel: {
            formatter: '¥{value}',
          },
        },
      ],
      series: [
        {
          name: '订单数量',
          type: 'line',
          data: counts,
          smooth: true,
          itemStyle: {
            color: '#1890ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.1)' },
              ],
            },
          },
        },
        {
          name: '订单金额',
          type: 'line',
          yAxisIndex: 1,
          data: amounts,
          smooth: true,
          itemStyle: {
            color: '#52c41a',
          },
        },
      ],
    };
  };

  // 订单时段分析柱状图配置
  const getOrderHourOption = () => {
    if (!orderHourData || orderHourData.length === 0) return {};
    
    const hours = orderHourData.map((item) => `${item._id}:00`);
    const counts = orderHourData.map((item) => item.count);

    return {
      title: {
        text: '订单时段分布',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: unknown) => {
          const param = Array.isArray(params) ? params[0] : params;
          if (param && typeof param === 'object' && 'name' in param && 'value' in param) {
            return `${param.name}<br/>订单数量: ${param.value}`;
          }
          return '';
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLabel: {
          rotate: 45,
        },
      },
      yAxis: {
        type: 'value',
        name: '订单数量',
      },
      series: [
        {
          name: '订单数量',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#ff7875' },
                { offset: 1, color: '#ff4d4f' },
              ],
            },
          },
        },
      ],
    };
  };

  // 商品销售排行柱状图配置
  const getProductRankingOption = () => {
    if (!productRanking || productRanking.length === 0) return {};
    
    const productNames = productRanking.map((item) => item.productName.length > 10 ? item.productName.substring(0, 10) + '...' : item.productName);
    const salesCounts = productRanking.map((item) => item.salesCount);

    return {
      title: {
        text: '商品销售排行 Top 10',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: unknown) => {
          const param = Array.isArray(params) ? params[0] : params;
          if (param && typeof param === 'object' && 'name' in param && 'value' in param) {
            const index = productNames.indexOf(param.name as string);
            const fullName = index >= 0 && productRanking[index] ? productRanking[index].productName : param.name;
            return `${fullName}<br/>销量: ${param.value}`;
          }
          return '';
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '销量',
      },
      yAxis: {
        type: 'category',
        data: productNames,
        axisLabel: {
          interval: 0,
        },
      },
      series: [
        {
          name: '销量',
          type: 'bar',
          data: salesCounts,
          itemStyle: {
            color: '#faad14',
          },
        },
      ],
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 订单分析页面
  if (analysisType === 'order') {
    const cardData = getOrderCardData();
    
    return (
      <div style={{ padding: '24px' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总订单数"
                value={cardData?.total || 0}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已送达订单"
                value={cardData?.delivered || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总订单金额"
                value={cardData?.totalAmount || 0}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="已取消订单"
                value={cardData?.cancelled || 0}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts
                option={getOrderStatusPieOption()}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts
                option={getOrderAmountBarOption()}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
        </Row>

      </div>
    );
  }

  // 订单趋势分析页面
  if (analysisType === 'order-trend') {
    return (
      <div style={{ padding: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title="订单时间趋势"
              extra={
                <Select
                  value={trendPeriod}
                  onChange={(value) => setTrendPeriod(value)}
                  style={{ width: 100 }}
                  options={[
                    { label: '按日', value: 'day' },
                    { label: '按周', value: 'week' },
                    { label: '按月', value: 'month' },
                  ]}
                />
              }
            >
              <ReactECharts
                option={getOrderTrendOption()}
                style={{ height: '500px' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="订单时段分布">
              <ReactECharts
                option={getOrderHourOption()}
                style={{ height: '500px' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // 商品分析页面
  if (analysisType === 'product') {
    const cardData = getProductCardData();
    
    return (
      <div style={{ padding: '24px' }}>
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="商品总数"
                value={cardData?.total || 0}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="在售商品"
                value={cardData?.active || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="缺货商品"
                value={cardData?.outOfStock || 0}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总销量"
                value={cardData?.totalSales || 0}
                prefix={<ShoppingOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts
                option={getProductStatusPieOption()}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card>
              <ReactECharts
                option={getProductCategoryBarOption()}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24}>
            <Card>
              <ReactECharts
                option={getProductRankingOption()}
                style={{ height: '400px' }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // 默认页面 - 显示概览
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <Card>
        <h2>数据分析概览</h2>
        <p style={{ fontSize: '16px', color: '#666', marginTop: '16px' }}>
          请从左侧菜单选择具体的分析类型：
        </p>
        <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '24px' }}>
          <li style={{ marginBottom: '12px', fontSize: '16px' }}>
            <strong>商品分析</strong> - 查看商品状态分布、分类统计等
          </li>
          <li style={{ fontSize: '16px' }}>
            <strong>订单分析</strong> - 查看订单状态分布、金额统计等
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default DataAnalysis;
