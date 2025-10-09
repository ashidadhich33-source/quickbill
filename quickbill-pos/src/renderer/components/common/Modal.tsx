import React from 'react';
import { Modal as AntModal, ModalProps as AntModalProps } from 'antd';

interface ModalProps extends AntModalProps {
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ children, ...props }) => {
  return (
    <AntModal {...props}>
      {children}
    </AntModal>
  );
};

export default Modal;