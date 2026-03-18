/**
 * Adapter: CommonTooltip for product-photography (resolves @/components/CommonTooltip)
 */
import React from 'react';

export interface CommonTooltipProps {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export function CommonTooltip({ text, children }: CommonTooltipProps) {
  return <span title={text}>{children}</span>;
}
