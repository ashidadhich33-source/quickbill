import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { ReloadOutlined, WarningOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class POSErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('POS ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to main process
    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        context: 'POS Screen'
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1
      }));
      
      if (this.props.onRetry) {
        this.props.onRetry();
      }
    } else {
      // Force page reload after max retries
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const canRetry = this.state.retryCount < this.maxRetries;
      
      return (
        <div style={{ 
          padding: '20px',
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '6px',
          margin: '20px'
        }}>
          <Alert
            message="POS System Error"
            description={
              <div>
                <Text>
                  A temporary error occurred in the POS system. 
                  {canRetry ? ' You can try to recover or reload the page.' : ' Please reload the page.'}
                </Text>
                {this.state.error && process.env.NODE_ENV === 'development' && (
                  <div style={{ marginTop: '10px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Error: {this.state.error.message}
                    </Text>
                  </div>
                )}
              </div>
            }
            type="error"
            icon={<WarningOutlined />}
            action={
              <Space>
                {canRetry && (
                  <Button 
                    size="small" 
                    danger 
                    onClick={this.handleRetry}
                    icon={<ReloadOutlined />}
                  >
                    Retry ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                )}
                <Button 
                  size="small" 
                  type="primary" 
                  onClick={this.handleReload}
                  icon={<ReloadOutlined />}
                >
                  Reload Page
                </Button>
              </Space>
            }
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default POSErrorBoundary;