import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Space } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to main process for production logging
    if (window.electronAPI?.logError) {
      window.electronAPI.logError({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const errorDetails = {
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please send this to support.');
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = JSON.stringify(errorDetails, null, 2);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Error details copied to clipboard. Please send this to support.');
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{ 
          padding: '50px 20px', 
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle="An unexpected error occurred. Please try again or contact support if the problem persists."
            extra={[
              <Space key="actions" size="middle">
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
                <Button 
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>
                <Button 
                  icon={<BugOutlined />}
                  onClick={this.handleReportBug}
                >
                  Report Bug
                </Button>
              </Space>
            ]}
          >
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ 
                textAlign: 'left', 
                marginTop: '20px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '6px',
                maxWidth: '800px'
              }}>
                <Paragraph>
                  <Text strong>Error Details (Development Mode):</Text>
                </Paragraph>
                <Paragraph>
                  <Text code>{this.state.error.message}</Text>
                </Paragraph>
                {this.state.error.stack && (
                  <Paragraph>
                    <Text strong>Stack Trace:</Text>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '12px',
                      backgroundColor: '#fff',
                      padding: '10px',
                      borderRadius: '4px',
                      marginTop: '10px'
                    }}>
                      {this.state.error.stack}
                    </pre>
                  </Paragraph>
                )}
                {this.state.errorInfo?.componentStack && (
                  <Paragraph>
                    <Text strong>Component Stack:</Text>
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '12px',
                      backgroundColor: '#fff',
                      padding: '10px',
                      borderRadius: '4px',
                      marginTop: '10px'
                    }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </Paragraph>
                )}
              </div>
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;