import { Alert, Button } from "antd";
import { CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { useState } from "react";

interface PickupCodeDisplayProps {
  pickupCode?: string;
  pickupLocation?: string;
  expiresAt?: Date | string;
  logisticsStatus?: string;
}

const PickupCodeDisplay: React.FC<PickupCodeDisplayProps> = ({
  pickupCode,
  pickupLocation,
  expiresAt,
  logisticsStatus
}) => {
  const [copied, setCopied] = useState(false);

  // 如果没有取件码，不显示
  if (!pickupCode) {
    return null;
  }

  // 判断是否可以取件 - 只在已送达后显示取件码
  const canPickup = logisticsStatus === 'delivered';
  
  // 如果状态不是已送达，完全不显示组件
  if (!canPickup) {
    return null;
  }

  // 判断是否过期
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  // 复制取件码
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pickupCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 格式化过期时间
  const formatExpiresAt = () => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 根据状态确定 Alert 类型（只有已送达才会显示，所以这里只判断是否过期）
  const getAlertType = (): 'success' | 'warning' | 'error' | 'info' => {
    if (isExpired) return 'error';
    return 'success'; // 已送达状态，显示成功样式
  };

  return (
    <div style={{ marginTop: '12px', marginBottom: '12px' }}>
      <Alert
        message="取件码"
        description={
          <div>
            {/* 取件码显示 */}
            <div 
              style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                margin: '12px 0',
                letterSpacing: '4px',
                color: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {pickupCode}
              <Button
                type="text"
                icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopy}
                style={{ 
                  color: copied ? '#52c41a' : '#1890ff',
                  padding: '0 8px'
                }}
              >
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            
            {/* 自提点位置 */}
            {pickupLocation && (
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                <strong>自提点：</strong>{pickupLocation}
              </div>
            )}
            
            {/* 有效期 */}
            {expiresAt && (
              <div 
                style={{ 
                  marginTop: '4px', 
                  fontSize: '12px', 
                  color: isExpired ? '#ff4d4f' : '#999' 
                }}
              >
                有效期至：{formatExpiresAt()}
                {isExpired && <span style={{ marginLeft: '8px' }}>（已过期）</span>}
              </div>
            )}
            
          </div>
        }
        type={getAlertType()}
        showIcon
        style={{
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

export default PickupCodeDisplay;

