import React, { useEffect } from 'react';
import { notification } from 'antd';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  duration = 4.5,
  onClose
}) => {
  useEffect(() => {
    const config = {
      message: title,
      description: message,
      duration,
      onClose
    };

    switch (type) {
      case 'success':
        notification.success(config);
        break;
      case 'error':
        notification.error(config);
        break;
      case 'warning':
        notification.warning(config);
        break;
      case 'info':
        notification.info(config);
        break;
      default:
        notification.open(config);
    }
  }, [type, title, message, duration, onClose]);

  return null;
};

export default Notification;