import React, { useState, useEffect, useRef } from 'react';
import { Card, Statistic, Progress, Alert, Button, Space, Typography } from 'antd';
import { DashboardOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataSize: number;
  cacheHitRate: number;
  searchTime: number;
  filterTime: number;
  sortTime: number;
}

interface PerformanceMonitorProps {
  onOptimize?: () => void;
  showDetails?: boolean;
  threshold?: {
    renderTime: number;
    memoryUsage: number;
    dataSize: number;
  };
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  onOptimize,
  showDetails = false,
  threshold = {
    renderTime: 100,
    memoryUsage: 100,
    dataSize: 10000
  }
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    dataSize: 0,
    cacheHitRate: 0,
    searchTime: 0,
    filterTime: 0,
    sortTime: 0
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      // Get memory usage
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? 
        Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;

      // Get render time (simplified)
      const renderTime = performance.now();

      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        renderTime: renderTime - prev.renderTime
      }));
    };

    intervalRef.current = setInterval(updateMetrics, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getPerformanceStatus = () => {
    const issues: string[] = [];
    
    if (metrics.renderTime > threshold.renderTime) {
      issues.push('Slow rendering');
    }
    
    if (metrics.memoryUsage > threshold.memoryUsage) {
      issues.push('High memory usage');
    }
    
    if (metrics.dataSize > threshold.dataSize) {
      issues.push('Large dataset');
    }

    return {
      status: issues.length === 0 ? 'good' : 'warning',
      issues
    };
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (onOptimize) {
      onOptimize();
    }
    
    setIsOptimizing(false);
  };

  const performanceStatus = getPerformanceStatus();

  if (!showDetails) {
    return (
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>Performance</Text>
            {performanceStatus.status === 'warning' && (
              <WarningOutlined style={{ color: '#faad14', marginLeft: 8 }} />
            )}
          </div>
          <Button 
            size="small" 
            icon={<ReloadOutlined />}
            loading={isOptimizing}
            onClick={handleOptimize}
          >
            Optimize
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <DashboardOutlined />
          Performance Monitor
          {performanceStatus.status === 'warning' && (
            <WarningOutlined style={{ color: '#faad14' }} />
          )}
        </Space>
      }
      extra={
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          loading={isOptimizing}
          onClick={handleOptimize}
        >
          Optimize
        </Button>
      }
      style={{ marginBottom: 16 }}
    >
      {performanceStatus.issues.length > 0 && (
        <Alert
          message="Performance Issues Detected"
          description={performanceStatus.issues.join(', ')}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div>
          <Statistic
            title="Render Time"
            value={metrics.renderTime}
            suffix="ms"
            valueStyle={{ 
              color: metrics.renderTime > threshold.renderTime ? '#ff4d4f' : '#52c41a' 
            }}
          />
          <Progress 
            percent={Math.min((metrics.renderTime / threshold.renderTime) * 100, 100)}
            size="small"
            status={metrics.renderTime > threshold.renderTime ? 'exception' : 'active'}
          />
        </div>

        <div>
          <Statistic
            title="Memory Usage"
            value={metrics.memoryUsage}
            suffix="MB"
            valueStyle={{ 
              color: metrics.memoryUsage > threshold.memoryUsage ? '#ff4d4f' : '#52c41a' 
            }}
          />
          <Progress 
            percent={Math.min((metrics.memoryUsage / threshold.memoryUsage) * 100, 100)}
            size="small"
            status={metrics.memoryUsage > threshold.memoryUsage ? 'exception' : 'active'}
          />
        </div>

        <div>
          <Statistic
            title="Data Size"
            value={metrics.dataSize}
            suffix="items"
            valueStyle={{ 
              color: metrics.dataSize > threshold.dataSize ? '#ff4d4f' : '#52c41a' 
            }}
          />
          <Progress 
            percent={Math.min((metrics.dataSize / threshold.dataSize) * 100, 100)}
            size="small"
            status={metrics.dataSize > threshold.dataSize ? 'exception' : 'active'}
          />
        </div>

        <div>
          <Statistic
            title="Cache Hit Rate"
            value={metrics.cacheHitRate}
            suffix="%"
            valueStyle={{ 
              color: metrics.cacheHitRate > 80 ? '#52c41a' : '#faad14' 
            }}
          />
          <Progress 
            percent={metrics.cacheHitRate}
            size="small"
            status={metrics.cacheHitRate > 80 ? 'active' : 'normal'}
          />
        </div>

        <div>
          <Statistic
            title="Search Time"
            value={metrics.searchTime}
            suffix="ms"
            valueStyle={{ 
              color: metrics.searchTime > 50 ? '#ff4d4f' : '#52c41a' 
            }}
          />
        </div>

        <div>
          <Statistic
            title="Filter Time"
            value={metrics.filterTime}
            suffix="ms"
            valueStyle={{ 
              color: metrics.filterTime > 30 ? '#ff4d4f' : '#52c41a' 
            }}
          />
        </div>

        <div>
          <Statistic
            title="Sort Time"
            value={metrics.sortTime}
            suffix="ms"
            valueStyle={{ 
              color: metrics.sortTime > 20 ? '#ff4d4f' : '#52c41a' 
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
        <Text type="secondary">
          <strong>Performance Tips:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            <li>Use virtual scrolling for large lists</li>
            <li>Implement debounced search</li>
            <li>Cache frequently accessed data</li>
            <li>Use pagination for large datasets</li>
            <li>Optimize database queries</li>
          </ul>
        </Text>
      </div>
    </Card>
  );
};

export default PerformanceMonitor;