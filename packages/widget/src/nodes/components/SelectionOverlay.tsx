import React from 'react';

interface SelectionOverlayProps {
  isVisible: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * SelectionOverlay - 选择模式覆盖层组件
 * 在选择模式下显示加号图标和提示文字
 */
export function SelectionOverlay({ isVisible, onClick }: SelectionOverlayProps) {
  if (!isVisible) return null;

  return (
    <>
      <style>
        {`
          .widget-selection-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.4);
            transition: background-color 0.2s ease;
            cursor: pointer;
            z-index: 10;
          }
          .widget-selection-overlay:hover {
            background-color: rgba(0, 0, 0, 0.5);
          }
          .widget-selection-overlay:hover .widget-selection-add-button {
            transform: scale(1.1);
          }
          .widget-selection-add-button {
            display: flex;
            width: 64px;
            height: 64px;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.9);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease;
          }
          .widget-selection-add-icon {
            width: 32px;
            height: 32px;
            color: #000;
          }
          .widget-selection-text {
            position: absolute;
            bottom: 16px;
            font-size: 14px;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.9);
          }
        `}
      </style>
      <div
        className="widget-selection-overlay"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
      >
        <div className="widget-selection-add-button">
          {/* Plus icon */}
          <svg
            className="widget-selection-add-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <span className="widget-selection-text">Click to add</span>
      </div>
    </>
  );
}
