import { Spin, Steps } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Tag } from "antd";
import { useEffect, useState } from "react";
import type { Track, TrackNode } from "../../services/UserMobile/trackService";

interface Order {
  orderId?: string;
  status?: string;
  sendaddress?: string;
  senderAddress?: string;
  useraddress?: string;
  shippingAddress?: {
    fullAddress?: string;
  };
}

interface OrdertrackCardProps {
  order: Order | null;
  track: Track | null;
  loading: boolean;
}

// 状态映射配置
const statusConfig = {
  pending: { color: 'default', text: '待支付' },
  paid: { color: 'processing', text: '已支付' },
  shipped: { color: 'blue', text: '运输中' },
  waiting_for_delivery: { color: 'purple', text: '等待派送' },
  delivering: { color: 'geekblue', text: '派送中' },
  confirmed: { color: 'cyan', text: '已确认' },
  delivered: { color: 'orange', text: '已送达' },
  cancelled: { color: 'error', text: '已取消' },
  refunded: { color: 'warning', text: '已退款' },
} as const;

// 获取状态文本和颜色
const getStatusInfo = (status?: string): { color: string; text: string } => {
  const orderStatus = (status || 'shipped') as keyof typeof statusConfig;
  // 确保总是返回有效的配置
  return statusConfig[orderStatus] || statusConfig['shipped'];
};

const OrdertrackCard = ({ order, track, loading }: OrdertrackCardProps) => {
  const status = track?.logisticsStatus || order?.status || "shipped";
  console.log(" ordertrackCard status:", status);
  const statusInfo = getStatusInfo(status);
  const [stepItems, setStepItems] = useState<Array<{
    title: string;
    description: string;
    status: 'wait' | 'process' | 'finish' | 'error';
  }>>([]);

  useEffect(() => {
    console.log("物流信息order:", order);
    console.log("物流信息track:", track);
    if (track && track.tracks && Array.isArray(track.tracks)) {
      // 将 tracks 转换为 Steps 组件需要的格式
      const items = track.tracks.map((trackItem: TrackNode, index: number) => {
        const date = new Date(trackItem.time);
        const timeStr = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        const stepStatus: 'wait' | 'process' | 'finish' | 'error' = 
          index === 0 ? 'finish' : index === track.tracks!.length - 1 ? 'process' : 'finish';
        
        console.log("trackItem:", trackItem);
        return {
          title: trackItem.description || trackItem.location,
          description: `${timeStr} ${trackItem.location || ''}`,
          status: stepStatus,
        };
      });

      setStepItems(items);

    } else {
      setStepItems([]);
    }
  }, [track]);
  return (
    <>
    <div
        style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            paddingBottom: "20px",
          }}
        >
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "#999",
              }}
            >
              <Spin
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
              />
              <div style={{ marginTop: 10 }}>正在查询...</div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* 订单信息卡片 */}
              <div
                style={{
                  backgroundColor: "#fafafa",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999",
                        marginBottom: "4px",
                      }}
                    >
                      物流公司
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        color: "#333",
                      }}
                    >
                      {track?.logisticsCompany || "未知物流"}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      {track?.logisticsNumber || order?.orderId || ""}
                    </div>
                  </div>
                  <Tag style={{borderRadius: "10px", display:'flex',alignItems: "center",justifyContent: "center",  border: "1px solid #e0e0e0",boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)", fontSize: "14px", width: "90px", height: "40px", lineHeight: "30px", textAlign: "center"}} color={statusInfo.color}>{statusInfo.text}</Tag>
                </div>

                {/* 发货/收货地址 */}
                <div style={{ marginTop: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#faad14",
                        color: "#fff",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      发
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#333",
                        lineHeight: "1.5",
                        flex: 1,
                      }}
                    >
                      {track?.sendAddress || order?.sendaddress || order?.senderAddress || "未知地址"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#52c41a",
                        color: "#fff",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      收
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "#333",
                        lineHeight: "1.5",
                        flex: 1,
                      }}
                    >
                      {track?.userAddress || order?.useraddress || order?.shippingAddress?.fullAddress || "未知地址"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 物流时间线卡片 */}
              <div
                style={{
                  backgroundColor: "#fafafa",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: "12px",
                  }}
                >
                  物流详情
                </div>
                {stepItems.length > 0 ? (
                  <Steps
                    orientation="vertical"
                    items={stepItems}
                    size="small"
                  />
                ) : (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#999",
                      textAlign: "center",
                      padding: "20px 0",
                    }}
                  >
                    暂无物流轨迹信息
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </>
  );
};

export default OrdertrackCard;