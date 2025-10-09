import React from 'react';
import { Typography as AntTypography } from 'antd';

const { Title, Text, Paragraph, Link } = AntTypography;

interface TypographyProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5;
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  mark?: boolean;
  keyboard?: boolean;
  copyable?: boolean | { text?: string; onCopy?: () => void };
  editable?: boolean | { onChange: (text: string) => void };
  ellipsis?: boolean | { rows?: number; expandable?: boolean; onExpand?: () => void };
  style?: React.CSSProperties;
  className?: string;
}

const Typography: React.FC<TypographyProps> = ({
  children,
  level = 1,
  type,
  strong = false,
  italic = false,
  underline = false,
  strikethrough = false,
  code = false,
  mark = false,
  keyboard = false,
  copyable = false,
  editable = false,
  ellipsis = false,
  style,
  className
}) => {
  return (
    <AntTypography
      style={style}
      className={className}
    >
      <Title level={level}>{children}</Title>
    </AntTypography>
  );
};

export default Typography;
export { Title, Text, Paragraph, Link };