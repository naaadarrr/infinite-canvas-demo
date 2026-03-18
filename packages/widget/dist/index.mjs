import React20, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useStore, Handle, Position, NodeToolbar, applyNodeChanges, applyEdgeChanges, addEdge, ReactFlow, SelectionMode, MarkerType, useNodeId, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { NodeType, parseRawData, generateId } from '@tc/infinite-core';
export * from '@tc/infinite-core';
import { Shuffle, Paintbrush, Video, RotateCw, CircleUser, ArrowUpRight, Download, RefreshCw, MicVocal, Pause, Play, ChevronDown, UserPlus, Frame, Type, PenTool, Repeat, Smile, Maximize2, Rotate3d, Camera, Image as Image$1, ImagePlay, Wand2, MoveDiagonal, PersonStanding, ShoppingBag, UserPen, User, Mic, AudioLines, Eraser, Undo2, Redo2, Check, X, Plus, Crown, ImagePlus, ScanFace, Sparkles, ArrowUp, Star, Music, Monitor, ArrowLeftRight, CloudUpload, LayoutGrid, Upload, Lightbulb, ArrowLeft, ChevronRight, MoreHorizontal, Images, Volume2, Ban, Info, Copy, AlignCenterVertical, AlignStartVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, Zap, ChevronUp } from 'lucide-react';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import ReactDOM from 'react-dom';

// #style-inject:#style-inject
function styleInject(css, { insertAt } = {}) {
  if (typeof document === "undefined")
    return;
  const head = document.head || document.getElementsByTagName("head")[0];
  const style = document.createElement("style");
  style.type = "text/css";
  if (insertAt === "top") {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

// src/styles.css
styleInject(".react-flow__node.selectable {\n  cursor: grab !important;\n}\n.react-flow__node.dragging,\n.react-flow__node.dragging * {\n  cursor: grabbing !important;\n}\n.tc-pan-mode .react-flow__pane,\n.tc-pan-mode .react-flow__node.selectable,\n.tc-pan-mode .react-flow__node,\n.tc-pan-mode .react-flow__node *,\n.tc-pan-mode .react-flow__renderer {\n  cursor: grab !important;\n}\n.tc-pan-mode:active .react-flow__pane,\n.tc-pan-mode:active .react-flow__node.selectable,\n.tc-pan-mode:active .react-flow__node,\n.tc-pan-mode:active .react-flow__node *,\n.tc-pan-mode:active .react-flow__renderer {\n  cursor: grabbing !important;\n}\n.tc-node-toolbar-portal {\n  pointer-events: auto;\n}\n.tc-node-toolbar {\n  --tc-node-toolbar-bg: #252525;\n  --tc-node-toolbar-border: rgba(255, 255, 255, 0.1);\n  --tc-node-toolbar-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);\n  --tc-node-toolbar-icon: rgba(255, 255, 255, 0.95);\n  --tc-node-toolbar-hover: rgba(255, 255, 255, 0.05);\n  --tc-node-toolbar-active: rgba(255, 255, 255, 0.12);\n  --tc-node-toolbar-focus: rgba(255, 255, 255, 0.35);\n  --tc-node-toolbar-tooltip-bg: #252525;\n  --tc-node-toolbar-tooltip-border: rgba(255, 255, 255, 0.1);\n  --tc-node-toolbar-tooltip-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 4px;\n  border-radius: 12px;\n  background-color: var(--tc-node-toolbar-bg);\n  border: 1px solid var(--tc-node-toolbar-border);\n  box-shadow: var(--tc-node-toolbar-shadow);\n  overflow: visible;\n}\n.tc-node-toolbar-action {\n  position: relative;\n  display: inline-flex;\n}\n.tc-node-toolbar-button {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 30px;\n  height: 30px;\n  padding: 8px;\n  border-radius: 6px;\n  border: none;\n  background: transparent;\n  color: var(--tc-node-toolbar-icon);\n  cursor: pointer;\n  transition: background-color 0.12s ease, color 0.12s ease;\n}\n.tc-node-toolbar-button:hover,\n.tc-node-toolbar-button[aria-pressed=true] {\n  background: var(--tc-node-toolbar-hover);\n}\n.tc-node-toolbar-button:focus-visible {\n  outline: 2px solid var(--tc-node-toolbar-focus);\n  outline-offset: 1px;\n}\n.tc-node-toolbar-icon {\n  width: 16px;\n  height: 16px;\n  flex: 0 0 auto;\n}\n.tc-node-toolbar-tooltip {\n  position: absolute;\n  bottom: 100%;\n  left: 50%;\n  transform: translateX(-50%);\n  margin-bottom: 8px;\n  pointer-events: none;\n  z-index: 10;\n}\n.tc-node-toolbar-tooltip-label {\n  padding: 5px 8px;\n  border-radius: 6px;\n  background-color: #252525;\n  color: #fff;\n  font-size: 11px;\n  white-space: nowrap;\n  border: 1px solid rgba(255, 255, 255, 0.12);\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n  display: flex;\n  align-items: center;\n}\n.tc-node-toolbar-tooltip-arrow {\n  display: none;\n}\n.tc-node-size-badge {\n  --tc-node-size-bg: #262626;\n  --tc-node-size-color: #ffffff;\n  position: absolute;\n  left: 50%;\n  top: calc(100% + var(--tc-node-toolbar-offset, 5px));\n  transform: translateX(-50%) scale(var(--tc-node-toolbar-scale, 1));\n  transform-origin: top center;\n  padding: 2px 4px;\n  border-radius: 4px;\n  background-color: var(--tc-node-size-bg);\n  color: var(--tc-node-size-color);\n  font-size: 11px;\n  line-height: 14px;\n  font-weight: 400;\n  white-space: nowrap;\n  pointer-events: none;\n  z-index: 4;\n}\n.tc-inpaint-active .react-flow__node-toolbar,\n.tc-inpaint-active .tc-node-toolbar-portal,\n.tc-inpaint-active .react-flow__node .tc-node-toolbar {\n  display: none !important;\n  pointer-events: none !important;\n}\n.tc-inpaint-active .react-flow__renderer {\n  cursor: none !important;\n}\n.tc-inpaint-active .react-flow__node {\n  cursor: none !important;\n}\n.tc-canvas-control-button {\n  outline: none;\n}\n.tc-canvas-control-button:focus-visible {\n  outline: 2px solid rgba(59, 130, 246, 0.5);\n  outline-offset: 1px;\n  border-radius: 8px;\n}\n.tc-textarea-input {\n  outline: none;\n}\n.tc-textarea-input:focus-visible {\n  border-color: rgba(88, 87, 253, 0.7) !important;\n  box-shadow: 0 0 0 2px rgba(88, 87, 253, 0.2);\n}\n.tc-inpaint-textarea {\n  outline: none !important;\n  box-shadow: none !important;\n  border: none !important;\n}\n.tc-inpaint-textarea::placeholder {\n  color: rgba(255, 255, 255, 0.2);\n}\n.tc-node-textarea {\n  outline: none;\n}\n.tc-node-textarea:focus-visible {\n  box-shadow: inset 0 0 0 1.5px rgba(59, 130, 246, 0.35);\n  border-radius: 2px;\n}\n@keyframes wave {\n  0%, 100% {\n    transform: scaleY(1);\n  }\n  50% {\n    transform: scaleY(1.5);\n  }\n}\n@keyframes ping {\n  75%, 100% {\n    transform: scale(1.2);\n    opacity: 0;\n  }\n}\n.react-flow__selection {\n  background: rgba(119, 129, 255, 0.1) !important;\n  border: 1px solid #7781FF !important;\n  border-radius: 2px;\n}\n.react-flow__nodesselection-rect,\n.react-flow__nodesselection-rect:focus,\n.react-flow__nodesselection-rect:focus-visible {\n  background: rgba(119, 129, 255, 0.04) !important;\n  border: none !important;\n  outline: calc(1px / var(--tc-flow-zoom, 1)) solid #7781FF !important;\n  outline-offset: 0px;\n  border-radius: 0 !important;\n  cursor: grab;\n  overflow: visible !important;\n}\n.react-flow__nodesselection-rect:active {\n  cursor: grabbing;\n}\n.tc-nodes-dragging .react-flow__nodesselection-rect {\n  background: transparent !important;\n  outline-color: transparent !important;\n}\n.tc-nodes-dragging .tc-multiselect-handles {\n  opacity: 0 !important;\n  pointer-events: none !important;\n}\n@keyframes tc-roll-out {\n  0% {\n    transform: translateY(0);\n    opacity: 1;\n  }\n  100% {\n    transform: translateY(-100%);\n    opacity: 0;\n  }\n}\n@keyframes tc-roll-in {\n  0% {\n    transform: translateY(100%);\n    opacity: 0;\n  }\n  100% {\n    transform: translateY(0);\n    opacity: 1;\n  }\n}\n.tc-canvas-loading-overlay {\n  position: absolute;\n  inset: 0;\n  z-index: 50;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: #000;\n  opacity: 1;\n  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);\n  pointer-events: all;\n}\n.tc-canvas-loading-overlay--hidden {\n  opacity: 0;\n  pointer-events: none;\n}\n.tc-canvas-loading-spinner {\n  width: 24px;\n  height: 24px;\n  border-radius: 50%;\n  border: 2px solid rgba(255, 255, 255, 0.1);\n  border-top-color: rgba(255, 255, 255, 0.6);\n  animation: tc-loading-spin 0.7s linear infinite;\n}\n@keyframes tc-loading-spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n.tc-sidebar-b {\n  width: 64px;\n  background: #232326;\n  border-right: 1px solid rgba(255, 255, 255, 0.05);\n  font-family:\n    Inter,\n    -apple-system,\n    sans-serif;\n}\n@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n    scroll-behavior: auto !important;\n  }\n}\n");
function EditModeIcon({ size = 16, ...props }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M4.58594 4.58594C5.14848 4.02339 5.99097 3.84779 6.73145 4.13867L19.7314 9.24609C20.5224 9.55694 21.0311 10.3334 20.999 11.1826C20.9668 12.0321 20.4004 12.7686 19.5879 13.0186C19.5705 13.0239 19.5529 13.0288 19.5352 13.0332L14.3252 14.3252L13.0332 19.5352C13.0288 19.5529 13.0239 19.5705 13.0186 19.5879C12.7686 20.4004 12.0321 20.9668 11.1826 20.999C10.3334 21.0311 9.55694 20.5224 9.24609 19.7314L4.13867 6.73145C3.84779 5.99097 4.02339 5.14848 4.58594 4.58594ZM6.36523 5.06934C5.99509 4.92411 5.57414 5.01179 5.29297 5.29297L5.19629 5.4043C4.99309 5.67831 4.94226 6.04136 5.06934 6.36523L10.1768 19.3652C10.3128 19.7115 10.6271 19.95 10.9883 19.9932L11.1455 19.999C11.5701 19.9827 11.9375 19.7 12.0625 19.2939L13.5 13.5L19.2939 12.0625C19.6493 11.9532 19.9109 11.6583 19.9814 11.3018L19.999 11.1455C20.0131 10.7738 19.8204 10.4294 19.5068 10.2451L19.3652 10.1768L6.36523 5.06934Z",
          fill: "currentColor",
          fillOpacity: 0.9
        }
      )
    }
  );
}
function LockModeIcon({ size = 16, locked = false, ...props }) {
  return locked ? /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [
    /* @__PURE__ */ jsx("path", { d: "M12.6667 7.33334H3.33333C2.59695 7.33334 2 7.9303 2 8.66668V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V8.66668C14 7.9303 13.403 7.33334 12.6667 7.33334Z", stroke: "white", "stroke-width": "1.33333", "stroke-linecap": "round", "stroke-linejoin": "round" }),
    /* @__PURE__ */ jsx("path", { d: "M4.66666 7.33334V4.66668C4.66666 3.78262 5.01785 2.93478 5.64297 2.30965C6.26809 1.68453 7.11593 1.33334 7.99999 1.33334C8.88404 1.33334 9.73189 1.68453 10.357 2.30965C10.9821 2.93478 11.3333 3.78262 11.3333 4.66668V7.33334", stroke: "white", "stroke-width": "1.33333", "stroke-linecap": "round", "stroke-linejoin": "round" })
  ] }) : /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M12.6667 7.33337H3.33333C2.59695 7.33337 2 7.93033 2 8.66671V13.3334C2 14.0698 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0698 14 13.3334V8.66671C14 7.93033 13.403 7.33337 12.6667 7.33337Z",
            stroke: "currentColor",
            strokeWidth: "1.33333",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M4.66675 7.33331V4.66665C4.66592 3.84001 4.97227 3.04256 5.52633 2.42909C6.08039 1.81563 6.84264 1.42992 7.66509 1.34684C8.48754 1.26376 9.31151 1.48925 9.97707 1.97952C10.6426 2.4698 11.1023 3.18988 11.2667 3.99998",
            stroke: "currentColor",
            strokeWidth: "1.33333",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      ]
    }
  );
}
function PanModeIcon({ size = 16, ...props }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: /* @__PURE__ */ jsx(
        "path",
        {
          d: "M11.9999 3C12.8725 3.00004 13.6125 3.5596 13.8857 4.33887C14.2041 4.12488 14.5875 4 14.9999 4C16.1045 4.00005 16.9999 4.89546 16.9999 6V6.26953C17.2943 6.09908 17.6353 6 17.9999 6C19.1045 6.00005 19.9999 6.89546 19.9999 8V9.5H20.0097L20.0107 14.3623L20.0048 14.5059C20.0015 14.5532 19.9967 14.6001 19.9902 14.6465C19.7046 18.6792 16.3426 20.8622 12.2372 20.8623L11.8954 20.8574C11.6723 20.8508 11.4578 20.838 11.2519 20.8193L10.9491 20.7871C7.81329 20.4043 5.19887 17.9467 3.60734 15.2178C3.07769 14.3095 2.56683 13.3093 3.15812 12.5537L3.29191 12.4053C4.08499 11.6362 5.19058 11.9007 5.99699 12.6553L6.99992 13.6045V6C6.99992 4.89543 7.89535 4 8.99992 4C9.41209 4.00002 9.79494 4.12515 10.1132 4.33887C10.3863 3.55943 11.1272 3 11.9999 3ZM11.9999 4C11.4476 4 10.9999 4.44772 10.9999 5V11C10.9999 11.2761 10.776 11.5 10.4999 11.5C10.2238 11.5 9.99992 11.2761 9.99992 11V6C9.99992 5.44774 9.55217 5.00005 8.99992 5C8.44764 5 7.99992 5.44772 7.99992 6V13.6045C7.99985 14.0037 7.76205 14.3645 7.39543 14.5225C7.02869 14.6804 6.60262 14.6053 6.31242 14.3311L5.30949 13.3828V13.3818C5.02148 13.1136 4.72842 12.9805 4.5048 12.9502C4.31275 12.9243 4.15027 12.9659 3.9882 13.123C3.92302 13.1863 3.90808 13.2286 3.90129 13.2578C3.89186 13.2987 3.8857 13.3793 3.91691 13.5205C3.98621 13.8336 4.18313 14.2192 4.4716 14.7139C5.98479 17.3085 8.37314 19.4657 11.0702 19.7949C11.4239 19.8381 11.8124 19.8623 12.2372 19.8623C14.1217 19.8623 15.7633 19.3612 16.9433 18.4697C18.103 17.5933 18.8708 16.3035 18.9931 14.5762L18.9999 14.5059C19.0065 14.4598 19.0106 14.4122 19.0107 14.3633L19.0097 9.62012H18.9999V8C18.9999 7.44774 18.5522 7.00005 17.9999 7C17.4476 7 16.9999 7.44772 16.9999 8V11C16.9999 11.2761 16.776 11.5 16.4999 11.5C16.2238 11.5 15.9999 11.2761 15.9999 11V6C15.9999 5.44774 15.5522 5.00005 14.9999 5C14.4476 5 13.9999 5.44772 13.9999 6V11C13.9999 11.2761 13.776 11.5 13.4999 11.5C13.2238 11.5 12.9999 11.2761 12.9999 11V5C12.9999 4.44774 12.5522 4.00005 11.9999 4Z",
          fill: "currentColor",
          fillOpacity: 0.9
        }
      )
    }
  );
}
function TextModeIcon({ size = 16, ...props }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M8 2.66663V13.3333",
            stroke: "currentColor",
            strokeWidth: "1.33333",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M2.66675 4.66663V3.33329C2.66675 3.15648 2.73699 2.98691 2.86201 2.86189C2.98703 2.73686 3.1566 2.66663 3.33341 2.66663H12.6667C12.8436 2.66663 13.0131 2.73686 13.1382 2.86189C13.2632 2.98691 13.3334 3.15648 13.3334 3.33329V4.66663",
            stroke: "currentColor",
            strokeWidth: "1.33333",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M6 13.3334H10",
            stroke: "currentColor",
            strokeWidth: "1.33333",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      ]
    }
  );
}
function PlusIcon({ size = 16, ...props }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M8 3.33333V12.6667",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M3.33333 8H12.6667",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      ]
    }
  );
}
function LayersIcon({ size = 16, strokeWidth = 1.2, ...props }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M1.33333 8L8 11.3333L14.6667 8",
            stroke: "currentColor",
            strokeWidth,
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M1.33333 11.3333L8 14.6667L14.6667 11.3333",
            stroke: "currentColor",
            strokeWidth,
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M8 1.33333L1.33333 4.66667L8 8L14.6667 4.66667L8 1.33333Z",
            stroke: "currentColor",
            strokeWidth,
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      ]
    }
  );
}
function ExpandIcon({ size = 16, ...props }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M10.5 2.5H13.5V5.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M13.5 2.5L9.5 6.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M5.5 13.5H2.5V10.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M2.5 13.5L6.5 9.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M2.5 5.5V2.5H5.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M2.5 2.5L6.5 6.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M13.5 10.5V13.5H10.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M13.5 13.5L9.5 9.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      ]
    }
  );
}
function ToolbarDropdownMenu({ items, direction = "down", onClose }) {
  const [hoveredId, setHoveredId] = React20.useState(null);
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        position: "absolute",
        ...direction === "down" ? { top: "calc(100% + 8px)" } : { bottom: "calc(100% + 8px)" },
        left: 0,
        padding: 4,
        borderRadius: 8,
        background: "#1e1e1e",
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        zIndex: 10,
        minWidth: 168
      },
      children: items.map((item) => {
        const isHovered = hoveredId === item.id;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              item.onClick();
              onClose();
            },
            onMouseEnter: () => setHoveredId(item.id),
            onMouseLeave: () => setHoveredId(null),
            style: {
              width: "100%",
              padding: "6px 8px",
              border: "none",
              borderRadius: 6,
              background: isHovered ? "rgba(255,255,255,0.06)" : "transparent",
              color: "#fff",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: "20px",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background 80ms ease",
              boxSizing: "border-box"
            },
            children: [
              /* @__PURE__ */ jsx("span", { style: { flexShrink: 0, lineHeight: "20px" }, children: item.label }),
              item.detail && /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 400, flexShrink: 0, lineHeight: "20px" }, children: item.detail }),
              item.creditCost != null && isHovered && /* @__PURE__ */ jsxs("span", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, flexShrink: 0, lineHeight: "20px" }, children: [
                /* @__PURE__ */ jsx(Zap, { size: 12, style: { color: "#fff" } }),
                /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "#fff", fontWeight: 400, lineHeight: "20px" }, children: item.creditCost })
              ] })
            ]
          },
          item.id
        );
      })
    }
  );
}
function ShortcutBadge({ keys }) {
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }, children: keys.map((k, i) => {
    if (k === "+") {
      return /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.5)", fontSize: 10 }, children: "+" }, i);
    }
    return /* @__PURE__ */ jsx(
      "kbd",
      {
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 18,
          height: 20,
          padding: "0 4px",
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 4,
          fontSize: 10,
          fontFamily: "inherit",
          color: "rgba(255,255,255,0.9)",
          lineHeight: 1
        },
        children: k
      },
      i
    );
  }) });
}
function QuickActionToolbar({ isVisible, actions, offset = 28 }) {
  const nodeId = useNodeId();
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const position = useStore((state) => {
    if (!nodeId)
      return Position.Top;
    const node = state.nodeLookup?.get(nodeId);
    if (!node)
      return Position.Top;
    const [_, ty, tZoom] = state.transform;
    const nodeY = node.internals?.positionAbsolute?.y ?? node.position.y;
    const screenNodeY = nodeY * tZoom + ty;
    return screenNodeY < 120 ? Position.Bottom : Position.Top;
  });
  const [hoveredActionId, setHoveredActionId] = React20.useState(null);
  const [openDropdownId, setOpenDropdownId] = React20.useState(null);
  const dropdownRef = React20.useRef(null);
  React20.useEffect(() => {
    if (typeof document === "undefined")
      return;
    const root = document.documentElement;
    root.style.setProperty("--tc-node-toolbar-offset", `${offset}px`);
    root.style.setProperty("--tc-node-toolbar-scale", `${1 / zoom}`);
  }, [offset, zoom]);
  React20.useEffect(() => {
    if (!openDropdownId)
      return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [openDropdownId]);
  React20.useEffect(() => {
    if (!isVisible)
      setOpenDropdownId(null);
  }, [isVisible]);
  if (!actions.length) {
    return null;
  }
  const isBottom = position === Position.Bottom;
  const renderAction = (action) => {
    const Icon = action.icon;
    const hasDropdown = !!action.dropdownItems?.length;
    const isDropdownOpen = openDropdownId === action.id;
    const handleClick = () => {
      if (hasDropdown) {
        setOpenDropdownId(isDropdownOpen ? null : action.id);
      } else {
        action.onClick();
      }
    };
    return /* @__PURE__ */ jsxs(React20.Fragment, { children: [
      action.dividerBefore && /* @__PURE__ */ jsx("div", { style: { width: 1, height: 24, background: "rgba(255,255,255,0.1)", margin: "0 2px", flexShrink: 0 } }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: isDropdownOpen ? dropdownRef : void 0,
          onMouseEnter: () => setHoveredActionId(action.id),
          onMouseLeave: () => setHoveredActionId((current) => current === action.id ? null : current),
          className: "tc-node-toolbar-action",
          style: { position: "relative" },
          children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: handleClick,
                "aria-label": action.label,
                "aria-pressed": action.active || isDropdownOpen,
                "aria-expanded": isDropdownOpen,
                className: "tc-node-toolbar-button",
                style: action.iconOnly ? { width: 30, height: 30, padding: "8px" } : { width: "auto", padding: "8px", gap: 6 },
                children: [
                  /* @__PURE__ */ jsx(Icon, { className: "tc-node-toolbar-icon", size: 16 }),
                  !action.iconOnly && /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", lineHeight: "20px" }, children: action.label })
                ]
              }
            ),
            hoveredActionId === action.id && action.iconOnly && !isDropdownOpen && /* @__PURE__ */ jsx("div", { className: "tc-node-toolbar-tooltip", children: /* @__PURE__ */ jsxs("div", { className: "tc-node-toolbar-tooltip-label", children: [
              /* @__PURE__ */ jsx("span", { children: action.label }),
              action.shortcutKeys && /* @__PURE__ */ jsx(ShortcutBadge, { keys: action.shortcutKeys })
            ] }) }),
            isDropdownOpen && action.dropdownItems && /* @__PURE__ */ jsx(
              ToolbarDropdownMenu,
              {
                items: action.dropdownItems,
                direction: isBottom ? "down" : "down",
                onClose: () => setOpenDropdownId(null)
              }
            )
          ]
        }
      )
    ] }, action.id);
  };
  return /* @__PURE__ */ jsx(
    NodeToolbar,
    {
      isVisible,
      position,
      offset,
      align: "center",
      className: "tc-node-toolbar-portal",
      children: /* @__PURE__ */ jsx(
        "div",
        {
          className: "tc-node-toolbar",
          style: {
            color: "rgba(255, 255, 255, 0.95)",
            background: "#252525",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 8,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)"
          },
          onPointerDownCapture: (event) => event.stopPropagation(),
          onMouseDownCapture: (event) => event.stopPropagation(),
          children: actions.map(renderAction)
        }
      )
    }
  );
}
var typeIcons = {
  IMAGE: Image$1,
  VIDEO: Video,
  AUDIO: Music
};
function NodeLabelBar({ isVisible, nodeType, label, sizeLabel, nodeWidth, toolLabel }) {
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const Icon = typeIcons[nodeType.toUpperCase()] ?? Image$1;
  const renderedWidth = nodeWidth * zoom;
  const showSize = renderedWidth >= 150;
  return /* @__PURE__ */ jsx(
    NodeToolbar,
    {
      isVisible,
      position: Position.Top,
      offset: 4,
      align: "start",
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            width: renderedWidth,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: "nowrap",
            lineHeight: "16px",
            pointerEvents: "none",
            userSelect: "none"
          },
          children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 5, overflow: "hidden", color: "#7781FF" }, children: [
              /* @__PURE__ */ jsx(Icon, { size: 13, style: { flexShrink: 0 } }),
              /* @__PURE__ */ jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", maxWidth: showSize ? 120 : renderedWidth - 20 }, children: label }),
              toolLabel && /* @__PURE__ */ jsx(
                "span",
                {
                  style: {
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 500,
                    lineHeight: "16px",
                    padding: "0 5px",
                    borderRadius: 3,
                    background: "rgba(119,129,255,0.12)",
                    color: "rgba(119,129,255,0.7)"
                  },
                  children: toolLabel
                }
              )
            ] }),
            showSize && /* @__PURE__ */ jsx("div", { style: { flexShrink: 0, color: "#7781FF" }, children: sizeLabel })
          ]
        }
      )
    }
  );
}
function useToolbarVisibility(selected, dragging) {
  const multipleSelected = useStore((state) => {
    if (!selected)
      return false;
    let count = 0;
    for (const [, node] of state.nodeLookup) {
      if (node.selected) {
        count++;
        if (count > 1)
          return true;
      }
    }
    return false;
  });
  return Boolean(selected && !dragging && !multipleSelected);
}
function useLabelBarVisibility(selected) {
  const multipleSelected = useStore((state) => {
    if (!selected)
      return false;
    let count = 0;
    for (const [, node] of state.nodeLookup) {
      if (node.selected) {
        count++;
        if (count > 1)
          return true;
      }
    }
    return false;
  });
  return Boolean(selected && !multipleSelected);
}
function useNodeSelection(selected, containerRef) {
  const [localSelected, setLocalSelected] = React20.useState(false);
  const prevSelectedRef = React20.useRef(!!selected);
  React20.useEffect(() => {
    const prev = prevSelectedRef.current;
    const curr = !!selected;
    prevSelectedRef.current = curr;
    if (curr) {
      setLocalSelected(true);
    } else if (prev && !curr) {
      setLocalSelected(false);
    }
  }, [selected]);
  const handlePointerDown = React20.useCallback(() => {
    setLocalSelected(true);
  }, []);
  React20.useEffect(() => {
    if (!localSelected)
      return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setLocalSelected(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [localSelected, containerRef]);
  return {
    effectiveSelected: localSelected || !!selected,
    handlePointerDown
  };
}

// src/utils/env.ts
var isDev = () => {
  if (typeof globalThis === "undefined") {
    return false;
  }
  const env = globalThis.process?.env;
  if (!env) {
    return false;
  }
  return env.NODE_ENV !== "production";
};

// src/bridge.ts
var WidgetBridge = class {
  constructor() {
    this.handlers = /* @__PURE__ */ new Map();
    this.commandHandlers = /* @__PURE__ */ new Map();
  }
  emit(event) {
    const set = this.handlers.get(event.type);
    if (isDev() && event.type === "NODE_DELETE_REQUEST") {
      const count = set?.size ?? 0;
      if (count === 0) {
        console.warn("[WidgetBridge] NODE_DELETE_REQUEST has no listeners");
      } else {
        console.log("[WidgetBridge] NODE_DELETE_REQUEST listeners:", count);
      }
    }
    set?.forEach((handler) => handler(event));
  }
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, /* @__PURE__ */ new Set());
    }
    const set = this.handlers.get(type);
    set.add(handler);
    return () => {
      const current = this.handlers.get(type);
      if (!current) {
        return;
      }
      current.delete(handler);
      if (current.size === 0) {
        this.handlers.delete(type);
      }
    };
  }
  command(type, payload) {
    const set = this.commandHandlers.get(type);
    set?.forEach((handler) => handler(payload));
  }
  onCommand(type, handler) {
    if (!this.commandHandlers.has(type)) {
      this.commandHandlers.set(type, /* @__PURE__ */ new Set());
    }
    const set = this.commandHandlers.get(type);
    set.add(handler);
    return () => {
      const current = this.commandHandlers.get(type);
      if (!current) {
        return;
      }
      current.delete(handler);
      if (current.size === 0) {
        this.commandHandlers.delete(type);
      }
    };
  }
};
var widgetBridge = new WidgetBridge();
var createWidgetEvent = (type, payload, options) => ({
  type,
  payload,
  source: options?.source,
  requestId: options?.requestId,
  timestamp: options?.timestamp ?? Date.now()
});
function MediaSkeleton() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
          @keyframes media-skeleton-gradient-shift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          @keyframes media-skeleton-shimmer {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(120%); }
          }
          @keyframes media-skeleton-pulse {
            0% { opacity: 0.9; }
            50% { opacity: 0.7; }
            100% { opacity: 0.9; }
          }
        ` }),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          borderRadius: 2,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, rgb(37, 37, 37) 0%, rgb(30, 30, 30) 25%, rgb(24, 24, 24) 50%, rgb(30, 30, 30) 75%, rgb(37, 37, 37) 100%)",
          backgroundSize: "200% 200%",
          animation: "media-skeleton-gradient-shift 2s ease-in-out infinite, media-skeleton-pulse 1.5s ease-in-out infinite"
        },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255, 0.05) 50%, rgba(255,255,255,0) 100%)",
              animation: "media-skeleton-shimmer 1.5s linear infinite"
            }
          }
        )
      }
    )
  ] });
}
function NodeRatingBadge({ rating, max = 3, onChange }) {
  const [hovered, setHovered] = React20.useState(false);
  const normalized = Math.max(0, Math.min(max, Math.round(typeof rating === "number" ? rating : 0)));
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "nodrag nopan nowheel",
      onPointerDown: (event) => event.stopPropagation(),
      onMouseDown: (event) => event.stopPropagation(),
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      style: {
        position: "absolute",
        left: 6,
        top: 6,
        zIndex: 4,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: 0,
        borderRadius: 0,
        backgroundColor: "transparent",
        border: "none",
        color: "#fff",
        userSelect: "none"
      },
      "aria-label": `Rating ${normalized} of ${max}`,
      children: [
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 2 }, children: Array.from({ length: max }).map((_, index) => {
          const active = normalized >= index + 1;
          return /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                if (!onChange) {
                  return;
                }
                const next = index + 1 === normalized ? 0 : index + 1;
                onChange(next);
              },
              onPointerDown: (event) => event.stopPropagation(),
              onMouseDown: (event) => event.stopPropagation(),
              "aria-label": `Rate ${index + 1}`,
              style: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: onChange ? "pointer" : "default",
                color: "inherit"
              },
              children: /* @__PURE__ */ jsx(
                Star,
                {
                  size: 12,
                  color: active ? "#f59e0b" : "rgba(255, 255, 255, 0.45)",
                  fill: active ? "#f59e0b" : "none"
                }
              )
            },
            `star_${index}`
          );
        }) }),
        hovered && /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              left: 0,
              top: "100%",
              marginTop: 8,
              padding: "6px 10px",
              borderRadius: 6,
              backgroundColor: "#1f2937",
              color: "#fff",
              fontSize: 12,
              whiteSpace: "nowrap",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
              zIndex: 10
            },
            children: "Shortcut: 1 / 2 / 3 to rate, 0 to clear"
          }
        )
      ]
    }
  );
}
var CanvasRoleContext = React20.createContext("editor");
var CanvasRoleProvider = CanvasRoleContext.Provider;
var useCanvasRole = () => React20.useContext(CanvasRoleContext);
var defaultSelectMode = {
  isActive: false,
  mediaType: null
};
var SelectModeContext = React20.createContext(defaultSelectMode);
var SelectModeProvider = SelectModeContext.Provider;
var useSelectMode = () => React20.useContext(SelectModeContext);
function SelectionOverlay({ isVisible, onClick }) {
  if (!isVisible)
    return null;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("style", { children: `
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
        ` }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "widget-selection-overlay",
        onClick: (e) => {
          e.stopPropagation();
          onClick?.(e);
        },
        children: [
          /* @__PURE__ */ jsx("div", { className: "widget-selection-add-button", children: /* @__PURE__ */ jsxs(
            "svg",
            {
              className: "widget-selection-add-icon",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              children: [
                /* @__PURE__ */ jsx("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
                /* @__PURE__ */ jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
              ]
            }
          ) }),
          /* @__PURE__ */ jsx("span", { className: "widget-selection-text", children: "Click to add" })
        ]
      }
    )
  ] });
}
var AiCreateContext = React20.createContext({
  aiCreateMode: null,
  credits: 0,
  onSubmit: () => {
  },
  onVideoSubmit: () => {
  },
  onDismiss: () => {
  }
});
var AiCreateProvider = AiCreateContext.Provider;
var useAiCreate = () => React20.useContext(AiCreateContext);
var DEFAULT_PANEL_WIDTH = 600;
var GAP = 8;
function CanvasPanel({
  inline,
  width: widthProp,
  nodeScreenRect,
  tabs,
  activeTab,
  onTabChange,
  bottomBar,
  onDismiss,
  children
}) {
  const PANEL_WIDTH = widthProp ?? DEFAULT_PANEL_WIDTH;
  const panelRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const [mounted, setMounted] = useState(!!inline);
  useEffect(() => {
    if (!inline)
      requestAnimationFrame(() => setMounted(true));
  }, [inline]);
  useEffect(() => {
    if (inline || !onDismiss)
      return;
    const handler = (e) => {
      if (e.key === "Escape")
        onDismissRef.current?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inline, onDismiss]);
  const nodeRectRef = useRef(nodeScreenRect);
  nodeRectRef.current = nodeScreenRect;
  useEffect(() => {
    if (inline || !onDismiss)
      return;
    const handler = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target))
        return;
      const nr = nodeRectRef.current;
      if (nr && e.clientX >= nr.x && e.clientX <= nr.x + nr.w && e.clientY >= nr.y && e.clientY <= nr.y + nr.h)
        return;
      onDismissRef.current?.();
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [inline, onDismiss]);
  const hasTabs = tabs && tabs.length > 1;
  if (inline) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref: panelRef,
        onClick: (e) => e.stopPropagation(),
        onPointerDownCapture: (e) => e.stopPropagation(),
        onMouseDownCapture: (e) => e.stopPropagation(),
        style: {
          width: PANEL_WIDTH,
          borderRadius: 12,
          background: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, -apple-system, sans-serif"
        },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", padding: "8px 8px 0", flexShrink: 0, gap: 4 }, children: [
            hasTabs && tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => onTabChange?.(tab.id),
                  style: {
                    height: 24,
                    margin: 0,
                    padding: "0 8px",
                    borderRadius: 6,
                    border: "none",
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    whiteSpace: "nowrap"
                  },
                  onMouseEnter: (e) => {
                    if (!isActive)
                      e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  },
                  onMouseLeave: (e) => {
                    if (!isActive)
                      e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  },
                  children: tab.label
                },
                tab.id
              );
            }),
            /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
            onDismiss && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onDismiss,
                style: {
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 100ms, color 100ms"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                },
                children: /* @__PURE__ */ jsx(X, { size: 14 })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { style: { flex: 1, padding: "8px 8px 8px", display: "flex", flexDirection: "column", gap: 10 }, children }),
          bottomBar && /* @__PURE__ */ jsx("div", { style: { padding: "0 8px 12px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }, children: bottomBar })
        ]
      }
    );
  }
  const panelLeft = (nodeScreenRect?.x ?? 0) + (nodeScreenRect?.w ?? 0) / 2 - PANEL_WIDTH / 2;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const panelTop = (nodeScreenRect?.y ?? 0) + (nodeScreenRect?.h ?? 0) + GAP;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: panelRef,
      onClick: (e) => e.stopPropagation(),
      style: {
        position: "absolute",
        left: Math.max(72, Math.min(panelLeft, viewportW - PANEL_WIDTH - 8)),
        top: panelTop,
        width: PANEL_WIDTH,
        zIndex: 42,
        borderRadius: 12,
        background: "#1a1a1a",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, -apple-system, sans-serif",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity 160ms ease, transform 160ms ease"
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          alignItems: "center",
          padding: "8px 8px 0",
          flexShrink: 0,
          gap: 4
        }, children: [
          hasTabs && tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => onTabChange?.(tab.id),
                style: {
                  height: 24,
                  margin: 0,
                  padding: "0 8px",
                  borderRadius: 6,
                  border: "none",
                  background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 120ms ease",
                  whiteSpace: "nowrap"
                },
                onMouseEnter: (e) => {
                  if (!isActive)
                    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                },
                onMouseLeave: (e) => {
                  if (!isActive)
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                },
                children: tab.label
              },
              tab.id
            );
          }),
          /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
          onDismiss && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onDismiss,
              style: {
                width: 24,
                height: 24,
                borderRadius: 6,
                border: "none",
                background: "transparent",
                color: "rgba(255,255,255,0.35)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 100ms, color 100ms"
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.35)";
              },
              children: /* @__PURE__ */ jsx(X, { size: 14 })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { style: { flex: 1, padding: "8px 8px 8px", display: "flex", flexDirection: "column", gap: 10 }, children }),
        bottomBar && /* @__PURE__ */ jsx("div", { style: {
          padding: "0 8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0
        }, children: bottomBar })
      ]
    }
  );
}
function ParamDropdown({ label, icon, value, options, onChange, renderOption, width }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open)
      return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target))
        close();
    };
    const handleKey = (e) => {
      if (e.key === "Escape")
        close();
    };
    window.addEventListener("mousedown", handleClick, true);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      window.removeEventListener("mousedown", handleClick, true);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [open, close]);
  const activeOption = options.find((opt) => typeof opt === "string" ? opt === value : opt.value === value);
  const displayLabel = typeof activeOption === "object" && activeOption ? activeOption.label || activeOption.value : value;
  const displayIcon = typeof activeOption === "object" && activeOption ? activeOption.icon : null;
  return /* @__PURE__ */ jsxs("div", { ref, style: { position: "relative" }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen((p) => !p),
        style: {
          height: 32,
          padding: "0 8px",
          borderRadius: 6,
          border: "none",
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          color: "rgba(255,255,255,0.45)",
          fontSize: 12,
          lineHeight: "16px",
          fontWeight: 400,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          transition: "background 100ms ease",
          whiteSpace: "nowrap",
          minWidth: width
        },
        onMouseEnter: (e) => {
          if (!open)
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        },
        onMouseLeave: (e) => {
          if (!open)
            e.currentTarget.style.background = "transparent";
        },
        children: [
          displayIcon || icon,
          label && /* @__PURE__ */ jsx("span", { style: { flexShrink: 0 }, children: label }),
          /* @__PURE__ */ jsx("span", { style: { color: "#fff", fontSize: 12, lineHeight: "16px", fontWeight: 600 }, children: displayLabel })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          padding: 4,
          borderRadius: 10,
          background: "#1e1e1e",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          zIndex: 10,
          minWidth: 120
        },
        children: options.map((opt) => {
          const optValue = typeof opt === "string" ? opt : opt.value;
          const isSelected = optValue === value;
          const optLabel = typeof opt === "object" ? opt.label || opt.value : opt;
          const optIcon = typeof opt === "object" ? opt.icon : null;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => {
                onChange(optValue);
                close();
              },
              style: {
                width: "100%",
                padding: "7px 10px",
                border: "none",
                borderRadius: 6,
                background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
                color: isSelected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
                fontSize: 12,
                lineHeight: "16px",
                fontWeight: isSelected ? 500 : 400,
                cursor: "pointer",
                textAlign: "left",
                whiteSpace: "nowrap",
                transition: "background 80ms ease",
                display: "flex",
                alignItems: "center",
                gap: 8
              },
              onMouseEnter: (e) => {
                if (!isSelected)
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.background = isSelected ? "rgba(255,255,255,0.08)" : "transparent";
              },
              children: [
                optIcon,
                optLabel
              ]
            },
            optValue
          );
        })
      }
    )
  ] });
}
function UploadSlot({
  label,
  imageUrl,
  size = "small",
  onUpload,
  onSelectFromBoard,
  onClear
}) {
  const isSmall = size === "small";
  const isInline = size === "inline";
  const w = isInline ? 48 : isSmall ? 72 : "100%";
  const h = isInline ? 48 : isSmall ? 72 : 160;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);
  useEffect(() => {
    if (!popoverOpen)
      return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [popoverOpen]);
  if (imageUrl) {
    return /* @__PURE__ */ jsxs("div", { style: { position: "relative", width: w, height: h, flexShrink: 0, borderRadius: 8, overflow: "hidden" }, children: [
      /* @__PURE__ */ jsx("img", { src: imageUrl, alt: label || "", style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }),
      onClear && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: (e) => {
            e.stopPropagation();
            onClear();
          },
          style: {
            position: "absolute",
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            borderRadius: 10,
            background: "rgba(0,0,0,0.6)",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          },
          children: /* @__PURE__ */ jsx(X, { size: 12 })
        }
      )
    ] });
  }
  if (isSmall || isInline) {
    const hasOptions = !!onSelectFromBoard;
    return /* @__PURE__ */ jsxs("div", { ref: popoverRef, style: { position: "relative", flexShrink: 0 }, children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => {
            if (hasOptions) {
              setPopoverOpen((p) => !p);
            } else {
              onUpload();
            }
          },
          style: {
            width: w,
            height: h,
            flexShrink: 0,
            borderRadius: 8,
            border: "none",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: isInline ? 2 : 4,
            fontSize: isInline ? 9 : 10,
            fontWeight: 500,
            transition: "background 120ms ease"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          },
          children: [
            /* @__PURE__ */ jsx(Plus, { size: isInline ? 14 : 18, style: { opacity: 0.4 } }),
            label && /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.25)" }, children: label })
          ]
        }
      ),
      popoverOpen && hasOptions && /* @__PURE__ */ jsxs("div", { style: {
        position: "absolute",
        top: "100%",
        left: 0,
        marginTop: 4,
        padding: 4,
        borderRadius: 8,
        background: "#1c1e22",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        zIndex: 20,
        minWidth: 140
      }, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setPopoverOpen(false);
              onUpload();
            },
            style: {
              width: "100%",
              padding: "6px 10px",
              border: "none",
              borderRadius: 5,
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 400,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background 80ms ease"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "transparent";
            },
            children: [
              /* @__PURE__ */ jsx(Upload, { size: 13, style: { opacity: 0.5 } }),
              "Upload local"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              setPopoverOpen(false);
              onSelectFromBoard?.();
            },
            style: {
              width: "100%",
              padding: "6px 10px",
              border: "none",
              borderRadius: 5,
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 400,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "background 80ms ease"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "transparent";
            },
            children: [
              /* @__PURE__ */ jsx(LayoutGrid, { size: 13, style: { opacity: 0.5 } }),
              "Select from Board"
            ]
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: onUpload,
        style: {
          width: "100%",
          height: h,
          borderRadius: 10,
          border: "1.5px dashed rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.02)",
          color: "rgba(255,255,255,0.35)",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 500,
          transition: "background 120ms ease, border-color 120ms ease"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        },
        children: [
          /* @__PURE__ */ jsx(Plus, { size: 24, style: { opacity: 0.4 } }),
          /* @__PURE__ */ jsx("span", { children: label || "Upload Image" })
        ]
      }
    ),
    onSelectFromBoard && /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: onSelectFromBoard,
        style: {
          width: "100%",
          height: 36,
          borderRadius: 8,
          border: "none",
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.6)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
          transition: "background 120ms ease"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.10)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        },
        children: [
          /* @__PURE__ */ jsx(LayoutGrid, { size: 13 }),
          "Select from Board"
        ]
      }
    )
  ] });
}
var activeStyle = {
  background: "rgba(255,255,255,0.9)",
  color: "#000",
  cursor: "pointer"
};
var disabledStyle = {
  background: "rgba(255,255,255,0.06)",
  color: "rgba(255,255,255,0.25)",
  cursor: "default"
};
function GenerateButton({
  canSubmit,
  credits,
  onGenerate,
  showWatermarkOption = false
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!dropdownOpen)
      return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target))
        setDropdownOpen(false);
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [dropdownOpen]);
  if (!showWatermarkOption) {
    return /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => canSubmit && onGenerate(false),
        style: {
          height: 32,
          padding: "0 12px",
          borderRadius: 8,
          border: "none",
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "all 120ms ease",
          ...canSubmit ? activeStyle : disabledStyle
        },
        children: [
          /* @__PURE__ */ jsx(Crown, { size: 13, color: "currentColor" }),
          /* @__PURE__ */ jsx("span", { style: { lineHeight: "16px" }, children: credits }),
          /* @__PURE__ */ jsx("span", { style: { lineHeight: "16px" }, children: "Generate" })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs("div", { ref, style: { position: "relative", display: "flex", height: 32 }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => canSubmit && onGenerate(false),
        style: {
          height: 32,
          padding: "0 12px",
          borderRadius: "8px 0 0 8px",
          border: "none",
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
          transition: "all 120ms ease",
          ...canSubmit ? activeStyle : disabledStyle
        },
        children: [
          /* @__PURE__ */ jsx(Crown, { size: 13, color: "currentColor" }),
          /* @__PURE__ */ jsx("span", { style: { lineHeight: "16px" }, children: credits }),
          /* @__PURE__ */ jsx("span", { style: { lineHeight: "16px" }, children: "Generate" })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { style: {
      width: 1,
      background: canSubmit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
      flexShrink: 0
    } }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => canSubmit && setDropdownOpen((p) => !p),
        style: {
          width: 24,
          height: 32,
          borderRadius: "0 8px 8px 0",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 120ms ease",
          ...canSubmit ? activeStyle : disabledStyle,
          boxShadow: "none"
        },
        children: /* @__PURE__ */ jsx(ChevronDown, { size: 13 })
      }
    ),
    dropdownOpen && /* @__PURE__ */ jsx("div", { style: {
      position: "absolute",
      bottom: "100%",
      right: 0,
      marginBottom: 6,
      padding: "4px",
      borderRadius: 10,
      background: "#1e1e1e",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      zIndex: 10,
      minWidth: 200
    }, children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => {
          onGenerate(true);
          setDropdownOpen(false);
        },
        style: {
          width: "100%",
          padding: "8px 12px",
          border: "none",
          borderRadius: 6,
          background: "transparent",
          color: "rgba(255,255,255,0.7)",
          fontSize: 13,
          fontWeight: 400,
          cursor: "pointer",
          textAlign: "left",
          transition: "background 80ms ease"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "transparent";
        },
        children: "Generate with watermark"
      }
    ) })
  ] });
}
function getRatioIcon(ratio) {
  const parts = ratio.split(":");
  let w = 12;
  let h = 12;
  if (parts.length === 2) {
    const rw = parseFloat(parts[0]);
    const rh = parseFloat(parts[1]);
    if (!isNaN(rw) && !isNaN(rh) && rw > 0 && rh > 0) {
      if (rw >= rh) {
        w = 14;
        h = 14 * rh / rw;
      } else {
        h = 14;
        w = 14 * rw / rh;
      }
    }
  }
  return /* @__PURE__ */ jsx("svg", { width: "14", height: "14", viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: { opacity: 0.6, flexShrink: 0 }, children: /* @__PURE__ */ jsx("rect", { x: 8 - w / 2, y: 8 - h / 2, width: w, height: h, rx: "1.5", stroke: "currentColor", strokeWidth: "1.2" }) });
}
var MODELS = [
  "Nano Banana 2",
  "Seedream 5.0",
  "GPT Image 1.5",
  "Kontext-Pro",
  "Imagen 4"
];
var RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
var RESOLUTIONS = ["512p", "1K", "2K", "4K"];
var DEFAULT_STATE = {
  prompt: "",
  model: "Nano Banana 2",
  ratio: "1:1",
  resolution: "1K",
  referenceImageUrl: ""
};
function TextToImagePanel({
  inline,
  width,
  nodeScreenRect,
  initialTab = "text-to-image",
  initialState,
  credits = 25,
  onSubmit,
  onDismiss,
  onUploadReference,
  onSelectFromBoard
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [state, setState] = useState(() => ({
    ...DEFAULT_STATE,
    ...initialState
  }));
  const update = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);
  const canSubmit = state.prompt.trim().length > 0;
  const handleSubmit = useCallback((withWatermark) => {
    if (!canSubmit)
      return;
    onSubmit(activeTab, state, withWatermark);
  }, [activeTab, canSubmit, onSubmit, state]);
  const isImageEdit = activeTab === "image-edit";
  return /* @__PURE__ */ jsx(
    CanvasPanel,
    {
      inline,
      width,
      nodeScreenRect,
      tabs: [
        { id: "text-to-image", label: "Text to Image" },
        { id: "image-edit", label: "Image Edit" }
      ],
      activeTab,
      onTabChange: (id) => setActiveTab(id),
      onDismiss,
      bottomBar: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          ParamDropdown,
          {
            value: state.model,
            options: MODELS.map((m) => ({ value: m, icon: /* @__PURE__ */ jsx(Sparkles, { size: 14, style: { opacity: 0.6 } }) })),
            onChange: (v) => update("model", v),
            width: 102
          }
        ),
        /* @__PURE__ */ jsx(
          ParamDropdown,
          {
            value: state.ratio,
            options: RATIOS.map((r) => ({ value: r, icon: getRatioIcon(r) })),
            onChange: (v) => update("ratio", v)
          }
        ),
        /* @__PURE__ */ jsx(
          ParamDropdown,
          {
            value: state.resolution,
            options: RESOLUTIONS.map((r) => ({ value: r, icon: /* @__PURE__ */ jsx(Monitor, { size: 14, style: { opacity: 0.6 } }) })),
            onChange: (v) => update("resolution", v)
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
        /* @__PURE__ */ jsx(
          GenerateButton,
          {
            canSubmit,
            credits,
            onGenerate: handleSubmit,
            showWatermarkOption: true
          }
        )
      ] }),
      children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12, width: "100%" }, children: [
        isImageEdit && /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 12 }, children: /* @__PURE__ */ jsx(
          UploadSlot,
          {
            label: "Ref",
            imageUrl: state.referenceImageUrl || void 0,
            size: "inline",
            onUpload: () => onUploadReference?.(),
            onSelectFromBoard: !state.referenceImageUrl ? onSelectFromBoard : void 0,
            onClear: () => update("referenceImageUrl", "")
          }
        ) }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            placeholder: isImageEdit ? "Describe how you want to edit the image..." : "Describe the motion you want... Use quotes for speech/singing.",
            value: state.prompt,
            onChange: (e) => update("prompt", e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                e.preventDefault();
                handleSubmit(false);
              }
            },
            autoFocus: true,
            rows: 3,
            className: "placeholder:text-white/40",
            style: {
              flex: 1,
              height: 72,
              padding: "8px 8px 8px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 8,
              boxSizing: "border-box",
              background: "transparent",
              color: "#fff",
              fontSize: 12,
              lineHeight: "18px",
              resize: "none",
              fontFamily: "inherit",
              outline: "none"
            }
          }
        )
      ] })
    }
  );
}
var RESOURCE_HOST = "https://d1735p3aqhycef.cloudfront.net";
var BADGE_COLORS = {
  HOT: "#f97316",
  NEW: "#6366f1",
  BETA: "#6b7280"
};
function getLogoUrl(s3Path) {
  if (s3Path.startsWith("http") || s3Path.startsWith("/"))
    return s3Path;
  return `${RESOURCE_HOST}/${s3Path}`;
}
function ProviderLogo({ s3Path, size = 24 }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return /* @__PURE__ */ jsx("div", { style: {
      width: size,
      height: size,
      borderRadius: size / 4,
      background: "rgba(255,255,255,0.08)",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }, children: /* @__PURE__ */ jsx(Sparkles, { size: size * 0.55, style: { opacity: 0.4 } }) });
  }
  return /* @__PURE__ */ jsx(
    "img",
    {
      src: getLogoUrl(s3Path),
      style: { width: size, height: size, borderRadius: size / 4, objectFit: "cover", flexShrink: 0 },
      onError: () => setErrored(true)
    }
  );
}
function VideoModelSelector({ providers, selectedModelId, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeProviderId, setActiveProviderId] = useState(null);
  const ref = useRef(null);
  const selectedProvider = providers.find((p) => p.models.some((m) => m.id === selectedModelId));
  const selectedModel = selectedProvider?.models.find((m) => m.id === selectedModelId);
  const displayName = selectedModel?.name ?? selectedModelId;
  const handleOpen = () => {
    setActiveProviderId(selectedProvider?.providerId ?? providers[0]?.providerId ?? null);
    setOpen(true);
  };
  useEffect(() => {
    if (!open)
      return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setActiveProviderId(null);
      }
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [open]);
  const activeProvider = providers.find((p) => p.providerId === activeProviderId);
  return /* @__PURE__ */ jsxs("div", { ref, style: { position: "relative" }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => open ? setOpen(false) : handleOpen(),
        style: {
          height: 32,
          padding: "0 8px",
          borderRadius: 6,
          border: "none",
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          color: "rgba(255,255,255,0.45)",
          fontSize: 12,
          lineHeight: "16px",
          fontWeight: 400,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          transition: "background 100ms ease",
          whiteSpace: "nowrap",
          maxWidth: 160
        },
        onMouseEnter: (e) => {
          if (!open)
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        },
        onMouseLeave: (e) => {
          if (!open)
            e.currentTarget.style.background = "transparent";
        },
        children: [
          selectedProvider ? /* @__PURE__ */ jsx(ProviderLogo, { s3Path: selectedProvider.logoS3Path, size: 16 }) : /* @__PURE__ */ jsx(Sparkles, { size: 14, style: { opacity: 0.6, flexShrink: 0 } }),
          /* @__PURE__ */ jsx("span", { style: { color: "#fff", fontSize: 12, lineHeight: "16px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }, children: displayName })
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      left: 0,
      display: "flex",
      borderRadius: 12,
      background: "#1e1e1e",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
      zIndex: 30,
      overflow: "hidden",
      height: 360
      // Fixed height for consistency
    }, children: [
      /* @__PURE__ */ jsx("div", { style: {
        width: 200,
        padding: "6px 4px",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        overflowY: "auto",
        height: "100%"
      }, children: providers.map((provider) => {
        const isActive = provider.providerId === activeProviderId;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onMouseEnter: () => setActiveProviderId(provider.providerId),
            onClick: () => setActiveProviderId(provider.providerId),
            style: {
              width: "100%",
              padding: "7px 8px",
              border: "none",
              borderRadius: 8,
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "background 80ms ease"
            },
            onMouseLeave: (e) => {
              if (!isActive)
                e.currentTarget.style.background = "transparent";
            },
            children: [
              /* @__PURE__ */ jsx(ProviderLogo, { s3Path: provider.logoS3Path, size: 28 }),
              /* @__PURE__ */ jsx("span", { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: provider.providerName }),
              /* @__PURE__ */ jsx(ChevronRight, { size: 14, style: { opacity: 0.35, flexShrink: 0 } })
            ]
          },
          provider.providerId
        );
      }) }),
      activeProvider && /* @__PURE__ */ jsx("div", { style: {
        width: 280,
        padding: "6px 4px",
        overflowY: "auto",
        height: "100%"
      }, children: activeProvider.models.map((model) => {
        const isSelected = model.id === selectedModelId;
        return /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
              onChange(model.id);
              setOpen(false);
              setActiveProviderId(null);
            },
            style: {
              width: "100%",
              padding: "8px",
              border: "none",
              borderRadius: 8,
              background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
              color: isSelected ? "#fff" : "rgba(255,255,255,0.75)",
              fontSize: 12,
              fontWeight: isSelected ? 500 : 400,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              transition: "background 80ms ease"
            },
            onMouseEnter: (e) => {
              if (!isSelected)
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = isSelected ? "rgba(255,255,255,0.08)" : "transparent";
            },
            children: [
              /* @__PURE__ */ jsx(ProviderLogo, { s3Path: activeProvider.logoS3Path, size: 32 }),
              /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }, children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, width: "100%" }, children: [
                  /* @__PURE__ */ jsx("span", { style: { flexShrink: 0, fontWeight: 600 }, children: model.name }),
                  model.badges.map((badge) => /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        padding: "1px 4px",
                        borderRadius: 3,
                        fontSize: 9,
                        fontWeight: 700,
                        lineHeight: "14px",
                        color: "#fff",
                        background: BADGE_COLORS[badge] ?? "#6b7280",
                        flexShrink: 0,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em"
                      },
                      children: badge
                    },
                    badge
                  )),
                  isSelected && /* @__PURE__ */ jsx(Check, { size: 13, style: { marginLeft: "auto", color: "#fff", flexShrink: 0 } })
                ] }),
                model.tags.length > 0 && /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: model.tags.map((tag) => /* @__PURE__ */ jsx(
                  "span",
                  {
                    style: {
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      lineHeight: "16px",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.45)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      flexShrink: 0
                    },
                    children: tag
                  },
                  tag
                )) })
              ] })
            ]
          },
          model.id
        );
      }) })
    ] })
  ] });
}

// src/panels/data/videoModels.json
var videoModels_default = {
  imageToVideo: [
    {
      providerId: "seedance",
      providerName: "Seedance",
      logoS3Path: "/model-logo/seedance.png",
      models: [
        {
          id: "seedance-1.5-pro",
          name: "Seedance 1.5 pro",
          badges: [
            "HOT",
            "NEW"
          ],
          tags: [
            "Audio Support",
            "End Frame"
          ]
        },
        {
          id: "seedance-1.0-pro-fast",
          name: "Seedance 1.0 Pro Fast",
          badges: [],
          tags: []
        },
        {
          id: "seedance-1.0-pro",
          name: "Seedance 1.0 Pro",
          badges: [],
          tags: [
            "End Frame"
          ]
        }
      ]
    },
    {
      providerId: "kling",
      providerName: "Kling 2.6/O1",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/kling.png",
      models: [
        {
          id: "kling-v2-6-pro",
          name: "Kling 2.6",
          badges: [
            "HOT",
            "NEW"
          ],
          tags: [
            "Audio Support"
          ]
        },
        {
          id: "kling-video-o1-pro",
          name: "Kling O1 Reference-to-Video",
          badges: [
            "NEW"
          ],
          tags: [
            "Reference to Video"
          ]
        },
        {
          id: "kling-2.5-turbo-pro",
          name: "Kling 2.5 Turbo Pro",
          badges: [],
          tags: [
            "End Frame"
          ]
        },
        {
          id: "kling-2.5-turbo-std",
          name: "Kling 2.5 Turbo Std",
          badges: [],
          tags: []
        }
      ]
    },
    {
      providerId: "sora2",
      providerName: "Sora 2",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/sora.png",
      models: [
        {
          id: "gpt-sora2",
          name: "Sora 2",
          badges: [
            "HOT"
          ],
          tags: [
            "Audio Support"
          ]
        },
        {
          id: "gpt-sora2-pro",
          name: "Sora 2 Pro",
          badges: [],
          tags: [
            "Audio Support"
          ]
        }
      ]
    },
    {
      providerId: "gemini",
      providerName: "Gemini",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/gemini-color.png",
      models: [
        {
          id: "gemini-veo-3.1",
          name: "Veo 3.1",
          badges: [],
          tags: [
            "Audio Support",
            "End Frame"
          ]
        },
        {
          id: "gemini-veo-3.1-ref",
          name: "Veo 3.1 Reference to video",
          badges: [],
          tags: [
            "Reference to Video",
            "Audio Support"
          ]
        },
        {
          id: "gemini-veo-3.1-fast",
          name: "Veo 3.1 Fast",
          badges: [],
          tags: [
            "Audio Support",
            "End Frame"
          ]
        },
        {
          id: "gemini-veo-3.1-fast-ref",
          name: "Veo 3.1 Fast Reference to video",
          badges: [],
          tags: [
            "Reference to Video",
            "Audio Support"
          ]
        }
      ]
    },
    {
      providerId: "minimax",
      providerName: "Minimax",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/minimax-color.png",
      models: [
        {
          id: "minimax-hailuo-02",
          name: "MiniMax-Hailuo-02",
          badges: [],
          tags: [
            "End Frame"
          ]
        },
        {
          id: "minimax-hailuo-2.3",
          name: "MiniMax-Hailuo-2.3",
          badges: [],
          tags: []
        }
      ]
    },
    {
      providerId: "vidu",
      providerName: "Vidu Q2 Reference to Video",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/vidu.png",
      models: [
        {
          id: "vidu-q2-ref",
          name: "Vidu Q2 Reference to Video",
          badges: [],
          tags: [
            "Reference to Video"
          ]
        }
      ]
    },
    {
      providerId: "qwen",
      providerName: "Wan 2.6",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/qwen.png",
      models: [
        {
          id: "qwen-wan2.6-i2v",
          name: "Wan 2.6",
          badges: [],
          tags: [
            "Audio Support"
          ]
        }
      ]
    },
    {
      providerId: "topview",
      providerName: "Topview",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/topview.png",
      models: [
        {
          id: "topview-lite",
          name: "Lite",
          badges: [],
          tags: []
        },
        {
          id: "topview-pro",
          name: "Pro",
          badges: [],
          tags: []
        },
        {
          id: "topview-plus",
          name: "Plus",
          badges: [],
          tags: []
        },
        {
          id: "topview-best",
          name: "Best",
          badges: [],
          tags: []
        }
      ]
    }
  ],
  textToVideo: [
    {
      providerId: "seedance",
      providerName: "Seedance",
      logoS3Path: "/model-logo/seedance.png",
      models: [
        {
          id: "seedance-1.5-pro",
          name: "Seedance 1.5 pro",
          badges: [
            "HOT",
            "NEW"
          ],
          tags: [
            "Audio Support"
          ]
        },
        {
          id: "seedance-1.0-pro-fast",
          name: "Seedance 1.0 Pro Fast",
          badges: [],
          tags: []
        },
        {
          id: "seedance-1.0-pro",
          name: "Seedance 1.0 Pro",
          badges: [],
          tags: []
        }
      ]
    },
    {
      providerId: "kling",
      providerName: "Kling",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/kling.png",
      models: [
        {
          id: "kling-v2-6-pro",
          name: "Kling 2.6",
          badges: [
            "HOT",
            "NEW"
          ],
          tags: [
            "Audio Support"
          ]
        },
        {
          id: "kling-2.5-turbo-pro",
          name: "Kling 2.5 Turbo Pro",
          badges: [],
          tags: []
        },
        {
          id: "kling-2.5-turbo-std",
          name: "Kling 2.5 Turbo Std",
          badges: [],
          tags: []
        }
      ]
    },
    {
      providerId: "sora2",
      providerName: "Sora 2",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/sora.png",
      models: [
        {
          id: "gpt-sora2",
          name: "Sora 2",
          badges: [
            "HOT"
          ],
          tags: [
            "Audio Support"
          ]
        },
        {
          id: "gpt-sora2-pro",
          name: "Sora 2 Pro",
          badges: [],
          tags: [
            "Audio Support"
          ]
        }
      ]
    },
    {
      providerId: "gemini",
      providerName: "Gemini",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/gemini-color.png",
      models: [
        {
          id: "gemini-veo-3.1",
          name: "Veo 3.1",
          badges: [],
          tags: [
            "Audio Support"
          ]
        },
        {
          id: "gemini-veo-3.1-fast",
          name: "Veo 3.1 Fast",
          badges: [],
          tags: [
            "Audio Support"
          ]
        }
      ]
    },
    {
      providerId: "minimax",
      providerName: "Minimax",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/minimax-color.png",
      models: [
        {
          id: "minimax-hailuo-02",
          name: "MiniMax-Hailuo-02",
          badges: [],
          tags: []
        },
        {
          id: "minimax-hailuo-2.3",
          name: "MiniMax-Hailuo-2.3",
          badges: [],
          tags: []
        }
      ]
    },
    {
      providerId: "vidu",
      providerName: "Vidu Q2",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/vidu.png",
      models: [
        {
          id: "vidu-q2-text",
          name: "Vidu Q2",
          badges: [],
          tags: []
        }
      ]
    },
    {
      providerId: "qwen",
      providerName: "Wan 2.6",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/qwen.png",
      models: [
        {
          id: "qwen-wan2.6-t2v",
          name: "Wan 2.6",
          badges: [],
          tags: [
            "Audio Support"
          ]
        }
      ]
    },
    {
      providerId: "topview",
      providerName: "Topview",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/topview.png",
      models: [
        {
          id: "topview-lite",
          name: "Lite",
          badges: [],
          tags: []
        },
        {
          id: "topview-pro",
          name: "Pro",
          badges: [],
          tags: []
        },
        {
          id: "topview-plus",
          name: "Plus",
          badges: [],
          tags: []
        },
        {
          id: "topview-best",
          name: "Best",
          badges: [],
          tags: []
        }
      ]
    }
  ],
  videoEdit: [
    {
      providerId: "kling",
      providerName: "Kling O1 Video-Edit",
      logoS3Path: "aigc-web/public/ai-creation/ai-video/model-logo/kling.png",
      models: [
        {
          id: "kling-video-o1-pro",
          name: "Kling O1 Video-Edit",
          badges: [
            "NEW"
          ],
          tags: []
        }
      ]
    }
  ]
};
var RATIOS2 = ["16:9", "9:16", "1:1", "4:3", "3:4"];
var RESOLUTIONS2 = ["720p", "1080p"];
var DURATIONS = ["4s", "5s", "6s", "8s"];
var MODEL_DATA = {
  "image-to-video": videoModels_default.imageToVideo,
  "text-to-video": videoModels_default.textToVideo,
  "video-edit": videoModels_default.videoEdit
};
var DEFAULT_STATE2 = {
  prompt: "",
  aspectRatio: "16:9",
  resolution: "720p",
  duration: "5s",
  firstFrameUrl: "",
  endFrameUrl: "",
  sourceVideoUrl: "",
  nativeAudio: true,
  internetSearch: false,
  model: "seedance-1.5-pro"
};
function Toggle({ value, onChange }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: () => onChange(!value),
      style: {
        position: "relative",
        width: 36,
        height: 20,
        borderRadius: 10,
        border: "none",
        background: value ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.15)",
        cursor: "pointer",
        transition: "background 150ms ease",
        flexShrink: 0,
        padding: 0
      },
      children: /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        top: 2,
        left: value ? 18 : 2,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: value ? "#1a1a1a" : "#fff",
        transition: "left 150ms ease, background 150ms ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
      } })
    }
  );
}
function MorePopover({
  nativeAudio,
  internetSearch,
  showNativeAudio,
  showInternetSearch,
  onNativeAudioChange,
  onInternetSearchChange
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open)
      return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target))
        setOpen(false);
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [open]);
  return /* @__PURE__ */ jsxs("div", { ref, style: { position: "relative" }, children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setOpen((p) => !p),
        style: {
          height: 32,
          width: 32,
          borderRadius: 6,
          border: "none",
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          color: "rgba(255,255,255,0.45)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 100ms ease",
          flexShrink: 0
        },
        onMouseEnter: (e) => {
          if (!open)
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        },
        onMouseLeave: (e) => {
          if (!open)
            e.currentTarget.style.background = "transparent";
        },
        children: /* @__PURE__ */ jsx(MoreHorizontal, { size: 16 })
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      left: 0,
      padding: "8px 0",
      borderRadius: 10,
      background: "#1e1e1e",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      zIndex: 30,
      minWidth: 200
    }, children: [
      showNativeAudio && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", gap: 12 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 400 }, children: "Native Audio" }),
        /* @__PURE__ */ jsx(Toggle, { value: nativeAudio, onChange: onNativeAudioChange })
      ] }),
      showInternetSearch && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", gap: 12 }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 400 }, children: "Internet Search" }),
        /* @__PURE__ */ jsx(Toggle, { value: internetSearch, onChange: onInternetSearchChange })
      ] })
    ] })
  ] });
}
var PROMPT_PLACEHOLDERS = {
  "image-to-video": "Describe motion between start and end frames...",
  "text-to-video": "Describe the motion you want... Use quotes for speech/singing.",
  "video-edit": "Upload 1-5 reference images or videos and use @mentions to describe interactions. Example: Use @Image1 as the first frame, @Image2 as the last frame, and make them dance like @Video1."
};
function AIVideoPanel({
  inline,
  width,
  initialTab = "image-to-video",
  initialState,
  credits = 2,
  onSubmit,
  onDismiss,
  onUploadFirstFrame,
  onUploadEndFrame,
  onUploadMedia,
  onSelectFromBoard
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [state, setState] = useState(() => ({
    ...DEFAULT_STATE2,
    ...initialState
  }));
  const update = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);
  const canSubmit = (() => {
    switch (activeTab) {
      case "image-to-video":
        return !!state.firstFrameUrl && state.prompt.trim().length > 0;
      case "text-to-video":
        return state.prompt.trim().length > 0;
      case "video-edit":
        return state.prompt.trim().length > 0;
    }
  })();
  const handleSubmit = useCallback(() => {
    if (!canSubmit)
      return;
    onSubmit(activeTab, state);
  }, [activeTab, canSubmit, onSubmit, state]);
  const isI2V = activeTab === "image-to-video";
  const isT2V = activeTab === "text-to-video";
  const isOR = activeTab === "video-edit";
  const providers = MODEL_DATA[activeTab] ?? [];
  return /* @__PURE__ */ jsx(
    CanvasPanel,
    {
      inline,
      width,
      tabs: [
        { id: "image-to-video", label: "Image to Video" },
        { id: "text-to-video", label: "Text to Video" },
        { id: "video-edit", label: "Omni Reference" }
      ],
      activeTab,
      onTabChange: (id) => setActiveTab(id),
      onDismiss,
      bottomBar: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          VideoModelSelector,
          {
            providers,
            selectedModelId: state.model,
            onChange: (v) => update("model", v)
          }
        ),
        /* @__PURE__ */ jsx(
          ParamDropdown,
          {
            value: state.aspectRatio,
            options: RATIOS2.map((r) => ({ value: r, icon: getRatioIcon(r) })),
            onChange: (v) => update("aspectRatio", v)
          }
        ),
        /* @__PURE__ */ jsx(
          ParamDropdown,
          {
            value: state.resolution,
            options: RESOLUTIONS2.map((r) => ({ value: r })),
            onChange: (v) => update("resolution", v)
          }
        ),
        /* @__PURE__ */ jsx(
          ParamDropdown,
          {
            value: state.duration,
            options: DURATIONS.map((d) => ({ value: d })),
            onChange: (v) => update("duration", v)
          }
        ),
        /* @__PURE__ */ jsx(
          MorePopover,
          {
            nativeAudio: state.nativeAudio,
            internetSearch: state.internetSearch,
            showNativeAudio: isI2V || isT2V,
            showInternetSearch: true,
            onNativeAudioChange: (v) => update("nativeAudio", v),
            onInternetSearchChange: (v) => update("internetSearch", v)
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
        /* @__PURE__ */ jsx(
          GenerateButton,
          {
            canSubmit,
            credits,
            onGenerate: () => handleSubmit()
          }
        )
      ] }),
      children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 12, width: "100%" }, children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 0,
            borderRadius: 8,
            background: "rgba(37, 37, 37, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0px 8px 32px 0px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(12px)",
            overflow: "hidden"
          },
          children: [
            isI2V && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: 12 }, children: [
              /* @__PURE__ */ jsx(
                UploadSlot,
                {
                  label: "First",
                  imageUrl: state.firstFrameUrl || void 0,
                  size: "inline",
                  onUpload: () => onUploadFirstFrame?.(),
                  onSelectFromBoard: !state.firstFrameUrl ? onSelectFromBoard : void 0,
                  onClear: () => update("firstFrameUrl", "")
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const a = state.firstFrameUrl;
                    const b = state.endFrameUrl;
                    update("firstFrameUrl", b);
                    update("endFrameUrl", a);
                  },
                  style: {
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: "none",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                  },
                  children: /* @__PURE__ */ jsx(ArrowLeftRight, { size: 14 })
                }
              ),
              /* @__PURE__ */ jsx(
                UploadSlot,
                {
                  label: "End frame",
                  imageUrl: state.endFrameUrl || void 0,
                  size: "inline",
                  onUpload: () => onUploadEndFrame?.(),
                  onSelectFromBoard: !state.endFrameUrl ? onSelectFromBoard : void 0,
                  onClear: () => update("endFrameUrl", "")
                }
              )
            ] }),
            isOR && /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 12, padding: 12 }, children: /* @__PURE__ */ jsx(
              UploadSlot,
              {
                imageUrl: state.sourceVideoUrl || void 0,
                size: "inline",
                onUpload: () => onUploadMedia?.(),
                onSelectFromBoard: !state.sourceVideoUrl ? onSelectFromBoard : void 0,
                onClear: () => update("sourceVideoUrl", "")
              }
            ) }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                placeholder: PROMPT_PLACEHOLDERS[activeTab],
                value: state.prompt,
                onChange: (e) => update("prompt", e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                    e.preventDefault();
                    handleSubmit();
                  }
                },
                autoFocus: true,
                className: "placeholder:text-white/40",
                style: {
                  flex: 1,
                  minHeight: isOR ? 100 : 80,
                  padding: 12,
                  margin: 0,
                  border: "none",
                  borderRadius: 0,
                  boxSizing: "border-box",
                  background: "transparent",
                  color: "#fff",
                  fontSize: 12,
                  lineHeight: "18px",
                  resize: "none",
                  fontFamily: "inherit",
                  outline: "none"
                }
              }
            )
          ]
        }
      ) })
    }
  );
}
function ImageNode({ data, selected, dragging }) {
  const role = useCanvasRole();
  const canEdit = role !== "viewer";
  const canDeleteFailed = canEdit;
  const selectMode = useSelectMode();
  const nodeMediaType = NodeType.IMAGE.toLowerCase();
  const isSelectable = selectMode.isActive && selectMode.mediaType === nodeMediaType;
  const nodeData = data;
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const selectedCount = useStore((state) => state.nodes.filter((n) => n.selected).length);
  const rawItem = nodeData.raw;
  const rawResult = rawItem?.result ?? void 0;
  const status = String(rawItem?.status ?? "").toLowerCase();
  const actualWidth = rawResult?.originImage?.width ?? rawResult?.compressedImage?.width ?? rawResult?.width;
  const actualHeight = rawResult?.originImage?.height ?? rawResult?.compressedImage?.height ?? rawResult?.height;
  const sizeLabel = `${Math.round(nodeData.size.width)} x ${Math.round(nodeData.size.height)}`;
  const containerRef = React20.useRef(null);
  const scaleStateRef = React20.useRef(null);
  const [isHovered, setIsHovered] = React20.useState(false);
  const { effectiveSelected, handlePointerDown: handleNodePointerDown } = useNodeSelection(selected, containerRef);
  const aiCreate = useAiCreate();
  const isSkeleton = status === "init";
  const isFailed = status === "fail";
  const isSuccess = status === "success";
  const isPlaceholder = !nodeData.url && !rawItem;
  const isRemixMode = !isPlaceholder && effectiveSelected && !dragging && aiCreate.aiCreateMode?.nodeId === nodeData.id && aiCreate.aiCreateMode?.subActionId === "image-edit" && !!aiCreate.aiCreateMode?.referenceImageUrl;
  const showHighlight = (effectiveSelected || dragging) && !isPlaceholder;
  const showToolbar = useToolbarVisibility(effectiveSelected, dragging) && !isSkeleton && !isFailed && !isPlaceholder;
  const showLabelBar = useLabelBarVisibility(effectiveSelected) && !isSkeleton && !isFailed;
  const nodeScreenWidth = nodeData.size.width * zoom;
  const showAiPanel = (isPlaceholder || isRemixMode) && effectiveSelected && !dragging && aiCreate.aiCreateMode?.nodeId === nodeData.id && (aiCreate.aiCreateMode?.subActionId === "text-to-image" || aiCreate.aiCreateMode?.subActionId === "image-edit") && nodeScreenWidth < 1200;
  const showAiVideoPanel = !isPlaceholder && effectiveSelected && !dragging && aiCreate.aiCreateMode?.nodeId === nodeData.id && aiCreate.aiCreateMode?.type === "ai-video";
  const handleQuickAction = React20.useCallback(
    (actionId, actionLabel) => {
      const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
      widgetBridge.emit(
        createWidgetEvent(
          "NODE_QUICK_ACTION",
          {
            nodeId: nodeData.id,
            nodeType: nodeData.type,
            actionId,
            actionLabel,
            node: nodeSnapshot
          },
          { source: "ui" }
        )
      );
    },
    [nodeData]
  );
  const handleRatingChange = React20.useCallback(
    (nextRating) => {
      const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
      nodeData.onNodeDataChange?.(nodeData.id, { rating: nextRating });
      widgetBridge.emit(
        createWidgetEvent(
          "NODE_QUICK_ACTION",
          {
            nodeId: nodeData.id,
            nodeType: nodeData.type,
            actionId: "rating",
            actionLabel: "Rating",
            rating: nextRating,
            node: nodeSnapshot
          },
          { source: "ui" }
        )
      );
    },
    [nodeData]
  );
  const handleSelectRequest = React20.useCallback(() => {
    const taskId = rawItem?.taskId;
    const url = nodeData.url || rawItem?.result?.originImage?.url || rawItem?.result?.compressedImage?.url || "";
    const s3Path = rawItem?.result?.originImage?.filePath || rawItem?.result?.compressedImage?.filePath || "";
    widgetBridge.emit(
      createWidgetEvent(
        "NODE_SELECT_REQUEST",
        {
          nodeId: nodeData.id,
          nodeType: nodeData.type,
          taskId: taskId || "",
          url,
          s3Path
        },
        { source: "ui" }
      )
    );
  }, [nodeData.id, nodeData.type, nodeData.url, rawItem]);
  const handleRemix = React20.useCallback(() => {
    const imageUrl = nodeData.url || rawItem?.result?.originImage?.url || rawItem?.result?.compressedImage?.url || "";
    if (imageUrl && aiCreate.enterRemixMode) {
      aiCreate.enterRemixMode(nodeData.id, imageUrl);
    } else {
      handleQuickAction("reference", "Remix");
    }
  }, [nodeData.id, nodeData.url, rawItem, aiCreate, handleQuickAction]);
  const visibleActions = React20.useMemo(() => [
    { id: "reference", label: "Remix", icon: Shuffle, onClick: handleRemix },
    { id: "inpaint", label: "Inpaint", icon: Paintbrush, onClick: () => handleQuickAction("inpaint", "Inpaint") },
    { id: "video", label: "Generate Video", icon: Video, onClick: () => handleQuickAction("video", "Generate Video") },
    { id: "edit-angles", label: "Edit Angles", icon: RotateCw, onClick: () => handleQuickAction("edit-angles", "Edit Angles") },
    { id: "avatar", label: "AI Avatar", icon: CircleUser, onClick: () => handleQuickAction("avatar", "AI Avatar") },
    {
      id: "upscale",
      label: "Upscale",
      icon: ArrowUpRight,
      onClick: () => handleQuickAction("upscale", "Upscale"),
      dropdownItems: (() => {
        const imgW = actualWidth || Math.round(nodeData.size.width);
        const imgH = actualHeight || Math.round(nodeData.size.height);
        const imageUrl = nodeData.url || rawItem?.result?.originImage?.url || rawItem?.result?.compressedImage?.url || "";
        const resolutions = [
          { value: "1k", label: "1K", scale: 1, creditCost: 0.8 },
          { value: "2k", label: "2K", scale: 2, creditCost: 0.8 },
          { value: "4k", label: "4K", scale: 4, creditCost: 1.4 }
        ];
        return resolutions.map((r) => ({
          id: r.value,
          label: r.label,
          detail: `${imgW * r.scale}\xD7${imgH * r.scale}`,
          creditCost: r.creditCost,
          onClick: () => {
            const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
            widgetBridge.emit(
              createWidgetEvent(
                "NODE_QUICK_ACTION",
                {
                  nodeId: nodeData.id,
                  nodeType: nodeData.type,
                  actionId: "upscale",
                  actionLabel: `Upscale ${r.label}`,
                  resolution: r.value,
                  imageUrl,
                  node: nodeSnapshot
                },
                { source: "ui" }
              )
            );
          }
        }));
      })()
    },
    { id: "download", label: "Download", icon: Download, onClick: () => handleQuickAction("download", "Download"), dividerBefore: true, iconOnly: true },
    { id: "fullscreen", label: "Full Screen", icon: ExpandIcon, onClick: () => handleQuickAction("fullscreen", "Full Screen"), iconOnly: true }
  ], [handleQuickAction, handleRemix, actualWidth, actualHeight, nodeData, rawItem]);
  const handleDelete = React20.useCallback(
    (event) => {
      if (!canDeleteFailed) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      nodeData.onNodeDataChange?.(nodeData.id, { _delete: true });
    },
    [canDeleteFailed, nodeData]
  );
  const handleScaleStart = (event, corner) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const anchorX = corner.includes("left") ? rect.right : rect.left;
    const anchorY = corner.includes("top") ? rect.bottom : rect.top;
    const startDist = Math.hypot(event.clientX - anchorX, event.clientY - anchorY);
    scaleStateRef.current = {
      anchorX,
      anchorY,
      startDist,
      startWidth: nodeData.size.width,
      startHeight: nodeData.size.height,
      // 使用 React Flow 的实际位置，而不是 nodeData.position
      // 这样可以避免在拖动后立即拉伸时位置跳回旧值
      startPosX: nodePosition.x,
      startPosY: nodePosition.y,
      corner
    };
    const handleMove = (moveEvent) => {
      if (!scaleStateRef.current) {
        return;
      }
      const {
        anchorX: anchorX2,
        anchorY: anchorY2,
        startDist: startDist2,
        startWidth,
        startHeight,
        startPosX,
        startPosY,
        corner: moveCorner
      } = scaleStateRef.current;
      const currentDist = Math.hypot(moveEvent.clientX - anchorX2, moveEvent.clientY - anchorY2);
      const rawScaleFactor = currentDist / startDist2;
      const minWidth = 80;
      const minHeight = 60;
      const minScaleFactor = Math.max(minWidth / startWidth, minHeight / startHeight, 0.1);
      const scaleFactor = Math.max(rawScaleFactor, minScaleFactor);
      const newWidth = Math.round(Math.max(minWidth, startWidth * scaleFactor));
      const newHeight = Math.round(Math.max(minHeight, startHeight * scaleFactor));
      let newPosX = startPosX;
      let newPosY = startPosY;
      if (moveCorner === "bottom-left") {
        newPosX = startPosX + (startWidth - newWidth);
      } else if (moveCorner === "top-right") {
        newPosY = startPosY + (startHeight - newHeight);
      } else if (moveCorner === "top-left") {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY + (startHeight - newHeight);
      }
      nodeData.onNodeDataChange?.(nodeData.id, {
        size: { width: newWidth, height: newHeight },
        position: { x: newPosX, y: newPosY }
      });
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      scaleStateRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onPointerDown: handleNodePointerDown,
      style: {
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: "relative",
        border: "none",
        borderRadius: 0,
        overflow: "visible",
        backgroundColor: "transparent",
        cursor: isSkeleton || isFailed ? "default" : dragging ? "move" : "default",
        outline: isPlaceholder && dragging ? `${2 / zoom}px solid transparent` : effectiveSelected && !dragging ? isFailed ? `${1 / zoom}px solid #ef4444` : `${1 / zoom}px solid #7781FF` : isFailed ? `${1 / zoom}px solid #ef4444` : isHovered && !isPlaceholder ? `${1 / zoom}px solid rgba(119,129,255,0.7)` : `${1 / zoom}px solid transparent`,
        outlineOffset: 0,
        transition: "outline-color 150ms ease"
      },
      children: [
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source",
            type: "source",
            position: Position.Top,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target",
            type: "target",
            position: Position.Bottom,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source-left",
            type: "source",
            position: Position.Left,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target-left",
            type: "target",
            position: Position.Left,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source-right",
            type: "source",
            position: Position.Right,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target-right",
            type: "target",
            position: Position.Right,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        isSuccess && showToolbar && /* @__PURE__ */ jsx(
          NodeRatingBadge,
          {
            rating: nodeData.rating ?? rawItem?.rating,
            onChange: canEdit ? handleRatingChange : void 0
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              width: "100%",
              height: "100%",
              overflow: "hidden",
              position: "relative",
              background: isPlaceholder ? "#1f1f1f" : "#1a1a1a",
              borderRadius: 0
            },
            children: [
              isFailed ? /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    textAlign: "center",
                    padding: 16,
                    color: "#b91c1c",
                    pointerEvents: "none",
                    background: "#1a1a1a"
                  },
                  children: [
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: "Failed to generate image" }),
                    canDeleteFailed && /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: handleDelete,
                        onPointerDown: (event) => event.stopPropagation(),
                        style: {
                          padding: "6px 14px",
                          borderRadius: 6,
                          border: "1px solid #ef4444",
                          background: "#fee2e2",
                          color: "#b91c1c",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          pointerEvents: "auto"
                        },
                        children: "Delete"
                      }
                    )
                  ]
                }
              ) : isSkeleton ? /* @__PURE__ */ jsx(MediaSkeleton, {}) : nodeData.url ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: nodeData.url,
                  alt: nodeData.alt || "Image",
                  draggable: false,
                  style: {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    pointerEvents: "none"
                  }
                }
              ) : /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  },
                  children: /* @__PURE__ */ jsxs(
                    "svg",
                    {
                      width: "48",
                      height: "48",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "#fff",
                      strokeWidth: "2",
                      strokeLinecap: "round",
                      strokeLinejoin: "round",
                      style: { opacity: 0.15 },
                      children: [
                        /* @__PURE__ */ jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
                        /* @__PURE__ */ jsx("circle", { cx: "9", cy: "9", r: "2" }),
                        /* @__PURE__ */ jsx("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" })
                      ]
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsx(
                SelectionOverlay,
                {
                  isVisible: isSelectable && isSuccess,
                  onClick: handleSelectRequest
                }
              )
            ]
          }
        ),
        showHighlight && !isPlaceholder && selectedCount <= 1 && !dragging && /* @__PURE__ */ jsx(Fragment, { children: ["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => {
          const cursorStyle = corner === "top-left" || corner === "bottom-right" ? "nwse-resize" : "nesw-resize";
          const handleSize = 8 / zoom;
          const handleOffset = -(handleSize / 2);
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "nodrag",
              onPointerDown: (e) => handleScaleStart(e, corner),
              style: {
                position: "absolute",
                left: corner.includes("left") ? handleOffset : "auto",
                right: corner.includes("right") ? handleOffset : "auto",
                top: corner.includes("top") ? handleOffset : "auto",
                bottom: corner.includes("bottom") ? handleOffset : "auto",
                width: handleSize,
                height: handleSize,
                zIndex: 2
              },
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    width: 8,
                    height: 8,
                    background: "#fff",
                    border: "1px solid #7781FF",
                    cursor: cursorStyle,
                    boxSizing: "border-box",
                    transform: `scale(${1 / zoom})`,
                    transformOrigin: "0 0"
                  }
                }
              )
            },
            corner
          );
        }) }),
        /* @__PURE__ */ jsx(
          NodeLabelBar,
          {
            isVisible: showLabelBar,
            nodeType: nodeData.type,
            label: rawItem?.title || "Image",
            sizeLabel,
            nodeWidth: nodeData.size.width,
            toolLabel: void 0
          }
        ),
        /* @__PURE__ */ jsx(QuickActionToolbar, { isVisible: showToolbar, actions: visibleActions }),
        /* @__PURE__ */ jsx(
          NodeToolbar,
          {
            isVisible: showAiPanel,
            position: Position.Bottom,
            offset: 8,
            align: "center",
            children: /* @__PURE__ */ jsx(
              TextToImagePanel,
              {
                inline: true,
                width: 480,
                initialTab: aiCreate.aiCreateMode?.subActionId,
                initialState: {
                  prompt: aiCreate.aiCreateMode?.prompt ?? "",
                  referenceImageUrl: aiCreate.aiCreateMode?.referenceImageUrl ?? ""
                },
                credits: aiCreate.credits,
                onSubmit: aiCreate.onSubmit,
                onDismiss: aiCreate.onDismiss,
                onUploadReference: () => aiCreate.onUploadReference?.(nodeData.id),
                onSelectFromBoard: () => aiCreate.onSelectFromBoard?.(nodeData.id)
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(
          NodeToolbar,
          {
            isVisible: showAiVideoPanel,
            position: Position.Bottom,
            offset: 8,
            align: "center",
            children: /* @__PURE__ */ jsx(
              AIVideoPanel,
              {
                inline: true,
                width: 480,
                initialTab: aiCreate.aiCreateMode?.subActionId,
                initialState: {
                  prompt: aiCreate.aiCreateMode?.prompt ?? "",
                  firstFrameUrl: aiCreate.aiCreateMode?.referenceImageUrl ?? ""
                },
                credits: aiCreate.credits,
                onSubmit: aiCreate.onVideoSubmit,
                onDismiss: aiCreate.onDismiss,
                onUploadFirstFrame: () => aiCreate.onUploadFirstFrame?.(nodeData.id),
                onUploadEndFrame: () => aiCreate.onUploadEndFrame?.(nodeData.id),
                onUploadMedia: () => aiCreate.onUploadMedia?.(nodeData.id),
                onSelectFromBoard: () => aiCreate.onSelectFromBoard?.(nodeData.id)
              }
            )
          }
        )
      ]
    }
  );
}
function VideoNode({ data, selected, dragging }) {
  const role = useCanvasRole();
  const canEdit = role !== "viewer";
  const canDeleteFailed = canEdit;
  const nodeData = data;
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const selectedCount = useStore((state) => state.nodes.filter((n) => n.selected).length);
  const rawItem = nodeData.raw;
  const status = String(rawItem?.status ?? "").toLowerCase();
  const rawResult = rawItem?.result ?? void 0;
  const actualWidth = rawResult?.originVideo?.width ?? rawResult?.originImage?.width ?? rawResult?.width;
  const actualHeight = rawResult?.originVideo?.height ?? rawResult?.originImage?.height ?? rawResult?.height;
  const sizeLabel = `${Math.round(nodeData.size.width)} x ${Math.round(nodeData.size.height)}`;
  const [isPlaying, setIsPlaying] = React20.useState(false);
  const [isHovered, setIsHovered] = React20.useState(false);
  const [duration, setDuration] = React20.useState(0);
  const screenW = nodeData.size.width * zoom;
  const screenH = nodeData.size.height * zoom;
  const showVideoOverlays = screenW >= 120 && screenH >= 120;
  const containerRef = React20.useRef(null);
  const { effectiveSelected, handlePointerDown: handleNodePointerDown } = useNodeSelection(selected, containerRef);
  const [preloadProgress, setPreloadProgress] = React20.useState(0);
  const [isPreloaded, setIsPreloaded] = React20.useState(false);
  const isSkeleton = status === "init";
  const isFailed = status === "fail";
  const isSuccess = status === "success";
  const isPlaceholder = !nodeData.url && !rawItem;
  const aiCreate = useAiCreate();
  const showAiVideoPanel = isPlaceholder && effectiveSelected && !dragging && aiCreate.aiCreateMode?.nodeId === nodeData.id && aiCreate.aiCreateMode?.type === "ai-video";
  const showHighlight = (effectiveSelected || dragging) && !isPlaceholder;
  const showToolbar = useToolbarVisibility(effectiveSelected, dragging) && !isSkeleton && !isFailed && !isPlaceholder;
  const showLabelBar = useLabelBarVisibility(effectiveSelected) && !isSkeleton && !isFailed;
  const videoRef = React20.useRef(null);
  const handleRatingChange = React20.useCallback(
    (nextRating) => {
      const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
      nodeData.onNodeDataChange?.(nodeData.id, { rating: nextRating });
      widgetBridge.emit(
        createWidgetEvent(
          "NODE_QUICK_ACTION",
          {
            nodeId: nodeData.id,
            nodeType: nodeData.type,
            actionId: "rating",
            actionLabel: "Rating",
            rating: nextRating,
            node: nodeSnapshot
          },
          { source: "ui" }
        )
      );
    },
    [nodeData]
  );
  const handleQuickAction = React20.useCallback(
    (actionId, actionLabel) => {
      const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
      widgetBridge.emit(
        createWidgetEvent(
          "NODE_QUICK_ACTION",
          {
            nodeId: nodeData.id,
            nodeType: nodeData.type,
            actionId,
            actionLabel,
            node: nodeSnapshot
          },
          { source: "ui" }
        )
      );
    },
    [nodeData]
  );
  const quickActions = React20.useMemo(() => {
    const videoUrl = nodeData.url || rawItem?.result?.originVideo?.url || "";
    const resolutions = [
      { value: "1080p", label: "1080p", detail: "1920\xD71080", creditPerMin: 1 },
      { value: "2K", label: "2K", detail: "2560\xD71440", creditPerMin: 2 },
      { value: "4K", label: "4K", detail: "3840\xD72160", creditPerMin: 4 }
    ];
    return [
      { id: "edit", label: "Re-edit", icon: RefreshCw, onClick: () => handleQuickAction("edit", "Re-edit") },
      { id: "video-lip-sync", label: "Lip Sync", icon: MicVocal, onClick: () => handleQuickAction("video-lip-sync", "Lip Sync") },
      {
        id: "upscale",
        label: "Upscale",
        icon: ArrowUpRight,
        onClick: () => handleQuickAction("upscale", "Upscale"),
        dropdownItems: resolutions.map((r) => ({
          id: r.value,
          label: r.label,
          detail: r.detail,
          creditCost: r.creditPerMin,
          onClick: () => {
            const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
            widgetBridge.emit(
              createWidgetEvent(
                "NODE_QUICK_ACTION",
                {
                  nodeId: nodeData.id,
                  nodeType: nodeData.type,
                  actionId: "upscale",
                  actionLabel: `Upscale ${r.label}`,
                  resolution: r.value,
                  videoUrl,
                  node: nodeSnapshot
                },
                { source: "ui" }
              )
            );
          }
        }))
      },
      { id: "download", label: "Download", icon: Download, onClick: () => handleQuickAction("download", "Download"), dividerBefore: true, iconOnly: true },
      { id: "fullscreen", label: "Full Screen", icon: ExpandIcon, onClick: () => handleQuickAction("fullscreen", "Full Screen"), iconOnly: true }
    ];
  }, [handleQuickAction, actualWidth, actualHeight, nodeData, rawItem]);
  const handleDelete = React20.useCallback(
    (event) => {
      if (!canDeleteFailed) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      nodeData.onNodeDataChange?.(nodeData.id, { _delete: true });
    },
    [canDeleteFailed, nodeData]
  );
  const scaleStateRef = React20.useRef(null);
  const handleScaleStart = (event, corner) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const anchorX = corner.includes("left") ? rect.right : rect.left;
    const anchorY = corner.includes("top") ? rect.bottom : rect.top;
    const startDist = Math.hypot(event.clientX - anchorX, event.clientY - anchorY);
    scaleStateRef.current = {
      anchorX,
      anchorY,
      startDist,
      startWidth: nodeData.size.width,
      startHeight: nodeData.size.height,
      // 使用 React Flow 的实际位置，而不是 nodeData.position
      startPosX: nodePosition.x,
      startPosY: nodePosition.y,
      corner
    };
    const handleMove = (moveEvent) => {
      if (!scaleStateRef.current) {
        return;
      }
      const {
        anchorX: anchorX2,
        anchorY: anchorY2,
        startDist: startDist2,
        startWidth,
        startHeight,
        startPosX,
        startPosY,
        corner: moveCorner
      } = scaleStateRef.current;
      const currentDist = Math.hypot(moveEvent.clientX - anchorX2, moveEvent.clientY - anchorY2);
      const rawScaleFactor = currentDist / startDist2;
      const minWidth = 160;
      const minHeight = 100;
      const minScaleFactor = Math.max(minWidth / startWidth, minHeight / startHeight, 0.1);
      const scaleFactor = Math.max(rawScaleFactor, minScaleFactor);
      const newWidth = Math.max(minWidth, startWidth * scaleFactor);
      const newHeight = Math.max(minHeight, startHeight * scaleFactor);
      let newPosX = startPosX;
      let newPosY = startPosY;
      if (moveCorner === "bottom-right") {
        newPosX = startPosX;
        newPosY = startPosY;
      } else if (moveCorner === "bottom-left") {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY;
      } else if (moveCorner === "top-right") {
        newPosX = startPosX;
        newPosY = startPosY + (startHeight - newHeight);
      } else if (moveCorner === "top-left") {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY + (startHeight - newHeight);
      }
      nodeData.onNodeDataChange?.(nodeData.id, {
        size: {
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        },
        position: {
          x: newPosX,
          y: newPosY
        }
      });
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      scaleStateRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };
  React20.useEffect(() => {
    if (!nodeData.url) {
      setIsPlaying(false);
      return void 0;
    }
    const video = videoRef.current;
    if (!video) {
      return void 0;
    }
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };
    setIsPlaying(!video.paused && !video.ended);
    if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [nodeData.url]);
  React20.useEffect(() => {
    if (!nodeData.url) {
      setPreloadProgress(0);
      setIsPreloaded(false);
      return void 0;
    }
    const abortController = new AbortController();
    let cancelled = false;
    const preloadVideo = async () => {
      try {
        const response = await fetch(nodeData.url, {
          signal: abortController.signal,
          // 使用 cors 模式，如果服务器不支持则回退
          mode: "cors",
          credentials: "omit"
        });
        if (!response.ok || cancelled) {
          return;
        }
        const contentLength = response.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        if (!response.body) {
          setIsPreloaded(true);
          setPreloadProgress(100);
          return;
        }
        const reader = response.body.getReader();
        let receivedLength = 0;
        const chunks = [];
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done)
            break;
          chunks.push(value);
          receivedLength += value.length;
          if (total > 0) {
            setPreloadProgress(Math.round(receivedLength / total * 100));
          } else {
            setPreloadProgress(Math.min(90, Math.round(receivedLength / 1e4)));
          }
        }
        if (!cancelled) {
          setIsPreloaded(true);
          setPreloadProgress(100);
          const blob = new Blob(chunks);
          URL.createObjectURL(blob);
        }
      } catch (error) {
        if (!cancelled && error.name !== "AbortError") {
          console.warn("[VideoNode] Preload failed, will use streaming:", error);
        }
      }
    };
    const timer = setTimeout(() => {
      void preloadVideo();
    }, 100);
    return () => {
      cancelled = true;
      abortController.abort();
      clearTimeout(timer);
    };
  }, [nodeData.url]);
  const togglePlayback = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused || video.ended) {
      void video.play();
    } else {
      video.pause();
    }
  };
  const formatDuration2 = (seconds) => {
    if (!seconds || isNaN(seconds))
      return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  const displayDuration = duration || rawResult?.originVideo?.duration || rawResult?.duration || 0;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onPointerDown: handleNodePointerDown,
      style: {
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: "relative",
        border: "none",
        borderRadius: "2px",
        overflow: "visible",
        backgroundColor: "transparent",
        cursor: isSkeleton || isFailed ? "default" : dragging ? "grabbing" : "grab",
        outline: isPlaceholder && dragging ? `${2 / zoom}px solid transparent` : effectiveSelected && !dragging ? isFailed ? `${1 / zoom}px solid #ef4444` : `${1 / zoom}px solid #7781FF` : isFailed ? `${1 / zoom}px solid #ef4444` : isHovered && !isPlaceholder ? `${1 / zoom}px solid rgba(119,129,255,0.7)` : `${1 / zoom}px solid transparent`,
        outlineOffset: 0,
        transition: "outline-color 150ms ease"
      },
      children: [
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source",
            type: "source",
            position: Position.Top,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target",
            type: "target",
            position: Position.Bottom,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source-left",
            type: "source",
            position: Position.Left,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target-left",
            type: "target",
            position: Position.Left,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source-right",
            type: "source",
            position: Position.Right,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target-right",
            type: "target",
            position: Position.Right,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        isSuccess && showToolbar && /* @__PURE__ */ jsx(
          NodeRatingBadge,
          {
            rating: nodeData.rating ?? rawItem?.rating,
            onChange: canEdit ? handleRatingChange : void 0
          }
        ),
        showHighlight && selectedCount <= 1 && !dragging && /* @__PURE__ */ jsx(Fragment, { children: ["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => {
          const cursorStyle = corner === "top-left" || corner === "bottom-right" ? "nwse-resize" : "nesw-resize";
          const handleSize = 8 / zoom;
          const handleOffset = -(handleSize / 2);
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "nodrag",
              onPointerDown: (e) => handleScaleStart(e, corner),
              style: {
                position: "absolute",
                left: corner.includes("left") ? handleOffset : "auto",
                right: corner.includes("right") ? handleOffset : "auto",
                top: corner.includes("top") ? handleOffset : "auto",
                bottom: corner.includes("bottom") ? handleOffset : "auto",
                width: handleSize,
                height: handleSize,
                zIndex: 2
              },
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    width: 8,
                    height: 8,
                    background: "#fff",
                    border: "1px solid #7781FF",
                    cursor: cursorStyle,
                    boxSizing: "border-box",
                    transform: `scale(${1 / zoom})`,
                    transformOrigin: "0 0"
                  }
                }
              )
            },
            corner
          );
        }) }),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              background: "#1a1a1a"
            },
            children: isFailed ? /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  textAlign: "center",
                  padding: 16,
                  color: "#b91c1c",
                  background: "#1a1a1a",
                  pointerEvents: "none"
                },
                children: [
                  /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: "Failed to generate video" }),
                  canDeleteFailed && /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: handleDelete,
                      onPointerDown: (event) => event.stopPropagation(),
                      style: {
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "1px solid #ef4444",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        pointerEvents: "auto"
                      },
                      children: "Delete"
                    }
                  )
                ]
              }
            ) : isSkeleton ? /* @__PURE__ */ jsx(MediaSkeleton, {}) : isPlaceholder ? /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#1a1a1a",
                  pointerEvents: "none"
                },
                children: /* @__PURE__ */ jsx(
                  "svg",
                  {
                    width: "48",
                    height: "48",
                    viewBox: "0 0 24 24",
                    fill: "#fff",
                    style: { opacity: 0.12 },
                    children: /* @__PURE__ */ jsx("path", { d: "M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" })
                  }
                )
              }
            ) : nodeData.url ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "video",
                {
                  ref: videoRef,
                  src: nodeData.url,
                  poster: nodeData.poster,
                  preload: "auto",
                  autoPlay: false,
                  loop: nodeData.loop,
                  muted: nodeData.muted,
                  playsInline: true,
                  style: {
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    pointerEvents: "none"
                  }
                }
              ),
              !isPreloaded && !isPlaying && preloadProgress > 0 && preloadProgress < 100 && /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    bottom: 8,
                    left: 8,
                    right: 8,
                    height: 3,
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    borderRadius: 2,
                    overflow: "hidden"
                  },
                  children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      style: {
                        height: "100%",
                        width: `${preloadProgress}%`,
                        backgroundColor: "rgba(0, 255, 200, 0.8)",
                        borderRadius: 2,
                        transition: "width 0.2s ease-out",
                        boxShadow: "0 0 6px rgba(0, 255, 200, 0.6)"
                      }
                    }
                  )
                }
              ),
              showVideoOverlays && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "nodrag nopan nowheel",
                    onClick: togglePlayback,
                    onPointerDown: (event) => event.stopPropagation(),
                    onMouseDown: (event) => event.stopPropagation(),
                    style: {
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      border: "none",
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      cursor: "pointer",
                      zIndex: 2,
                      opacity: !isPlaying || isHovered ? 1 : 0,
                      transition: "opacity 0.2s ease",
                      pointerEvents: !isPlaying || isHovered ? "auto" : "none"
                    },
                    "aria-label": isPlaying ? "Pause video" : "Play video",
                    children: isPlaying ? /* @__PURE__ */ jsx(Pause, { size: 16, fill: "currentColor", stroke: "none" }) : /* @__PURE__ */ jsx(Play, { size: 16, fill: "currentColor", stroke: "none", style: { marginLeft: 2 } })
                  }
                ),
                displayDuration > 0 && /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      left: 8 / zoom,
                      bottom: 8 / zoom,
                      padding: "0 6px",
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                      color: "#fff",
                      fontSize: 12,
                      lineHeight: "20px",
                      fontWeight: 500,
                      borderRadius: 4,
                      zIndex: 2,
                      pointerEvents: "none",
                      transform: `scale(${1 / zoom})`,
                      transformOrigin: "bottom left"
                    },
                    children: formatDuration2(displayDuration)
                  }
                )
              ] })
            ] }) : null
          }
        ),
        /* @__PURE__ */ jsx(
          NodeLabelBar,
          {
            isVisible: showLabelBar,
            nodeType: nodeData.type,
            label: rawItem?.title || "Video",
            sizeLabel,
            nodeWidth: nodeData.size.width,
            toolLabel: void 0
          }
        ),
        /* @__PURE__ */ jsx(QuickActionToolbar, { isVisible: showToolbar, actions: quickActions }),
        /* @__PURE__ */ jsx(
          NodeToolbar,
          {
            isVisible: showAiVideoPanel,
            position: Position.Bottom,
            offset: 8,
            align: "center",
            children: /* @__PURE__ */ jsx(
              AIVideoPanel,
              {
                inline: true,
                width: 480,
                initialTab: aiCreate.aiCreateMode?.subActionId,
                initialState: {
                  prompt: aiCreate.aiCreateMode?.prompt ?? "",
                  firstFrameUrl: aiCreate.aiCreateMode?.referenceImageUrl ?? ""
                },
                credits: aiCreate.credits,
                onSubmit: aiCreate.onVideoSubmit,
                onDismiss: aiCreate.onDismiss,
                onUploadFirstFrame: () => aiCreate.onUploadFirstFrame?.(nodeData.id),
                onUploadEndFrame: () => aiCreate.onUploadEndFrame?.(nodeData.id),
                onUploadMedia: () => aiCreate.onUploadMedia?.(nodeData.id),
                onSelectFromBoard: () => aiCreate.onSelectFromBoard?.(nodeData.id)
              }
            )
          }
        )
      ]
    }
  );
}
var defaultWaveformHeights = [
  6,
  8,
  12,
  16,
  18,
  22,
  20,
  24,
  22,
  18,
  20,
  24,
  26,
  22,
  18,
  14,
  16,
  20,
  18,
  14,
  10,
  12,
  8,
  6,
  8,
  10,
  14,
  12,
  8,
  6
];
function AudioNode({ data, selected, dragging }) {
  const role = useCanvasRole();
  const canEdit = role !== "viewer";
  const canDeleteFailed = canEdit;
  const nodeData = data;
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const selectedCount = useStore((state) => state.nodes.filter((n) => n.selected).length);
  const rawItem = nodeData.raw;
  const status = String(rawItem?.status ?? "").toLowerCase();
  const isSkeleton = status === "init";
  const isFailed = status === "fail";
  const isSuccess = status === "success";
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || hasError)
      return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((error) => {
        console.error("Audio play error:", {
          error,
          name: error.name,
          message: error.message,
          url: nodeData.url,
          readyState: audio.readyState,
          networkState: audio.networkState
        });
        setHasError(true);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio)
      return;
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration * 100);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    const handlePause = () => {
      setIsPlaying(false);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setHasError(false);
    };
    const handleError = () => {
      const error = audio.error;
      const errorDetails = {
        code: error?.code,
        message: error?.message,
        url: nodeData.url,
        networkState: audio.networkState,
        readyState: audio.readyState
      };
      const errorMessages = {
        1: "MEDIA_ERR_ABORTED - \u52A0\u8F7D\u88AB\u4E2D\u6B62",
        2: "MEDIA_ERR_NETWORK - \u7F51\u7EDC\u9519\u8BEF",
        3: "MEDIA_ERR_DECODE - \u89E3\u7801\u9519\u8BEF",
        4: "MEDIA_ERR_SRC_NOT_SUPPORTED - \u4E0D\u652F\u6301\u7684\u97F3\u9891\u683C\u5F0F\u6216\u6E90"
      };
      console.error("Audio loading error:", {
        ...errorDetails,
        errorType: error?.code ? errorMessages[error.code] : "Unknown error"
      });
      setHasError(true);
      setIsPlaying(false);
    };
    const handleLoadedMetadata = () => {
      setHasError(false);
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);
  const handleRatingChange = React20.useCallback(
    (nextRating) => {
      const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
      nodeData.onNodeDataChange?.(nodeData.id, { rating: nextRating });
      widgetBridge.emit(
        createWidgetEvent(
          "NODE_QUICK_ACTION",
          {
            nodeId: nodeData.id,
            nodeType: nodeData.type,
            actionId: "rating",
            actionLabel: "Rating",
            rating: nextRating,
            node: nodeSnapshot
          },
          { source: "ui" }
        )
      );
    },
    [nodeData]
  );
  const handleQuickAction = React20.useCallback(
    (actionId, actionLabel) => {
      const { onNodeDataChange: _ignore, ...nodeSnapshot } = nodeData;
      widgetBridge.emit(
        createWidgetEvent(
          "NODE_QUICK_ACTION",
          {
            nodeId: nodeData.id,
            nodeType: nodeData.type,
            actionId,
            actionLabel,
            node: nodeSnapshot
          },
          { source: "ui" }
        )
      );
    },
    [nodeData]
  );
  const quickActions = React20.useMemo(() => {
    const actions = [];
    if (rawItem?.toolType !== "user-upload") {
      actions.push({
        id: "edit",
        label: "Re-edit",
        icon: RefreshCw,
        onClick: () => handleQuickAction("edit", "Re-edit")
      });
    }
    actions.push({
      id: "download",
      label: "Download",
      icon: Download,
      onClick: () => handleQuickAction("download", "Download"),
      iconOnly: true
    });
    return actions;
  }, [rawItem?.toolType, handleQuickAction]);
  const handleDelete = React20.useCallback(
    (event) => {
      if (!canDeleteFailed) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      nodeData.onNodeDataChange?.(nodeData.id, { _delete: true });
    },
    [canDeleteFailed, nodeData]
  );
  const containerRef = React20.useRef(null);
  const { effectiveSelected, handlePointerDown: handleNodePointerDown } = useNodeSelection(selected, containerRef);
  const showHighlight = effectiveSelected || dragging;
  const showToolbar = useToolbarVisibility(effectiveSelected, dragging) && !isSkeleton && !isFailed;
  const showLabelBar = useLabelBarVisibility(effectiveSelected) && !isSkeleton && !isFailed;
  const scaleStateRef = React20.useRef(null);
  const handleScaleStart = (event, corner) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const anchorX = corner.includes("left") ? rect.right : rect.left;
    const anchorY = corner.includes("top") ? rect.bottom : rect.top;
    const startDist = Math.hypot(event.clientX - anchorX, event.clientY - anchorY);
    scaleStateRef.current = {
      anchorX,
      anchorY,
      startDist,
      startWidth: nodeData.size.width,
      startHeight: nodeData.size.height,
      // 使用 React Flow 的实际位置，而不是 nodeData.position
      startPosX: nodePosition.x,
      startPosY: nodePosition.y,
      corner
    };
    const handleMove = (moveEvent) => {
      if (!scaleStateRef.current) {
        return;
      }
      const {
        anchorX: anchorX2,
        anchorY: anchorY2,
        startDist: startDist2,
        startWidth,
        startHeight,
        startPosX,
        startPosY,
        corner: moveCorner
      } = scaleStateRef.current;
      const currentDist = Math.hypot(moveEvent.clientX - anchorX2, moveEvent.clientY - anchorY2);
      const rawScaleFactor = currentDist / startDist2;
      const minWidth = 120;
      const minHeight = 80;
      const minScaleFactor = Math.max(minWidth / startWidth, minHeight / startHeight, 0.1);
      const scaleFactor = Math.max(rawScaleFactor, minScaleFactor);
      const newWidth = Math.max(minWidth, startWidth * scaleFactor);
      const newHeight = Math.max(minHeight, startHeight * scaleFactor);
      let newPosX = startPosX;
      let newPosY = startPosY;
      if (moveCorner === "bottom-right") {
        newPosX = startPosX;
        newPosY = startPosY;
      } else if (moveCorner === "bottom-left") {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY;
      } else if (moveCorner === "top-right") {
        newPosX = startPosX;
        newPosY = startPosY + (startHeight - newHeight);
      } else if (moveCorner === "top-left") {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY + (startHeight - newHeight);
      }
      nodeData.onNodeDataChange?.(nodeData.id, {
        size: {
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        },
        position: {
          x: newPosX,
          y: newPosY
        }
      });
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      scaleStateRef.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onPointerDown: handleNodePointerDown,
      style: {
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: "relative",
        border: "none",
        overflow: "visible",
        padding: isSkeleton || isFailed ? 0 : "16px",
        backgroundColor: "transparent",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: isSkeleton || isFailed ? "default" : dragging ? "grabbing" : "grab",
        outline: effectiveSelected && !dragging ? `${1 / zoom}px solid #7781FF` : isFailed ? `${1 / zoom}px solid #ef4444` : isHovered ? `${1 / zoom}px solid rgba(119,129,255,0.7)` : `${1 / zoom}px solid transparent`,
        outlineOffset: 0,
        transition: "outline-color 150ms ease"
      },
      children: [
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source",
            type: "source",
            position: Position.Top,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target",
            type: "target",
            position: Position.Bottom,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source-left",
            type: "source",
            position: Position.Left,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target-left",
            type: "target",
            position: Position.Left,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-source-right",
            type: "source",
            position: Position.Right,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        /* @__PURE__ */ jsx(
          Handle,
          {
            id: "dep-target-right",
            type: "target",
            position: Position.Right,
            style: { opacity: 0, pointerEvents: "none" }
          }
        ),
        isSuccess && /* @__PURE__ */ jsx(
          NodeRatingBadge,
          {
            rating: nodeData.rating ?? rawItem?.rating,
            onChange: canEdit ? handleRatingChange : void 0
          }
        ),
        showHighlight && selectedCount <= 1 && !dragging && /* @__PURE__ */ jsx(Fragment, { children: ["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => {
          const cursorStyle = corner === "top-left" || corner === "bottom-right" ? "nwse-resize" : "nesw-resize";
          const handleSize = 8 / zoom;
          const handleOffset = -(handleSize / 2);
          return /* @__PURE__ */ jsx(
            "div",
            {
              className: "nodrag",
              onPointerDown: (e) => handleScaleStart(e, corner),
              style: {
                position: "absolute",
                left: corner.includes("left") ? handleOffset : "auto",
                right: corner.includes("right") ? handleOffset : "auto",
                top: corner.includes("top") ? handleOffset : "auto",
                bottom: corner.includes("bottom") ? handleOffset : "auto",
                width: handleSize,
                height: handleSize,
                zIndex: 2
              },
              children: /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    width: 8,
                    height: 8,
                    background: "#fff",
                    border: "1px solid #7781FF",
                    cursor: cursorStyle,
                    boxSizing: "border-box",
                    transform: `scale(${1 / zoom})`,
                    transformOrigin: "0 0"
                  }
                }
              )
            },
            corner
          );
        }) }),
        isFailed ? /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              textAlign: "center",
              padding: 16,
              color: "#b91c1c",
              pointerEvents: "none"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: "Failed to generate audio" }),
              canDeleteFailed && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: handleDelete,
                  onPointerDown: (event) => event.stopPropagation(),
                  style: {
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid #ef4444",
                    background: "#fee2e2",
                    color: "#b91c1c",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    pointerEvents: "auto"
                  },
                  children: "Delete"
                }
              )
            ]
          }
        ) : isSkeleton ? /* @__PURE__ */ jsx(MediaSkeleton, {}) : nodeData.url ? /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #252525 0%, #1e1e1e 50%, #181818 100%)",
              overflow: "hidden"
            },
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    inset: 0,
                    opacity: 0.3,
                    backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)"
                  }
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    width: 128,
                    height: 128,
                    borderRadius: "50%",
                    filter: "blur(48px)",
                    background: isPlaying ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                    transform: isPlaying ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.7s ease"
                  }
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16
                  },
                  children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          gap: 2,
                          height: 28
                        },
                        children: defaultWaveformHeights.map((h, i) => /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              width: 2,
                              height: h,
                              borderRadius: 1,
                              background: "rgba(255,255,255,0.5)",
                              transformOrigin: "bottom",
                              ...isPlaying ? {
                                animationName: "wave",
                                animationDuration: "1.5s",
                                animationTimingFunction: "ease-in-out",
                                animationIterationCount: "infinite",
                                animationDelay: `${i * 50}ms`
                              } : {}
                            }
                          },
                          i
                        ))
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { style: { position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }, children: [
                      isPlaying && /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              width: 112,
                              height: 112,
                              borderRadius: "50%",
                              border: "1px solid rgba(255,255,255,0.1)",
                              animationName: "ping",
                              animationDuration: "2s",
                              animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
                              animationIterationCount: "infinite"
                            }
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              width: 96,
                              height: 96,
                              borderRadius: "50%",
                              border: "1px solid rgba(255,255,255,0.15)",
                              animationName: "ping",
                              animationDuration: "2.5s",
                              animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
                              animationIterationCount: "infinite",
                              animationDelay: "0.5s"
                            }
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs(
                        "svg",
                        {
                          style: {
                            position: "absolute",
                            width: 80,
                            height: 80,
                            transform: "rotate(-90deg)"
                          },
                          viewBox: "0 0 80 80",
                          children: [
                            /* @__PURE__ */ jsx(
                              "circle",
                              {
                                cx: "40",
                                cy: "40",
                                r: "36",
                                fill: "none",
                                stroke: "rgba(255,255,255,0.06)",
                                strokeWidth: "1.5"
                              }
                            ),
                            /* @__PURE__ */ jsx(
                              "circle",
                              {
                                cx: "40",
                                cy: "40",
                                r: "36",
                                fill: "none",
                                stroke: "rgba(255,255,255,0.5)",
                                strokeWidth: "1.5",
                                strokeLinecap: "round",
                                strokeDasharray: `${2 * Math.PI * 36}`,
                                strokeDashoffset: `${2 * Math.PI * 36 * (1 - progress / 100)}`,
                                style: { transition: "stroke-dashoffset 0.1s" }
                              }
                            )
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          className: "nodrag nopan nowheel",
                          onClick: togglePlay,
                          onPointerDown: (e) => e.stopPropagation(),
                          onMouseDown: (e) => e.stopPropagation(),
                          disabled: hasError || !nodeData.url,
                          style: {
                            position: "relative",
                            zIndex: 10,
                            display: "flex",
                            height: 56,
                            width: 56,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            transition: "all 0.3s",
                            border: hasError ? "1px solid rgba(239, 68, 68, 0.3)" : isPlaying ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.1)",
                            background: hasError ? "rgba(239, 68, 68, 0.1)" : isPlaying ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                            boxShadow: isPlaying ? "0 10px 15px -3px rgba(0,0,0,0.3)" : "none",
                            cursor: hasError || !nodeData.url ? "not-allowed" : "pointer",
                            opacity: hasError || !nodeData.url ? 0.5 : 1
                          },
                          onMouseEnter: (e) => {
                            if (!isPlaying && !hasError && nodeData.url) {
                              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                            }
                          },
                          onMouseLeave: (e) => {
                            if (!isPlaying && !hasError && nodeData.url) {
                              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                            }
                          },
                          children: isPlaying ? /* @__PURE__ */ jsx(Pause, { style: { height: 20, width: 20, color: "rgba(255,255,255,0.9)" } }) : /* @__PURE__ */ jsx(Play, { style: { height: 20, width: 20, color: hasError ? "rgba(239, 68, 68, 0.7)" : "rgba(255,255,255,0.7)", marginLeft: 2 } })
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { style: { padding: "0 16px", textAlign: "center" }, children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            fontSize: 12,
                            color: hasError ? "rgba(239, 68, 68, 0.7)" : "rgba(255,255,255,0.7)",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: nodeData.size.width - 32,
                            letterSpacing: "0.025em"
                          },
                          children: hasError ? "\u65E0\u6CD5\u52A0\u8F7D\u97F3\u9891" : nodeData.title || "Untitled"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            marginTop: 4,
                            fontSize: 10,
                            color: hasError ? "rgba(239, 68, 68, 0.5)" : "rgba(255,255,255,0.3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em"
                          },
                          children: hasError ? "Error" : nodeData.artist || "Audio"
                        }
                      )
                    ] })
                  ]
                }
              ),
              nodeData.url && /* @__PURE__ */ jsx(
                "audio",
                {
                  ref: audioRef,
                  src: nodeData.url,
                  loop: nodeData.loop,
                  preload: "metadata",
                  style: { display: "none" }
                }
              )
            ]
          }
        ) : null,
        /* @__PURE__ */ jsx(
          NodeLabelBar,
          {
            isVisible: showLabelBar,
            nodeType: nodeData.type,
            label: rawItem?.title || "Audio",
            sizeLabel: `${Math.round(nodeData.size.width)} \xD7 ${Math.round(nodeData.size.height)}`,
            nodeWidth: nodeData.size.width,
            toolLabel: void 0
          }
        ),
        /* @__PURE__ */ jsx(QuickActionToolbar, { isVisible: showToolbar, actions: quickActions })
      ]
    }
  );
}
var TextToolbar = React20.memo(function TextToolbar2({
  fontSize,
  fontWeight,
  textAlign,
  backgroundColor,
  backgroundOpacity,
  zoom,
  onFontSizeChange,
  onFontWeightChange,
  onTextAlignChange,
  onBackgroundColorChange,
  onBackgroundOpacityChange
}) {
  const [showFontSizeDropdown, setShowFontSizeDropdown] = React20.useState(false);
  const [isExpanded, setIsExpanded] = React20.useState(false);
  const [hoveredTooltip, setHoveredTooltip] = React20.useState(null);
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 128];
  const backgroundOptions = [
    { value: "transparent", label: "\u900F\u660E", swatch: "transparent" },
    { value: "#ffffff", label: "\u767D\u8272", swatch: "#ffffff" },
    { value: "#000000", label: "\u9ED1\u8272", swatch: "#000000" },
    { value: "#f5f5f5", label: "\u7070\u8272", swatch: "#f5f5f5" },
    { value: "#fef3c7", label: "\u6DE1\u9EC4", swatch: "#fef3c7" },
    { value: "#e0f2fe", label: "\u6DE1\u84DD", swatch: "#e0f2fe" },
    { value: "#dcfce7", label: "\u6DE1\u7EFF", swatch: "#dcfce7" }
  ];
  const TooltipWrapper = ({
    id,
    label,
    children
  }) => /* @__PURE__ */ jsxs(
    "div",
    {
      onMouseEnter: () => setHoveredTooltip(id),
      onMouseLeave: () => setHoveredTooltip((current) => current === id ? null : current),
      style: { position: "relative", display: "inline-flex" },
      children: [
        children,
        hoveredTooltip === id && /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              marginBottom: 8,
              pointerEvents: "none",
              zIndex: 10
            },
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    padding: "6px 10px",
                    borderRadius: 6,
                    backgroundColor: "#252525",
                    color: "#fff",
                    fontSize: 12,
                    whiteSpace: "nowrap",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.35)"
                  },
                  children: label
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    left: "50%",
                    bottom: -4,
                    width: 8,
                    height: 8,
                    transform: "translateX(-50%) rotate(45deg)",
                    backgroundColor: "#252525",
                    borderRight: "1px solid rgba(255, 255, 255, 0.12)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.12)"
                  }
                }
              )
            ]
          }
        )
      ]
    }
  );
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "nodrag nopan nowheel",
      onPointerDown: (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      onMouseDown: (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      onClick: (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      onDoubleClick: (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      style: {
        position: "absolute",
        bottom: "100%",
        left: "50%",
        transform: `translateX(-50%) scale(${1 / zoom})`,
        transformOrigin: "bottom center",
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 8px",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        borderRadius: 10,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
        whiteSpace: "nowrap",
        zIndex: 9999,
        pointerEvents: "auto"
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
          /* @__PURE__ */ jsx(TooltipWrapper, { id: "font-size", label: "\u5B57\u53F7", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowFontSizeDropdown(!showFontSizeDropdown);
              },
              onPointerDown: (e) => {
                e.preventDefault();
                e.stopPropagation();
              },
              onMouseDown: (e) => {
                e.preventDefault();
                e.stopPropagation();
              },
              style: {
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 6,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                cursor: "pointer",
                fontSize: 12,
                color: "#fff",
                minWidth: 56
              },
              children: [
                fontSize,
                /* @__PURE__ */ jsx("svg", { width: "10", height: "6", viewBox: "0 0 10 6", fill: "none", children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M1 1L5 5L9 1",
                    stroke: "rgba(255, 255, 255, 0.8)",
                    strokeWidth: "1.5",
                    strokeLinecap: "round",
                    strokeLinejoin: "round"
                  }
                ) })
              ]
            }
          ) }),
          showFontSizeDropdown && /* @__PURE__ */ jsx(
            "div",
            {
              className: "nodrag nopan nowheel",
              onPointerDown: (event) => {
                event.preventDefault();
                event.stopPropagation();
              },
              onMouseDown: (event) => {
                event.preventDefault();
                event.stopPropagation();
              },
              style: {
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                backgroundColor: "#252525",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 6,
                boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                maxHeight: 200,
                overflowY: "auto",
                zIndex: 1e4,
                pointerEvents: "auto"
              },
              children: fontSizes.map((size) => /* @__PURE__ */ jsx(
                "div",
                {
                  onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFontSizeChange(size);
                    setShowFontSizeDropdown(false);
                  },
                  onPointerDown: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  },
                  onMouseDown: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  },
                  style: {
                    padding: "6px 16px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: size === fontSize ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
                    backgroundColor: size === fontSize ? "rgba(255, 255, 255, 0.12)" : "transparent"
                  },
                  onMouseEnter: (e) => {
                    e.target.style.backgroundColor = size === fontSize ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.08)";
                  },
                  onMouseLeave: (e) => {
                    e.target.style.backgroundColor = size === fontSize ? "rgba(255, 255, 255, 0.12)" : "transparent";
                  },
                  children: size
                },
                size
              ))
            }
          )
        ] }),
        /* @__PURE__ */ jsx(TooltipWrapper, { id: "bold", label: "\u52A0\u7C97", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              onFontWeightChange(fontWeight === "bold" ? "normal" : "bold");
            },
            onPointerDown: (e) => {
              e.preventDefault();
              e.stopPropagation();
            },
            onMouseDown: (e) => {
              e.preventDefault();
              e.stopPropagation();
            },
            style: {
              width: 26,
              height: 26,
              border: "none",
              borderRadius: 6,
              backgroundColor: fontWeight === "bold" ? "rgba(255, 255, 255, 0.2)" : "transparent",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 14,
              color: fontWeight === "bold" ? "#ffffff" : "rgba(255, 255, 255, 0.75)"
            },
            children: "B"
          }
        ) }),
        isExpanded && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { style: { width: 1, height: 18, backgroundColor: "rgba(255, 255, 255, 0.18)", margin: "0 4px" } }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 2 }, children: [
            /* @__PURE__ */ jsx(TooltipWrapper, { id: "align-left", label: "\u5DE6\u5BF9\u9F50", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTextAlignChange("left");
                },
                onPointerDown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                onMouseDown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                style: {
                  padding: 6,
                  border: "none",
                  borderRadius: 6,
                  backgroundColor: textAlign === "left" ? "rgba(255, 255, 255, 0.2)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                },
                children: /* @__PURE__ */ jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M2 3H14M2 6.5H10M2 10H14M2 13.5H10",
                    stroke: textAlign === "left" ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                    strokeWidth: "1.5",
                    strokeLinecap: "round"
                  }
                ) })
              }
            ) }),
            /* @__PURE__ */ jsx(TooltipWrapper, { id: "align-center", label: "\u5C45\u4E2D\u5BF9\u9F50", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTextAlignChange("center");
                },
                onPointerDown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                onMouseDown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                style: {
                  padding: 6,
                  border: "none",
                  borderRadius: 6,
                  backgroundColor: textAlign === "center" ? "rgba(255, 255, 255, 0.2)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                },
                children: /* @__PURE__ */ jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M2 3H14M4 6.5H12M2 10H14M4 13.5H12",
                    stroke: textAlign === "center" ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                    strokeWidth: "1.5",
                    strokeLinecap: "round"
                  }
                ) })
              }
            ) }),
            /* @__PURE__ */ jsx(TooltipWrapper, { id: "align-right", label: "\u53F3\u5BF9\u9F50", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTextAlignChange("right");
                },
                onPointerDown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                onMouseDown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                style: {
                  padding: 6,
                  border: "none",
                  borderRadius: 6,
                  backgroundColor: textAlign === "right" ? "rgba(255, 255, 255, 0.2)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                },
                children: /* @__PURE__ */ jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    d: "M2 3H14M6 6.5H14M2 10H14M6 13.5H14",
                    stroke: textAlign === "right" ? "#ffffff" : "rgba(255, 255, 255, 0.7)",
                    strokeWidth: "1.5",
                    strokeLinecap: "round"
                  }
                ) })
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { width: 1, height: 18, backgroundColor: "rgba(255, 255, 255, 0.18)", margin: "0 4px" } }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 4 }, children: backgroundOptions.map((option) => {
            const isActive = (backgroundColor ?? "transparent") === option.value;
            return /* @__PURE__ */ jsx(TooltipWrapper, { id: `bg-${option.label}`, label: option.label, children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBackgroundColorChange(option.value);
                },
                onPointerDown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                onMouseDown: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                },
                style: {
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: isActive ? "2px solid rgba(255, 255, 255, 0.9)" : "1px solid rgba(255, 255, 255, 0.3)",
                  padding: 0,
                  backgroundColor: option.swatch,
                  cursor: "pointer",
                  position: "relative"
                },
                children: [
                  option.value === "transparent" && /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        position: "absolute",
                        inset: 0,
                        borderRadius: 3,
                        background: "linear-gradient(135deg, transparent 45%, #ef4444 45%, #ef4444 55%, transparent 55%)"
                      }
                    }
                  ),
                  option.value === "#000000" && /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        position: "absolute",
                        inset: 2,
                        borderRadius: 2,
                        border: "1px solid rgba(255,255,255,0.4)"
                      }
                    }
                  )
                ]
              }
            ) }, option.label);
          }) }),
          /* @__PURE__ */ jsx("div", { style: { width: 1, height: 18, backgroundColor: "rgba(255, 255, 255, 0.18)", margin: "0 4px" } }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "range",
                min: 0,
                max: 100,
                value: Math.round(backgroundOpacity * 100),
                onChange: (event) => {
                  event.stopPropagation();
                  onBackgroundOpacityChange(Number(event.target.value) / 100);
                },
                onPointerDown: (e) => {
                  e.stopPropagation();
                },
                onMouseDown: (e) => {
                  e.stopPropagation();
                },
                onClick: (e) => {
                  e.stopPropagation();
                },
                style: { width: 90, accentColor: "#ffffff" }
              }
            ),
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: "rgba(255, 255, 255, 0.8)", minWidth: 36, textAlign: "right" }, children: [
              Math.round(backgroundOpacity * 100),
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(TooltipWrapper, { id: "expand", label: isExpanded ? "\u6536\u8D77" : "\u66F4\u591A", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            },
            onPointerDown: (e) => {
              e.preventDefault();
              e.stopPropagation();
            },
            onMouseDown: (e) => {
              e.preventDefault();
              e.stopPropagation();
            },
            style: {
              width: 26,
              height: 26,
              border: "none",
              borderRadius: 6,
              backgroundColor: isExpanded ? "rgba(255, 255, 255, 0.2)" : "transparent",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              color: isExpanded ? "#ffffff" : "rgba(255, 255, 255, 0.75)"
            },
            "aria-label": isExpanded ? "\u6536\u8D77" : "\u66F4\u591A",
            children: "..."
          }
        ) })
      ]
    }
  );
});
function TextNode({ data, selected, dragging }) {
  const nodeData = data;
  const nodePosition = useStore((state) => {
    const node = state.nodeLookup?.get(nodeData.id);
    return node?.position ?? nodeData.position;
  });
  const [content, setContent] = React20.useState(nodeData.content || "Add some text..");
  const [isEditing, setIsEditing] = React20.useState(false);
  const containerRef = React20.useRef(null);
  const textareaRef = React20.useRef(null);
  const textDisplayRef = React20.useRef(null);
  const autoEditProcessedRef = React20.useRef(false);
  const scaleStateRef = React20.useRef(null);
  const widthResizeRef = React20.useRef(null);
  const manualSizingRef = React20.useRef(false);
  const [isHovered, setIsHovered] = React20.useState(false);
  const { effectiveSelected, handlePointerDown: handleNodePointerDown } = useNodeSelection(selected, containerRef);
  const showHighlight = effectiveSelected || dragging;
  const fontSize = nodeData.fontSize ?? 16;
  const fontWeight = nodeData.fontWeight ?? "normal";
  const textAlign = nodeData.textAlign ?? "left";
  const backgroundOpacity = Math.max(0, Math.min(1, nodeData.backgroundOpacity ?? 1));
  const lineHeight = 1.4;
  const paddingSize = 12;
  const lineHeightPx = Math.round(fontSize * lineHeight);
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const selectedCount = useStore((state) => state.nodes.filter((n) => n.selected).length);
  const showToolbar = useToolbarVisibility(effectiveSelected, dragging);
  const resolvedBackgroundColor = React20.useMemo(() => {
    if (!nodeData.backgroundColor || nodeData.backgroundColor === "transparent") {
      return "transparent";
    }
    const hex = nodeData.backgroundColor.replace("#", "");
    const normalized = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const value = Number.parseInt(normalized, 16);
    if (Number.isNaN(value) || normalized.length !== 6) {
      return nodeData.backgroundColor;
    }
    const r = value >> 16 & 255;
    const g = value >> 8 & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
  }, [backgroundOpacity, nodeData.backgroundColor]);
  const resolvedTextColor = React20.useMemo(() => {
    const raw = (nodeData.backgroundColor || "").toLowerCase();
    if (!raw || raw === "transparent") {
      return nodeData.color || "#ffffff";
    }
    const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
    const hex = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
    if (hex === "000000") {
      return nodeData.color || "#ffffff";
    }
    if (hex === "ffffff") {
      return nodeData.color || "#000000";
    }
    return nodeData.color || "#000000";
  }, [nodeData.backgroundColor, nodeData.color]);
  React20.useEffect(() => {
    setContent(nodeData.content || "");
  }, [nodeData.content]);
  React20.useEffect(() => {
    if (nodeData.autoEdit && !autoEditProcessedRef.current) {
      autoEditProcessedRef.current = true;
      setIsEditing(true);
      nodeData.onNodeDataChange?.(nodeData.id, { autoEdit: void 0 });
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
        }
      }, 100);
    }
  }, [nodeData.autoEdit, nodeData, content]);
  const handleContainerClick = React20.useCallback(() => {
    if (selected && !isEditing) {
      setIsEditing(true);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [selected, isEditing]);
  React20.useLayoutEffect(() => {
    const textDisplay = textDisplayRef.current;
    if (!textDisplay) {
      return;
    }
    if (manualSizingRef.current) {
      return;
    }
    const scrollHeight = textDisplay.scrollHeight;
    const minContentHeight = lineHeightPx;
    const contentHeight = Math.max(scrollHeight, minContentHeight);
    const nextHeight = contentHeight + paddingSize * 2;
    if (Math.abs(nextHeight - nodeData.size.height) < 1) {
      return;
    }
    nodeData.onNodeDataChange?.(nodeData.id, {
      size: { ...nodeData.size, height: Math.ceil(nextHeight) }
    });
  }, [content, lineHeightPx, nodeData.id, nodeData.onNodeDataChange, paddingSize, nodeData.size.width]);
  const contentSyncTimeoutRef = React20.useRef(null);
  const isComposingRef = React20.useRef(false);
  const handleContentChange = (event) => {
    const nextValue = event.target.value;
    setContent(nextValue);
    if (isComposingRef.current) {
      return;
    }
    if (contentSyncTimeoutRef.current) {
      clearTimeout(contentSyncTimeoutRef.current);
    }
    contentSyncTimeoutRef.current = setTimeout(() => {
      nodeData.onNodeDataChange?.(nodeData.id, { content: nextValue });
    }, 300);
  };
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };
  const handleCompositionEnd = (event) => {
    isComposingRef.current = false;
    const nextValue = event.target.value;
    if (contentSyncTimeoutRef.current) {
      clearTimeout(contentSyncTimeoutRef.current);
    }
    nodeData.onNodeDataChange?.(nodeData.id, { content: nextValue });
  };
  const handleBlur = (event) => {
    const nextValue = event.currentTarget.value;
    setTimeout(() => {
      const relatedTarget = event.relatedTarget;
      if (relatedTarget && containerRef.current?.contains(relatedTarget)) {
        textareaRef.current?.focus();
        return;
      }
      setIsEditing(false);
      if (!nextValue.trim()) {
        if (isDev()) {
          console.log("[TextNode] Empty content on blur, request delete", {
            id: nodeData.id
          });
        }
        nodeData.onNodeDataChange?.(nodeData.id, { _delete: true });
      }
    }, 0);
  };
  const handleFontSizeChange = React20.useCallback((newSize) => {
    nodeData.onNodeDataChange?.(nodeData.id, { fontSize: newSize });
  }, [nodeData]);
  const handleFontWeightChange = React20.useCallback((newWeight) => {
    nodeData.onNodeDataChange?.(nodeData.id, { fontWeight: newWeight });
  }, [nodeData]);
  const handleTextAlignChange = React20.useCallback((newAlign) => {
    nodeData.onNodeDataChange?.(nodeData.id, { textAlign: newAlign });
  }, [nodeData]);
  const handleBackgroundColorChange = React20.useCallback((newColor) => {
    const normalizedColor = !newColor || newColor === "transparent" ? "transparent" : newColor;
    let textColor;
    const raw = normalizedColor.toLowerCase();
    if (!raw || raw === "transparent") {
      textColor = "#ffffff";
    } else {
      const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
      const hex = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
      if (hex === "000000") {
        textColor = "#ffffff";
      } else if (hex === "ffffff") {
        textColor = "#000000";
      } else {
        textColor = "#000000";
      }
    }
    nodeData.onNodeDataChange?.(nodeData.id, {
      backgroundColor: normalizedColor,
      color: textColor
    });
  }, [nodeData]);
  const handleBackgroundOpacityChange = React20.useCallback((newOpacity) => {
    nodeData.onNodeDataChange?.(nodeData.id, { backgroundOpacity: newOpacity });
  }, [nodeData]);
  const handleScaleStart = (event, corner) => {
    event.preventDefault();
    event.stopPropagation();
    manualSizingRef.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    const anchorX = corner.includes("left") ? rect.right : rect.left;
    const anchorY = corner.includes("top") ? rect.bottom : rect.top;
    const startDist = Math.hypot(event.clientX - anchorX, event.clientY - anchorY);
    scaleStateRef.current = {
      anchorX,
      anchorY,
      startDist,
      startFontSize: fontSize,
      startWidth: nodeData.size.width,
      startHeight: nodeData.size.height,
      // 使用 React Flow 的实际位置，而不是 nodeData.position
      startPosX: nodePosition.x,
      startPosY: nodePosition.y,
      corner
    };
    const handleMove = (moveEvent) => {
      if (!scaleStateRef.current) {
        return;
      }
      const { anchorX: anchorX2, anchorY: anchorY2, startDist: startDist2, startFontSize, startWidth, startHeight, startPosX, startPosY, corner: corner2 } = scaleStateRef.current;
      const currentDist = Math.hypot(moveEvent.clientX - anchorX2, moveEvent.clientY - anchorY2);
      const scaleFactor = currentDist / startDist2;
      const newFontSize = Math.max(8, Math.min(1024, startFontSize * scaleFactor));
      const newWidth = Math.max(80, startWidth * scaleFactor);
      const newHeight = Math.max(30, startHeight * scaleFactor);
      let newPosX = startPosX;
      let newPosY = startPosY;
      if (corner2 === "bottom-right") {
        newPosX = startPosX;
        newPosY = startPosY;
      } else if (corner2 === "bottom-left") {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY;
      } else if (corner2 === "top-right") {
        newPosX = startPosX;
        newPosY = startPosY + (startHeight - newHeight);
      } else if (corner2 === "top-left") {
        newPosX = startPosX + (startWidth - newWidth);
        newPosY = startPosY + (startHeight - newHeight);
      }
      nodeData.onNodeDataChange?.(nodeData.id, {
        fontSize: Math.round(newFontSize),
        size: {
          width: Math.round(newWidth),
          height: Math.round(newHeight)
        },
        position: {
          x: newPosX,
          y: newPosY
        }
      });
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      scaleStateRef.current = null;
      setTimeout(() => {
        manualSizingRef.current = false;
      }, 500);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };
  const handleWidthResizeStart = (event, side) => {
    event.preventDefault();
    event.stopPropagation();
    manualSizingRef.current = true;
    widthResizeRef.current = {
      startX: event.clientX,
      startWidth: nodeData.size.width,
      // 使用 React Flow 的实际位置，而不是 nodeData.position
      startPosX: nodePosition.x,
      side
    };
    const handleMove = (moveEvent) => {
      if (!widthResizeRef.current) {
        return;
      }
      const { startX, startWidth, startPosX, side: side2 } = widthResizeRef.current;
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth;
      let newPosX = startPosX;
      if (side2 === "right") {
        newWidth = startWidth + deltaX;
      } else {
        newWidth = startWidth - deltaX;
        newPosX = startPosX + deltaX;
      }
      newWidth = Math.max(80, newWidth);
      if (side2 === "left" && newWidth === 80) {
        newPosX = startPosX + (startWidth - 80);
      }
      if (Math.abs(newWidth - nodeData.size.width) > 2 || Math.abs(newPosX - nodeData.position.x) > 2) {
        const patch = {
          size: { ...nodeData.size, width: Math.round(newWidth) }
        };
        if (side2 === "left") {
          patch.position = {
            x: newPosX,
            y: nodeData.position.y
          };
        }
        nodeData.onNodeDataChange?.(nodeData.id, patch);
      }
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      widthResizeRef.current = null;
      setTimeout(() => {
        manualSizingRef.current = false;
      }, 500);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };
  const renderTextContent = () => {
    if (!content) {
      return /* @__PURE__ */ jsx("span", { style: { opacity: 0.4 }, children: "Add some text.." });
    }
    return content;
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      onPointerDown: () => {
        handleNodePointerDown();
      },
      onClick: () => {
        handleContainerClick();
      },
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      style: {
        width: nodeData.size.width,
        height: nodeData.size.height,
        position: "relative",
        overflow: "visible",
        padding: `${paddingSize}px`,
        boxSizing: "border-box",
        border: "none",
        outline: effectiveSelected && !dragging ? `${1 / zoom}px solid #7781FF` : isHovered ? `${1 / zoom}px solid rgba(119,129,255,0.7)` : `${1 / zoom}px solid transparent`,
        outlineOffset: 0,
        transition: "outline-color 150ms ease",
        backgroundColor: resolvedBackgroundColor,
        cursor: "default"
      },
      children: [
        showToolbar && /* @__PURE__ */ jsx(
          TextToolbar,
          {
            fontSize,
            fontWeight,
            textAlign,
            backgroundColor: nodeData.backgroundColor,
            backgroundOpacity,
            zoom: zoom || 1,
            onFontSizeChange: handleFontSizeChange,
            onFontWeightChange: handleFontWeightChange,
            onTextAlignChange: handleTextAlignChange,
            onBackgroundColorChange: handleBackgroundColorChange,
            onBackgroundOpacityChange: handleBackgroundOpacityChange
          }
        ),
        showHighlight && selectedCount <= 1 && !dragging && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "nodrag",
              onPointerDown: (e) => handleWidthResizeStart(e, "left"),
              style: {
                position: "absolute",
                left: -4 / zoom,
                top: 8 / zoom,
                bottom: 8 / zoom,
                width: 8 / zoom,
                cursor: "ew-resize",
                zIndex: 1
              }
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "nodrag",
              onPointerDown: (e) => handleWidthResizeStart(e, "right"),
              style: {
                position: "absolute",
                right: -4 / zoom,
                top: 8 / zoom,
                bottom: 8 / zoom,
                width: 8 / zoom,
                cursor: "ew-resize",
                zIndex: 1
              }
            }
          ),
          ["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => {
            const cursorStyle = corner === "top-left" || corner === "bottom-right" ? "nwse-resize" : "nesw-resize";
            const handleSize = 8 / zoom;
            const handleOffset = -(handleSize / 2);
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: "nodrag",
                onPointerDown: (e) => handleScaleStart(e, corner),
                style: {
                  position: "absolute",
                  left: corner.includes("left") ? handleOffset : "auto",
                  right: corner.includes("right") ? handleOffset : "auto",
                  top: corner.includes("top") ? handleOffset : "auto",
                  bottom: corner.includes("bottom") ? handleOffset : "auto",
                  width: handleSize,
                  height: handleSize,
                  zIndex: 2
                },
                children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      width: 8,
                      height: 8,
                      background: "#fff",
                      border: "1px solid #7781FF",
                      cursor: cursorStyle,
                      boxSizing: "border-box",
                      transform: `scale(${1 / zoom})`,
                      transformOrigin: "0 0"
                    }
                  }
                )
              },
              corner
            );
          })
        ] }),
        /* @__PURE__ */ jsx(
          "div",
          {
            ref: textDisplayRef,
            style: {
              width: "100%",
              minHeight: `${lineHeightPx}px`,
              fontSize,
              fontFamily: nodeData.fontFamily || "sans-serif",
              fontWeight,
              color: resolvedTextColor,
              textAlign,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: `${lineHeightPx}px`,
              userSelect: isEditing ? "none" : "text",
              opacity: isEditing ? 0 : 1,
              pointerEvents: isEditing ? "none" : "auto"
            },
            children: renderTextContent()
          }
        ),
        isEditing && /* @__PURE__ */ jsx(
          "textarea",
          {
            title: "Input Text",
            placeholder: "Add some text..",
            ref: textareaRef,
            className: "nodrag tc-node-textarea",
            autoFocus: true,
            style: {
              position: "absolute",
              top: paddingSize,
              left: paddingSize,
              right: paddingSize,
              bottom: paddingSize,
              width: `calc(100% - ${paddingSize * 2}px)`,
              height: `calc(100% - ${paddingSize * 2}px)`,
              boxSizing: "border-box",
              fontSize,
              fontFamily: nodeData.fontFamily || "sans-serif",
              fontWeight,
              color: resolvedTextColor,
              textAlign,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflow: "hidden",
              border: "none",
              resize: "none",
              background: "transparent",
              lineHeight: `${lineHeightPx}px`,
              padding: 0,
              margin: 0,
              caretColor: resolvedTextColor
            },
            value: content,
            onChange: handleContentChange,
            onCompositionStart: handleCompositionStart,
            onCompositionEnd: handleCompositionEnd,
            onBlur: handleBlur,
            onContextMenu: (event) => {
              event.preventDefault();
            },
            onKeyDown: (event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                textareaRef.current?.blur();
                return;
              }
              if (event.key !== "Delete" && event.key !== "Backspace") {
                return;
              }
              const nextValue = event.currentTarget.value;
              if (!nextValue.trim()) {
                event.preventDefault();
                event.stopPropagation();
                if (isDev()) {
                  console.log("[TextNode] Empty content on key delete, request delete", {
                    id: nodeData.id,
                    key: event.key
                  });
                }
                nodeData.onNodeDataChange?.(nodeData.id, { _delete: true });
              }
            }
          }
        )
      ]
    }
  );
}
var ICON_STYLE = {
  width: 16,
  height: 16,
  display: "block"
};
function ZoomOutIcon() {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: ICON_STYLE, children: [
    /* @__PURE__ */ jsx("circle", { cx: "7", cy: "7", r: "4.5", stroke: "currentColor", strokeWidth: "1.3" }),
    /* @__PURE__ */ jsx("path", { d: "M10.5 10.5L14 14", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M5 7H9", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })
  ] });
}
function ZoomInIcon() {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: ICON_STYLE, children: [
    /* @__PURE__ */ jsx("circle", { cx: "7", cy: "7", r: "4.5", stroke: "currentColor", strokeWidth: "1.3" }),
    /* @__PURE__ */ jsx("path", { d: "M10.5 10.5L14 14", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M5 7H9", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M7 5V9", stroke: "currentColor", strokeWidth: "1.3", strokeLinecap: "round" })
  ] });
}
function ControlButton({ label, shortcutKeys, onClick, disabled, ariaLabel, children }) {
  const [hovered, setHovered] = React20.useState(false);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: { position: "relative" },
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick,
            disabled,
            "aria-label": ariaLabel,
            className: "tc-canvas-control-button",
            style: {
              width: 32,
              height: 32,
              padding: 0,
              borderRadius: 6,
              border: "none",
              background: hovered && !disabled ? "rgba(255,255,255,0.1)" : "transparent",
              color: disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "background 120ms ease, color 120ms ease"
            },
            children
          }
        ),
        hovered && !disabled && /* @__PURE__ */ jsxs("div", { style: {
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: 6,
          padding: "5px 8px",
          borderRadius: 6,
          background: "#252525",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          color: "#fff",
          fontSize: 11,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 10,
          display: "flex",
          alignItems: "center"
        }, children: [
          /* @__PURE__ */ jsx("span", { children: label }),
          shortcutKeys && /* @__PURE__ */ jsx(ShortcutBadge, { keys: shortcutKeys })
        ] })
      ]
    }
  );
}
function CanvasControls({
  position = "bottom-left",
  style,
  className
}) {
  const { zoomIn, zoomOut, zoomTo } = useReactFlow();
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const minZoom = useStore((state) => state.minZoom ?? 0.1);
  const maxZoom = useStore((state) => state.maxZoom ?? 4);
  const [zoomHovered, setZoomHovered] = React20.useState(false);
  const zoomPercent = Math.round(zoom * 100);
  const canZoomIn = zoom < maxZoom - 1e-3;
  const canZoomOut = zoom > minZoom + 1e-3;
  const handleZoomReset = React20.useCallback(() => {
    zoomTo(1, { duration: 200 });
  }, [zoomTo]);
  const containerPosition = style ? {} : position === "top-left" ? { top: 16, left: 16 } : { bottom: 16, left: 16 };
  const isAbsolute = !style;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className,
      style: {
        position: isAbsolute ? "absolute" : "relative",
        ...containerPosition,
        zIndex: 20,
        pointerEvents: "none",
        ...style
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          onPointerDown: (e) => e.stopPropagation(),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 0,
            pointerEvents: "auto",
            color: "#ffffff",
            fontFamily: "Inter, sans-serif",
            background: "rgba(28, 30, 34, 1)",
            // Dark background like other panels
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            // Pill shape
            padding: "2px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
          },
          children: [
            /* @__PURE__ */ jsx(
              ControlButton,
              {
                label: "Zoom out",
                shortcutKeys: ["\u2318", "\u2212"],
                onClick: () => zoomOut({ duration: 0 }),
                disabled: !canZoomOut,
                ariaLabel: "Zoom out",
                children: /* @__PURE__ */ jsx(ZoomOutIcon, {})
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                role: "button",
                tabIndex: 0,
                onClick: handleZoomReset,
                onKeyDown: (e) => {
                  if (e.key === "Enter")
                    handleZoomReset();
                },
                onMouseEnter: () => setZoomHovered(true),
                onMouseLeave: () => setZoomHovered(false),
                style: {
                  minWidth: 40,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  lineHeight: "16px",
                  fontWeight: 500,
                  color: zoomHovered ? "#fff" : "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  transition: "color 120ms ease",
                  userSelect: "none",
                  height: 32
                },
                children: [
                  zoomPercent,
                  "%"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              ControlButton,
              {
                label: "Zoom in",
                shortcutKeys: ["\u2318", "+"],
                onClick: () => zoomIn({ duration: 0 }),
                disabled: !canZoomIn,
                ariaLabel: "Zoom in",
                children: /* @__PURE__ */ jsx(ZoomInIcon, {})
              }
            )
          ]
        }
      )
    }
  );
}
var getNodeRect = (position, size) => {
  const centerX = position.x + size.width / 2;
  const centerY = position.y + size.height / 2;
  return {
    left: position.x,
    right: position.x + size.width,
    top: position.y,
    bottom: position.y + size.height,
    centerX,
    centerY
  };
};
var getSnappedPosition = (position, node, otherNodes, threshold) => {
  const size = node.data.size;
  const rect = getNodeRect(position, size);
  let snappedX = position.x;
  let snappedY = position.y;
  let snapLineX;
  let snapLineY;
  let bestXDelta = threshold + 1;
  let bestYDelta = threshold + 1;
  otherNodes.forEach((other) => {
    const otherRect = getNodeRect(other.position, other.data.size);
    const xCandidates = [
      { delta: otherRect.left - rect.left, line: otherRect.left },
      { delta: otherRect.centerX - rect.centerX, line: otherRect.centerX },
      { delta: otherRect.right - rect.right, line: otherRect.right }
    ];
    xCandidates.forEach(({ delta, line }) => {
      const absDelta = Math.abs(delta);
      if (absDelta <= threshold && absDelta < bestXDelta) {
        bestXDelta = absDelta;
        snappedX = position.x + delta;
        snapLineX = line;
      }
    });
    const yCandidates = [
      { delta: otherRect.top - rect.top, line: otherRect.top },
      { delta: otherRect.centerY - rect.centerY, line: otherRect.centerY },
      { delta: otherRect.bottom - rect.bottom, line: otherRect.bottom }
    ];
    yCandidates.forEach(({ delta, line }) => {
      const absDelta = Math.abs(delta);
      if (absDelta <= threshold && absDelta < bestYDelta) {
        bestYDelta = absDelta;
        snappedY = position.y + delta;
        snapLineY = line;
      }
    });
  });
  return {
    position: { x: snappedX, y: snappedY },
    snapLines: { x: snapLineX, y: snapLineY }
  };
};
function InfiniteCanvas({
  nodes: initialNodes,
  edges: initialEdges = [],
  config = {},
  onNodesChange: onNodesChangeCallback,
  onEdgesChange: onEdgesChangeCallback,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragEnd,
  onNodeContextMenu,
  onPaneContextMenu,
  onPaneMouseMove,
  onViewportChange,
  onPaneClick,
  onNodeClick: onNodeClickCallback,
  paneCursor,
  nodesDraggable = true,
  elementsSelectable = true,
  selectionOnDrag = true,
  panOnDrag = [1, 2],
  onLockChange,
  isLocked = false,
  showControls = true,
  className,
  style,
  backgroundColor = "#000000",
  width = "100%",
  height = "100%",
  minWidth = "300px",
  minHeight = "400px",
  onReactFlowInit
}) {
  const [nodes, setNodes] = React20.useState([]);
  const nodesRef = React20.useRef([]);
  const pendingDeleteRef = React20.useRef(/* @__PURE__ */ new Set());
  const [edges, setEdges] = React20.useState(initialEdges);
  const isInitialMount = React20.useRef(true);
  const [snapLines, setSnapLines] = React20.useState(null);
  const [isNodeDragging, setIsNodeDragging] = React20.useState(false);
  const [isPanDragging, setIsPanDragging] = React20.useState(false);
  const [viewport, setViewport] = React20.useState({ x: 0, y: 0, zoom: 1 });
  const reactFlowInstanceRef = React20.useRef(null);
  const [instanceReady, setInstanceReady] = React20.useState(false);
  const containerRef = React20.useRef(null);
  const fitViewAppliedRef = React20.useRef(false);
  const lastViewportNotifiedRef = React20.useRef(viewport);
  const snapPositionRef = React20.useRef(/* @__PURE__ */ new Map());
  React20.useEffect(() => {
    document.documentElement.style.setProperty("--tc-flow-zoom", String(viewport.zoom));
    return () => {
      document.documentElement.style.removeProperty("--tc-flow-zoom");
    };
  }, [viewport.zoom]);
  const initializedRef = React20.useRef(false);
  const initialNodesSignatureRef = React20.useRef("");
  const defaultViewport = useMemo(
    () => ({ x: 0, y: 0, zoom: config.defaultZoom || 1 }),
    [config.defaultZoom]
  );
  const getViewportFromInstance = useCallback(
    (instance) => {
      const viewportGetter = instance;
      const viewport2 = viewportGetter.getViewport?.() ?? viewportGetter.toObject?.().viewport;
      if (!viewport2) {
        return null;
      }
      return viewport2;
    },
    []
  );
  const applyInitialFitView = useCallback(() => {
    const instance = reactFlowInstanceRef.current;
    if (!instance || fitViewAppliedRef.current || nodes.length === 0) {
      return;
    }
    instance.fitView({ padding: 0.2, duration: 0 });
    fitViewAppliedRef.current = true;
    const nextViewport = getViewportFromInstance(instance);
    if (!nextViewport) {
      return;
    }
    setViewport((prevViewport) => {
      if (prevViewport.x === nextViewport.x && prevViewport.y === nextViewport.y && prevViewport.zoom === nextViewport.zoom) {
        return prevViewport;
      }
      return nextViewport;
    });
  }, [getViewportFromInstance, nodes.length]);
  const emitNodesChange = useCallback(
    (nextNodes) => {
      if (onNodesChangeCallback && !isInitialMount.current) {
        setTimeout(() => {
          const canvasNodes = nextNodes.map((node) => {
            const { onNodeDataChange: _ignore, ...nodeData } = node.data;
            return {
              ...nodeData,
              position: node.position,
              zIndex: node.zIndex,
              selected: node.selected
              // 保留节点选择状态
            };
          });
          onNodesChangeCallback(canvasNodes);
        }, 0);
      }
    },
    [onNodesChangeCallback]
  );
  const requestDeleteNode = useCallback((targetNode) => {
    if (pendingDeleteRef.current.has(targetNode.id)) {
      return;
    }
    pendingDeleteRef.current.add(targetNode.id);
    if (isDev()) {
      console.log("[InfiniteCanvas] request delete", {
        id: targetNode.id,
        type: targetNode.data?.type
      });
    }
    const { onNodeDataChange: _ignore, ...nodeSnapshot } = targetNode.data;
    widgetBridge.emit(
      createWidgetEvent(
        "NODE_DELETE_REQUEST",
        {
          nodeId: targetNode.id,
          nodeType: targetNode.data.type,
          node: nodeSnapshot
        },
        { source: "ui" }
      )
    );
  }, []);
  const confirmDeleteNode = useCallback(
    (nodeId) => {
      setNodes((prevNodes) => {
        const nextNodes = prevNodes.filter((node) => node.id !== nodeId);
        if (nextNodes.length === prevNodes.length) {
          if (isDev()) {
            console.warn("[InfiniteCanvas] confirm delete but node not found", { nodeId });
          }
          pendingDeleteRef.current.delete(nodeId);
          return prevNodes;
        }
        if (isDev()) {
          console.log("[InfiniteCanvas] confirm delete", { nodeId });
        }
        emitNodesChange(nextNodes);
        pendingDeleteRef.current.delete(nodeId);
        return nextNodes;
      });
    },
    [emitNodesChange]
  );
  const syncNodeDataSize = useCallback((node) => {
    const width2 = node.width ?? node.data.size.width;
    const height2 = node.height ?? node.data.size.height;
    if (width2 === node.data.size.width && height2 === node.data.size.height) {
      return node;
    }
    return {
      ...node,
      data: {
        ...node.data,
        size: { width: width2, height: height2 }
      }
    };
  }, []);
  const isSkeletonNode = useCallback((node) => {
    const raw = node.data.raw;
    return String(raw?.status ?? "").toLowerCase() === "init";
  }, []);
  const handleNodeDataUpdate = useCallback(
    (id, dataPatch) => {
      if (dataPatch._delete) {
        if (isDev()) {
          console.log("[InfiniteCanvas] nodeData delete patch", { id });
        }
        setNodes((prevNodes) => {
          const target = prevNodes.find((node) => node.id === id);
          if (target) {
            requestDeleteNode(target);
          }
          return prevNodes;
        });
        return;
      }
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) => {
          if (node.id !== id) {
            return node;
          }
          const newData = {
            ...node.data,
            ...dataPatch,
            type: node.data.type
          };
          const updatedNode = {
            ...node,
            data: newData
          };
          if (dataPatch.size) {
            updatedNode.width = newData.size.width;
            updatedNode.height = newData.size.height;
            updatedNode.measured = {
              width: newData.size.width,
              height: newData.size.height
            };
          }
          if (dataPatch.position) {
            const pos = dataPatch.position;
            updatedNode.position = {
              x: pos.x,
              y: pos.y
            };
          }
          return updatedNode;
        });
        emitNodesChange(updatedNodes);
        return updatedNodes;
      });
    },
    [emitNodesChange, requestDeleteNode]
  );
  React20.useEffect(() => {
    nodesRef.current = nodes;
    if (pendingDeleteRef.current.size > 0) {
      const existingIds = new Set(nodes.map((node) => node.id));
      pendingDeleteRef.current.forEach((id) => {
        if (!existingIds.has(id)) {
          pendingDeleteRef.current.delete(id);
        }
      });
    }
  }, [nodes]);
  React20.useEffect(() => {
    const unsubscribe = widgetBridge.onCommand(
      "NODE_DELETE_CONFIRM",
      (payload) => {
        if (!payload) {
          return;
        }
        const nodeId = typeof payload === "string" ? payload : payload.nodeId;
        if (typeof nodeId !== "string") {
          return;
        }
        if (isDev()) {
          console.log("[InfiniteCanvas] received NODE_DELETE_CONFIRM", { nodeId });
        }
        confirmDeleteNode(nodeId);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [confirmDeleteNode]);
  React20.useEffect(() => {
    const unsubscribe = widgetBridge.onCommand(
      "NODE_BATCH_DELETE_CONFIRM",
      (payload) => {
        if (!payload?.nodeIds?.length)
          return;
        if (isDev()) {
          console.log("[InfiniteCanvas] received NODE_BATCH_DELETE_CONFIRM", { nodeIds: payload.nodeIds });
        }
        for (const nodeId of payload.nodeIds) {
          confirmDeleteNode(nodeId);
        }
      }
    );
    return () => unsubscribe();
  }, [confirmDeleteNode]);
  React20.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }
      const target = event.target;
      if (target) {
        const tagName = target.tagName?.toLowerCase();
        if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
          return;
        }
      }
      const selectedNodes = nodesRef.current.filter((node) => node.selected);
      if (selectedNodes.length === 0) {
        return;
      }
      if (selectedNodes.length > 1) {
        const nodeIds = selectedNodes.map((n) => n.id);
        const nodeSnapshots = selectedNodes.map((n) => {
          const { onNodeDataChange: _ignore, ...snapshot } = n.data;
          return snapshot;
        });
        widgetBridge.emit(
          createWidgetEvent(
            "NODE_BATCH_DELETE_REQUEST",
            { nodeIds, nodes: nodeSnapshots },
            { source: "ui" }
          )
        );
        return;
      }
      selectedNodes.forEach((node) => requestDeleteNode(node));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestDeleteNode]);
  const updatePaneCursor = useCallback(() => {
    const pane = containerRef.current?.querySelector(".react-flow__pane");
    if (!pane) {
      return;
    }
    if (isNodeDragging) {
      pane.style.cursor = "move";
    } else if (paneCursor === "grab" && isPanDragging) {
      pane.style.cursor = "grabbing";
    } else {
      pane.style.cursor = paneCursor ?? "";
    }
  }, [paneCursor, isNodeDragging, isPanDragging]);
  React20.useEffect(() => {
    updatePaneCursor();
  }, [updatePaneCursor]);
  React20.useEffect(() => {
    if (!onViewportChange) {
      return;
    }
    const last = lastViewportNotifiedRef.current;
    if (last.x === viewport.x && last.y === viewport.y && last.zoom === viewport.zoom) {
      return;
    }
    lastViewportNotifiedRef.current = viewport;
    onViewportChange(viewport);
  }, [onViewportChange, viewport]);
  React20.useEffect(() => {
    const nodeSignature = initialNodes.map((node) => `${node.id}:${node.type}:${node.size.width}:${node.size.height}`).sort().join("|");
    if (initializedRef.current && nodeSignature === initialNodesSignatureRef.current) {
      return;
    }
    initialNodesSignatureRef.current = nodeSignature;
    initializedRef.current = true;
    const prevNodeMap = new Map(nodes.map((n) => [n.id, n]));
    const flowNodes = initialNodes.map((node) => {
      const prevNode = prevNodeMap.get(node.id);
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node,
          onNodeDataChange: handleNodeDataUpdate
        },
        zIndex: node.zIndex,
        selected: prevNode?.selected ?? node.selected ?? false,
        dragging: prevNode?.dragging ?? false,
        width: node.size.width,
        height: node.size.height,
        measured: prevNode?.measured ?? {
          width: node.size.width,
          height: node.size.height
        }
      };
    });
    setNodes(flowNodes);
  }, [initialNodes]);
  const syncSignature = useMemo(() => {
    return initialNodes.map((node) => {
      const depFocus = node.dependencyFocus ?? false;
      const zIndex = typeof node.zIndex === "number" ? node.zIndex : 0;
      const nodeAny = node;
      const rating = nodeAny.rating ?? 0;
      const fontSize = nodeAny.fontSize ?? 0;
      const fontWeight = nodeAny.fontWeight ?? "";
      const textAlign = nodeAny.textAlign ?? "";
      const backgroundColor2 = nodeAny.backgroundColor ?? "";
      const backgroundOpacity = nodeAny.backgroundOpacity ?? 1;
      const fontFamily = nodeAny.fontFamily ?? "";
      const color = nodeAny.color ?? "";
      const content = nodeAny.content ?? "";
      const url = node.url ?? "";
      const rawStatus = String(nodeAny.raw?.status ?? "");
      return `${node.id}:${Math.round(node.position.x * 10)}:${Math.round(node.position.y * 10)}:${depFocus}:${zIndex}:${rating}:${fontSize}:${fontWeight}:${textAlign}:${backgroundColor2}:${backgroundOpacity}:${fontFamily}:${color}:${content}:${url}:${rawStatus}`;
    }).join("|");
  }, [initialNodes]);
  React20.useEffect(() => {
    if (!initializedRef.current) {
      return;
    }
    setNodes((currentNodes) => {
      const nodeUpdates = [];
      initialNodes.forEach((initialNode) => {
        const flowNode = currentNodes.find((n) => n.id === initialNode.id);
        if (flowNode) {
          if (flowNode.dragging) {
            return;
          }
          const dx = Math.abs(flowNode.position.x - initialNode.position.x);
          const dy = Math.abs(flowNode.position.y - initialNode.position.y);
          const posChanged = dx > 0.1 || dy > 0.1;
          const flowDependencyFocus = flowNode.data.dependencyFocus;
          const initialDependencyFocus = initialNode.dependencyFocus;
          const dependencyFocusChanged = flowDependencyFocus !== initialDependencyFocus;
          const flowZIndex = typeof flowNode.zIndex === "number" ? flowNode.zIndex : 0;
          const initialZIndex = typeof initialNode.zIndex === "number" ? initialNode.zIndex : 0;
          const zIndexChanged = flowZIndex !== initialZIndex;
          const flowRating = flowNode.data.rating ?? 0;
          const initialRating = initialNode.rating ?? 0;
          const ratingChanged = flowRating !== initialRating;
          const flowData = flowNode.data;
          const initialData = initialNode;
          const textStyleChanged = (flowData.fontSize ?? 0) !== (initialData.fontSize ?? 0) || (flowData.fontWeight ?? "") !== (initialData.fontWeight ?? "") || (flowData.textAlign ?? "") !== (initialData.textAlign ?? "") || (flowData.backgroundColor ?? "") !== (initialData.backgroundColor ?? "") || (flowData.backgroundOpacity ?? 1) !== (initialData.backgroundOpacity ?? 1) || (flowData.fontFamily ?? "") !== (initialData.fontFamily ?? "") || (flowData.color ?? "") !== (initialData.color ?? "") || (flowData.content ?? "") !== (initialData.content ?? "");
          const urlChanged = flowNode.data.url !== initialNode.url;
          const flowRaw = flowNode.data.raw;
          const initialRaw = initialNode.raw;
          const rawStatusChanged = String(flowRaw?.status ?? "") !== String(initialRaw?.status ?? "");
          if (posChanged || dependencyFocusChanged || zIndexChanged || ratingChanged || textStyleChanged || urlChanged || rawStatusChanged) {
            nodeUpdates.push({
              id: initialNode.id,
              position: initialNode.position,
              initialNode
            });
          }
        }
      });
      if (nodeUpdates.length === 0) {
        return currentNodes;
      }
      return currentNodes.map((node) => {
        const update = nodeUpdates.find((u) => u.id === node.id);
        if (update) {
          const existingData = node.data;
          const { onNodeDataChange } = existingData;
          return {
            ...node,
            position: update.position,
            zIndex: update.initialNode.zIndex,
            // 同步 zIndex
            // 保留当前的 selected 状态，不从 initialNodes 同步
            data: {
              ...update.initialNode,
              onNodeDataChange
              // 保留回调函数
            }
          };
        }
        return node;
      });
    });
  }, [syncSignature, initialNodes]);
  React20.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);
  React20.useEffect(() => {
    if (!instanceReady || nodes.length === 0) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      applyInitialFitView();
    });
    return () => cancelAnimationFrame(frame);
  }, [applyInitialFitView, instanceReady, nodes.length]);
  const nodeTypes = useMemo(
    () => ({
      image: ImageNode,
      video: VideoNode,
      audio: AudioNode,
      text: TextNode
    }),
    []
  );
  const handleNodesChange = useCallback(
    (changes) => {
      const nextChanges = changes.filter((change) => {
        if (change.type !== "remove") {
          return true;
        }
        const target = nodes.find((node) => node.id === change.id);
        if (!target) {
          return true;
        }
        return !isSkeletonNode(target);
      });
      const snapThreshold = config.snapThreshold ?? 5;
      const snapToNodes = config.snapToNodes ?? true;
      const showSnapLines = config.showSnapLines ?? true;
      let nextSnapLines = null;
      const hasDraggingChange = nextChanges.some(
        (change) => change.type === "position" && "dragging" in change && change.dragging === true
      );
      const mappedChanges = nextChanges.map((change) => {
        if (!snapToNodes || change.type !== "position" || !("position" in change) || !change.position || !("dragging" in change) || typeof change.dragging !== "boolean") {
          return change;
        }
        const movingNode = nodes.find((node) => node.id === change.id);
        if (!movingNode) {
          return change;
        }
        const otherNodes = nodes.filter((node) => node.id !== change.id);
        const snapped = getSnappedPosition(change.position, movingNode, otherNodes, snapThreshold);
        const hasSnap = snapped.snapLines && (snapped.snapLines.x !== void 0 || snapped.snapLines.y !== void 0);
        if (change.dragging === true) {
          if (hasSnap) {
            nextSnapLines = snapped.snapLines;
            snapPositionRef.current.set(change.id, snapped.position);
          } else {
            snapPositionRef.current.delete(change.id);
          }
          return {
            ...change,
            position: snapped.position
          };
        }
        if (change.dragging === false) {
          const snappedPosition = snapPositionRef.current.get(change.id);
          if (snappedPosition) {
            snapPositionRef.current.delete(change.id);
            return {
              ...change,
              position: snappedPosition
            };
          }
        }
        return change;
      });
      if (showSnapLines && hasDraggingChange && nextSnapLines) {
        setSnapLines(nextSnapLines);
      } else {
        setSnapLines(null);
      }
      setNodes((nds) => {
        const updatedNodes = applyNodeChanges(mappedChanges, nds);
        const syncedNodes = updatedNodes.map(syncNodeDataSize);
        emitNodesChange(syncedNodes);
        return syncedNodes;
      });
    },
    [
      config.snapThreshold,
      config.snapToNodes,
      config.showSnapLines,
      emitNodesChange,
      isSkeletonNode,
      nodes,
      syncNodeDataSize
    ]
  );
  React20.useEffect(() => {
    isInitialMount.current = false;
  }, []);
  const handleEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const updatedEdges = applyEdgeChanges(changes, eds);
        if (onEdgesChangeCallback && !isInitialMount.current) {
          setTimeout(() => {
            onEdgesChangeCallback(updatedEdges);
          }, 0);
        }
        return updatedEdges;
      });
    },
    [onEdgesChangeCallback]
  );
  const handleConnect = useCallback(
    (connection) => {
      setEdges((eds) => {
        const updatedEdges = addEdge(connection, eds);
        if (onEdgesChangeCallback) {
          setTimeout(() => {
            onEdgesChangeCallback(updatedEdges);
          }, 0);
        }
        return updatedEdges;
      });
    },
    [onEdgesChangeCallback]
  );
  const containerStyle = {
    width,
    height,
    minWidth,
    minHeight,
    backgroundColor,
    position: "relative",
    cursor: isNodeDragging ? "move" : paneCursor === "grab" && isPanDragging ? "grabbing" : paneCursor,
    ...style
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      className: [className, isNodeDragging && "tc-nodes-dragging"].filter(Boolean).join(" "),
      style: containerStyle,
      children: [
        /* @__PURE__ */ jsx("style", { children: `
          @keyframes dependency-edge-dash {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 4.51056px; }
          }
          .dependency-edge-animated path {
            animation: dependency-edge-dash 1.4s linear infinite;
          }
        ` }),
        /* @__PURE__ */ jsx(
          ReactFlow,
          {
            style: {
              width: "100%",
              height: "100%",
              backgroundColor,
              // Override React Flow default background
              "--xy-background-color-default": backgroundColor
            },
            nodes,
            edges,
            nodeTypes,
            onNodesChange: handleNodesChange,
            onEdgesChange: handleEdgesChange,
            onConnect: handleConnect,
            onNodeDragStart: (_, node) => {
              setIsNodeDragging(true);
              document.body.style.cursor = "move";
              onNodeDragStart?.(node.id, node.position);
            },
            onNodeDrag: (_, node) => {
              const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
              onNodeDrag?.(node.id, node.position, selectedNodeIds.length > 1 ? selectedNodeIds : void 0);
            },
            onNodeDragStop: (_, node) => {
              setIsNodeDragging(false);
              document.body.style.cursor = "";
              setSnapLines(null);
              onNodeDragEnd?.(node.id, node.position);
            },
            onNodeContextMenu: (event, node) => {
              if (!onNodeContextMenu) {
                return;
              }
              event.preventDefault();
              event.stopPropagation();
              onNodeContextMenu(event, node);
            },
            onPaneContextMenu: (event) => {
              if (!onPaneContextMenu) {
                return;
              }
              onPaneContextMenu(event);
            },
            deleteKeyCode: null,
            onMoveStart: () => {
              setIsPanDragging(true);
            },
            onMove: (_, nextViewport) => {
              setViewport((prevViewport) => {
                if (prevViewport.x === nextViewport.x && prevViewport.y === nextViewport.y && prevViewport.zoom === nextViewport.zoom) {
                  return prevViewport;
                }
                return nextViewport;
              });
            },
            onMoveEnd: (_, nextViewport) => {
              setIsPanDragging(false);
              setViewport((prevViewport) => {
                if (prevViewport.x === nextViewport.x && prevViewport.y === nextViewport.y && prevViewport.zoom === nextViewport.zoom) {
                  return prevViewport;
                }
                return nextViewport;
              });
            },
            onInit: (instance) => {
              reactFlowInstanceRef.current = instance;
              setInstanceReady(true);
              onReactFlowInit?.(instance);
            },
            onPaneMouseEnter: updatePaneCursor,
            onPaneMouseMove: (event) => {
              updatePaneCursor();
              if (!onPaneMouseMove) {
                return;
              }
              const point = { x: event.clientX, y: event.clientY };
              if (reactFlowInstanceRef.current?.screenToFlowPosition) {
                onPaneMouseMove(reactFlowInstanceRef.current.screenToFlowPosition(point), event);
                return;
              }
              onPaneMouseMove(point, event);
            },
            onNodeClick: (_, node) => {
              onNodeClickCallback?.(node.id);
            },
            onPaneClick: (event) => {
              if (!onPaneClick) {
                return;
              }
              const point = { x: event.clientX, y: event.clientY };
              if (reactFlowInstanceRef.current?.screenToFlowPosition) {
                onPaneClick(reactFlowInstanceRef.current.screenToFlowPosition(point), event);
                return;
              }
              onPaneClick(point, event);
            },
            minZoom: config.minZoom || 0.1,
            maxZoom: config.maxZoom || 4,
            defaultViewport,
            snapToGrid: config.snapToGrid || false,
            snapGrid: config.gridSize ? [config.gridSize, config.gridSize] : void 0,
            fitView: false,
            nodesDraggable,
            nodesConnectable: false,
            elementsSelectable,
            nodeDragThreshold: 5,
            selectNodesOnDrag: true,
            selectionOnDrag,
            selectionMode: SelectionMode.Partial,
            multiSelectionKeyCode: "Shift",
            elevateNodesOnSelect: false,
            panOnDrag,
            panOnScroll: true,
            zoomOnScroll: false,
            zoomOnPinch: true,
            zoomOnDoubleClick: false,
            zoomActivationKeyCode: "Meta",
            panOnScrollSpeed: 1,
            colorMode: "dark",
            proOptions: {
              hideAttribution: true
            },
            children: showControls && /* @__PURE__ */ jsx(
              CanvasControls,
              {
                position: "bottom-left",
                isLocked,
                onLockChange
              }
            )
          }
        ),
        snapLines && /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: "0 0"
            },
            children: [
              snapLines.x !== void 0 && /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    left: snapLines.x,
                    top: -1e4,
                    height: 2e4,
                    borderLeft: "1px dashed rgba(255,255,255,0.2)"
                  }
                }
              ),
              snapLines.y !== void 0 && /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    top: snapLines.y,
                    left: -1e4,
                    width: 2e4,
                    borderTop: "1px dashed rgba(255,255,255,0.2)"
                  }
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function throttle(func, wait) {
  let timeout = null;
  let lastArgs = null;
  return (...args) => {
    lastArgs = args;
    if (!timeout) {
      timeout = setTimeout(() => {
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
        timeout = null;
      }, wait);
    }
  };
}
function useCollaboration(config, onMessage) {
  const {
    canvasId,
    userId,
    userName,
    wsUrl = typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_WS_BASE || "wss://infinite-canvas-collab-worker.topviewai.app",
    token = typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_USER_TOKEN || `user_${userId}`,
    autoReconnect = true,
    reconnectInterval = 3e3,
    enabled = true,
    invisible = false,
    clientIdleTimeout = 5 * 60 * 1e3
    // 默认 2 分钟
  } = config;
  const [connected, setConnected] = useState(false);
  const [seq, setSeq] = useState(0);
  const [presences, setPresences] = useState(/* @__PURE__ */ new Map());
  const [lockedNodes, setLockedNodes] = useState(/* @__PURE__ */ new Map());
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastSeqRef = useRef(0);
  const reconnectBlockedRef = useRef(false);
  const manualCloseRef = useRef(false);
  const shouldReconnectRef = useRef(true);
  const lastUserActivityRef = useRef(Date.now());
  const idleCheckTimerRef = useRef(null);
  const wasIdleDisconnectedRef = useRef(false);
  const lastActivityNotifyRef = useRef(0);
  const activityNotifyIntervalMs = 1e3;
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const startClientIdleCheck = useCallback(() => {
    if (idleCheckTimerRef.current) {
      clearInterval(idleCheckTimerRef.current);
    }
    console.log(`[Collaboration] Starting client-side idle detection (timeout: ${clientIdleTimeout}ms = ${clientIdleTimeout / 1e3}s)`);
    idleCheckTimerRef.current = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastUserActivityRef.current;
      const idleSeconds = Math.floor(idleTime / 1e3);
      console.log(`[Collaboration] Idle check: ${idleSeconds}s idle (threshold: ${clientIdleTimeout / 1e3}s)`);
      if (idleTime > clientIdleTimeout) {
        console.log(`[Collaboration] User idle for ${idleSeconds}s, disconnecting...`);
        wasIdleDisconnectedRef.current = true;
        if (wsRef.current) {
          manualCloseRef.current = true;
          wsRef.current.close(1e3, "Client idle timeout");
          wsRef.current = null;
        }
        setConnected(false);
        stopClientIdleCheck();
        if (onMessageRef.current) {
          onMessageRef.current({
            type: "error" /* ERROR */,
            error: "\u7531\u4E8E\u957F\u65F6\u95F4\u672A\u64CD\u4F5C\uFF0C\u5DF2\u81EA\u52A8\u65AD\u5F00\u8FDE\u63A5\u3002\u79FB\u52A8\u9F20\u6807\u5373\u53EF\u6062\u590D\u8FDE\u63A5\u3002",
            clientIdle: true
          });
        }
      }
    }, 3e4);
  }, [clientIdleTimeout]);
  const stopClientIdleCheck = useCallback(() => {
    if (idleCheckTimerRef.current) {
      clearInterval(idleCheckTimerRef.current);
      idleCheckTimerRef.current = null;
      console.log("[Collaboration] Stopped client-side idle detection");
    }
  }, []);
  const updateUserActivity = useCallback(() => {
    const now = Date.now();
    lastUserActivityRef.current = now;
    const timeSinceLastNotify = now - lastActivityNotifyRef.current;
    if (wsRef.current?.readyState === WebSocket.OPEN && timeSinceLastNotify >= activityNotifyIntervalMs) {
      wsRef.current.send(JSON.stringify({
        type: "user_activity" /* USER_ACTIVITY */,
        timestamp: now
      }));
      lastActivityNotifyRef.current = now;
      console.log("[Collaboration] Notified server of user activity");
    }
  }, []);
  const send = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);
  const throttledDragMove = useRef(
    throttle((nodeId, position) => {
      send({
        type: "drag_move" /* DRAG_MOVE */,
        nodeId,
        position
      });
    }, 33)
    // ~30 fps
  ).current;
  const throttledUpdatePresence = useRef(
    throttle((presence) => {
      send({
        type: "update_presence" /* UPDATE_PRESENCE */,
        presence
      });
    }, 100)
    // ~10 fps
  ).current;
  const throttledUpdateNodes = useRef(
    throttle((updates) => {
      send({
        type: "update_nodes" /* UPDATE_NODES */,
        updates
      });
    }, 33)
    // ~30 fps
  ).current;
  const connect = useCallback(() => {
    if (!enabled) {
      return;
    }
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return;
    }
    try {
      const url = `${wsUrl}/ws/canvas/${canvasId}?token=${token}`;
      console.log("[Collaboration] Connecting to:", url);
      const ws = new WebSocket(url);
      manualCloseRef.current = false;
      ws.onopen = () => {
        console.log("[Collaboration] Connected to canvas:", canvasId);
        setConnected(true);
        reconnectBlockedRef.current = false;
        lastUserActivityRef.current = Date.now();
        startClientIdleCheck();
        try {
          ws.send(
            JSON.stringify({
              type: "join" /* JOIN */,
              userId,
              userName,
              lastSeq: lastSeqRef.current,
              invisible
            })
          );
        } catch (error) {
          console.error("[Collaboration] Error sending JOIN message:", error);
        }
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if ("seq" in message) {
            setSeq(message.seq);
            lastSeqRef.current = message.seq;
          }
          switch (message.type) {
            case "sync_state" /* SYNC_STATE */:
              setPresences(new Map(Object.entries(message.presences)));
              setLockedNodes(new Map(Object.entries(message.lockedNodes)));
              break;
            case "node_locked" /* NODE_LOCKED */:
              setLockedNodes((prev) => {
                const next = new Map(prev);
                next.set(message.nodeId, message.userId);
                return next;
              });
              break;
            case "node_unlocked" /* NODE_UNLOCKED */:
              setLockedNodes((prev) => {
                const next = new Map(prev);
                next.delete(message.nodeId);
                return next;
              });
              break;
            case "presence_update" /* PRESENCE_UPDATE */:
              setPresences((prev) => {
                const next = new Map(prev);
                if (message.presence) {
                  next.set(message.userId, message.presence);
                } else {
                  next.delete(message.userId);
                }
                return next;
              });
              break;
            case "error" /* ERROR */:
              if (message.code === "ROOM_FULL") {
                reconnectBlockedRef.current = true;
                ws.close(4e3, "Room full");
              } else {
                console.error("[Collaboration] Server error:", message.error);
              }
              break;
          }
          onMessageRef.current(message);
        } catch (error) {
          console.error("[Collaboration] Error parsing message:", error);
        }
      };
      ws.onclose = (event) => {
        console.log("[Collaboration] Disconnected from canvas:", canvasId, "code:", event.code, "reason:", event.reason);
        setConnected(false);
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        stopClientIdleCheck();
        const isIdleClose = event.code === 4001 || event.reason === "Idle timeout" || event.reason === "Client idle timeout";
        const isAbnormalClose = event.code === 1006;
        if (event.code === 1013) {
          reconnectBlockedRef.current = true;
        }
        if (event.code === 4e3 || // 房间已满
        event.code === 4002 || // 其他错误
        event.code === 4003 || // 房间被管理员关闭
        event.code === 4004) {
          shouldReconnectRef.current = false;
          reconnectBlockedRef.current = true;
          const reasons = {
            4e3: "\u623F\u95F4\u5DF2\u6EE1",
            4002: "\u8FDE\u63A5\u9519\u8BEF",
            4003: "\u623F\u95F4\u5DF2\u88AB\u7BA1\u7406\u5458\u5173\u95ED",
            4004: "\u60A8\u5DF2\u88AB\u7BA1\u7406\u5458\u79FB\u51FA\u623F\u95F4"
          };
          const reason = reasons[event.code] || event.reason || "\u8FDE\u63A5\u5DF2\u5173\u95ED";
          console.warn(`[Collaboration] \u8FDE\u63A5\u5173\u95ED: ${reason}\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u91CD\u65B0\u8FDE\u63A5`);
          if (onMessageRef.current) {
            onMessageRef.current({
              type: "error" /* ERROR */,
              error: reason,
              permanent: true,
              // 标识这是永久性断开，不会自动重连
              closeCode: event.code
              // WebSocket close code
            });
          }
        }
        if (manualCloseRef.current) {
          manualCloseRef.current = false;
          return;
        }
        if (isIdleClose || isAbnormalClose) {
          wasIdleDisconnectedRef.current = true;
          if (onMessageRef.current) {
            onMessageRef.current({
              type: "error" /* ERROR */,
              error: isIdleClose ? "\u7531\u4E8E\u957F\u65F6\u95F4\u672A\u64CD\u4F5C\uFF0C\u5DF2\u81EA\u52A8\u65AD\u5F00\u8FDE\u63A5\u3002\u79FB\u52A8\u9F20\u6807\u5373\u53EF\u6062\u590D\u8FDE\u63A5\u3002" : "\u8FDE\u63A5\u5DF2\u4E2D\u65AD\uFF0C\u64CD\u4F5C\u540E\u5C06\u81EA\u52A8\u91CD\u8FDE\u3002",
              clientIdle: true
            });
          }
          return;
        }
        if (enabled && autoReconnect && shouldReconnectRef.current && !reconnectBlockedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[Collaboration] Reconnecting...");
            connect();
          }, reconnectInterval);
        }
      };
      ws.onerror = (error) => {
        const wsError = error;
        console.error("[Collaboration] WebSocket error:", {
          error: wsError,
          message: wsError.message || "Unknown error",
          type: wsError.type,
          url,
          readyState: ws.readyState,
          readyStateText: ["CONNECTING", "OPEN", "CLOSING", "CLOSED"][ws.readyState],
          canvasId
        });
      };
      wsRef.current = ws;
    } catch (error) {
      console.error("[Collaboration] Error creating WebSocket:", error);
    }
  }, [canvasId, userId, userName, wsUrl, token, autoReconnect, reconnectInterval, enabled]);
  useEffect(() => {
    if (!enabled) {
      shouldReconnectRef.current = false;
      manualCloseRef.current = true;
      setConnected(false);
      setPresences(/* @__PURE__ */ new Map());
      setLockedNodes(/* @__PURE__ */ new Map());
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }
    shouldReconnectRef.current = true;
    connect();
    return () => {
      shouldReconnectRef.current = false;
      manualCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      stopClientIdleCheck();
    };
  }, [connect, enabled, stopClientIdleCheck]);
  useEffect(() => {
    if (!enabled)
      return;
    const handleActivity = () => {
      if (wasIdleDisconnectedRef.current && !wsRef.current && shouldReconnectRef.current) {
        console.log("[Collaboration] User activity detected after idle disconnect, reconnecting...");
        wasIdleDisconnectedRef.current = false;
        reconnectBlockedRef.current = false;
        connect();
      }
      updateUserActivity();
    };
    const events = [
      "mousemove",
      "mousedown",
      "mouseup",
      "click",
      "dblclick",
      "wheel",
      "pointerdown",
      "pointermove",
      "pointerup",
      "touchstart",
      "touchmove",
      "keydown",
      "dragstart",
      "drag",
      "drop"
    ];
    const listenerOptions = { passive: true, capture: true };
    let throttleTimer = null;
    const throttledActivity = () => {
      if (throttleTimer)
        return;
      throttleTimer = setTimeout(() => {
        handleActivity();
        throttleTimer = null;
      }, 1e3);
    };
    events.forEach((event) => {
      window.addEventListener(event, throttledActivity, listenerOptions);
    });
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledActivity, listenerOptions);
      });
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [enabled, updateUserActivity, connect]);
  const createNode = useCallback(
    (nodeData, tempId) => {
      send({
        type: "create_node" /* CREATE_NODE */,
        tempId: tempId ?? `temp_${Date.now()}`,
        nodeData
      });
    },
    [send]
  );
  const updateNode = useCallback(
    (nodeId, updates) => {
      send({
        type: "update_node" /* UPDATE_NODE */,
        nodeId,
        updates
      });
    },
    [send]
  );
  const updateNodes = useCallback(
    (updates, immediate = false) => {
      if (updates.length === 0) {
        return;
      }
      if (immediate) {
        send({
          type: "update_nodes" /* UPDATE_NODES */,
          updates
        });
      } else {
        throttledUpdateNodes(updates);
      }
    },
    [throttledUpdateNodes, send]
  );
  const deleteNode = useCallback(
    (nodeId) => {
      if (isDev()) {
        console.log("[Collaboration] send delete_node", { nodeId });
      }
      send({
        type: "delete_node" /* DELETE_NODE */,
        nodeId
      });
    },
    [send]
  );
  const dragStart = useCallback(
    (nodeId, position) => {
      send({
        type: "drag_start" /* DRAG_START */,
        nodeId,
        position
      });
    },
    [send]
  );
  const dragMove = useCallback(
    (nodeId, position) => {
      throttledDragMove(nodeId, position);
    },
    [throttledDragMove]
  );
  const dragEnd = useCallback(
    (nodeId, position) => {
      send({
        type: "drag_end" /* DRAG_END */,
        nodeId,
        position
      });
    },
    [send]
  );
  const updatePresence = useCallback(
    (presence) => {
      throttledUpdatePresence(presence);
    },
    [throttledUpdatePresence]
  );
  const leave = useCallback(() => {
    send({ type: "leave" /* LEAVE */ });
  }, [send]);
  const reconnect = useCallback(() => {
    if (!enabled) {
      return;
    }
    reconnectBlockedRef.current = false;
    shouldReconnectRef.current = true;
    wasIdleDisconnectedRef.current = false;
    manualCloseRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      return;
    }
    connect();
  }, [connect, enabled]);
  return {
    connected,
    seq,
    presences,
    lockedNodes,
    createNode,
    updateNode,
    updateNodes,
    deleteNode,
    dragStart,
    dragMove,
    dragEnd,
    updatePresence,
    leave,
    reconnect
  };
}
var DependencyFocusContext = React20.createContext({
  activeNodeId: null,
  toggleNode: () => {
  }
});
var DependencyFocusProvider = DependencyFocusContext.Provider;
var SHORTCUT_GROUPS = [
  {
    title: "View",
    items: [
      { label: "Pan Canvas", keys: [["Scroll"]] },
      { label: "Zoom", keys: [["\u2318", "Scroll"]] },
      { label: "Zoom In", keys: [["\u2318", "+"]] },
      { label: "Zoom Out", keys: [["\u2318", "\u2212"]] },
      { label: "Fit to Screen", keys: [["\u21E7", "1"], ["F"]] },
      { label: "Zoom to Selection", keys: [["\u21E7", "2"]] }
    ]
  },
  {
    title: "Tools",
    items: [
      { label: "Select Tool", keys: [["V"]] },
      { label: "Hand Tool", keys: [["H"]] },
      { label: "Temporary Hand", keys: [["Space", "Drag"]] }
    ]
  },
  {
    title: "Selection",
    items: [
      { label: "Multi-select", keys: [["\u21E7", "Click"]] },
      { label: "Select All", keys: [["\u2318", "A"]] }
    ]
  },
  {
    title: "Edit",
    items: [
      { label: "Copy", keys: [["\u2318", "C"]] },
      { label: "Paste", keys: [["\u2318", "V"]] },
      { label: "Delete", keys: [["Delete"], ["\u232B"]] }
    ]
  },
  {
    title: "Multi-select (2+)",
    items: [
      { label: "Horizontal Space", keys: [["\u21E7", "H"]] },
      { label: "Vertical Space", keys: [["\u21E7", "V"]] },
      { label: "Auto Arrange", keys: [["\u21E7", "A"]] }
    ]
  }
];
function KeyBadge({ children }) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 24,
        height: 24,
        padding: "0 6px",
        borderRadius: 5,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.1)",
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "Inter, -apple-system, sans-serif",
        color: "rgba(255,255,255,0.7)",
        lineHeight: 1
      },
      children
    }
  );
}
function KeyboardShortcutsModal({ open, onClose }) {
  React20.useEffect(() => {
    if (!open)
      return;
    const handler = (e) => {
      if (e.key === "Escape")
        onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open)
    return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      onClick: onClose,
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)"
            }
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              position: "relative",
              width: 400,
              maxHeight: "calc(100vh - 120px)",
              overflow: "auto",
              background: "#1c1e22",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              padding: "24px 0",
              fontFamily: "Inter, -apple-system, sans-serif",
              color: "#fff"
            },
            children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.06)"
                  },
                  children: [
                    /* @__PURE__ */ jsx("span", { style: { fontSize: 16, fontWeight: 600 }, children: "Keyboard Shortcuts" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        "aria-label": "Close",
                        onClick: onClose,
                        style: {
                          width: 28,
                          height: 28,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "transparent",
                          border: "none",
                          borderRadius: 6,
                          color: "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                          transition: "background 120ms"
                        },
                        onMouseEnter: (e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.background = "transparent";
                        },
                        children: /* @__PURE__ */ jsx(X, { size: 16 })
                      }
                    )
                  ]
                }
              ),
              SHORTCUT_GROUPS.map((group) => /* @__PURE__ */ jsxs("div", { style: { padding: "16px 24px 0" }, children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      fontSize: 11,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 8
                    },
                    children: group.title
                  }
                ),
                group.items.map((item) => /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0"
                    },
                    children: [
                      /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.8)" }, children: item.label }),
                      /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: item.keys.map((combo, ci) => /* @__PURE__ */ jsxs(React20.Fragment, { children: [
                        ci > 0 && /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: "rgba(255,255,255,0.3)" }, children: "/" }),
                        /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: combo.map((key, ki) => /* @__PURE__ */ jsx(KeyBadge, { children: key }, ki)) })
                      ] }, ci)) })
                    ]
                  },
                  item.label
                ))
              ] }, group.title))
            ]
          }
        )
      ]
    }
  );
}
var TOOLBAR_BG = "rgba(31, 31, 31, 1)";
var TOOLBAR_BORDER = "1px solid rgba(255,255,255,0.08)";
var TOOLBAR_SHADOW = "0 4px 16px rgba(0,0,0,0.2)";
var DIVIDER_COLOR = "rgba(255,255,255,0.06)";
function ZoomOutIcon2() {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: { width: 16, height: 16, display: "block" }, children: [
    /* @__PURE__ */ jsx("circle", { cx: "7", cy: "7", r: "4.5", stroke: "currentColor", strokeWidth: "1.2" }),
    /* @__PURE__ */ jsx("path", { d: "M10.5 10.5L14 14", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M5 7H9", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })
  ] });
}
function ZoomInIcon2() {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 16 16", fill: "none", xmlns: "http://www.w3.org/2000/svg", style: { width: 16, height: 16, display: "block" }, children: [
    /* @__PURE__ */ jsx("circle", { cx: "7", cy: "7", r: "4.5", stroke: "currentColor", strokeWidth: "1.2" }),
    /* @__PURE__ */ jsx("path", { d: "M10.5 10.5L14 14", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M5 7H9", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" }),
    /* @__PURE__ */ jsx("path", { d: "M7 5V9", stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round" })
  ] });
}
function ToolbarButton({
  label,
  shortcutKeys,
  active,
  disabled,
  cursorOverride,
  onClick,
  children
}) {
  const [hovered, setHovered] = React20.useState(false);
  const [pressed, setPressed] = React20.useState(false);
  const bg = active ? "#ffffff" : hovered && !disabled ? "rgba(255,255,255,0.08)" : "transparent";
  const cursor = disabled ? "not-allowed" : cursorOverride ? pressed ? "grabbing" : cursorOverride : "pointer";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: { position: "relative" },
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => {
        setHovered(false);
        setPressed(false);
      },
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick,
            disabled,
            "aria-label": label,
            onMouseDown: () => setPressed(true),
            onMouseUp: () => setPressed(false),
            style: {
              width: 32,
              height: 32,
              padding: 0,
              borderRadius: 4,
              border: "none",
              background: bg,
              color: disabled ? "rgba(255,255,255,0.25)" : active ? "#000000" : "rgba(255,255,255,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor,
              transition: "background 120ms ease, color 120ms ease"
            },
            children
          }
        ),
        hovered && !disabled && /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              marginBottom: 8,
              padding: "5px 8px",
              borderRadius: 6,
              background: "#252525",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              color: "#fff",
              fontSize: 11,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 10,
              display: "flex",
              alignItems: "center"
            },
            children: [
              /* @__PURE__ */ jsx("span", { children: label }),
              shortcutKeys && /* @__PURE__ */ jsx(ShortcutBadge, { keys: shortcutKeys })
            ]
          }
        )
      ]
    }
  );
}
function Divider() {
  return /* @__PURE__ */ jsx("div", { style: { width: 1, height: 24, background: DIVIDER_COLOR, margin: "0 4px", flexShrink: 0 } });
}
function BottomToolbar({
  visible = true,
  toolMode,
  onToolModeChange,
  viewport,
  reactFlowInstance,
  layersPanelOpen,
  onLayersToggle,
  canEdit,
  isLocked,
  sidebarOffset = 0,
  onAddAsset
}) {
  const displayZoom = Math.round(viewport.zoom * 100);
  const canZoomIn = viewport.zoom < 3.99;
  const canZoomOut = viewport.zoom > 0.11;
  const [zoomHovered, setZoomHovered] = React20.useState(false);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [tempZoomValue, setTempZoomValue] = useState("");
  const zoomInputRef = useRef(null);
  const handleZoomIn = React20.useCallback(() => {
    reactFlowInstance?.zoomIn({ duration: 0 });
  }, [reactFlowInstance]);
  const handleZoomOut = React20.useCallback(() => {
    reactFlowInstance?.zoomOut({ duration: 0 });
  }, [reactFlowInstance]);
  React20.useCallback(() => {
    reactFlowInstance?.zoomTo(1, { duration: 200 });
  }, [reactFlowInstance]);
  const handleZoomCommit = () => {
    let val = parseFloat(tempZoomValue);
    if (!isNaN(val)) {
      val = Math.max(10, Math.min(400, val));
      reactFlowInstance?.zoomTo(val / 100, { duration: 200 });
    }
    setIsEditingZoom(false);
  };
  useEffect(() => {
    if (isEditingZoom && zoomInputRef.current) {
      zoomInputRef.current.focus();
      zoomInputRef.current.select();
    }
  }, [isEditingZoom]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      onPointerDown: (e) => e.stopPropagation(),
      style: {
        position: "absolute",
        bottom: 12,
        left: `calc(50% + ${sidebarOffset / 2}px)`,
        transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(28px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
        zIndex: 200,
        pointerEvents: visible ? "auto" : "none"
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 8,
            borderRadius: 8,
            background: TOOLBAR_BG,
            border: TOOLBAR_BORDER,
            boxShadow: TOOLBAR_SHADOW,
            fontFamily: "Inter, sans-serif"
          },
          children: [
            /* @__PURE__ */ jsx(ToolbarButton, { label: "Select", shortcutKeys: ["V"], active: toolMode === "edit", onClick: () => onToolModeChange("edit"), children: /* @__PURE__ */ jsx(EditModeIcon, { size: 20 }) }),
            /* @__PURE__ */ jsx(
              ToolbarButton,
              {
                label: "Hand",
                shortcutKeys: ["H"],
                active: toolMode === "pan",
                cursorOverride: toolMode === "pan" ? "grab" : void 0,
                onClick: () => onToolModeChange("pan"),
                children: /* @__PURE__ */ jsx(PanModeIcon, { size: 20 })
              }
            ),
            /* @__PURE__ */ jsx(Divider, {}),
            onAddAsset && /* @__PURE__ */ jsx(ToolbarButton, { label: "Add Asset", onClick: onAddAsset, disabled: !canEdit || isLocked, children: /* @__PURE__ */ jsx("div", { style: {
              width: 16,
              height: 16,
              borderRadius: 4,
              border: "1.2px solid currentColor",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }, children: /* @__PURE__ */ jsx(Plus, { size: 12, strokeWidth: 2.4 }) }) }),
            /* @__PURE__ */ jsx(Divider, {}),
            /* @__PURE__ */ jsx(ToolbarButton, { label: "Zoom out", shortcutKeys: ["\u2318", "\u2212"], disabled: !canZoomOut, onClick: handleZoomOut, children: /* @__PURE__ */ jsx(ZoomOutIcon2, {}) }),
            isEditingZoom ? /* @__PURE__ */ jsx(
              "input",
              {
                ref: zoomInputRef,
                value: tempZoomValue,
                onChange: (e) => setTempZoomValue(e.target.value),
                onBlur: handleZoomCommit,
                onKeyDown: (e) => {
                  if (e.key === "Enter") {
                    handleZoomCommit();
                  } else if (e.key === "Escape") {
                    setIsEditingZoom(false);
                  }
                },
                style: {
                  width: 44,
                  textAlign: "center",
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  outline: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 500,
                  height: 32,
                  padding: 0
                }
              }
            ) : /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                "aria-label": `Zoom ${Math.round(displayZoom)}%, click to set`,
                onClick: () => {
                  setTempZoomValue(String(Math.round(displayZoom)));
                  setIsEditingZoom(true);
                },
                onMouseEnter: () => setZoomHovered(true),
                onMouseLeave: () => setZoomHovered(false),
                style: {
                  minWidth: 44,
                  height: 32,
                  padding: "0 4px",
                  borderRadius: 8,
                  border: "none",
                  background: zoomHovered ? "rgba(255,255,255,0.08)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  lineHeight: "16px",
                  fontWeight: 500,
                  color: zoomHovered ? "#fff" : "rgba(255,255,255,0.95)",
                  cursor: "pointer",
                  transition: "background 120ms ease, color 120ms ease",
                  userSelect: "none",
                  fontVariantNumeric: "tabular-nums"
                },
                children: [
                  Math.round(displayZoom),
                  "%"
                ]
              }
            ),
            /* @__PURE__ */ jsx(ToolbarButton, { label: "Zoom in", shortcutKeys: ["\u2318", "+"], disabled: !canZoomIn, onClick: handleZoomIn, children: /* @__PURE__ */ jsx(ZoomInIcon2, {}) }),
            /* @__PURE__ */ jsx(Divider, {}),
            /* @__PURE__ */ jsx(ToolbarButton, { label: "Layers", active: layersPanelOpen, onClick: onLayersToggle, children: /* @__PURE__ */ jsx(LayersIcon, { size: 16 }) })
          ]
        }
      )
    }
  );
}
var MODAL_PADDING = 24;
var MODAL_TOP_PADDING = 48;
function ImmersiveModal({
  open,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  footer,
  onClose,
  children,
  maxWidth = 1800
}) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  useEffect(() => {
    if (open) {
      setAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setAnimating(false), 180);
      return () => clearTimeout(timer);
    }
  }, [open]);
  useEffect(() => {
    if (!open)
      return;
    const handleKey = (e) => {
      if (e.key === "Escape")
        onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);
  if (!open && !animating)
    return null;
  const hasTabs = tabs && tabs.length > 1;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        padding: `${MODAL_TOP_PADDING}px ${MODAL_PADDING}px ${MODAL_PADDING}px ${MODAL_PADDING + 64}px`,
        fontFamily: "Inter, -apple-system, sans-serif"
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            onClick: onClose,
            style: {
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              opacity: visible ? 1 : 0,
              transition: "opacity 200ms ease"
            }
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              position: "relative",
              width: "84vw",
              minWidth: 300,
              maxWidth,
              borderRadius: 16,
              background: "#000000",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1)" : "scale(0.96)",
              transition: "opacity 200ms ease, transform 200ms ease"
            },
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  style: {
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 100ms ease, color 100ms ease, border-color 100ms ease",
                    zIndex: 10
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  },
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              ),
              /* @__PURE__ */ jsxs("div", { style: {
                padding: "32px 32px 16px",
                flexShrink: 0,
                textAlign: "center"
              }, children: [
                /* @__PURE__ */ jsx("h2", { style: {
                  margin: 0,
                  fontSize: 32,
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 600,
                  color: "#fff",
                  lineHeight: "40px"
                }, children: title }),
                subtitle && /* @__PURE__ */ jsx("p", { style: {
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                  lineHeight: "18px"
                }, children: subtitle }),
                hasTabs && /* @__PURE__ */ jsx("div", { style: {
                  display: "flex",
                  gap: 0,
                  marginTop: 12,
                  justifyContent: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.06)"
                }, children: tabs.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => onTabChange?.(tab.id),
                      style: {
                        padding: "8px 16px",
                        border: "none",
                        background: "transparent",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 400,
                        cursor: "pointer",
                        position: "relative",
                        transition: "color 120ms ease"
                      },
                      children: [
                        tab.label,
                        isActive && /* @__PURE__ */ jsx("div", { style: {
                          position: "absolute",
                          bottom: 0,
                          left: "15%",
                          right: "15%",
                          height: 2,
                          borderRadius: 1,
                          background: "#fff"
                        } })
                      ]
                    },
                    tab.id
                  );
                }) })
              ] }),
              /* @__PURE__ */ jsx("div", { style: {
                flex: 1,
                overflow: "hidden",
                padding: "0 32px",
                display: "flex",
                flexDirection: "column",
                minHeight: 0
              }, children }),
              footer && /* @__PURE__ */ jsx("div", { style: {
                padding: "16px 32px 48px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0
              }, children: footer })
            ]
          }
        )
      ]
    }
  );
}
function makePlaceholder(hue, sat, light, label) {
  const bg = `hsl(${hue}, ${sat}%, ${light}%)`;
  const fg = light > 50 ? `hsl(${hue}, ${sat}%, ${Math.max(light - 35, 15)}%)` : `hsl(${hue}, ${Math.min(sat + 10, 80)}%, ${Math.min(light + 40, 85)}%)`;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="4" fill="${bg}"/><text x="60" y="66" text-anchor="middle" font-size="10" font-family="sans-serif" fill="${fg}">${label}</text></svg>`)}`;
}
var TEMPLATE_CATEGORIES = [
  {
    id: "general",
    label: "General Display",
    items: [
      { id: "g1", label: "Studio White", thumbnail: makePlaceholder(40, 8, 94, "Studio") },
      { id: "g2", label: "Warm Light", thumbnail: makePlaceholder(35, 55, 65, "Warm") },
      { id: "g3", label: "Soft Shadow", thumbnail: makePlaceholder(30, 15, 82, "Shadow") },
      { id: "g4", label: "Golden Hour", thumbnail: makePlaceholder(38, 70, 58, "Golden") },
      { id: "g5", label: "Cream Tone", thumbnail: makePlaceholder(42, 30, 88, "Cream") },
      { id: "g6", label: "Amber Glow", thumbnail: makePlaceholder(30, 65, 52, "Amber") },
      { id: "g7", label: "Ivory", thumbnail: makePlaceholder(45, 12, 92, "Ivory") },
      { id: "g8", label: "Candle Light", thumbnail: makePlaceholder(28, 60, 48, "Candle") },
      { id: "g9", label: "Honey", thumbnail: makePlaceholder(40, 72, 55, "Honey") },
      { id: "g10", label: "Champagne", thumbnail: makePlaceholder(48, 25, 80, "Champagne") },
      { id: "g11", label: "Peach", thumbnail: makePlaceholder(20, 50, 75, "Peach") },
      { id: "g12", label: "Terracotta", thumbnail: makePlaceholder(15, 55, 50, "Terracotta") },
      { id: "g13", label: "Sienna", thumbnail: makePlaceholder(18, 60, 42, "Sienna") },
      { id: "g14", label: "Caramel", thumbnail: makePlaceholder(32, 58, 48, "Caramel") },
      { id: "g15", label: "Rust", thumbnail: makePlaceholder(12, 65, 40, "Rust") }
    ]
  },
  {
    id: "fabric",
    label: "Fabric & Velvet",
    items: [
      { id: "f1", label: "Silk White", thumbnail: makePlaceholder(0, 0, 95, "Silk") },
      { id: "f2", label: "Linen Beige", thumbnail: makePlaceholder(38, 25, 72, "Linen") },
      { id: "f3", label: "Velvet Red", thumbnail: makePlaceholder(0, 55, 35, "Velvet") },
      { id: "f4", label: "Satin Gold", thumbnail: makePlaceholder(45, 65, 55, "Satin") },
      { id: "f5", label: "Cashmere", thumbnail: makePlaceholder(30, 18, 78, "Cashmere") },
      { id: "f6", label: "Blush Pink", thumbnail: makePlaceholder(340, 40, 80, "Blush") },
      { id: "f7", label: "Champagne Silk", thumbnail: makePlaceholder(42, 30, 82, "Champ.") },
      { id: "f8", label: "Ivory Drape", thumbnail: makePlaceholder(48, 15, 90, "Drape") },
      { id: "f9", label: "Mocha Suede", thumbnail: makePlaceholder(25, 35, 45, "Suede") },
      { id: "f10", label: "Dusty Rose", thumbnail: makePlaceholder(350, 30, 65, "Rose") },
      { id: "f11", label: "Taupe", thumbnail: makePlaceholder(30, 15, 55, "Taupe") },
      { id: "f12", label: "Burgundy", thumbnail: makePlaceholder(345, 50, 30, "Burgundy") },
      { id: "f13", label: "Olive Cloth", thumbnail: makePlaceholder(80, 30, 40, "Olive") },
      { id: "f14", label: "Navy Fabric", thumbnail: makePlaceholder(220, 45, 28, "Navy") }
    ]
  },
  {
    id: "home",
    label: "Home Life",
    items: [
      { id: "h1", label: "Kitchen Counter", thumbnail: makePlaceholder(30, 10, 85, "Kitchen") },
      { id: "h2", label: "Bathroom Shelf", thumbnail: makePlaceholder(200, 8, 88, "Bath") },
      { id: "h3", label: "Wooden Table", thumbnail: makePlaceholder(28, 45, 42, "Wood") },
      { id: "h4", label: "Bookshelf", thumbnail: makePlaceholder(25, 30, 38, "Shelf") },
      { id: "h5", label: "Window Sill", thumbnail: makePlaceholder(50, 12, 90, "Window") },
      { id: "h6", label: "Cozy Corner", thumbnail: makePlaceholder(35, 25, 55, "Cozy") },
      { id: "h7", label: "Plant Shelf", thumbnail: makePlaceholder(120, 35, 45, "Plant") },
      { id: "h8", label: "Bedside", thumbnail: makePlaceholder(30, 15, 75, "Bedside") },
      { id: "h9", label: "Desk Setup", thumbnail: makePlaceholder(210, 10, 50, "Desk") },
      { id: "h10", label: "Fireplace", thumbnail: makePlaceholder(15, 50, 35, "Fire") },
      { id: "h11", label: "Dining", thumbnail: makePlaceholder(35, 20, 65, "Dining") },
      { id: "h12", label: "Living Room", thumbnail: makePlaceholder(40, 12, 70, "Living") }
    ]
  },
  {
    id: "water",
    label: "Water Elements",
    items: [
      { id: "w1", label: "Ocean Blue", thumbnail: makePlaceholder(200, 60, 50, "Ocean") },
      { id: "w2", label: "Pool Aqua", thumbnail: makePlaceholder(185, 55, 60, "Pool") },
      { id: "w3", label: "Splash", thumbnail: makePlaceholder(195, 50, 65, "Splash") },
      { id: "w4", label: "Rain Drops", thumbnail: makePlaceholder(210, 35, 55, "Rain") },
      { id: "w5", label: "Underwater", thumbnail: makePlaceholder(200, 65, 35, "Under") },
      { id: "w6", label: "Ice Crystal", thumbnail: makePlaceholder(195, 25, 85, "Ice") },
      { id: "w7", label: "Teal Wave", thumbnail: makePlaceholder(175, 50, 45, "Teal") },
      { id: "w8", label: "Mist", thumbnail: makePlaceholder(200, 15, 80, "Mist") },
      { id: "w9", label: "Deep Sea", thumbnail: makePlaceholder(215, 60, 25, "Deep") },
      { id: "w10", label: "Coral Reef", thumbnail: makePlaceholder(180, 45, 55, "Coral") },
      { id: "w11", label: "Lagoon", thumbnail: makePlaceholder(170, 55, 50, "Lagoon") },
      { id: "w12", label: "Dewdrop", thumbnail: makePlaceholder(140, 30, 70, "Dew") }
    ]
  },
  {
    id: "sand",
    label: "Sand & Rocks",
    items: [
      { id: "r1", label: "Beach Sand", thumbnail: makePlaceholder(42, 40, 72, "Sand") },
      { id: "r2", label: "Desert Dune", thumbnail: makePlaceholder(38, 55, 62, "Dune") },
      { id: "r3", label: "Marble White", thumbnail: makePlaceholder(0, 0, 90, "Marble") },
      { id: "r4", label: "Slate Gray", thumbnail: makePlaceholder(210, 8, 45, "Slate") },
      { id: "r5", label: "Granite", thumbnail: makePlaceholder(0, 0, 55, "Granite") },
      { id: "r6", label: "Sandstone", thumbnail: makePlaceholder(30, 35, 60, "Stone") },
      { id: "r7", label: "Pebbles", thumbnail: makePlaceholder(25, 12, 65, "Pebble") },
      { id: "r8", label: "Concrete", thumbnail: makePlaceholder(0, 0, 62, "Concrete") },
      { id: "r9", label: "Obsidian", thumbnail: makePlaceholder(240, 10, 18, "Obsidian") },
      { id: "r10", label: "Terracotta Tile", thumbnail: makePlaceholder(15, 50, 48, "Tile") },
      { id: "r11", label: "Clay", thumbnail: makePlaceholder(20, 40, 55, "Clay") }
    ]
  },
  {
    id: "creative",
    label: "Creative Photography",
    items: [
      { id: "c1", label: "Neon Glow", thumbnail: makePlaceholder(280, 70, 30, "Neon") },
      { id: "c2", label: "Gradient Sunset", thumbnail: makePlaceholder(15, 75, 55, "Sunset") },
      { id: "c3", label: "Holographic", thumbnail: makePlaceholder(300, 50, 65, "Holo") },
      { id: "c4", label: "Smoke", thumbnail: makePlaceholder(0, 0, 25, "Smoke") },
      { id: "c5", label: "Sparkle", thumbnail: makePlaceholder(50, 60, 50, "Sparkle") },
      { id: "c6", label: "Galaxy", thumbnail: makePlaceholder(260, 55, 20, "Galaxy") },
      { id: "c7", label: "Prism", thumbnail: makePlaceholder(320, 45, 60, "Prism") },
      { id: "c8", label: "Aurora", thumbnail: makePlaceholder(160, 55, 40, "Aurora") },
      { id: "c9", label: "Retro Film", thumbnail: makePlaceholder(40, 40, 50, "Retro") },
      { id: "c10", label: "Pop Art", thumbnail: makePlaceholder(350, 70, 55, "Pop") },
      { id: "c11", label: "Cyberpunk", thumbnail: makePlaceholder(290, 65, 35, "Cyber") },
      { id: "c12", label: "Bokeh", thumbnail: makePlaceholder(45, 30, 40, "Bokeh") }
    ]
  }
];
var SAMPLE_PRODUCTS = [
  { id: "s1", url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="%23f5f0eb"/><text x="40" y="44" text-anchor="middle" font-size="28">\u{1F9F4}</text></svg>', label: "Serum" },
  { id: "s2", url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="%23fce4ec"/><text x="40" y="44" text-anchor="middle" font-size="28">\u{1F484}</text></svg>', label: "Lipstick" },
  { id: "s3", url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="%23e8d5c4"/><text x="40" y="44" text-anchor="middle" font-size="28">\u{1F45C}</text></svg>', label: "Handbag" },
  { id: "s4", url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="8" fill="%23e0f2fe"/><text x="40" y="44" text-anchor="middle" font-size="28">\u{1F9EA}</text></svg>', label: "Bottle" }
];
var DEFAULT_STATE3 = {
  productImageUrl: "",
  productMaskDataUrl: void 0,
  backgroundPrompt: "",
  backgroundImageUrl: "",
  selectedTemplateId: "",
  ratio: "1:1"
};
function TemplateCategoryRow({
  category,
  selectedId,
  onSelect
}) {
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: 16 }, children: [
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
      padding: "0 2px"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }, children: category.label }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          style: {
            border: "none",
            background: "transparent",
            padding: "2px 0",
            color: "rgba(255,255,255,0.3)",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
            transition: "color 100ms ease"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.3)";
          },
          children: [
            "More ",
            /* @__PURE__ */ jsx(ChevronRight, { size: 12 })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      paddingBottom: 4,
      scrollbarWidth: "thin",
      scrollbarColor: "rgba(255,255,255,0.08) transparent"
    }, children: category.items.map((item) => {
      const isSelected = item.id === selectedId;
      return /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => onSelect(item.id),
          title: item.label,
          style: {
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: 6,
            padding: 0,
            border: isSelected ? "2px solid #ffffff" : "2px solid transparent",
            background: "#2c2c2c",
            cursor: "pointer",
            overflow: "hidden",
            transition: "border-color 100ms ease, transform 80ms ease",
            transform: isSelected ? "scale(1.05)" : "scale(1)"
          },
          onMouseEnter: (e) => {
            if (!isSelected)
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          },
          onMouseLeave: (e) => {
            if (!isSelected)
              e.currentTarget.style.borderColor = "transparent";
          },
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: item.thumbnail,
              alt: item.label,
              style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
            }
          )
        },
        item.id
      );
    }) })
  ] });
}
function ProductPhotographyModal({
  open,
  nodeId,
  initialState,
  credits = 25,
  onSubmit,
  onClose,
  onUploadProduct,
  onUploadBackground,
  onSelectFromBoard
}) {
  const [state, setState] = useState(() => ({
    ...DEFAULT_STATE3,
    ...initialState
  }));
  const [bgMode, setBgMode] = useState("image");
  const [bgSource, setBgSource] = useState("templates");
  const [hoverProduct, setHoverProduct] = useState(false);
  React20.useEffect(() => {
    if (initialState) {
      setState((prev) => ({ ...prev, ...initialState }));
    }
  }, [initialState]);
  const update = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);
  const hasProduct = state.productImageUrl !== "";
  const hasBg = bgMode === "image" ? state.backgroundImageUrl !== "" || state.selectedTemplateId !== "" : state.backgroundPrompt.trim() !== "";
  const canSubmit = hasProduct && hasBg;
  const handleSubmit = useCallback((_withWatermark) => {
    if (!canSubmit)
      return;
    onSubmit(state);
  }, [canSubmit, onSubmit, state]);
  const sectionLabel6 = {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.85)",
    display: "block",
    marginBottom: 12
  };
  const tabBtnStyle = (mode) => ({
    flex: 1,
    height: 36,
    borderRadius: 8,
    border: "none",
    background: bgMode === mode ? "rgba(255,255,255,0.08)" : "transparent",
    color: bgMode === mode ? "#fff" : "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    transition: "all 120ms ease"
  });
  state.selectedTemplateId ? TEMPLATE_CATEGORIES.flatMap((c) => c.items).find((t) => t.id === state.selectedTemplateId)?.thumbnail : void 0;
  return /* @__PURE__ */ jsx(
    ImmersiveModal,
    {
      open,
      title: "Product Photography",
      onClose,
      maxWidth: 1800,
      footer: /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => canSubmit && handleSubmit(false),
          style: {
            height: 40,
            width: 400,
            padding: "0 24px",
            borderRadius: 12,
            border: "none",
            fontSize: 16,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 120ms ease",
            background: canSubmit ? "#3643FF" : "rgba(255,255,255,0.08)",
            color: canSubmit ? "#fff" : "rgba(255,255,255,0.4)",
            cursor: canSubmit ? "pointer" : "default"
          },
          children: [
            /* @__PURE__ */ jsx("span", { children: "Generate" }),
            /* @__PURE__ */ jsx("div", { style: { width: 1, height: 16, background: canSubmit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)" } }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ jsx(Crown, { size: 16, color: canSubmit ? "#facc15" : "currentColor" }),
              /* @__PURE__ */ jsx("span", { children: credits })
            ] })
          ]
        }
      ) }),
      children: /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        gap: 28,
        flex: 1,
        minHeight: 0
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }, children: [
          /* @__PURE__ */ jsx("span", { style: sectionLabel6, children: "Product Image" }),
          state.productImageUrl ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
            /* @__PURE__ */ jsxs("div", { style: {
              position: "relative",
              width: "100%",
              aspectRatio: "1",
              borderRadius: 12,
              overflow: "hidden",
              background: "#111",
              backgroundImage: "repeating-linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222), repeating-linear-gradient(45deg, #222 25%, #1a1a1a 25%, #1a1a1a 75%, #222 75%, #222)",
              backgroundPosition: "0 0, 10px 10px",
              backgroundSize: "20px 20px"
            }, children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: state.productImageUrl,
                  alt: "Product",
                  style: { width: "100%", height: "100%", objectFit: "contain", display: "block", transform: "scale(0.65)" }
                }
              ),
              /* @__PURE__ */ jsxs("div", { style: {
                position: "absolute",
                top: "17.5%",
                left: "17.5%",
                right: "17.5%",
                bottom: "17.5%",
                border: "1.5px solid #facc15",
                pointerEvents: "none"
              }, children: [
                /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: -5, left: -5, width: 10, height: 10, background: "#fff", borderRadius: "50%" } }),
                /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: -5, right: -5, width: 10, height: 10, background: "#fff", borderRadius: "50%" } }),
                /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: -5, left: -5, width: 10, height: 10, background: "#fff", borderRadius: "50%" } }),
                /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: -5, right: -5, width: 10, height: 10, background: "#fff", borderRadius: "50%" } }),
                /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)", width: 20, height: 20, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(RefreshCw, { size: 12, color: "#000" }) }),
                /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: -18, left: "50%", width: 1.5, height: 18, background: "#facc15" } })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => update("productImageUrl", ""),
                  style: {
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    backdropFilter: "blur(8px)",
                    zIndex: 10
                  },
                  children: "\xD7"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, justifyContent: "center" }, children: ["9:16", "3:4", "1:1", "4:3", "16:9"].map((r) => /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => update("ratio", r),
                style: {
                  flex: 1,
                  height: 32,
                  borderRadius: 6,
                  background: state.ratio === r ? "rgba(255,255,255,0.1)" : "transparent",
                  border: `1px solid ${state.ratio === r ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                  color: state.ratio === r ? "#fff" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 120ms ease"
                },
                children: r
              },
              r
            )) })
          ] }) : /* @__PURE__ */ jsxs(
            "div",
            {
              style: { position: "relative", width: "100%", aspectRatio: "1" },
              onMouseEnter: () => setHoverProduct(true),
              onMouseLeave: () => setHoverProduct(false),
              children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => onUploadProduct?.(),
                    style: {
                      width: "100%",
                      height: "100%",
                      borderRadius: 12,
                      border: "1.5px dashed rgba(255,255,255,0.15)",
                      background: hoverProduct ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      fontSize: 13,
                      fontWeight: 500,
                      transition: "background 120ms ease, border-color 120ms ease",
                      borderColor: hoverProduct ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"
                    },
                    children: [
                      /* @__PURE__ */ jsx(CloudUpload, { size: 28, style: { opacity: 0.5 } }),
                      /* @__PURE__ */ jsx("span", { children: "Upload Image" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: (e) => {
                      e.stopPropagation();
                      onSelectFromBoard?.();
                    },
                    style: {
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      right: 12,
                      height: 36,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(0,0,0,0.85)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      cursor: "pointer",
                      opacity: hoverProduct ? 1 : 0,
                      transform: hoverProduct ? "translateY(0)" : "translateY(4px)",
                      transition: "all 150ms ease",
                      pointerEvents: hoverProduct ? "auto" : "none"
                    },
                    children: [
                      /* @__PURE__ */ jsx(LayoutGrid, { size: 14 }),
                      "Select from Board"
                    ]
                  }
                )
              ]
            }
          ),
          !state.productImageUrl && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { style: {
              fontSize: 11,
              fontWeight: 500,
              color: "rgba(255,255,255,0.35)",
              display: "block",
              marginBottom: 8
            }, children: "Quick start with examples:" }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8 }, children: SAMPLE_PRODUCTS.map((s) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => update("productImageUrl", s.url),
                style: {
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  padding: 0,
                  border: state.productImageUrl === s.url ? "2px solid #ffffff" : "2px solid transparent",
                  background: "#2c2c2c",
                  cursor: "pointer",
                  overflow: "hidden",
                  flexShrink: 0,
                  transition: "border-color 100ms ease, transform 100ms ease",
                  transform: state.productImageUrl === s.url ? "scale(1.04)" : "scale(1)"
                },
                onMouseEnter: (e) => {
                  if (state.productImageUrl !== s.url)
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                },
                onMouseLeave: (e) => {
                  if (state.productImageUrl !== s.url)
                    e.currentTarget.style.borderColor = "transparent";
                },
                children: /* @__PURE__ */ jsx("img", { src: s.url, alt: s.label, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } })
              },
              s.id
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }, children: [
          /* @__PURE__ */ jsx("span", { style: sectionLabel6, children: "Background" }),
          /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            gap: 0,
            padding: 3,
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)"
          }, children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setBgMode("image"), style: tabBtnStyle("image"), children: "Image Background" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setBgMode("prompt"), style: tabBtnStyle("prompt"), children: "Prompt Background" })
          ] }),
          bgMode === "image" ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0 }, children: [
            state.backgroundImageUrl && /* @__PURE__ */ jsxs("div", { style: {
              position: "relative",
              width: "100%",
              height: 100,
              borderRadius: 12,
              overflow: "hidden",
              background: "#111",
              flexShrink: 0
            }, children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: state.backgroundImageUrl,
                  alt: "Background",
                  style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    update("backgroundImageUrl", "");
                  },
                  style: {
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "rgba(0,0,0,0.6)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    backdropFilter: "blur(8px)"
                  },
                  children: "\xD7"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { style: {
              display: "flex",
              gap: 0,
              flexShrink: 0,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              padding: 3
            }, children: [
              { key: "templates", icon: /* @__PURE__ */ jsx(LayoutGrid, { size: 13 }), label: "Templates" },
              { key: "upload", icon: /* @__PURE__ */ jsx(Upload, { size: 13 }), label: "Upload" },
              { key: "board", icon: /* @__PURE__ */ jsx(LayoutGrid, { size: 13 }), label: "From Board" }
            ].map((tab) => {
              const isActive = bgSource === tab.key;
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setBgSource(tab.key);
                  },
                  style: {
                    flex: 1,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.35)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    transition: "all 120ms ease"
                  },
                  children: [
                    tab.icon,
                    tab.label
                  ]
                },
                tab.key
              );
            }) }),
            /* @__PURE__ */ jsxs("div", { style: {
              flex: 1,
              overflowY: "auto",
              minHeight: 0,
              paddingTop: 4
            }, children: [
              bgSource === "templates" && TEMPLATE_CATEGORIES.map((cat) => /* @__PURE__ */ jsx(
                TemplateCategoryRow,
                {
                  category: cat,
                  selectedId: state.selectedTemplateId,
                  onSelect: (id) => {
                    update("selectedTemplateId", id);
                    update("backgroundImageUrl", "");
                  }
                },
                cat.id
              )),
              bgSource === "upload" && /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    flex: 1,
                    minHeight: 200,
                    borderRadius: 12,
                    border: "1.5px dashed rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    transition: "all 120ms ease"
                  },
                  onClick: () => onUploadBackground?.(),
                  onMouseEnter: (e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  },
                  children: [
                    /* @__PURE__ */ jsx(CloudUpload, { size: 32, style: { opacity: 0.4 }, color: "#fff" }),
                    /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)" }, children: "Click to upload background image" }),
                    /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "rgba(255,255,255,0.25)" }, children: "JPG, PNG, WebP supported" })
                  ]
                }
              ),
              bgSource === "board" && /* @__PURE__ */ jsx("div", { style: {
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8
              }, children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    aspectRatio: "1",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 120ms ease"
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  },
                  onClick: () => onSelectFromBoard?.(),
                  children: /* @__PURE__ */ jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "rgba(255,255,255,0.15)", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                    /* @__PURE__ */ jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
                    /* @__PURE__ */ jsx("circle", { cx: "9", cy: "9", r: "2" }),
                    /* @__PURE__ */ jsx("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" })
                  ] })
                },
                i
              )) })
            ] })
          ] }) : /* @__PURE__ */ jsx("div", { style: { flex: 1, display: "flex", flexDirection: "column" }, children: /* @__PURE__ */ jsx(
            "textarea",
            {
              placeholder: "Describe the background you want to generate...",
              value: state.backgroundPrompt,
              onChange: (e) => update("backgroundPrompt", e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                  e.preventDefault();
                  handleSubmit();
                }
              },
              autoFocus: bgMode === "prompt",
              rows: 6,
              style: {
                width: "100%",
                flex: 1,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
                fontSize: 13,
                lineHeight: "1.6",
                resize: "none",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
                minHeight: 140
              }
            }
          ) })
        ] })
      ] })
    }
  );
}
var MODES = ["replace", "add", "remove"];
var MODE_LABELS = {
  replace: "Replace",
  add: "Add",
  remove: "Remove"
};
var TUTORIAL_IMAGE_URLS = {
  replace: "https://d1735p3aqhycef.cloudfront.net/media/images/6CyC2di16mtui71H.png",
  add: "https://d1735p3aqhycef.cloudfront.net/media/images/aZi4oVw_xYK4F8W5.png",
  remove: "https://d1735p3aqhycef.cloudfront.net/media/images/z6tK697oh_R_3jo5.png"
};
var AUTO_CYCLE_MS = 3e3;
var BRUSH_SIZE_MIN_RATIO = 0.01;
var BRUSH_SIZE_MAX_RATIO = 0.25;
var BRUSH_SIZE_DEFAULT_RATIO = 0.05;
var footerBtnStyle = {
  flex: 1,
  maxWidth: 240,
  height: 44,
  borderRadius: 8,
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "background 120ms ease"
};
function InpaintTutorialModal({
  open,
  onClose,
  onSelectFromBoard,
  onSubmit,
  credits = 15,
  initialImageUrl
}) {
  const [view, setView] = useState("tutorial");
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [maskTool, setMaskTool] = useState("brush");
  const [brushSizeRatio, setBrushSizeRatio] = useState(BRUSH_SIZE_DEFAULT_RATIO);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const cacheCanvasRef = useRef(null);
  const strokeCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const currentPointsRef = useRef([]);
  const lastPointRef = useRef(null);
  const maskToolRef = useRef("brush");
  const brushSizeRatioRef = useRef(BRUSH_SIZE_DEFAULT_RATIO);
  const imgNaturalSize = useRef({ w: 0, h: 0 });
  const canvasWrapperRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const centeringShellRef = useRef(null);
  useEffect(() => {
    maskToolRef.current = maskTool;
  }, [maskTool]);
  useEffect(() => {
    brushSizeRatioRef.current = brushSizeRatio;
  }, [brushSizeRatio]);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);
  useEffect(() => {
    if (open) {
      if (initialImageUrl) {
        setView("editor");
        setImageUrl(initialImageUrl);
      } else {
        setView("tutorial");
        setImageUrl("");
      }
      setActiveIdx(0);
      setPrompt("");
      setMaskTool("brush");
      setBrushSizeRatio(BRUSH_SIZE_DEFAULT_RATIO);
      setIsOverCanvas(false);
      setIsDrawing(false);
      setHistory([]);
      setHistoryIndex(-1);
      setCanvasSize({ width: 0, height: 0 });
      historyRef.current = [];
      historyIndexRef.current = -1;
      currentPointsRef.current = [];
      lastPointRef.current = null;
    }
  }, [open, initialImageUrl]);
  useEffect(() => {
    if (!open || view !== "tutorial")
      return;
    timerRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % MODES.length);
    }, AUTO_CYCLE_MS);
    return () => {
      if (timerRef.current)
        clearInterval(timerRef.current);
    };
  }, [open, view]);
  const getBrushSizePx = useCallback((ratio) => {
    const { w, h } = imgNaturalSize.current;
    const shortSide = Math.min(w, h);
    return Math.max(1, shortSide * ratio);
  }, []);
  const getCanvasCoords = useCallback((e) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas)
      return { x: 0, y: 0 };
    const rect = maskCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * maskCanvas.width;
    const y = (e.clientY - rect.top) / rect.height * maskCanvas.height;
    return { x, y };
  }, []);
  const clearStrokeCanvas = useCallback(() => {
    const sc = strokeCanvasRef.current;
    if (!sc)
      return;
    const ctx = sc.getContext("2d");
    if (!ctx)
      return;
    ctx.clearRect(0, 0, sc.width, sc.height);
  }, []);
  const drawStrokePoint = useCallback((point) => {
    const sc = strokeCanvasRef.current;
    if (!sc)
      return;
    const ctx = sc.getContext("2d");
    if (!ctx)
      return;
    const radius = getBrushSizePx(brushSizeRatioRef.current) / 2;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [getBrushSizePx]);
  const drawStrokeSegment = useCallback((from, to) => {
    const sc = strokeCanvasRef.current;
    if (!sc)
      return;
    const ctx = sc.getContext("2d");
    if (!ctx)
      return;
    const lineWidth = getBrushSizePx(brushSizeRatioRef.current);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
  }, [getBrushSizePx]);
  const renderToMask = useCallback((includeCurrentStroke) => {
    const maskCanvas = maskCanvasRef.current;
    const cacheCanvas = cacheCanvasRef.current;
    const strokeCanvas = strokeCanvasRef.current;
    if (!maskCanvas || !cacheCanvas || !strokeCanvas)
      return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx)
      return;
    const { width, height } = maskCanvas;
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    const tmpCtx = tmpCanvas.getContext("2d");
    if (!tmpCtx)
      return;
    tmpCtx.drawImage(cacheCanvas, 0, 0);
    if (includeCurrentStroke) {
      const tool = maskToolRef.current;
      if (tool === "brush") {
        tmpCtx.globalCompositeOperation = "source-over";
      } else {
        tmpCtx.globalCompositeOperation = "destination-out";
      }
      tmpCtx.drawImage(strokeCanvas, 0, 0);
      tmpCtx.globalCompositeOperation = "source-over";
    }
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(tmpCanvas, 0, 0);
    ctx.restore();
  }, []);
  const rebuildCache = useCallback(() => {
    const cacheCanvas = cacheCanvasRef.current;
    if (!cacheCanvas)
      return;
    const ctx = cacheCanvas.getContext("2d");
    if (!ctx)
      return;
    const { width, height } = cacheCanvas;
    ctx.clearRect(0, 0, width, height);
    const hist = historyRef.current;
    const idx = historyIndexRef.current;
    for (let i = 0; i <= idx; i++) {
      const action = hist[i];
      if (!action || action.points.length === 0)
        continue;
      const bpx = getBrushSizePx(action.brushSizeRatio);
      if (action.type === "erase") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.fillStyle = "#000";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = bpx;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.arc(action.points[0].x, action.points[0].y, bpx / 2, 0, Math.PI * 2);
      ctx.fill();
      if (action.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let j = 1; j < action.points.length; j++) {
          ctx.lineTo(action.points[j].x, action.points[j].y);
        }
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }, [getBrushSizePx]);
  useEffect(() => {
    if (view !== "editor")
      return;
    rebuildCache();
    renderToMask(false);
  }, [historyIndex, view, rebuildCache, renderToMask]);
  const imageObjRef = useRef(null);
  const calculateAndInitCanvas = useCallback((img) => {
    const shell = centeringShellRef.current;
    if (!shell)
      return;
    const containerWidth = shell.clientWidth;
    const containerHeight = shell.clientHeight;
    let displayWidth = img.naturalWidth;
    let displayHeight = img.naturalHeight;
    if (displayWidth > containerWidth) {
      const scale = containerWidth / displayWidth;
      displayWidth = containerWidth;
      displayHeight = img.naturalHeight * scale;
    }
    if (displayHeight > containerHeight) {
      const scale = containerHeight / displayHeight;
      displayHeight = containerHeight;
      displayWidth = displayWidth * scale;
    }
    const newWidth = Math.round(displayWidth);
    const newHeight = Math.round(displayHeight);
    setCanvasSize({ width: newWidth, height: newHeight });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    imgNaturalSize.current = { w, h };
    [canvasRef, maskCanvasRef, cacheCanvasRef, strokeCanvasRef].forEach((ref) => {
      if (ref.current) {
        ref.current.width = w;
        ref.current.height = h;
      }
    });
    const imgCtx = canvasRef.current?.getContext("2d");
    if (imgCtx) {
      imgCtx.clearRect(0, 0, w, h);
      imgCtx.drawImage(img, 0, 0, w, h);
    }
    [maskCanvasRef, cacheCanvasRef, strokeCanvasRef].forEach((ref) => {
      const ctx = ref.current?.getContext("2d");
      if (ctx)
        ctx.clearRect(0, 0, w, h);
    });
  }, []);
  const initCanvas = useCallback(() => {
    if (!imageUrl)
      return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageObjRef.current = img;
      calculateAndInitCanvas(img);
    };
    img.src = imageUrl;
  }, [imageUrl, calculateAndInitCanvas]);
  useEffect(() => {
    if (view === "editor" && imageUrl) {
      initCanvas();
    }
  }, [view, imageUrl, initCanvas]);
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    isDrawingRef.current = true;
    const coords = getCanvasCoords(e);
    currentPointsRef.current = [coords];
    lastPointRef.current = coords;
    clearStrokeCanvas();
    drawStrokePoint(coords);
    renderToMask(true);
  }, [getCanvasCoords, clearStrokeCanvas, drawStrokePoint, renderToMask]);
  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!isDrawingRef.current)
      return;
    const coords = getCanvasCoords(e);
    const lastPoint = lastPointRef.current;
    if (lastPoint) {
      drawStrokeSegment(lastPoint, coords);
      renderToMask(true);
    }
    currentPointsRef.current.push(coords);
    lastPointRef.current = coords;
  }, [getCanvasCoords, drawStrokeSegment, renderToMask]);
  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current)
      return;
    const points = [...currentPointsRef.current];
    const tool = maskToolRef.current;
    const ratio = brushSizeRatioRef.current;
    if (points.length > 0) {
      const action = {
        type: tool === "brush" ? "draw" : "erase",
        points,
        brushSizeRatio: ratio
      };
      setHistory((prev) => {
        const truncated = prev.slice(0, historyIndexRef.current + 1);
        const next = [...truncated, action];
        historyRef.current = next;
        return next;
      });
      setHistoryIndex((prev) => {
        const next = prev + 1;
        historyIndexRef.current = next;
        return next;
      });
    }
    setIsDrawing(false);
    isDrawingRef.current = false;
    currentPointsRef.current = [];
    lastPointRef.current = null;
    clearStrokeCanvas();
  }, [clearStrokeCanvas]);
  const handleUndo = useCallback(() => {
    setHistoryIndex((prev) => {
      const next = Math.max(-1, prev - 1);
      historyIndexRef.current = next;
      return next;
    });
  }, []);
  const handleRedo = useCallback(() => {
    setHistoryIndex((prev) => {
      const max = historyRef.current.length - 1;
      const next = Math.min(max, prev + 1);
      historyIndexRef.current = next;
      return next;
    });
  }, []);
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setView("editor");
    setHistory([]);
    setHistoryIndex(-1);
    historyRef.current = [];
    historyIndexRef.current = -1;
    e.target.value = "";
  }, []);
  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  useCallback(() => {
    if (imageUrl.startsWith("blob:"))
      URL.revokeObjectURL(imageUrl);
    setImageUrl("");
    setPrompt("");
    setView("tutorial");
    setHistory([]);
    setHistoryIndex(-1);
    historyRef.current = [];
    historyIndexRef.current = -1;
  }, [imageUrl]);
  const handleSubmit = useCallback(() => {
    if (!imageUrl || !prompt.trim())
      return;
    onSubmit({ imageUrl, prompt, maskTool, brushSize: getBrushSizePx(brushSizeRatio) });
  }, [imageUrl, prompt, maskTool, brushSizeRatio, getBrushSizePx, onSubmit]);
  const activeMode = MODES[activeIdx];
  const resetTimer = useCallback(() => {
    if (timerRef.current)
      clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % MODES.length);
    }, AUTO_CYCLE_MS);
  }, []);
  const brushCursorPx = (() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || !canvasSize.width)
      return 20;
    const brushSizePx = getBrushSizePx(brushSizeRatio);
    return Math.max(4, brushSizePx / maskCanvas.width * canvasSize.width);
  })();
  if (view === "tutorial") {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: "image/*",
          style: { display: "none" },
          onChange: handleFileSelect
        }
      ),
      /* @__PURE__ */ jsx(
        ImmersiveModal,
        {
          open,
          title: "AI Image Inpainter",
          subtitle: "Modify or reimagine elements of your image with simple brush strokes.",
          onClose,
          maxWidth: 1800,
          footer: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: triggerUpload,
                style: { ...footerBtnStyle, background: "#fff", color: "#000" },
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "#f0f0f0";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "#fff";
                },
                children: [
                  /* @__PURE__ */ jsx(Upload, { size: 16 }),
                  "Upload"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: onSelectFromBoard,
                style: footerBtnStyle,
                onMouseEnter: (e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                },
                children: [
                  /* @__PURE__ */ jsx(LayoutGrid, { size: 16 }),
                  "Select from Board"
                ]
              }
            )
          ] }),
          children: /* @__PURE__ */ jsxs("div", { style: {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            padding: "8px 0 20px",
            minHeight: 0,
            marginTop: 24
          }, children: [
            /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }, children: MODES.map((mode, i) => {
              const isActive = i === activeIdx;
              return /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    setActiveIdx(i);
                    resetTimer();
                  },
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 32,
                    padding: "0 16px",
                    borderRadius: 20,
                    border: "none",
                    background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    transition: "background 150ms ease, color 150ms ease",
                    whiteSpace: "nowrap"
                  },
                  onMouseEnter: (e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "rgba(255,255,255,0.09)";
                  },
                  onMouseLeave: (e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  },
                  children: MODE_LABELS[mode]
                },
                mode
              );
            }) }),
            /* @__PURE__ */ jsx("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsx("div", { style: { width: "100%", maxWidth: 720, aspectRatio: "16 / 9" }, children: /* @__PURE__ */ jsx(
              "img",
              {
                src: TUTORIAL_IMAGE_URLS[activeMode],
                alt: `${activeMode} tutorial`,
                style: {
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 16
                }
              },
              activeMode
            ) }) })
          ] })
        }
      )
    ] });
  }
  const canSubmit = !!imageUrl && prompt.trim().length > 0;
  const maskBtnStyle = (active) => ({
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    background: active ? "rgba(88,87,253,0.3)" : "transparent",
    color: active ? "#a5b4fc" : "rgba(255,255,255,0.5)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 100ms ease"
  });
  const iconBtnStyle = (enabled) => ({
    ...maskBtnStyle(false),
    opacity: enabled ? 1 : 0.3,
    cursor: enabled ? "pointer" : "default"
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/*",
        style: { display: "none" },
        onChange: handleFileSelect
      }
    ),
    /* @__PURE__ */ jsx(
      ImmersiveModal,
      {
        open,
        title: "AI Image Inpainter",
        onClose,
        maxWidth: 1800,
        footer: /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: handleSubmit,
            style: {
              ...footerBtnStyle,
              maxWidth: 400,
              background: canSubmit ? "#3643FF" : "rgba(255,255,255,0.08)",
              color: canSubmit ? "#fff" : "rgba(255,255,255,0.4)",
              cursor: canSubmit ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10
            },
            children: [
              /* @__PURE__ */ jsx("span", { children: "Generate" }),
              /* @__PURE__ */ jsx("div", { style: { width: 1, height: 16, background: canSubmit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)" } }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
                /* @__PURE__ */ jsx(Crown, { size: 16, color: canSubmit ? "#facc15" : "currentColor" }),
                /* @__PURE__ */ jsx("span", { children: credits })
              ] })
            ]
          }
        ) }),
        children: /* @__PURE__ */ jsxs("div", { style: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minHeight: 0,
          padding: "0 0 4px"
        }, children: [
          /* @__PURE__ */ jsxs("div", { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12 }, children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                ref: centeringShellRef,
                style: {
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden"
                },
                onMouseMove: handleMouseMove,
                onMouseUp: handleMouseUp,
                onMouseLeave: () => {
                  handleMouseUp();
                  setIsOverCanvas(false);
                },
                children: [
                  /* @__PURE__ */ jsx("canvas", { ref: cacheCanvasRef, style: { display: "none" } }),
                  /* @__PURE__ */ jsx("canvas", { ref: strokeCanvasRef, style: { display: "none" } }),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      ref: canvasWrapperRef,
                      style: {
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 16,
                        lineHeight: 0,
                        cursor: "none",
                        width: canvasSize.width || "auto",
                        height: canvasSize.height || "auto"
                      },
                      children: [
                        /* @__PURE__ */ jsx(
                          "canvas",
                          {
                            ref: canvasRef,
                            style: {
                              display: "block",
                              width: canvasSize.width || "100%",
                              height: canvasSize.height || "auto",
                              userSelect: "none"
                            },
                            draggable: false
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "canvas",
                          {
                            ref: maskCanvasRef,
                            style: {
                              position: "absolute",
                              top: 0,
                              left: 0,
                              display: "block",
                              width: canvasSize.width || "100%",
                              height: canvasSize.height || "auto",
                              userSelect: "none",
                              cursor: "none"
                            },
                            draggable: false,
                            onDragStart: (e) => e.preventDefault(),
                            onMouseDown: handleMouseDown,
                            onMouseEnter: () => setIsOverCanvas(true),
                            onMouseLeave: () => setIsOverCanvas(false)
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            ),
            isOverCanvas && canvasSize.width > 0 && /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  position: "fixed",
                  left: mousePos.x - brushCursorPx / 2,
                  top: mousePos.y - brushCursorPx / 2,
                  width: brushCursorPx,
                  height: brushCursorPx,
                  borderRadius: "50%",
                  border: "2px solid #facc15",
                  backgroundColor: maskTool === "brush" ? "rgba(250,204,21,0.2)" : "transparent",
                  pointerEvents: "none",
                  zIndex: 200,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.2)"
                }
              }
            ),
            /* @__PURE__ */ jsxs("div", { style: {
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 12,
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.08)",
              alignSelf: "center"
            }, children: [
              /* @__PURE__ */ jsx("button", { type: "button", title: "Brush", onClick: () => setMaskTool("brush"), style: maskBtnStyle(maskTool === "brush"), children: /* @__PURE__ */ jsx(Paintbrush, { size: 16 }) }),
              /* @__PURE__ */ jsx("button", { type: "button", title: "Eraser", onClick: () => setMaskTool("eraser"), style: maskBtnStyle(maskTool === "eraser"), children: /* @__PURE__ */ jsx(Eraser, { size: 16 }) }),
              /* @__PURE__ */ jsx("div", { style: { width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 6px" } }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "range",
                  min: BRUSH_SIZE_MIN_RATIO * 1e3,
                  max: BRUSH_SIZE_MAX_RATIO * 1e3,
                  value: brushSizeRatio * 1e3,
                  onChange: (e) => setBrushSizeRatio(Number(e.target.value) / 1e3),
                  style: { width: 80, accentColor: "#5857FD", cursor: "pointer" }
                }
              ),
              /* @__PURE__ */ jsx("div", { style: { width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 6px" } }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  title: "Undo",
                  style: iconBtnStyle(canUndo),
                  onClick: canUndo ? handleUndo : void 0,
                  children: /* @__PURE__ */ jsx(Undo2, { size: 16 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  title: "Redo",
                  style: iconBtnStyle(canRedo),
                  onClick: canRedo ? handleRedo : void 0,
                  children: /* @__PURE__ */ jsx(Redo2, { size: 16 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
            minHeight: 56
          }, children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: triggerUpload,
                style: {
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: "1px dashed rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.3)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "border-color 120ms ease, background 120ms ease"
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                },
                children: /* @__PURE__ */ jsx(Plus, { size: 18 })
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Describe what you want to change...",
                value: prompt,
                onChange: (e) => setPrompt(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                    e.preventDefault();
                    handleSubmit();
                  }
                },
                style: {
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 14,
                  lineHeight: "20px",
                  fontFamily: "inherit"
                }
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
var RESOLUTION_OPTIONS = [
  { value: "1k", label: "1K", creditCost: 0.8 },
  { value: "2k", label: "2K", creditCost: 0.8 },
  { value: "4k", label: "4K", creditCost: 1.4 }
];
var TUTORIAL_CATEGORIES = [
  { id: "portraits", label: "Portraits" },
  { id: "landscapes", label: "Landscapes" },
  { id: "text", label: "Text" }
];
var TUTORIAL_IMAGES = {
  portraits: {
    before: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=60",
    after: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=95"
  },
  landscapes: {
    before: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=60",
    after: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=95"
  },
  text: {
    before: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=50",
    after: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=95"
  }
};
var footerBtnStyle2 = {
  flex: 1,
  maxWidth: 240,
  height: 44,
  borderRadius: 8,
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "background 120ms ease"
};
function ImagePreview({
  imageUrl,
  onClear
}) {
  const imgRef = React20.useRef(null);
  const outerRef = React20.useRef(null);
  const [imgRect, setImgRect] = React20.useState(null);
  const [hovered, setHovered] = React20.useState(false);
  const updateRect = React20.useCallback(() => {
    const img = imgRef.current;
    const outer = outerRef.current;
    if (!img || !outer)
      return;
    const imgBounds = img.getBoundingClientRect();
    const outerBounds = outer.getBoundingClientRect();
    setImgRect({
      top: imgBounds.top - outerBounds.top,
      right: outerBounds.right - imgBounds.right
    });
  }, []);
  React20.useEffect(() => {
    const img = imgRef.current;
    const outer = outerRef.current;
    if (!img || !outer)
      return;
    if (img.complete)
      updateRect();
    img.addEventListener("load", updateRect);
    const ro = new ResizeObserver(updateRect);
    ro.observe(img);
    ro.observe(outer);
    return () => {
      img.removeEventListener("load", updateRect);
      ro.disconnect();
    };
  }, [imageUrl, updateRect]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: outerRef,
      style: {
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            ref: imgRef,
            src: imageUrl,
            alt: "Preview",
            style: {
              display: "block",
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain"
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClear,
            style: {
              position: "absolute",
              top: imgRect ? imgRect.top + 8 : 8,
              right: imgRect ? imgRect.right + 8 : 8,
              width: 32,
              height: 32,
              borderRadius: 4,
              background: "rgba(0,0,0,0.4)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: hovered ? 1 : 0,
              transition: "opacity 150ms ease, background 100ms ease",
              pointerEvents: hovered ? "auto" : "none",
              backdropFilter: "blur(4px)"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.65)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.4)";
            },
            children: /* @__PURE__ */ jsx(X, { size: 16 })
          }
        )
      ]
    }
  );
}
function GenerateDropdownButton({ onGenerate, credits }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!dropdownOpen)
      return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target))
        setDropdownOpen(false);
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [dropdownOpen]);
  return /* @__PURE__ */ jsxs("div", { ref, style: { position: "relative", display: "flex", height: 44, maxWidth: 400, flex: 1 }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => onGenerate(false),
        style: {
          flex: 1,
          height: "100%",
          background: "#3643FF",
          border: "none",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          borderRadius: "8px 0 0 8px",
          transition: "background 120ms ease"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#4a55ff";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#3643FF";
        },
        children: [
          /* @__PURE__ */ jsx("span", { children: "Generate" }),
          /* @__PURE__ */ jsx("div", { style: { width: 1, height: 16, background: "rgba(255,255,255,0.15)" } }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
            /* @__PURE__ */ jsx(Crown, { size: 16, color: "#facc15" }),
            /* @__PURE__ */ jsx("span", { children: credits })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { style: { width: 1, height: "100%", background: "rgba(255,255,255,0.15)", flexShrink: 0 } }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setDropdownOpen((p) => !p),
        style: {
          width: 44,
          height: 44,
          border: "none",
          background: "#3643FF",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          borderRadius: "0 8px 8px 0",
          transition: "background 120ms ease",
          flexShrink: 0
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#4a55ff";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#3643FF";
        },
        children: /* @__PURE__ */ jsx(
          ChevronDown,
          {
            size: 15,
            style: {
              transition: "transform 150ms ease",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
            }
          }
        )
      }
    ),
    dropdownOpen && /* @__PURE__ */ jsx("div", { style: {
      position: "absolute",
      bottom: "calc(100% + 8px)",
      right: 0,
      padding: "4px",
      borderRadius: 8,
      background: "#1c1e22",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
      zIndex: 100,
      minWidth: 200
    }, children: /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => {
          onGenerate(true);
          setDropdownOpen(false);
        },
        style: {
          width: "100%",
          padding: "8px 12px",
          border: "none",
          borderRadius: 4,
          background: "transparent",
          color: "rgba(255,255,255,0.8)",
          fontSize: 14,
          fontWeight: 400,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          transition: "background 80ms ease"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "transparent";
        },
        children: [
          "Generate with watermark",
          /* @__PURE__ */ jsx(Crown, { size: 14, style: { marginLeft: "auto", color: "#fff" } })
        ]
      }
    ) })
  ] });
}
function ComparisonSlider({ beforeSrc, afterSrc }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const updatePosition = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el)
      return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, x / rect.width * 100));
    setSliderPos(pct);
  }, []);
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    updatePosition(e.clientX);
  }, [updatePosition]);
  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current)
        return;
      updatePosition(e.clientX);
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [updatePosition]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      onMouseDown: handleMouseDown,
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 16,
        cursor: "ew-resize",
        userSelect: "none"
      },
      children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: afterSrc,
            alt: "After",
            draggable: false,
            style: { display: "block", width: "100%", height: "100%", objectFit: "cover" }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
            },
            children: /* @__PURE__ */ jsx(
              "img",
              {
                src: beforeSrc,
                alt: "Before",
                draggable: false,
                style: {
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "blur(0.5px) brightness(0.92)"
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${sliderPos}%`,
              width: 2,
              background: "rgba(255,255,255,0.8)",
              transform: "translateX(-1px)",
              pointerEvents: "none"
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              top: "50%",
              left: `${sliderPos}%`,
              transform: "translate(-50%, -50%)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              border: "2px solid rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              backdropFilter: "blur(4px)"
            },
            children: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", children: [
              /* @__PURE__ */ jsx("path", { d: "M4.5 3L1.5 7L4.5 11", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }),
              /* @__PURE__ */ jsx("path", { d: "M9.5 3L12.5 7L9.5 11", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
            ] })
          }
        ),
        /* @__PURE__ */ jsx("div", { style: {
          position: "absolute",
          bottom: 12,
          left: 12,
          padding: "3px 8px",
          borderRadius: 6,
          background: "rgba(0,0,0,0.5)",
          color: "rgba(255,255,255,0.8)",
          fontSize: 11,
          fontWeight: 500,
          backdropFilter: "blur(4px)",
          pointerEvents: "none"
        }, children: "Before" }),
        /* @__PURE__ */ jsx("div", { style: {
          position: "absolute",
          bottom: 12,
          right: 12,
          padding: "3px 8px",
          borderRadius: 6,
          background: "rgba(0,0,0,0.5)",
          color: "rgba(255,255,255,0.8)",
          fontSize: 11,
          fontWeight: 500,
          backdropFilter: "blur(4px)",
          pointerEvents: "none"
        }, children: "After" })
      ]
    }
  );
}
function ImageUpscaleModal({
  open,
  onClose,
  onSelectFromBoard,
  onSubmit,
  credits
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [targetResolution, setTargetResolution] = useState("2k");
  const [activeCategory, setActiveCategory] = useState("portraits");
  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);
  const resDropdownRef = useRef(null);
  const timerRef = useRef(null);
  const hasImage = !!imageUrl;
  const currentRes = RESOLUTION_OPTIONS.find((o) => o.value === targetResolution) ?? RESOLUTION_OPTIONS[1];
  const creditCost = credits ?? currentRes.creditCost;
  const AUTO_CYCLE_MS2 = 3e3;
  useEffect(() => {
    if (open) {
      setImageUrl("");
      setTargetResolution("2k");
      setActiveCategory("portraits");
      setResDropdownOpen(false);
    }
  }, [open]);
  useEffect(() => {
    if (!open || hasImage)
      return;
    timerRef.current = setInterval(() => {
      setActiveCategory((prev) => {
        const idx = TUTORIAL_CATEGORIES.findIndex((c) => c.id === prev);
        return TUTORIAL_CATEGORIES[(idx + 1) % TUTORIAL_CATEGORIES.length].id;
      });
    }, AUTO_CYCLE_MS2);
    return () => {
      if (timerRef.current)
        clearInterval(timerRef.current);
    };
  }, [open, hasImage]);
  const resetTimer = useCallback(() => {
    if (timerRef.current)
      clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveCategory((prev) => {
        const idx = TUTORIAL_CATEGORIES.findIndex((c) => c.id === prev);
        return TUTORIAL_CATEGORIES[(idx + 1) % TUTORIAL_CATEGORIES.length].id;
      });
    }, AUTO_CYCLE_MS2);
  }, []);
  useEffect(() => {
    if (!resDropdownOpen)
      return;
    const handler = (e) => {
      if (resDropdownRef.current && !resDropdownRef.current.contains(e.target)) {
        setResDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [resDropdownOpen]);
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    setImageUrl(URL.createObjectURL(file));
    e.target.value = "";
  }, []);
  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleClearImage = useCallback(() => {
    if (imageUrl.startsWith("blob:"))
      URL.revokeObjectURL(imageUrl);
    setImageUrl("");
  }, [imageUrl]);
  const handleSubmit = useCallback((withWatermark) => {
    if (!imageUrl)
      return;
    onSubmit({ imageUrl, targetResolution, withWatermark });
  }, [imageUrl, targetResolution, onSubmit]);
  const contentPanel = hasImage ? (
    /*
     * Image preview layout — close button anchored to the image's visual corner:
     *
     * The challenge: object-fit:contain letterboxes the image, so the image's
     * rendered bounds are smaller than the container. We can't use a single
     * positioned container because the button would end up in the container's
     * corner, not the image's corner.
     *
     * Solution: two-layer approach
     * 1. Outer centering div (flex, fills available space) — just for centering
     * 2. Inner wrapper (position:relative) that shrinks to the image's rendered
     *    size using max-width/max-height + aspect-ratio. The close button is
     *    positioned inside this wrapper, so it always sits on the image corner.
     */
    /* @__PURE__ */ jsx(
      ImagePreview,
      {
        imageUrl,
        onClear: handleClearImage
      }
    )
  ) : (
    // Tutorial showcase
    /* @__PURE__ */ jsxs("div", { style: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 24,
      marginTop: 0
    }, children: [
      /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: TUTORIAL_CATEGORIES.map((cat) => {
        const isActive = cat.id === activeCategory;
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setActiveCategory(cat.id);
              resetTimer();
            },
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 32,
              padding: "0 16px",
              borderRadius: 20,
              border: "none",
              background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
              color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "background 150ms ease, color 150ms ease",
              whiteSpace: "nowrap"
            },
            onMouseEnter: (e) => {
              if (!isActive)
                e.currentTarget.style.background = "rgba(255,255,255,0.09)";
            },
            onMouseLeave: (e) => {
              if (!isActive)
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            },
            children: cat.label
          },
          cat.id
        );
      }) }),
      /* @__PURE__ */ jsx("div", { style: {
        width: "100%",
        display: "flex",
        justifyContent: "center"
      }, children: /* @__PURE__ */ jsx("div", { style: {
        width: "100%",
        maxWidth: 720,
        aspectRatio: "16 / 9"
      }, children: /* @__PURE__ */ jsx(
        ComparisonSlider,
        {
          beforeSrc: TUTORIAL_IMAGES[activeCategory].before,
          afterSrc: TUTORIAL_IMAGES[activeCategory].after
        }
      ) }) })
    ] })
  );
  const footer = hasImage ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: [
    /* @__PURE__ */ jsxs("div", { ref: resDropdownRef, style: { position: "relative" }, children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setResDropdownOpen((p) => !p),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 100ms ease, background 100ms ease",
            minWidth: 100,
            justifyContent: "space-between"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          },
          children: [
            /* @__PURE__ */ jsx("span", { children: currentRes.label }),
            /* @__PURE__ */ jsx(
              ChevronDown,
              {
                size: 16,
                style: {
                  color: "rgba(255,255,255,0.4)",
                  transition: "transform 150ms ease",
                  transform: resDropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
                }
              }
            )
          ]
        }
      ),
      resDropdownOpen && /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        padding: 4,
        borderRadius: 8,
        background: "#1c1e22",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
        zIndex: 20,
        minWidth: 100
      }, children: RESOLUTION_OPTIONS.map((opt) => {
        const isSelected = opt.value === targetResolution;
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setTargetResolution(opt.value);
              setResDropdownOpen(false);
            },
            style: {
              width: "100%",
              padding: "8px 12px",
              border: "none",
              borderRadius: 4,
              background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
              color: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
              fontSize: 14,
              fontWeight: isSelected ? 500 : 400,
              cursor: "pointer",
              textAlign: "left",
              transition: "background 80ms ease"
            },
            onMouseEnter: (e) => {
              if (!isSelected)
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = isSelected ? "rgba(255,255,255,0.08)" : "transparent";
            },
            children: opt.label
          },
          opt.value
        );
      }) })
    ] }),
    /* @__PURE__ */ jsx(GenerateDropdownButton, { onGenerate: handleSubmit, credits: creditCost })
  ] }) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: triggerUpload,
        style: {
          ...footerBtnStyle2,
          background: "#fff",
          color: "#000"
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#f0f0f0";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#fff";
        },
        children: [
          /* @__PURE__ */ jsx(Upload, { size: 16 }),
          "Upload"
        ]
      }
    ),
    onSelectFromBoard && /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: onSelectFromBoard,
        style: footerBtnStyle2,
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.14)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        },
        children: [
          /* @__PURE__ */ jsx(LayoutGrid, { size: 16 }),
          "Select from Board"
        ]
      }
    )
  ] });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/jpeg,image/png,image/webp",
        style: { display: "none" },
        onChange: handleFileSelect
      }
    ),
    /* @__PURE__ */ jsx(
      ImmersiveModal,
      {
        open,
        title: "AI Image Upscaler",
        subtitle: hasImage ? void 0 : "From old family photos to product shots, upscale any image to crystal-clear 4K in seconds.",
        onClose,
        maxWidth: 1800,
        footer,
        children: /* @__PURE__ */ jsx("div", { style: {
          flex: 1,
          display: "flex",
          minHeight: 0,
          padding: "8px 0 20px",
          justifyContent: "center",
          alignItems: "flex-start",
          marginTop: 24
        }, children: contentPanel })
      }
    )
  ] });
}
var RESOLUTION_OPTIONS2 = [
  { value: "1080p", label: "1080p", creditPerMin: 1 },
  { value: "2K", label: "2K", creditPerMin: 2 },
  { value: "4K", label: "4K", creditPerMin: 4 }
];
var TUTORIAL_CATEGORIES2 = [
  { id: "animation", label: "Animation" },
  { id: "landscape", label: "Landscape" },
  { id: "portrait", label: "Portrait" }
];
var TUTORIAL_IMAGES2 = {
  animation: {
    before: "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=400&q=50",
    after: "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=1200&q=95"
  },
  landscape: {
    before: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=50",
    after: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=95"
  },
  portrait: {
    before: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=50",
    after: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=95"
  }
};
var footerBtnStyle3 = {
  flex: 1,
  maxWidth: 240,
  height: 44,
  borderRadius: 8,
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  transition: "background 120ms ease"
};
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function VideoPreview({
  videoUrl,
  hovered,
  onHoverChange,
  onClear,
  onMetadata
}) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [meta, setMeta] = useState(null);
  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v)
      return;
    const m = { width: v.videoWidth, height: v.videoHeight, duration: v.duration };
    setMeta(m);
    onMetadata(m);
  }, [onMetadata]);
  const togglePlay = useCallback((e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v)
      return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);
  useEffect(() => {
    const v = videoRef.current;
    if (!v)
      return;
    const onEnded = () => setPlaying(false);
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      onMouseEnter: () => onHoverChange(true),
      onMouseLeave: () => onHoverChange(false),
      children: [
        /* @__PURE__ */ jsx(
          "video",
          {
            ref: videoRef,
            src: videoUrl,
            onLoadedMetadata: handleLoadedMetadata,
            style: {
              display: "block",
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: 8
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: togglePlay,
            style: {
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              border: "2px solid rgba(255,255,255,0.3)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: hovered || !playing ? 0.9 : 0,
              transition: "opacity 200ms ease",
              backdropFilter: "blur(4px)"
            },
            children: playing ? /* @__PURE__ */ jsx(Pause, { size: 22 }) : /* @__PURE__ */ jsx(Play, { size: 22, style: { marginLeft: 2 } })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onClear,
            style: {
              position: "absolute",
              top: 8,
              right: 8,
              width: 32,
              height: 32,
              borderRadius: 4,
              background: "rgba(0,0,0,0.4)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: hovered ? 1 : 0,
              transition: "opacity 150ms ease, background 100ms ease",
              pointerEvents: hovered ? "auto" : "none",
              backdropFilter: "blur(4px)"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.65)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.4)";
            },
            children: /* @__PURE__ */ jsx(X, { size: 16 })
          }
        ),
        meta && /* @__PURE__ */ jsxs("div", { style: {
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 12,
          padding: "4px 12px",
          borderRadius: 6,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          pointerEvents: "none"
        }, children: [
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }, children: [
            meta.width,
            " x ",
            meta.height
          ] }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }, children: formatDuration(meta.duration) })
        ] })
      ]
    }
  );
}
function GenerateButton2({ onClick, credits, disabled }) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      disabled,
      style: {
        flex: 1,
        maxWidth: 400,
        height: 44,
        background: disabled ? "rgba(54,67,255,0.4)" : "#3643FF",
        border: "none",
        color: "#fff",
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderRadius: 8,
        transition: "background 120ms ease",
        opacity: disabled ? 0.6 : 1
      },
      onMouseEnter: (e) => {
        if (!disabled)
          e.currentTarget.style.background = "#4a55ff";
      },
      onMouseLeave: (e) => {
        if (!disabled)
          e.currentTarget.style.background = "#3643FF";
      },
      children: [
        /* @__PURE__ */ jsx("span", { children: "Upscale Video" }),
        /* @__PURE__ */ jsx("div", { style: { width: 1, height: 16, background: "rgba(255,255,255,0.15)" } }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
          /* @__PURE__ */ jsx(Crown, { size: 16, color: "#facc15" }),
          /* @__PURE__ */ jsx("span", { children: credits })
        ] })
      ]
    }
  );
}
function ComparisonSlider2({ beforeSrc, afterSrc }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const updatePosition = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el)
      return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, x / rect.width * 100));
    setSliderPos(pct);
  }, []);
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    updatePosition(e.clientX);
  }, [updatePosition]);
  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current)
        return;
      updatePosition(e.clientX);
    };
    const handleUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [updatePosition]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: containerRef,
      onMouseDown: handleMouseDown,
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 16,
        cursor: "ew-resize",
        userSelect: "none"
      },
      children: [
        /* @__PURE__ */ jsx("img", { src: afterSrc, alt: "After", draggable: false, style: { display: "block", width: "100%", height: "100%", objectFit: "cover" } }),
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }, children: /* @__PURE__ */ jsx("img", { src: beforeSrc, alt: "Before", draggable: false, style: { display: "block", width: "100%", height: "100%", objectFit: "cover", filter: "blur(0.5px) brightness(0.92)" } }) }),
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 2, background: "rgba(255,255,255,0.8)", transform: "translateX(-1px)", pointerEvents: "none" } }),
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", top: "50%", left: `${sliderPos}%`, transform: "translate(-50%, -50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", backdropFilter: "blur(4px)" }, children: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", children: [
          /* @__PURE__ */ jsx("path", { d: "M4.5 3L1.5 7L4.5 11", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }),
          /* @__PURE__ */ jsx("path", { d: "M9.5 3L12.5 7L9.5 11", stroke: "white", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" })
        ] }) }),
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: 12, left: 12, padding: "3px 8px", borderRadius: 6, background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 500, backdropFilter: "blur(4px)", pointerEvents: "none" }, children: "Before" }),
        /* @__PURE__ */ jsx("div", { style: { position: "absolute", bottom: 12, right: 12, padding: "3px 8px", borderRadius: 6, background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 500, backdropFilter: "blur(4px)", pointerEvents: "none" }, children: "After" })
      ]
    }
  );
}
function VideoUpscaleModal({
  open,
  onClose,
  onSelectFromBoard,
  onSubmit,
  credits
}) {
  const [videoUrl, setVideoUrl] = useState("");
  const [targetResolution, setTargetResolution] = useState("1080p");
  const [activeCategory, setActiveCategory] = useState("animation");
  const [resDropdownOpen, setResDropdownOpen] = useState(false);
  const [videoHover, setVideoHover] = useState(false);
  const [videoMeta, setVideoMeta] = useState(null);
  const fileInputRef = useRef(null);
  const resDropdownRef = useRef(null);
  const timerRef = useRef(null);
  const hasVideo = !!videoUrl;
  const currentRes = RESOLUTION_OPTIONS2.find((o) => o.value === targetResolution) ?? RESOLUTION_OPTIONS2[0];
  const creditCost = credits ?? currentRes.creditPerMin;
  const AUTO_CYCLE_MS2 = 3e3;
  useEffect(() => {
    if (open) {
      setVideoUrl("");
      setTargetResolution("1080p");
      setActiveCategory("animation");
      setResDropdownOpen(false);
      setVideoHover(false);
      setVideoMeta(null);
    }
  }, [open]);
  useEffect(() => {
    if (!open || hasVideo)
      return;
    timerRef.current = setInterval(() => {
      setActiveCategory((prev) => {
        const idx = TUTORIAL_CATEGORIES2.findIndex((c) => c.id === prev);
        return TUTORIAL_CATEGORIES2[(idx + 1) % TUTORIAL_CATEGORIES2.length].id;
      });
    }, AUTO_CYCLE_MS2);
    return () => {
      if (timerRef.current)
        clearInterval(timerRef.current);
    };
  }, [open, hasVideo]);
  const resetTimer = useCallback(() => {
    if (timerRef.current)
      clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveCategory((prev) => {
        const idx = TUTORIAL_CATEGORIES2.findIndex((c) => c.id === prev);
        return TUTORIAL_CATEGORIES2[(idx + 1) % TUTORIAL_CATEGORIES2.length].id;
      });
    }, AUTO_CYCLE_MS2);
  }, []);
  useEffect(() => {
    if (!resDropdownOpen)
      return;
    const handler = (e) => {
      if (resDropdownRef.current && !resDropdownRef.current.contains(e.target)) {
        setResDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [resDropdownOpen]);
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    if (videoUrl.startsWith("blob:"))
      URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    e.target.value = "";
  }, [videoUrl]);
  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleClearVideo = useCallback(() => {
    if (videoUrl.startsWith("blob:"))
      URL.revokeObjectURL(videoUrl);
    setVideoUrl("");
    setVideoHover(false);
    setVideoMeta(null);
  }, [videoUrl]);
  const handleSubmit = useCallback(() => {
    if (!videoUrl)
      return;
    onSubmit({ videoUrl, targetResolution });
  }, [videoUrl, targetResolution, onSubmit]);
  const handleMetadata = useCallback((meta) => {
    setVideoMeta(meta);
  }, []);
  const contentPanel = hasVideo ? /* @__PURE__ */ jsx(
    VideoPreview,
    {
      videoUrl,
      hovered: videoHover,
      onHoverChange: setVideoHover,
      onClear: handleClearVideo,
      onMetadata: handleMetadata
    }
  ) : /* @__PURE__ */ jsxs("div", { style: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    marginTop: 0
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: TUTORIAL_CATEGORIES2.map((cat) => {
      const isActive = cat.id === activeCategory;
      return /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            setActiveCategory(cat.id);
            resetTimer();
          },
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 32,
            padding: "0 16px",
            borderRadius: 20,
            border: "none",
            background: isActive ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
            color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
            fontSize: 13,
            fontWeight: isActive ? 600 : 400,
            cursor: "pointer",
            transition: "background 150ms ease, color 150ms ease",
            whiteSpace: "nowrap"
          },
          onMouseEnter: (e) => {
            if (!isActive)
              e.currentTarget.style.background = "rgba(255,255,255,0.09)";
          },
          onMouseLeave: (e) => {
            if (!isActive)
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          },
          children: cat.label
        },
        cat.id
      );
    }) }),
    /* @__PURE__ */ jsx("div", { style: { width: "100%", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsx("div", { style: { width: "100%", maxWidth: 720, aspectRatio: "16 / 9" }, children: /* @__PURE__ */ jsx(
      ComparisonSlider2,
      {
        beforeSrc: TUTORIAL_IMAGES2[activeCategory].before,
        afterSrc: TUTORIAL_IMAGES2[activeCategory].after
      }
    ) }) })
  ] });
  const footer = hasVideo ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: [
    /* @__PURE__ */ jsxs("div", { ref: resDropdownRef, style: { position: "relative" }, children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setResDropdownOpen((p) => !p),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 100ms ease, background 100ms ease",
            minWidth: 100,
            justifyContent: "space-between"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          },
          children: [
            /* @__PURE__ */ jsx("span", { children: currentRes.label }),
            /* @__PURE__ */ jsx(
              ChevronDown,
              {
                size: 16,
                style: {
                  color: "rgba(255,255,255,0.4)",
                  transition: "transform 150ms ease",
                  transform: resDropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
                }
              }
            )
          ]
        }
      ),
      resDropdownOpen && /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        padding: 4,
        borderRadius: 8,
        background: "#1c1e22",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
        zIndex: 20,
        minWidth: 100
      }, children: RESOLUTION_OPTIONS2.map((opt) => {
        const isSelected = opt.value === targetResolution;
        return /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setTargetResolution(opt.value);
              setResDropdownOpen(false);
            },
            style: {
              width: "100%",
              padding: "8px 12px",
              border: "none",
              borderRadius: 4,
              background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
              color: isSelected ? "#fff" : "rgba(255,255,255,0.5)",
              fontSize: 14,
              fontWeight: isSelected ? 500 : 400,
              cursor: "pointer",
              textAlign: "left",
              transition: "background 80ms ease"
            },
            onMouseEnter: (e) => {
              if (!isSelected)
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.background = isSelected ? "rgba(255,255,255,0.08)" : "transparent";
            },
            children: opt.label
          },
          opt.value
        );
      }) })
    ] }),
    /* @__PURE__ */ jsx(GenerateButton2, { onClick: handleSubmit, credits: creditCost })
  ] }) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: triggerUpload,
        style: { ...footerBtnStyle3, background: "#fff", color: "#000" },
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "#f0f0f0";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "#fff";
        },
        children: [
          /* @__PURE__ */ jsx(Upload, { size: 16 }),
          "Upload"
        ]
      }
    ),
    onSelectFromBoard && /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: onSelectFromBoard,
        style: footerBtnStyle3,
        onMouseEnter: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.14)";
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        },
        children: [
          /* @__PURE__ */ jsx(LayoutGrid, { size: 16 }),
          "Select from Board"
        ]
      }
    )
  ] });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "video/mp4,video/quicktime,video/webm,video/x-m4v",
        style: { display: "none" },
        onChange: handleFileSelect
      }
    ),
    /* @__PURE__ */ jsx(
      ImmersiveModal,
      {
        open,
        title: "AI Video Upscaler",
        subtitle: hasVideo ? void 0 : "Enhance any video to crystal-clear HD, 2K or 4K resolution in seconds.",
        onClose,
        maxWidth: 1800,
        footer,
        children: /* @__PURE__ */ jsx("div", { style: {
          flex: 1,
          display: "flex",
          minHeight: 0,
          padding: "8px 0 20px",
          justifyContent: "center",
          alignItems: "flex-start",
          marginTop: 24
        }, children: contentPanel })
      }
    )
  ] });
}
var SKELETON_COUNT = 12;
function TemplateCard({
  template,
  isSelected,
  loaded,
  ratio,
  onSelect,
  onImgLoad
}) {
  const [hovered, setHovered] = React20.useState(false);
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: onSelect,
      onMouseEnter: (e) => {
        setHovered(true);
        if (!isSelected)
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
      },
      onMouseLeave: (e) => {
        setHovered(false);
        if (!isSelected)
          e.currentTarget.style.borderColor = "transparent";
      },
      style: {
        display: "block",
        width: "100%",
        padding: 0,
        marginBottom: 8,
        borderRadius: 8,
        border: isSelected ? "2px solid #3643FF" : "2px solid transparent",
        background: "#1a1a1a",
        cursor: "pointer",
        overflow: "hidden",
        breakInside: "avoid",
        transition: "border-color 100ms ease, transform 80ms ease",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
        position: "relative",
        aspectRatio: ratio > 0 ? `${ratio}` : void 0
      },
      children: [
        !loaded && /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.04)",
              animation: "pulse 1.5s ease-in-out infinite"
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "img",
          {
            src: template.thumbnailUrl,
            alt: template.name,
            loading: "lazy",
            onLoad: onImgLoad,
            style: {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: loaded ? 1 : 0,
              transition: "opacity 200ms ease, transform 200ms ease",
              transform: hovered ? "scale(1.05)" : "scale(1)"
            },
            onError: (e) => {
              e.target.style.display = "none";
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 12,
              background: "linear-gradient(transparent 40%, rgba(0,0,0,0.6) 100%)",
              opacity: hovered ? 1 : 0,
              pointerEvents: "none",
              transition: "opacity 200ms ease"
            },
            children: /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: "#fff",
                  color: "#1a1a1a",
                  fontSize: 12,
                  fontWeight: 500,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                },
                children: "Use"
              }
            )
          }
        )
      ]
    }
  );
}
function SkeletonCard({ index }) {
  const heights = [180, 220, 160, 200, 240, 170, 210, 190, 230, 150, 200, 180];
  const h = heights[index % heights.length];
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        width: "100%",
        height: h,
        borderRadius: 8,
        background: "rgba(255,255,255,0.04)",
        marginBottom: 8,
        animation: "pulse 1.5s ease-in-out infinite"
      }
    }
  );
}
function AvatarTemplateGrid({
  templates,
  selectedId,
  onSelect,
  categories,
  activeCategory,
  onCategoryChange,
  onLoadMore,
  hasMore,
  loading,
  categoryWrap = true
}) {
  const sentinelRef = useRef(null);
  const scrollRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(/* @__PURE__ */ new Set());
  const handleImgLoad = useCallback((id) => {
    setImgLoaded((prev) => new Set(prev).add(id));
  }, []);
  useEffect(() => {
    if (!onLoadMore || !hasMore)
      return;
    const sentinel = sentinelRef.current;
    if (!sentinel)
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting)
          onLoadMore();
      },
      { root: scrollRef.current, rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);
  const hasCats = categories && categories.length > 0;
  const catScrollRef = useRef(null);
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }, children: [
    hasCats && /* @__PURE__ */ jsx(
      "div",
      {
        ref: catScrollRef,
        style: {
          display: "flex",
          flexWrap: categoryWrap ? "wrap" : "nowrap",
          gap: 6,
          paddingBottom: 12,
          overflowX: categoryWrap ? "visible" : "auto",
          flexShrink: 0,
          scrollbarWidth: "none"
        },
        children: categories.map((cat) => {
          const isActive = cat.id === activeCategory;
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => onCategoryChange?.(cat.id),
              style: {
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: 26,
                padding: "0 10px",
                borderRadius: 6,
                border: isActive ? "1px solid #fff" : "1px solid rgba(255,255,255,0.2)",
                background: isActive ? "#fff" : "transparent",
                color: isActive ? "#1a1a1a" : "rgba(255,255,255,0.7)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 120ms ease"
              },
              onMouseEnter: (e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                  e.currentTarget.style.color = "#fff";
                }
              },
              onMouseLeave: (e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }
              },
              children: [
                cat.icon && /* @__PURE__ */ jsx("span", { style: { fontSize: 13 }, children: cat.icon }),
                cat.label
              ]
            },
            cat.id
          );
        })
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: scrollRef,
        style: {
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.08) transparent"
        },
        children: loading && templates.length === 0 ? /* @__PURE__ */ jsx("div", { style: { columns: 4, columnGap: 8 }, children: Array.from({ length: SKELETON_COUNT }).map((_, i) => /* @__PURE__ */ jsx(SkeletonCard, { index: i }, i)) }) : templates.length === 0 ? /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              color: "rgba(255,255,255,0.25)",
              fontSize: 13
            },
            children: "No templates found"
          }
        ) : /* @__PURE__ */ jsxs("div", { style: { columns: 4, columnGap: 8 }, children: [
          templates.map((tpl) => {
            const isSelected = tpl.id === selectedId;
            const loaded = imgLoaded.has(tpl.id);
            const ratio = tpl.aspectRatio || 1;
            return /* @__PURE__ */ jsx(
              TemplateCard,
              {
                template: tpl,
                isSelected,
                loaded,
                ratio,
                onSelect: () => onSelect(tpl),
                onImgLoad: () => handleImgLoad(tpl.id)
              },
              tpl.id
            );
          }),
          hasMore && /* @__PURE__ */ jsx("div", { ref: sentinelRef, style: { height: 1 } }),
          loading && templates.length > 0 && Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ jsx(SkeletonCard, { index: i }, `more-${i}`))
        ] })
      }
    )
  ] });
}
function ScriptInfoHoverTooltip({
  charCount,
  maxChars,
  onIncreaseTimeLimit
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const updatePos = useCallback(() => {
    if (!ref.current)
      return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.left });
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      onMouseEnter: () => {
        setHovered(true);
        updatePos();
      },
      onMouseLeave: () => setHovered(false),
      style: {
        flexShrink: 0,
        width: 20,
        height: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "help",
        color: "rgba(255,255,255,0.4)"
      },
      children: [
        /* @__PURE__ */ jsx(Info, { size: 16 }),
        hovered && pos && ReactDOM.createPortal(
          /* @__PURE__ */ jsxs(
            "div",
            {
              onMouseEnter: () => setHovered(true),
              onMouseLeave: () => setHovered(false),
              style: {
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: 280,
                maxWidth: "calc(100vw - 24px)",
                padding: "12px 14px",
                borderRadius: 8,
                background: "rgba(37,37,37,0.95)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                zIndex: 9999,
                border: "1px solid rgba(255,255,255,0.08)"
              },
              children: [
                /* @__PURE__ */ jsx("p", { style: { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }, children: "It's okay to go slightly over 450 characters, but your video must stay under 30 sec to generate successfully." }),
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, flexWrap: "wrap", gap: 8 }, children: [
                  /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.4)" }, children: [
                    charCount,
                    "/",
                    maxChars,
                    " (30 sec max)"
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => onIncreaseTimeLimit?.(),
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: 0,
                        border: "none",
                        background: "transparent",
                        color: "#f59e0b",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer"
                      },
                      children: [
                        /* @__PURE__ */ jsx(Crown, { size: 14 }),
                        "Increase time limit"
                      ]
                    }
                  )
                ] })
              ]
            }
          ),
          document.body
        )
      ]
    }
  );
}
var modeBtn = (active) => ({
  flex: 1,
  height: 32,
  borderRadius: 6,
  border: "none",
  background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
  color: active ? "#fff" : "rgba(255,255,255,0.55)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 120ms ease"
});
function ScriptInput({
  mode,
  onModeChange,
  text,
  onTextChange,
  audioUrl,
  onAudioChange,
  maxChars = 450,
  placeholder = "Enter your script here...",
  showVoiceover = false,
  voiceoverOptions = [],
  selectedVoiceover,
  onVoiceoverChange,
  onPreviewVoice,
  showHelpers = false,
  onAddPause,
  onModifyPronunciation,
  showScriptInfo = false,
  onIncreaseTimeLimit,
  modifyPronunciationTooltip = "Modify pronunciation or add phonetics for specific words"
}) {
  const fileInputRef = useRef(null);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const voiceRef = useRef(null);
  const charCount = text.length;
  const isOverLimit = charCount > maxChars;
  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file)
        return;
      onAudioChange(URL.createObjectURL(file));
      e.target.value = "";
    },
    [onAudioChange]
  );
  const clearAudio = useCallback(() => {
    if (audioUrl.startsWith("blob:"))
      URL.revokeObjectURL(audioUrl);
    onAudioChange("");
  }, [audioUrl, onAudioChange]);
  React20.useEffect(() => {
    if (!voiceDropdownOpen)
      return;
    const handler = (e) => {
      if (voiceRef.current && !voiceRef.current.contains(e.target)) {
        setVoiceDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [voiceDropdownOpen]);
  const selectedVoice = voiceoverOptions.find((v) => v.id === selectedVoiceover);
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          gap: 0,
          padding: 2,
          borderRadius: 8,
          background: "rgba(255,255,255,0.08)"
        },
        children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onModeChange("text"), style: modeBtn(mode === "text"), children: "Text" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onModeChange("audio"), style: modeBtn(mode === "audio"), children: "Audio Upload" })
        ]
      }
    ),
    mode === "text" && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 8 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, position: "relative" }, children: [
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: text,
            onChange: (e) => onTextChange(e.target.value),
            placeholder,
            rows: 5,
            style: {
              width: "100%",
              padding: "10px 12px",
              paddingBottom: showScriptInfo ? 10 : 28,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 13,
              lineHeight: "1.5",
              resize: "none",
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box"
            },
            onFocus: (e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            },
            onBlur: (e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            }
          }
        ),
        !showScriptInfo && /* @__PURE__ */ jsxs(
          "span",
          {
            style: {
              position: "absolute",
              bottom: 8,
              right: 12,
              fontSize: 11,
              color: isOverLimit ? "#ef4444" : "rgba(255,255,255,0.25)",
              fontWeight: isOverLimit ? 600 : 400
            },
            children: [
              charCount,
              "/",
              maxChars
            ]
          }
        )
      ] }),
      showScriptInfo && /* @__PURE__ */ jsx(
        ScriptInfoHoverTooltip,
        {
          charCount,
          maxChars,
          onIncreaseTimeLimit
        }
      )
    ] }),
    mode === "audio" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: "audio/mp3,audio/wav,audio/mpeg,audio/ogg,audio/webm,audio/*",
          style: { display: "none" },
          onChange: handleFileSelect
        }
      ),
      audioUrl ? /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)"
          },
          children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: "rgba(54,67,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                },
                children: /* @__PURE__ */ jsx(Volume2, { size: 14, color: "#818cf8" })
              }
            ),
            /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  flex: 1,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.7)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                },
                children: "Audio uploaded"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: clearAudio,
                style: {
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: "none",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                },
                children: /* @__PURE__ */ jsx(X, { size: 12 })
              }
            )
          ]
        }
      ) : /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => fileInputRef.current?.click(),
          style: {
            width: "100%",
            height: 80,
            borderRadius: 8,
            border: "1.5px dashed rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.02)",
            color: "rgba(255,255,255,0.35)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            transition: "all 120ms ease"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
          },
          children: [
            /* @__PURE__ */ jsx(Upload, { size: 18, style: { opacity: 0.4 } }),
            "Upload audio file"
          ]
        }
      )
    ] }),
    showHelpers && mode === "text" && /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 4 }, children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            if (onAddPause) {
              onAddPause();
              return;
            }
            onTextChange(text + " [pause 0.2s] ");
          },
          style: {
            height: 26,
            padding: "0 10px",
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 100ms ease"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          },
          children: "Add Pause"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          title: modifyPronunciationTooltip,
          onClick: () => {
            if (onModifyPronunciation) {
              onModifyPronunciation();
              return;
            }
          },
          style: {
            height: 26,
            padding: "0 10px",
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 100ms ease"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          },
          children: "Modify Pronunciation"
        }
      )
    ] }),
    showVoiceover && mode === "text" && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.6)" }, children: "Voiceover" }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, alignItems: "center" }, children: [
        /* @__PURE__ */ jsxs("div", { ref: voiceRef, style: { position: "relative", flex: 1 }, children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setVoiceDropdownOpen((p) => !p),
              style: {
                width: "100%",
                height: 36,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "border-color 100ms ease"
              },
              children: [
                selectedVoice?.flag && /* @__PURE__ */ jsx("span", { children: selectedVoice.flag }),
                /* @__PURE__ */ jsx("span", { style: { flex: 1, textAlign: "left" }, children: selectedVoice?.name || "Select voice" }),
                /* @__PURE__ */ jsx(
                  ChevronDown,
                  {
                    size: 14,
                    style: {
                      color: "rgba(255,255,255,0.3)",
                      transition: "transform 150ms ease",
                      transform: voiceDropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
                    }
                  }
                )
              ]
            }
          ),
          voiceDropdownOpen && voiceoverOptions.length > 0 && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                bottom: "calc(100% + 4px)",
                left: 0,
                right: 0,
                padding: 4,
                borderRadius: 8,
                background: "#1e1e1e",
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                zIndex: 20,
                maxHeight: 200,
                overflowY: "auto"
              },
              children: voiceoverOptions.map((v) => /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    onVoiceoverChange?.(v.id);
                    setVoiceDropdownOpen(false);
                  },
                  style: {
                    width: "100%",
                    padding: "6px 8px",
                    border: "none",
                    borderRadius: 4,
                    background: v.id === selectedVoiceover ? "rgba(255,255,255,0.08)" : "transparent",
                    color: v.id === selectedVoiceover ? "#fff" : "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: v.id === selectedVoiceover ? 500 : 400,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "background 80ms ease"
                  },
                  onMouseEnter: (e) => {
                    if (v.id !== selectedVoiceover)
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  },
                  onMouseLeave: (e) => {
                    if (v.id !== selectedVoiceover)
                      e.currentTarget.style.background = "transparent";
                  },
                  children: [
                    v.flag && /* @__PURE__ */ jsx("span", { children: v.flag }),
                    v.name
                  ]
                },
                v.id
              ))
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onPreviewVoice?.(),
            style: {
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 100ms ease"
            },
            onMouseEnter: (e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
            },
            children: /* @__PURE__ */ jsx(Volume2, { size: 14 })
          }
        )
      ] })
    ] })
  ] });
}
function CommonTooltip({ text, children }) {
  return /* @__PURE__ */ jsx("span", { title: text, children });
}
var CUSTOM_MOTION_MAX_LENGTH = 600;
var sectionLabel = {
  fontSize: 12,
  fontWeight: 500,
  color: "rgba(255,255,255,0.6)",
  display: "block",
  marginBottom: 8
};
var DEMO_SUBTITLE_OPTIONS = [
  { key: "style-default", label: "Default" },
  { key: "style-minimal", label: "Minimal" },
  { key: "style-bold", label: "Bold" }
];
function MoreSettingsPanel({
  captionKey,
  onCaptionKeyChange,
  customMotion,
  onCustomMotionChange,
  offPeak,
  onOffPeakChange
}) {
  const [subtitleModalOpen, setSubtitleModalOpen] = useState(false);
  useRef(null);
  const handleSubtitleSelect = useCallback(
    (key) => {
      onCaptionKeyChange(key);
      setSubtitleModalOpen(false);
    },
    [onCaptionKeyChange]
  );
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
    /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
      /* @__PURE__ */ jsx("span", { style: sectionLabel, children: "Subtitle Style" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setSubtitleModalOpen(true),
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 56,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            transition: "all 120ms ease"
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          },
          children: !captionKey ? /* @__PURE__ */ jsx(Ban, { size: 24, style: { opacity: 0.6 } }) : /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "rgba(255,255,255,0.8)" }, children: DEMO_SUBTITLE_OPTIONS.find((o) => o.key === captionKey)?.label ?? "Style" })
        }
      ),
      subtitleModalOpen && /* @__PURE__ */ jsx(
        SubtitleStyleModal,
        {
          captionKey,
          onSelect: handleSubtitleSelect,
          onClose: () => setSubtitleModalOpen(false),
          options: DEMO_SUBTITLE_OPTIONS
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }, children: [
        /* @__PURE__ */ jsx("span", { style: sectionLabel, children: "Custom Motion" }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.4)" }, children: "(Optional)" }),
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              padding: "2px 6px",
              borderRadius: 4,
              background: "rgba(99,102,241,0.2)",
              color: "#818cf8",
              fontSize: 10,
              fontWeight: 500
            },
            children: "Beta"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          value: customMotion ?? "",
          onChange: (e) => {
            const v = e.target.value;
            if (v.length <= CUSTOM_MOTION_MAX_LENGTH)
              onCustomMotionChange(v || void 0);
          },
          placeholder: "Describe the avatar's emotional actions, such as excited, discouraged, or cheering.",
          rows: 4,
          style: {
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            color: "#fff",
            fontSize: 13,
            lineHeight: 1.5,
            resize: "none",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box"
          }
        }
      ),
      /* @__PURE__ */ jsxs("div", { style: { marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.4)" }, children: [
        (customMotion ?? "").length,
        "/",
        CUSTOM_MOTION_MAX_LENGTH
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx("span", { style: { ...sectionLabel, marginBottom: 0 }, children: "Off-Peak Mode" }),
            /* @__PURE__ */ jsx(Crown, { size: 14, style: { color: "#a78bfa" } }),
            /* @__PURE__ */ jsx(
              CommonTooltip,
              {
                text: "Save 50% credits. Processed in idle hours. Guaranteed within 24h.",
                placement: "top",
                children: /* @__PURE__ */ jsx("span", { style: { cursor: "help", display: "flex", alignItems: "center" }, children: /* @__PURE__ */ jsx(Info, { size: 14, style: { color: "rgba(255,255,255,0.3)" } }) })
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              role: "switch",
              "aria-checked": !!offPeak,
              onClick: () => onOffPeakChange(!offPeak),
              style: {
                position: "relative",
                width: 36,
                height: 20,
                borderRadius: 10,
                border: "none",
                background: offPeak ? "#6366f1" : "rgba(255,255,255,0.2)",
                cursor: "pointer",
                transition: "background 150ms ease"
              },
              children: /* @__PURE__ */ jsx(
                "span",
                {
                  style: {
                    position: "absolute",
                    top: 2,
                    left: offPeak ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: "#fff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    transition: "left 150ms ease"
                  }
                }
              )
            }
          )
        ]
      }
    )
  ] });
}
function SubtitleStyleModal({
  captionKey,
  onSelect,
  onClose,
  options
}) {
  const ref = useRef(null);
  React20.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target))
        onClose();
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [onClose]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      style: {
        position: "absolute",
        left: 0,
        top: "100%",
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        background: "#1e1e1e",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        zIndex: 100,
        minWidth: 140
      },
      children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => onSelect(void 0),
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              background: captionKey === void 0 ? "rgba(78,64,243,0.3)" : "transparent",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left"
            },
            children: [
              /* @__PURE__ */ jsx(Ban, { size: 16, style: { opacity: 0.6 } }),
              "No Subtitle"
            ]
          }
        ),
        options.map((opt) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onSelect(opt.key),
            style: {
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              background: captionKey === opt.key ? "rgba(78,64,243,0.3)" : "transparent",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left"
            },
            children: opt.label
          },
          opt.key
        ))
      ] })
    }
  );
}
var MODEL_OPTIONS = [
  {
    value: "avatar4",
    label: "Avatar 4",
    desc: "Best quality",
    features: [
      "Character actions automatically match the audio rhythm; support prompt-based control of character movements.",
      "Up to 120 seconds per video."
    ]
  },
  {
    value: "avatar4-fast",
    label: "Avatar 4 Fast",
    desc: "Faster, slightly lower quality",
    features: ["Cheaper and faster, with slightly lower quality than Avatar 4."]
  }
];
var DEMO_CATEGORIES = [
  { id: "my-avatar", label: "My Avatar", icon: "\u{1F464}" },
  { id: "favorite", label: "Favorite", icon: "\u2B50" },
  { id: "all", label: "All" },
  { id: "conference", label: "\u{1F3A4}Conference/Public Speaking" },
  { id: "lifestyle", label: "\u{1F33F}Lifestyle/UGC" },
  { id: "doctor", label: "\u{1F3E5}Doctor/Expert" },
  { id: "fashion", label: "\u{1F457}Fashion/Model" },
  { id: "tech", label: "\u{1F4BB}Tech/Geek" },
  { id: "business", label: "\u{1F4BC}Business/Profession" },
  { id: "fitness", label: "\u{1F4AA}Fitness/sport" },
  { id: "foodie", label: "Foodie/Chef", icon: "\u{1F468}\u200D\u{1F373}" },
  { id: "pets", label: "Pets/Animals", icon: "\u{1F431}" },
  { id: "senior", label: "Senior", icon: "\u{1F474}" },
  { id: "anime", label: "\u2728Anime/Creative" }
];
var DEMO_VOICEOVER_OPTIONS = [
  { id: "violet", name: "Violet", language: "en" },
  { id: "adam", name: "Adam", language: "en" },
  { id: "emma", name: "Emma", language: "en" },
  { id: "josh", name: "Josh", language: "en" },
  { id: "sarah", name: "Sarah", language: "en" },
  { id: "alex", name: "Alex", language: "en" },
  { id: "lily", name: "Lily", language: "en" }
];
function makeDemoTemplates() {
  const cats = ["conference", "lifestyle", "doctor", "fashion", "tech", "business", "fitness", "foodie", "pets", "senior", "anime"];
  const names = [
    "Professional Pitch",
    "Corporate Intro",
    "Meeting Opener",
    "Product Launch",
    "Social Ad",
    "Brand Story",
    "Course Intro",
    "Tutorial Guide",
    "Quiz Intro",
    "Fun Greeting",
    "Birthday Wish",
    "Holiday Message",
    "Product Review",
    "Flash Sale",
    "Unboxing",
    "Morning Motivation",
    "Wellness Tips",
    "Travel Vlog",
    "Tech News",
    "App Demo",
    "Software Tutorial",
    "Health Reminder",
    "Medical Info",
    "Appointment Reminder"
  ];
  return names.map((name, i) => ({
    id: `demo-${i + 1}`,
    name,
    thumbnailUrl: `https://picsum.photos/seed/avatar-${i + 1}/${360 + i % 3 * 40}/${440 + i * 7 % 5 * 30}`,
    category: cats[Math.floor(i / 3) % cats.length],
    aspectRatio: (360 + i % 3 * 40) / (440 + i * 7 % 5 * 30)
  }));
}
var DEMO_TEMPLATES = makeDemoTemplates();
var sectionLabel2 = {
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.65)",
  display: "block",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};
var actionCardStyle = {
  display: "flex",
  flex: 1,
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  borderRadius: 8,
  border: "1px dashed rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.65)",
  cursor: "pointer",
  fontSize: 10,
  fontWeight: 500,
  transition: "all 120ms ease",
  padding: 8
};
function AvatarPhotoSection({
  avatarUrl,
  templateName,
  onClear,
  onUploadPhoto,
  onSelectFromTemplates,
  onSelectFromBoard
}) {
  const fileInputRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    onUploadPhoto(URL.createObjectURL(file));
    e.target.value = "";
  }, [onUploadPhoto]);
  if (avatarUrl) {
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("span", { style: sectionLabel2, children: "Avatar" }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            borderRadius: 8,
            overflow: "hidden",
            background: "#111",
            border: "1px solid rgba(255,255,255,0.08)"
          },
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
          children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: avatarUrl,
                alt: "Selected avatar",
                style: { width: "100%", height: "100%", objectFit: "contain", display: "block" }
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onClear,
                style: {
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  background: "rgba(0,0,0,0.6)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: hovered ? 1 : 0,
                  transition: "opacity 150ms ease"
                },
                children: /* @__PURE__ */ jsx(X, { size: 12 })
              }
            ),
            onSelectFromBoard && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onSelectFromBoard,
                style: {
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  right: 4,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(0,0,0,0.7)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: hovered ? 1 : 0,
                  transform: hovered ? "translateY(0)" : "translateY(4px)",
                  transition: "all 150ms ease",
                  pointerEvents: hovered ? "auto" : "none"
                },
                children: "Select from Board"
              }
            ),
            templateName && /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "16px 8px 6px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                  textAlign: "center",
                  pointerEvents: "none",
                  opacity: hovered ? 0 : 1,
                  transition: "opacity 150ms ease"
                },
                children: /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 500 }, children: templateName })
              }
            )
          ]
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("span", { style: sectionLabel2, children: "Avatar" }),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: fileInputRef,
        type: "file",
        accept: "image/jpeg,image/png,image/webp",
        style: { display: "none" },
        onChange: handleFileSelect
      }
    ),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, aspectRatio: "4/3" }, children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          style: { display: "flex", flex: 1, position: "relative" },
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
          children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => fileInputRef.current?.click(),
                style: {
                  ...actionCardStyle,
                  flex: 1,
                  width: "100%",
                  gap: 6
                },
                onMouseEnter: (e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.16)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                },
                onMouseLeave: (e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                },
                children: [
                  /* @__PURE__ */ jsx(Upload, { size: 20, style: { opacity: 0.65 } }),
                  /* @__PURE__ */ jsx("span", { children: "Upload Photo" })
                ]
              }
            ),
            onSelectFromBoard && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onSelectFromBoard,
                style: {
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  right: 4,
                  height: 26,
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(0,0,0,0.7)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: hovered ? 1 : 0,
                  transform: hovered ? "translateY(0)" : "translateY(3px)",
                  transition: "all 150ms ease",
                  pointerEvents: hovered ? "auto" : "none"
                },
                children: "Select from Board"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flex: 1, flexDirection: "column", gap: 6 }, children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: onSelectFromTemplates,
            style: actionCardStyle,
            onMouseEnter: (e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
              e.currentTarget.style.background = "rgba(255,255,255,0.16)";
              e.currentTarget.style.color = "rgba(255,255,255,0.9)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.65)";
            },
            children: [
              /* @__PURE__ */ jsx(Images, { size: 16, style: { opacity: 0.65 } }),
              /* @__PURE__ */ jsx("span", { children: "Select from Templates" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => {
            },
            style: actionCardStyle,
            onMouseEnter: (e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
              e.currentTarget.style.background = "rgba(255,255,255,0.16)";
              e.currentTarget.style.color = "rgba(255,255,255,0.9)";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.65)";
            },
            children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 16, style: { opacity: 0.65 } }),
              /* @__PURE__ */ jsx("span", { children: "Create with AI" })
            ]
          }
        )
      ] })
    ] })
  ] });
}
function AIAvatarModal({
  open,
  onClose,
  credits = 0,
  onSubmit,
  onSelectFromBoard,
  templates: templatesProp = [],
  categories: categoriesProp = [],
  onCategoryChange,
  onLoadMoreTemplates,
  hasMoreTemplates,
  loadingTemplates,
  voiceoverOptions: voiceoverOptionsProp = [],
  initialAvatarUrl,
  modelPreviewVideoUrl,
  modelPreviewPosterUrl
}) {
  const categories = categoriesProp.length > 0 ? categoriesProp : DEMO_CATEGORIES;
  const allTemplates = templatesProp.length > 0 ? templatesProp : DEMO_TEMPLATES;
  const voiceoverOptions = voiceoverOptionsProp.length > 0 ? voiceoverOptionsProp : DEMO_VOICEOVER_OPTIONS;
  const [model, setModel] = useState("avatar4");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [scriptMode, setScriptMode] = useState("text");
  const [scriptText, setScriptText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [voiceoverId, setVoiceoverId] = useState(voiceoverOptions[0]?.id ?? "");
  const [activeCategory, setActiveCategory] = useState("all");
  const [moreSettingsOpen, setMoreSettingsOpen] = useState(false);
  const [captionKey, setCaptionKey] = useState(void 0);
  const [customMotion, setCustomMotion] = useState(void 0);
  const [offPeak, setOffPeak] = useState(false);
  const [modelTooltip, setModelTooltip] = useState(null);
  const [modelTooltipPos, setModelTooltipPos] = useState(null);
  const modelButtonRefs = useRef(/* @__PURE__ */ new Map());
  const filteredTemplates = React20.useMemo(() => {
    if (!activeCategory || activeCategory === "all" || activeCategory === "my-avatar" || activeCategory === "favorite") {
      return allTemplates;
    }
    return allTemplates.filter((t) => t.category === activeCategory);
  }, [allTemplates, activeCategory]);
  useEffect(() => {
    if (open) {
      setModel("avatar4");
      setSelectedTemplate(null);
      setAvatarUrl(initialAvatarUrl ?? "");
      setScriptMode("text");
      setScriptText("");
      setAudioUrl("");
      setVoiceoverId(voiceoverOptions[0]?.id ?? "");
      setActiveCategory("all");
      setMoreSettingsOpen(false);
      setCaptionKey(void 0);
      setCustomMotion(void 0);
      setOffPeak(false);
    }
  }, [open, initialAvatarUrl, voiceoverOptions]);
  const handleTemplateSelect = useCallback((tpl) => {
    setSelectedTemplate(tpl);
    setAvatarUrl(tpl.thumbnailUrl);
  }, []);
  const handleCategoryChange = useCallback(
    (id) => {
      setActiveCategory(id);
      onCategoryChange?.(id);
    },
    [onCategoryChange]
  );
  const hasAvatar = !!avatarUrl;
  const hasScript = scriptMode === "text" ? scriptText.trim().length > 0 : !!audioUrl;
  const canSubmit = hasAvatar && hasScript;
  const handleSubmit = useCallback(() => {
    if (!canSubmit)
      return;
    onSubmit({
      actionId: "ai-avatar",
      templateId: selectedTemplate?.id,
      avatarImageUrl: avatarUrl,
      model,
      scriptMode,
      scriptText: scriptMode === "text" ? scriptText : void 0,
      audioUrl: scriptMode === "audio" ? audioUrl : void 0,
      voiceoverId: scriptMode === "text" ? voiceoverId : void 0,
      motion: customMotion,
      subtitleStyle: captionKey,
      offPeak
    });
  }, [canSubmit, onSubmit, selectedTemplate, avatarUrl, model, scriptMode, scriptText, audioUrl, voiceoverId, customMotion, captionKey, offPeak]);
  return /* @__PURE__ */ jsx(
    ImmersiveModal,
    {
      open,
      title: "AI Avatar",
      onClose,
      maxWidth: 1800,
      footer: /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleSubmit,
          style: {
            height: 44,
            width: 400,
            maxWidth: "80%",
            padding: "0 24px",
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 120ms ease",
            background: canSubmit ? "#3643FF" : "rgba(255,255,255,0.08)",
            color: canSubmit ? "#fff" : "rgba(255,255,255,0.4)",
            cursor: canSubmit ? "pointer" : "default"
          },
          onMouseEnter: (e) => {
            if (canSubmit)
              e.currentTarget.style.background = "#4a55ff";
          },
          onMouseLeave: (e) => {
            if (canSubmit)
              e.currentTarget.style.background = "#3643FF";
          },
          children: [
            /* @__PURE__ */ jsx("span", { children: "Generate" }),
            /* @__PURE__ */ jsx("div", { style: { width: 1, height: 16, background: canSubmit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)" } }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ jsx(Crown, { size: 16, color: canSubmit ? "#facc15" : "currentColor" }),
              /* @__PURE__ */ jsx("span", { children: credits })
            ] })
          ]
        }
      ) }),
      children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 24, flex: 1, minHeight: 0, marginTop: 24 }, children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              width: 300,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              overflowY: "auto",
              padding: "16px 12px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.08) transparent",
              position: "relative",
              zIndex: 1
            },
            children: [
              /* @__PURE__ */ jsxs("div", { style: { position: "relative", zIndex: 2 }, children: [
                /* @__PURE__ */ jsx("span", { style: sectionLabel2, children: "Model" }),
                /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6 }, children: MODEL_OPTIONS.map((opt) => {
                  const isActive = model === opt.value;
                  modelTooltip === opt.value;
                  return /* @__PURE__ */ jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      ref: (el) => {
                        if (el)
                          modelButtonRefs.current.set(opt.value, el);
                      },
                      type: "button",
                      onClick: () => setModel(opt.value),
                      onMouseEnter: (e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const w = 320;
                        const h = modelPreviewVideoUrl ? 280 : 120;
                        let left = rect.left + rect.width / 2 - w / 2;
                        let top = rect.bottom + 8;
                        if (left + w > window.innerWidth - 10)
                          left = window.innerWidth - w - 10;
                        if (left < 10)
                          left = 10;
                        if (top + h > window.innerHeight - 10)
                          top = rect.top - h - 8;
                        setModelTooltipPos({ top, left });
                        setModelTooltip(opt.value);
                      },
                      onMouseLeave: () => {
                        setModelTooltip(null);
                        setModelTooltipPos(null);
                      },
                      style: {
                        width: "100%",
                        height: 34,
                        borderRadius: 8,
                        border: isActive ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.12)",
                        background: isActive ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                        color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 120ms ease"
                      },
                      children: opt.label
                    }
                  ) }, opt.value);
                }) }),
                /* @__PURE__ */ jsx(
                  "p",
                  {
                    style: {
                      margin: "6px 0 0",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.45)",
                      lineHeight: "16px"
                    },
                    children: MODEL_OPTIONS.find((o) => o.value === model)?.desc
                  }
                )
              ] }),
              modelTooltip && modelTooltipPos && open && ReactDOM.createPortal(
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    onMouseEnter: () => setModelTooltip(modelTooltip),
                    onMouseLeave: () => {
                      setModelTooltip(null);
                      setModelTooltipPos(null);
                    },
                    style: {
                      position: "fixed",
                      top: modelTooltipPos.top,
                      left: modelTooltipPos.left,
                      width: 320,
                      padding: modelPreviewVideoUrl ? 0 : 12,
                      borderRadius: 8,
                      background: "#2d2d2d",
                      border: "1px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                      zIndex: 9999,
                      overflow: "hidden"
                    },
                    children: [
                      modelPreviewVideoUrl && /* @__PURE__ */ jsx("div", { style: { position: "relative", aspectRatio: "16/9", background: "#000" }, children: /* @__PURE__ */ jsx(
                        "video",
                        {
                          src: modelPreviewVideoUrl,
                          poster: modelPreviewPosterUrl,
                          autoPlay: true,
                          loop: true,
                          muted: true,
                          playsInline: true,
                          style: { width: "100%", height: "100%", objectFit: "cover" }
                        }
                      ) }),
                      /* @__PURE__ */ jsx("div", { style: { padding: 12 }, children: /* @__PURE__ */ jsx("ul", { style: { margin: 0, padding: 0, listStyle: "none" }, children: MODEL_OPTIONS.find((o) => o.value === modelTooltip)?.features.map((f, i) => /* @__PURE__ */ jsxs(
                        "li",
                        {
                          style: {
                            display: "flex",
                            gap: 8,
                            marginTop: i > 0 ? 6 : 0,
                            fontSize: 12,
                            color: "rgba(255,255,255,0.7)",
                            lineHeight: 1.4
                          },
                          children: [
                            /* @__PURE__ */ jsx("span", { style: { flexShrink: 0, width: 4, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.4)", marginTop: 6 } }),
                            /* @__PURE__ */ jsx("span", { children: f })
                          ]
                        },
                        i
                      )) }) })
                    ]
                  }
                ),
                document.body
              ),
              /* @__PURE__ */ jsx(
                AvatarPhotoSection,
                {
                  avatarUrl,
                  templateName: selectedTemplate?.name,
                  onClear: () => {
                    setAvatarUrl("");
                    setSelectedTemplate(null);
                  },
                  onUploadPhoto: (url) => setAvatarUrl(url),
                  onSelectFromTemplates: () => {
                  },
                  onSelectFromBoard: onSelectFromBoard ? () => onSelectFromBoard("avatar-template") : void 0
                }
              ),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { style: sectionLabel2, children: "Script" }),
                /* @__PURE__ */ jsx(
                  ScriptInput,
                  {
                    mode: scriptMode,
                    onModeChange: setScriptMode,
                    text: scriptText,
                    onTextChange: setScriptText,
                    audioUrl,
                    onAudioChange: setAudioUrl,
                    maxChars: 450,
                    showHelpers: true,
                    showVoiceover: true,
                    voiceoverOptions,
                    selectedVoiceover: voiceoverId,
                    onVoiceoverChange: setVoiceoverId,
                    onPreviewVoice: () => {
                    },
                    showScriptInfo: true,
                    onIncreaseTimeLimit: () => {
                    }
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { position: "relative", zIndex: 2 }, children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setMoreSettingsOpen((p) => !p),
                    style: {
                      width: "100%",
                      padding: "8px 0",
                      border: "none",
                      background: "transparent",
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "color 100ms ease"
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    },
                    children: [
                      /* @__PURE__ */ jsx(
                        ChevronDown,
                        {
                          size: 14,
                          style: {
                            transition: "transform 150ms ease",
                            transform: moreSettingsOpen ? "rotate(0deg)" : "rotate(-90deg)"
                          }
                        }
                      ),
                      "More Settings"
                    ]
                  }
                ),
                moreSettingsOpen && /* @__PURE__ */ jsx("div", { style: { padding: "16px 0 0", marginTop: 12 }, children: /* @__PURE__ */ jsx(
                  MoreSettingsPanel,
                  {
                    captionKey,
                    onCaptionKeyChange: setCaptionKey,
                    customMotion,
                    onCustomMotionChange: setCustomMotion,
                    offPeak,
                    onOffPeakChange: setOffPeak
                  }
                ) })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }, children: /* @__PURE__ */ jsx(
          AvatarTemplateGrid,
          {
            templates: filteredTemplates,
            selectedId: selectedTemplate?.id ?? null,
            onSelect: handleTemplateSelect,
            categories,
            activeCategory,
            onCategoryChange: handleCategoryChange,
            onLoadMore: onLoadMoreTemplates,
            hasMore: hasMoreTemplates,
            loading: loadingTemplates
          }
        ) })
      ] })
    }
  );
}
var EMOTION_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "happy", label: "Happy" },
  { value: "sad", label: "Sad" },
  { value: "angry", label: "Angry" },
  { value: "surprised", label: "Surprised" }
];
var sectionLabel3 = {
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};
function VideoLipSyncModal({
  open,
  onClose,
  credits = 0,
  onSubmit,
  onSelectFromBoard,
  templates = [],
  categories = [],
  onCategoryChange,
  onLoadMoreTemplates,
  hasMoreTemplates,
  loadingTemplates,
  voiceoverOptions = [],
  initialVideoUrl
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [sourceMode, setSourceMode] = useState("template");
  const [scriptMode, setScriptMode] = useState("text");
  const [scriptText, setScriptText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [voiceoverId, setVoiceoverId] = useState(voiceoverOptions[0]?.id ?? "");
  const [emotion, setEmotion] = useState("normal");
  const [emotionOpen, setEmotionOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "all");
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const emotionRef = useRef(null);
  useEffect(() => {
    if (open) {
      setSelectedTemplate(null);
      setVideoUrl(initialVideoUrl ?? "");
      setSourceMode(initialVideoUrl ? "upload" : "template");
      setScriptMode("text");
      setScriptText("");
      setAudioUrl("");
      setVoiceoverId(voiceoverOptions[0]?.id ?? "");
      setEmotion("normal");
      setEmotionOpen(false);
      setActiveCategory(categories[0]?.id ?? "all");
      setIsPlaying(false);
    }
  }, [open, initialVideoUrl, voiceoverOptions, categories]);
  useEffect(() => {
    if (!emotionOpen)
      return;
    const handler = (e) => {
      if (emotionRef.current && !emotionRef.current.contains(e.target))
        setEmotionOpen(false);
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [emotionOpen]);
  const handleTemplateSelect = useCallback((tpl) => {
    setSelectedTemplate(tpl);
    setVideoUrl(tpl.thumbnailUrl);
    setSourceMode("template");
  }, []);
  const handleCategoryChange = useCallback(
    (id) => {
      setActiveCategory(id);
      onCategoryChange?.(id);
    },
    [onCategoryChange]
  );
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    setVideoUrl(URL.createObjectURL(file));
    setSourceMode("upload");
    setSelectedTemplate(null);
    e.target.value = "";
  }, []);
  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid)
      return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, []);
  const hasVideo = !!videoUrl;
  const hasScript = scriptMode === "text" ? scriptText.trim().length > 0 : !!audioUrl;
  const canSubmit = hasVideo && hasScript;
  const handleSubmit = useCallback(() => {
    if (!canSubmit)
      return;
    onSubmit({
      actionId: "video-lip-sync",
      sourceMode,
      templateId: selectedTemplate?.id,
      videoUrl,
      scriptMode,
      scriptText: scriptMode === "text" ? scriptText : void 0,
      audioUrl: scriptMode === "audio" ? audioUrl : void 0,
      voiceoverId: scriptMode === "text" ? voiceoverId : void 0,
      emotion
    });
  }, [canSubmit, onSubmit, sourceMode, selectedTemplate, videoUrl, scriptMode, scriptText, audioUrl, voiceoverId, emotion]);
  const selectedEmotion = EMOTION_OPTIONS.find((e) => e.value === emotion);
  return /* @__PURE__ */ jsxs(
    ImmersiveModal,
    {
      open,
      title: "Video Lip Sync",
      subtitle: "Sync lip movements to any avatar video",
      onClose,
      maxWidth: 1800,
      footer: /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleSubmit,
          style: {
            height: 44,
            width: 400,
            maxWidth: "80%",
            padding: "0 24px",
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 120ms ease",
            background: canSubmit ? "#3643FF" : "rgba(255,255,255,0.08)",
            color: canSubmit ? "#fff" : "rgba(255,255,255,0.4)",
            cursor: canSubmit ? "pointer" : "default"
          },
          onMouseEnter: (e) => {
            if (canSubmit)
              e.currentTarget.style.background = "#4a55ff";
          },
          onMouseLeave: (e) => {
            if (canSubmit)
              e.currentTarget.style.background = "#3643FF";
          },
          children: [
            /* @__PURE__ */ jsx("span", { children: "Generate" }),
            /* @__PURE__ */ jsx("div", { style: { width: 1, height: 16, background: canSubmit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)" } }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ jsx(Crown, { size: 16, color: canSubmit ? "#facc15" : "currentColor" }),
              /* @__PURE__ */ jsx("span", { children: credits })
            ] })
          ]
        }
      ) }),
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            accept: "video/mp4,video/webm,video/quicktime,video/*",
            style: { display: "none" },
            onChange: handleFileSelect
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 24, flex: 1, minHeight: 0, marginTop: 24 }, children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                width: 300,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                overflowY: "auto",
                paddingRight: 4,
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.06) transparent"
              },
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: sectionLabel3, children: "Video Source" }),
                  videoUrl ? /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        position: "relative",
                        width: "100%",
                        aspectRatio: "16/9",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#000"
                      },
                      children: [
                        /* @__PURE__ */ jsx(
                          "video",
                          {
                            ref: videoRef,
                            src: videoUrl,
                            style: { width: "100%", height: "100%", objectFit: "contain", display: "block" },
                            onEnded: () => setIsPlaying(false),
                            loop: false
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: togglePlay,
                            style: {
                              position: "absolute",
                              inset: 0,
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            },
                            children: !isPlaying && /* @__PURE__ */ jsx(
                              "div",
                              {
                                style: {
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  background: "rgba(0,0,0,0.6)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backdropFilter: "blur(4px)"
                                },
                                children: /* @__PURE__ */ jsx(Play, { size: 18, color: "#fff", style: { marginLeft: 2 } })
                              }
                            )
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              if (videoUrl.startsWith("blob:"))
                                URL.revokeObjectURL(videoUrl);
                              setVideoUrl("");
                              setSelectedTemplate(null);
                              setIsPlaying(false);
                            },
                            style: {
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              background: "rgba(0,0,0,0.4)",
                              border: "none",
                              color: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backdropFilter: "blur(8px)",
                              zIndex: 2
                            },
                            children: /* @__PURE__ */ jsx(X, { size: 14 })
                          }
                        )
                      ]
                    }
                  ) : /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => fileInputRef.current?.click(),
                      style: {
                        width: "100%",
                        aspectRatio: "16/9",
                        borderRadius: 10,
                        border: "1.5px dashed rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.02)",
                        color: "rgba(255,255,255,0.3)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        transition: "all 120ms ease"
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      },
                      children: [
                        /* @__PURE__ */ jsx(CloudUpload, { size: 24, style: { opacity: 0.4 } }),
                        "Select a template or upload \u2192"
                      ]
                    }
                  ),
                  !videoUrl && /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => fileInputRef.current?.click(),
                      style: {
                        width: "100%",
                        height: 34,
                        marginTop: 8,
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "background 120ms ease"
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      },
                      children: [
                        /* @__PURE__ */ jsx(Upload, { size: 13 }),
                        "Upload Video"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: sectionLabel3, children: "Script" }),
                  /* @__PURE__ */ jsx(
                    ScriptInput,
                    {
                      mode: scriptMode,
                      onModeChange: setScriptMode,
                      text: scriptText,
                      onTextChange: setScriptText,
                      audioUrl,
                      onAudioChange: setAudioUrl,
                      maxChars: 450,
                      showVoiceover: voiceoverOptions.length > 0,
                      voiceoverOptions,
                      selectedVoiceover: voiceoverId,
                      onVoiceoverChange: setVoiceoverId
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: sectionLabel3, children: "Emotion" }),
                  /* @__PURE__ */ jsxs("div", { ref: emotionRef, style: { position: "relative" }, children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setEmotionOpen((p) => !p),
                        style: {
                          width: "100%",
                          height: 36,
                          padding: "0 10px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "border-color 100ms ease"
                        },
                        children: [
                          /* @__PURE__ */ jsx("span", { children: selectedEmotion?.label ?? "Normal" }),
                          /* @__PURE__ */ jsx(
                            ChevronDown,
                            {
                              size: 14,
                              style: {
                                color: "rgba(255,255,255,0.3)",
                                transition: "transform 150ms ease",
                                transform: emotionOpen ? "rotate(180deg)" : "rotate(0deg)"
                              }
                            }
                          )
                        ]
                      }
                    ),
                    emotionOpen && /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          position: "absolute",
                          bottom: "calc(100% + 8px)",
                          left: 0,
                          right: 0,
                          padding: 4,
                          borderRadius: 8,
                          background: "#1e1e1e",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                          zIndex: 20
                        },
                        children: EMOTION_OPTIONS.map((opt) => /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              setEmotion(opt.value);
                              setEmotionOpen(false);
                            },
                            style: {
                              width: "100%",
                              padding: "6px 8px",
                              border: "none",
                              borderRadius: 4,
                              background: opt.value === emotion ? "rgba(255,255,255,0.08)" : "transparent",
                              color: opt.value === emotion ? "#fff" : "rgba(255,255,255,0.6)",
                              fontSize: 12,
                              fontWeight: opt.value === emotion ? 500 : 400,
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "background 80ms ease"
                            },
                            onMouseEnter: (e) => {
                              if (opt.value !== emotion)
                                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                            },
                            onMouseLeave: (e) => {
                              if (opt.value !== emotion)
                                e.currentTarget.style.background = "transparent";
                            },
                            children: opt.label
                          },
                          opt.value
                        ))
                      }
                    )
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { style: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }, children: /* @__PURE__ */ jsx(
            AvatarTemplateGrid,
            {
              templates,
              selectedId: selectedTemplate?.id ?? null,
              onSelect: handleTemplateSelect,
              categories,
              activeCategory,
              onCategoryChange: handleCategoryChange,
              onLoadMore: onLoadMoreTemplates,
              hasMore: hasMoreTemplates,
              loading: loadingTemplates
            }
          ) })
        ] })
      ]
    }
  );
}
var GENDER_OPTIONS = ["Male", "Female", "Non-binary"];
var AGE_OPTIONS = ["Young (18-25)", "Adult (26-40)", "Middle-aged (41-60)", "Senior (60+)"];
var ETHNICITY_OPTIONS = ["Asian", "Black", "Caucasian", "Hispanic", "Middle Eastern", "Mixed", "South Asian"];
var DEFAULT_SAMPLES = [
  "A professional business woman in a modern office, wearing a navy blazer, warm lighting, confident expression",
  "A friendly young man in casual streetwear, urban background, natural smile, soft daylight",
  "A doctor in a white coat, hospital setting, trustworthy expression, clean background"
];
var sectionLabel4 = {
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};
var segBtn = (active) => ({
  flex: 1,
  height: 34,
  borderRadius: 8,
  border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
  background: active ? "rgba(255,255,255,0.08)" : "transparent",
  color: active ? "#fff" : "rgba(255,255,255,0.4)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 120ms ease"
});
function SelectDropdown({
  label,
  value,
  options,
  onChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!isOpen)
      return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target))
        setIsOpen(false);
    };
    window.addEventListener("mousedown", handler, true);
    return () => window.removeEventListener("mousedown", handler, true);
  }, [isOpen]);
  return /* @__PURE__ */ jsxs("div", { ref, style: { position: "relative", flex: 1 }, children: [
    /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }, children: label }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setIsOpen((p) => !p),
        style: {
          width: "100%",
          height: 36,
          padding: "0 10px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: value ? "#fff" : "rgba(255,255,255,0.3)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: value || label }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 14, style: { color: "rgba(255,255,255,0.3)", flexShrink: 0 } })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "absolute",
          top: "calc(100% + 8px)",
          left: 0,
          right: 0,
          padding: 4,
          borderRadius: 8,
          background: "#1e1e1e",
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          zIndex: 30,
          maxHeight: 180,
          overflowY: "auto"
        },
        children: options.map((opt) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              onChange(opt);
              setIsOpen(false);
            },
            style: {
              width: "100%",
              padding: "6px 8px",
              border: "none",
              borderRadius: 4,
              background: opt === value ? "rgba(255,255,255,0.08)" : "transparent",
              color: opt === value ? "#fff" : "rgba(255,255,255,0.6)",
              fontSize: 12,
              fontWeight: opt === value ? 500 : 400,
              cursor: "pointer",
              textAlign: "left",
              transition: "background 80ms ease"
            },
            onMouseEnter: (e) => {
              if (opt !== value)
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            },
            onMouseLeave: (e) => {
              if (opt !== value)
                e.currentTarget.style.background = opt === value ? "rgba(255,255,255,0.08)" : "transparent";
            },
            children: opt
          },
          opt
        ))
      }
    )
  ] });
}
function DesignMyAvatarModal({
  open,
  onClose,
  credits = 2,
  onSubmit,
  samplePrompts
}) {
  const [faceSource, setFaceSource] = useState("photo");
  const [photoUrl, setPhotoUrl] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [style, setStyle] = useState("ugc");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [prompt, setPrompt] = useState("");
  const [samplesOpen, setSamplesOpen] = useState(false);
  const fileInputRef = useRef(null);
  const samples = samplePrompts ?? DEFAULT_SAMPLES;
  useEffect(() => {
    if (open) {
      setFaceSource("photo");
      setPhotoUrl("");
      setGender("");
      setAge("");
      setEthnicity("");
      setStyle("ugc");
      setAspectRatio("9:16");
      setPrompt("");
      setSamplesOpen(false);
    }
  }, [open]);
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    setPhotoUrl(URL.createObjectURL(file));
    e.target.value = "";
  }, []);
  const hasFace = faceSource === "photo" ? !!photoUrl : !!gender && !!age;
  const hasPrompt = prompt.trim().length > 0;
  const canSubmit = hasFace && hasPrompt;
  const handleSubmit = useCallback(() => {
    if (!canSubmit)
      return;
    onSubmit({
      actionId: "design-avatar",
      faceSource,
      photoUrl: faceSource === "photo" ? photoUrl : void 0,
      gender: faceSource === "describe" ? gender : void 0,
      age: faceSource === "describe" ? age : void 0,
      ethnicity: faceSource === "describe" ? ethnicity : void 0,
      style,
      aspectRatio,
      prompt
    });
  }, [canSubmit, onSubmit, faceSource, photoUrl, gender, age, ethnicity, style, aspectRatio, prompt]);
  return /* @__PURE__ */ jsxs(
    ImmersiveModal,
    {
      open,
      title: "Design My Avatar",
      subtitle: "Create a custom avatar template from a photo or description",
      onClose,
      maxWidth: 640,
      footer: /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleSubmit,
          style: {
            height: 44,
            width: 400,
            maxWidth: "90%",
            padding: "0 24px",
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 120ms ease",
            background: canSubmit ? "#3643FF" : "rgba(255,255,255,0.08)",
            color: canSubmit ? "#fff" : "rgba(255,255,255,0.4)",
            cursor: canSubmit ? "pointer" : "default"
          },
          onMouseEnter: (e) => {
            if (canSubmit)
              e.currentTarget.style.background = "#4a55ff";
          },
          onMouseLeave: (e) => {
            if (canSubmit)
              e.currentTarget.style.background = "#3643FF";
          },
          children: [
            /* @__PURE__ */ jsx("span", { children: "Generate" }),
            /* @__PURE__ */ jsx("div", { style: { width: 1, height: 16, background: canSubmit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)" } }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ jsx(Crown, { size: 16, color: canSubmit ? "#facc15" : "currentColor" }),
              /* @__PURE__ */ jsx("span", { children: credits })
            ] })
          ]
        }
      ) }),
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: fileInputRef,
            type: "file",
            accept: "image/jpeg,image/png,image/webp",
            style: { display: "none" },
            onChange: handleFileSelect
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              padding: "4px 0",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.06) transparent"
            },
            children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { style: sectionLabel4, children: "Face Source" }),
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setFaceSource("photo"), style: segBtn(faceSource === "photo"), children: "Photo Upload" }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setFaceSource("describe"), style: segBtn(faceSource === "describe"), children: "Describe" })
                ] })
              ] }),
              faceSource === "photo" && /* @__PURE__ */ jsx("div", { children: photoUrl ? /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    position: "relative",
                    width: "100%",
                    maxWidth: 280,
                    aspectRatio: "3/4",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#111"
                  },
                  children: [
                    /* @__PURE__ */ jsx("img", { src: photoUrl, alt: "Face", style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          if (photoUrl.startsWith("blob:"))
                            URL.revokeObjectURL(photoUrl);
                          setPhotoUrl("");
                        },
                        style: {
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 32,
                          height: 32,
                          borderRadius: 4,
                          background: "rgba(0,0,0,0.4)",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backdropFilter: "blur(8px)"
                        },
                        children: /* @__PURE__ */ jsx(X, { size: 14 })
                      }
                    )
                  ]
                }
              ) : /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => fileInputRef.current?.click(),
                  style: {
                    width: "100%",
                    height: 140,
                    borderRadius: 10,
                    border: "1.5px dashed rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.02)",
                    color: "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    transition: "all 120ms ease"
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  },
                  children: [
                    /* @__PURE__ */ jsx(CloudUpload, { size: 24, style: { opacity: 0.4 } }),
                    "Upload a face photo",
                    /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.2)" }, children: "JPG, PNG supported" })
                  ]
                }
              ) }),
              faceSource === "describe" && /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
                /* @__PURE__ */ jsx(SelectDropdown, { label: "Gender", value: gender, options: GENDER_OPTIONS, onChange: setGender }),
                /* @__PURE__ */ jsx(SelectDropdown, { label: "Age", value: age, options: AGE_OPTIONS, onChange: setAge }),
                /* @__PURE__ */ jsx(SelectDropdown, { label: "Ethnicity", value: ethnicity, options: ETHNICITY_OPTIONS, onChange: setEthnicity })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { style: sectionLabel4, children: "Style" }),
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setStyle("ugc"), style: segBtn(style === "ugc"), children: "UGC" }),
                  /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setStyle("pro"), style: segBtn(style === "pro"), children: "Pro" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { style: sectionLabel4, children: "Aspect Ratio" }),
                /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6 }, children: ["9:16", "1:1", "16:9"].map((r) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setAspectRatio(r), style: segBtn(aspectRatio === r), children: r }, r)) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { style: sectionLabel4, children: "Appearance Prompt" }),
                /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      value: prompt,
                      onChange: (e) => setPrompt(e.target.value),
                      placeholder: "Describe your avatar's appearance, outfit, background...",
                      rows: 4,
                      style: {
                        width: "100%",
                        padding: "10px 12px",
                        paddingBottom: 32,
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        color: "#fff",
                        fontSize: 13,
                        lineHeight: "1.5",
                        resize: "none",
                        fontFamily: "inherit",
                        outline: "none",
                        boxSizing: "border-box"
                      },
                      onFocus: (e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                      },
                      onBlur: (e) => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        position: "absolute",
                        bottom: 8,
                        left: 12,
                        right: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      },
                      children: [
                        /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => setSamplesOpen((p) => !p),
                              style: {
                                border: "none",
                                background: "transparent",
                                color: "rgba(255,255,255,0.35)",
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: 0,
                                transition: "color 100ms ease"
                              },
                              onMouseEnter: (e) => {
                                e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                              },
                              onMouseLeave: (e) => {
                                e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                              },
                              children: [
                                /* @__PURE__ */ jsx(Lightbulb, { size: 12 }),
                                "Sample Prompts"
                              ]
                            }
                          ),
                          samplesOpen && /* @__PURE__ */ jsx(
                            "div",
                            {
                              style: {
                                position: "absolute",
                                bottom: "calc(100% + 8px)",
                                left: 0,
                                width: 360,
                                padding: 4,
                                borderRadius: 8,
                                background: "#1e1e1e",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                                zIndex: 30
                              },
                              children: samples.map((s, i) => /* @__PURE__ */ jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => {
                                    setPrompt(s);
                                    setSamplesOpen(false);
                                  },
                                  style: {
                                    width: "100%",
                                    padding: "8px 10px",
                                    border: "none",
                                    borderRadius: 6,
                                    background: "transparent",
                                    color: "rgba(255,255,255,0.6)",
                                    fontSize: 12,
                                    lineHeight: "1.4",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "background 80ms ease"
                                  },
                                  onMouseEnter: (e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                  },
                                  onMouseLeave: (e) => {
                                    e.currentTarget.style.background = "transparent";
                                  },
                                  children: s
                                },
                                i
                              ))
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs(
                          "span",
                          {
                            style: {
                              fontSize: 11,
                              color: prompt.length > 2e3 ? "#ef4444" : "rgba(255,255,255,0.25)"
                            },
                            children: [
                              prompt.length,
                              "/2000"
                            ]
                          }
                        )
                      ]
                    }
                  )
                ] })
              ] })
            ]
          }
        )
      ]
    }
  );
}
var sectionLabel5 = {
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};
var segBtn2 = (active) => ({
  flex: 1,
  height: 34,
  borderRadius: 8,
  border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
  background: active ? "rgba(255,255,255,0.08)" : "transparent",
  color: active ? "#fff" : "rgba(255,255,255,0.4)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 120ms ease"
});
function ProductAvatarModal({
  open,
  onClose,
  credits = 0,
  onSubmit,
  onSelectFromBoard,
  templates = [],
  categories = [],
  onCategoryChange,
  onLoadMoreTemplates,
  hasMoreTemplates,
  loadingTemplates,
  voiceoverOptions = [],
  initialProductImageUrl
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [mode, setMode] = useState("auto");
  const [scriptMode, setScriptMode] = useState("text");
  const [scriptText, setScriptText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [voiceoverId, setVoiceoverId] = useState(voiceoverOptions[0]?.id ?? "");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "all");
  const [browsingTemplates, setBrowsingTemplates] = useState(false);
  const [hoverProduct, setHoverProduct] = useState(false);
  const productFileRef = useRef(null);
  useEffect(() => {
    if (open) {
      setSelectedTemplate(null);
      setAvatarUrl("");
      setProductImageUrl(initialProductImageUrl ?? "");
      setMode("auto");
      setScriptMode("text");
      setScriptText("");
      setAudioUrl("");
      setVoiceoverId(voiceoverOptions[0]?.id ?? "");
      setActiveCategory(categories[0]?.id ?? "all");
      setBrowsingTemplates(false);
      setHoverProduct(false);
    }
  }, [open, initialProductImageUrl, voiceoverOptions, categories]);
  const handleTemplateSelect = useCallback((tpl) => {
    setSelectedTemplate(tpl);
    setAvatarUrl(tpl.thumbnailUrl);
    setBrowsingTemplates(false);
  }, []);
  const handleCategoryChange = useCallback(
    (id) => {
      setActiveCategory(id);
      onCategoryChange?.(id);
    },
    [onCategoryChange]
  );
  const handleProductFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file)
      return;
    setProductImageUrl(URL.createObjectURL(file));
    e.target.value = "";
  }, []);
  const hasAvatar = !!avatarUrl;
  const hasProduct = !!productImageUrl;
  const hasScript = scriptMode === "text" ? scriptText.trim().length > 0 : !!audioUrl;
  const canSubmit = hasAvatar && hasProduct && hasScript;
  const handleSubmit = useCallback(() => {
    if (!canSubmit)
      return;
    onSubmit({
      actionId: "product-avatar",
      mode,
      templateId: selectedTemplate?.id,
      avatarImageUrl: avatarUrl,
      productImageUrl,
      scriptMode,
      scriptText: scriptMode === "text" ? scriptText : void 0,
      audioUrl: scriptMode === "audio" ? audioUrl : void 0,
      voiceoverId: scriptMode === "text" ? voiceoverId : void 0
    });
  }, [canSubmit, onSubmit, mode, selectedTemplate, avatarUrl, productImageUrl, scriptMode, scriptText, audioUrl, voiceoverId]);
  return /* @__PURE__ */ jsxs(
    ImmersiveModal,
    {
      open,
      title: "Product Avatar",
      subtitle: "Create product explainer videos with AI avatars",
      onClose,
      maxWidth: 1800,
      footer: /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }, children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: handleSubmit,
          style: {
            height: 44,
            width: 400,
            maxWidth: "80%",
            padding: "0 24px",
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 120ms ease",
            background: canSubmit ? "#3643FF" : "rgba(255,255,255,0.08)",
            color: canSubmit ? "#fff" : "rgba(255,255,255,0.4)",
            cursor: canSubmit ? "pointer" : "default"
          },
          onMouseEnter: (e) => {
            if (canSubmit)
              e.currentTarget.style.background = "#4a55ff";
          },
          onMouseLeave: (e) => {
            if (canSubmit)
              e.currentTarget.style.background = "#3643FF";
          },
          children: [
            /* @__PURE__ */ jsx("span", { children: "Generate" }),
            /* @__PURE__ */ jsx("div", { style: { width: 1, height: 16, background: canSubmit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)" } }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: [
              /* @__PURE__ */ jsx(Crown, { size: 16, color: canSubmit ? "#facc15" : "currentColor" }),
              /* @__PURE__ */ jsx("span", { children: credits })
            ] })
          ]
        }
      ) }),
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: productFileRef,
            type: "file",
            accept: "image/jpeg,image/png,image/webp",
            style: { display: "none" },
            onChange: handleProductFileSelect
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 24, flex: 1, minHeight: 0, marginTop: 24 }, children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                width: 320,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                overflowY: "auto",
                paddingRight: 4,
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.06) transparent"
              },
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: sectionLabel5, children: "Avatar Template" }),
                  avatarUrl ? /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        position: "relative",
                        width: "100%",
                        aspectRatio: "3/4",
                        maxHeight: 240,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#111"
                      },
                      children: [
                        /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: avatarUrl,
                            alt: "Avatar",
                            style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              setAvatarUrl("");
                              setSelectedTemplate(null);
                            },
                            style: {
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              background: "rgba(0,0,0,0.4)",
                              border: "none",
                              color: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backdropFilter: "blur(4px)",
                              zIndex: 2
                            },
                            children: /* @__PURE__ */ jsx(X, { size: 14 })
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              padding: "20px 10px 8px",
                              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                              textAlign: "center"
                            },
                            children: /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500 }, children: selectedTemplate?.name || "Avatar" })
                          }
                        )
                      ]
                    }
                  ) : /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setBrowsingTemplates(true),
                      style: {
                        width: "100%",
                        height: 120,
                        borderRadius: 10,
                        border: "1.5px dashed rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.02)",
                        color: "rgba(255,255,255,0.3)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        transition: "all 120ms ease"
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      },
                      children: [
                        /* @__PURE__ */ jsx(CloudUpload, { size: 24, style: { opacity: 0.4 } }),
                        "Select avatar template"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setBrowsingTemplates(true),
                      style: {
                        width: "100%",
                        height: 34,
                        marginTop: 8,
                        borderRadius: 8,
                        border: "none",
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "background 120ms ease"
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      },
                      children: [
                        /* @__PURE__ */ jsx(LayoutGrid, { size: 13 }),
                        "Browse Templates"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: sectionLabel5, children: "Mode" }),
                  /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
                    /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setMode("auto"), style: segBtn2(mode === "auto"), children: "Auto" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                        },
                        style: {
                          ...segBtn2(false),
                          opacity: 0.4,
                          cursor: "not-allowed"
                        },
                        title: "Coming soon",
                        children: "Manual"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("p", { style: { margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: "16px" }, children: "AI automatically places your product with the avatar" })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx("div", { style: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }, children: browsingTemplates ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexShrink: 0 }, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setBrowsingTemplates(false),
                  style: {
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    border: "none",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 100ms ease"
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  },
                  children: /* @__PURE__ */ jsx(ArrowLeft, { size: 14 })
                }
              ),
              /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }, children: "Select Avatar Template" })
            ] }),
            /* @__PURE__ */ jsx(
              AvatarTemplateGrid,
              {
                templates,
                selectedId: selectedTemplate?.id ?? null,
                onSelect: handleTemplateSelect,
                categories,
                activeCategory,
                onCategoryChange: handleCategoryChange,
                onLoadMore: onLoadMoreTemplates,
                hasMore: hasMoreTemplates,
                loading: loadingTemplates
              }
            )
          ] }) : /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 20,
                flex: 1,
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.06) transparent"
              },
              children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: sectionLabel5, children: "Product Image" }),
                  productImageUrl ? /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        position: "relative",
                        width: "100%",
                        maxWidth: 400,
                        aspectRatio: "1",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#111"
                      },
                      children: [
                        /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: productImageUrl,
                            alt: "Product",
                            style: { width: "100%", height: "100%", objectFit: "contain", display: "block" }
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              if (productImageUrl.startsWith("blob:"))
                                URL.revokeObjectURL(productImageUrl);
                              setProductImageUrl("");
                            },
                            style: {
                              position: "absolute",
                              top: 8,
                              right: 8,
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              background: "rgba(0,0,0,0.4)",
                              border: "none",
                              color: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backdropFilter: "blur(8px)",
                              zIndex: 2
                            },
                            children: /* @__PURE__ */ jsx(X, { size: 14 })
                          }
                        )
                      ]
                    }
                  ) : /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: { position: "relative", width: "100%", maxWidth: 400, aspectRatio: "1" },
                      onMouseEnter: () => setHoverProduct(true),
                      onMouseLeave: () => setHoverProduct(false),
                      children: [
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => productFileRef.current?.click(),
                            style: {
                              width: "100%",
                              height: "100%",
                              borderRadius: 10,
                              border: "1.5px dashed rgba(255,255,255,0.12)",
                              background: hoverProduct ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                              color: "rgba(255,255,255,0.3)",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 8,
                              fontSize: 12,
                              fontWeight: 500,
                              transition: "all 120ms ease",
                              borderColor: hoverProduct ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"
                            },
                            children: [
                              /* @__PURE__ */ jsx(CloudUpload, { size: 28, style: { opacity: 0.4 } }),
                              "Upload product image"
                            ]
                          }
                        ),
                        onSelectFromBoard && /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => onSelectFromBoard("product-image"),
                            style: {
                              position: "absolute",
                              bottom: 12,
                              left: 12,
                              right: 12,
                              height: 36,
                              borderRadius: 8,
                              border: "none",
                              background: "rgba(0,0,0,0.85)",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              cursor: "pointer",
                              opacity: hoverProduct ? 1 : 0,
                              transform: hoverProduct ? "translateY(0)" : "translateY(4px)",
                              transition: "all 150ms ease",
                              pointerEvents: hoverProduct ? "auto" : "none"
                            },
                            children: [
                              /* @__PURE__ */ jsx(LayoutGrid, { size: 14 }),
                              "Select from Board"
                            ]
                          }
                        )
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { style: sectionLabel5, children: "Script" }),
                  /* @__PURE__ */ jsx(
                    ScriptInput,
                    {
                      mode: scriptMode,
                      onModeChange: setScriptMode,
                      text: scriptText,
                      onTextChange: setScriptText,
                      audioUrl,
                      onAudioChange: setAudioUrl,
                      maxChars: 450,
                      placeholder: "Describe the product features...",
                      showVoiceover: voiceoverOptions.length > 0,
                      voiceoverOptions,
                      selectedVoiceover: voiceoverId,
                      onVoiceoverChange: setVoiceoverId
                    }
                  )
                ] })
              ]
            }
          ) })
        ] })
      ]
    }
  );
}
var S = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 40,
    padding: "0 8px",
    boxSizing: "border-box",
    borderRadius: 8,
    background: "#252525",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
    pointerEvents: "auto",
    userSelect: "none",
    whiteSpace: "nowrap"
  },
  divider: {
    width: 1,
    height: 24,
    background: "rgba(255, 255, 255, 0.1)",
    margin: "0 2px",
    flexShrink: 0
  },
  action: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  btn: (hovered, iconOnly) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 30,
    height: 30,
    padding: iconOnly ? "8px" : "8px 10px",
    border: "none",
    borderRadius: 6,
    background: hovered ? "rgba(255, 255, 255, 0.05)" : "transparent",
    color: hovered ? "#fff" : "rgba(255, 255, 255, 0.95)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background-color 0.12s ease, color 0.12s ease"
  }),
  btnDanger: (hovered) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 30,
    height: 30,
    padding: "8px",
    border: "none",
    borderRadius: 6,
    background: hovered ? "rgba(239, 68, 68, 0.15)" : "transparent",
    color: hovered ? "#f87171" : "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 100ms ease, color 100ms ease"
  }),
  icon: { width: 16, height: 16, flexShrink: 0 },
  chevron: { width: 12, height: 12, flexShrink: 0, opacity: 0.5 },
  popover: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 4,
    background: "#252525",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
    zIndex: 60,
    whiteSpace: "nowrap"
  },
  popoverBtn: (hovered, active) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    border: "none",
    borderRadius: 4,
    background: hovered || active ? "rgba(255, 255, 255, 0.05)" : "transparent",
    color: "rgba(255, 255, 255, 0.95)",
    cursor: "pointer",
    transition: "background-color 0.12s ease, color 0.12s ease",
    flexShrink: 0,
    position: "relative"
  }),
  popoverDivider: {
    width: 1,
    height: 24,
    background: "rgba(255,255,255,0.08)",
    margin: "0 2px",
    flexShrink: 0
  },
  tooltip: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
    zIndex: 60
  },
  tooltipLabel: {
    background: "#252525",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 6,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 500,
    color: "#fff",
    whiteSpace: "nowrap",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center"
  },
  tooltipArrow: {
    display: "none"
  },
  moreMenu: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    right: 0,
    minWidth: 180,
    padding: 4,
    background: "#252525",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
    zIndex: 60
  },
  moreItem: (hovered) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    height: 34,
    padding: "0 10px",
    border: "none",
    borderRadius: 6,
    background: hovered ? "rgba(255,255,255,0.05)" : "transparent",
    color: hovered ? "#fff" : "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: 400,
    textAlign: "left",
    cursor: "pointer",
    transition: "background 80ms ease, color 80ms ease",
    boxSizing: "border-box"
  }),
  moreShortcut: {
    marginLeft: "auto",
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.02em"
  },
  moreMenuDivider: {
    height: 1,
    background: "rgba(255,255,255,0.06)",
    margin: "3px 4px"
  }
};
var TOOLBAR_OFFSET = 12;
var SELECTION_RECT_SELECTOR = ".react-flow__nodesselection-rect";
function GroupIcon({ style }) {
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": true,
      style: { flexShrink: 0, ...style },
      children: /* @__PURE__ */ jsx(
        "rect",
        {
          x: "1.5",
          y: "1.5",
          width: "13",
          height: "13",
          rx: "0.5",
          stroke: "currentColor",
          strokeWidth: "1.5",
          strokeDasharray: "2 2"
        }
      )
    }
  );
}
var HANDLE_SIZE = 8;
function MultiSelectCornerHandles({
  visible
}) {
  const containerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (visible)
      setMounted(true);
    else
      setMounted(false);
  }, [visible]);
  useEffect(() => {
    if (!visible || !mounted || !containerRef.current)
      return;
    let rafId;
    const update = () => {
      const sel = document.querySelector(SELECTION_RECT_SELECTOR);
      const container = containerRef.current;
      const parent = container?.offsetParent;
      if (sel && container && parent) {
        const parentRect = parent.getBoundingClientRect();
        const rect = sel.getBoundingClientRect();
        container.style.left = `${rect.left - parentRect.left}px`;
        container.style.top = `${rect.top - parentRect.top}px`;
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [visible, mounted]);
  if (!mounted)
    return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className: "tc-multiselect-handles",
      style: { position: "absolute", pointerEvents: "none", zIndex: 5 },
      children: ["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => {
        const cursorStyle = corner === "top-left" || corner === "bottom-right" ? "nwse-resize" : "nesw-resize";
        return /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              position: "absolute",
              left: corner.includes("left") ? -4 : "auto",
              right: corner.includes("right") ? -4 : "auto",
              top: corner.includes("top") ? -4 : "auto",
              bottom: corner.includes("bottom") ? -4 : "auto",
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: "#fff",
              border: "1px solid #7781FF",
              boxSizing: "border-box",
              cursor: cursorStyle,
              pointerEvents: "none"
            }
          },
          corner
        );
      })
    }
  );
}
function MultiSelectToolbar(props) {
  const { info, viewport, ...handlers } = props;
  const visible = info !== null;
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const lastInfoRef = useRef(null);
  const timerRef = useRef();
  const wrapperRef = useRef(null);
  if (info)
    lastInfoRef.current = info;
  useEffect(() => {
    if (visible) {
      setMounted(true);
      setExiting(false);
      if (timerRef.current)
        clearTimeout(timerRef.current);
    } else if (mounted) {
      setExiting(true);
      timerRef.current = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, 120);
    }
    return () => {
      if (timerRef.current)
        clearTimeout(timerRef.current);
    };
  }, [visible, mounted]);
  useEffect(() => {
    if (!visible || !mounted || !wrapperRef.current)
      return;
    let rafId;
    const update = () => {
      const sel = document.querySelector(SELECTION_RECT_SELECTOR);
      const wrapper = wrapperRef.current;
      const parent = wrapper?.offsetParent;
      if (sel && wrapper && parent) {
        const parentRect = parent.getBoundingClientRect();
        const rect = sel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - parentRect.left;
        const showBelow2 = rect.top < 120;
        const anchorY2 = showBelow2 ? rect.bottom + TOOLBAR_OFFSET - parentRect.top : rect.top - TOOLBAR_OFFSET - parentRect.top;
        wrapper.style.left = `${centerX}px`;
        wrapper.style.top = `${anchorY2}px`;
        wrapper.style.transform = showBelow2 ? "translateX(-50%)" : "translateX(-50%) translateY(-100%)";
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [visible, mounted]);
  const currentInfo = visible ? info : lastInfoRef.current;
  if (!mounted || !currentInfo)
    return null;
  const { nodes } = currentInfo;
  if (nodes.length < 2)
    return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const nx = n.position.x;
    const ny = n.position.y;
    if (nx < minX)
      minX = nx;
    if (ny < minY)
      minY = ny;
    if (nx + n.size.width > maxX)
      maxX = nx + n.size.width;
    if (ny + n.size.height > maxY)
      maxY = ny + n.size.height;
  }
  const { x: vx, y: vy, zoom } = viewport;
  const screenTop = minY * zoom + vy;
  const screenLeft = minX * zoom + vx;
  const screenRight = maxX * zoom + vx;
  const screenCenterX = (screenLeft + screenRight) / 2;
  const showBelow = screenTop < 120;
  const screenBottom = maxY * zoom + vy;
  const anchorY = showBelow ? screenBottom + TOOLBAR_OFFSET : screenTop - TOOLBAR_OFFSET;
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: wrapperRef,
      style: {
        position: "absolute",
        left: screenCenterX,
        top: anchorY,
        transform: showBelow ? "translateX(-50%)" : "translateX(-50%) translateY(-100%)",
        zIndex: 50,
        pointerEvents: "none",
        opacity: exiting ? 0 : 1,
        transition: "opacity 120ms ease"
      },
      children: /* @__PURE__ */ jsx(
        "div",
        {
          style: S.bar,
          onPointerDownCapture: (e) => e.stopPropagation(),
          onMouseDownCapture: (e) => e.stopPropagation(),
          children: /* @__PURE__ */ jsx(BarContent, { info: currentInfo, ...handlers })
        }
      )
    }
  );
}
function BarContent({
  info,
  onBatchGroup,
  onBatchCopy,
  onBatchDownload,
  onAlign,
  onDistribute,
  onAutoArrange
}) {
  const [hoveredId, setHoveredId] = useState(null);
  const [openPopover, setOpenPopover] = useState(null);
  const [activeAlign, setActiveAlign] = useState(null);
  const [activeDistribute, setActiveDistribute] = useState(null);
  const alignRef = useRef(null);
  const distributeRef = useRef(null);
  useEffect(() => {
    setOpenPopover(null);
  }, [info?.count]);
  useEffect(() => {
    if (!openPopover)
      return;
    const handleClick = (e) => {
      const target = e.target;
      if (openPopover === "align" && alignRef.current && !alignRef.current.contains(target))
        setOpenPopover(null);
      if (openPopover === "distribute" && distributeRef.current && !distributeRef.current.contains(target))
        setOpenPopover(null);
    };
    document.addEventListener("pointerdown", handleClick);
    return () => document.removeEventListener("pointerdown", handleClick);
  }, [openPopover]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(ActionBtn, { id: "group", label: "Group", shortcutKeys: ["\u2318", "G"], iconNode: /* @__PURE__ */ jsx(GroupIcon, { style: S.icon }), onClick: onBatchGroup, hoveredId, setHoveredId }),
    /* @__PURE__ */ jsx(ActionBtn, { id: "download", label: "Download", Icon: Download, onClick: onBatchDownload, hoveredId, setHoveredId }),
    /* @__PURE__ */ jsx(ActionBtn, { id: "copy", label: "Copy", shortcutKeys: ["\u2318", "C"], Icon: Copy, onClick: onBatchCopy, hoveredId, setHoveredId }),
    /* @__PURE__ */ jsxs("div", { ref: alignRef, style: { ...S.action, position: "relative" }, children: [
      /* @__PURE__ */ jsx(
        PopoverTriggerIconOnly,
        {
          id: "align",
          ariaLabel: "Align",
          Icon: AlignCenterVertical,
          isOpen: openPopover === "align",
          hoveredId,
          setHoveredId,
          onToggle: () => setOpenPopover((cur) => cur === "align" ? null : "align")
        }
      ),
      openPopover === "align" && /* @__PURE__ */ jsxs("div", { style: S.popover, children: [
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Align Left", active: activeAlign === "left" || !activeAlign, onClick: () => {
          onAlign("left");
          setActiveAlign("left");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(AlignStartVertical, { size: 15 }) }),
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Align Center", active: activeAlign === "center", onClick: () => {
          onAlign("center");
          setActiveAlign("center");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(AlignCenterVertical, { size: 15 }) }),
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Align Right", active: activeAlign === "right", onClick: () => {
          onAlign("right");
          setActiveAlign("right");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(AlignEndVertical, { size: 15 }) }),
        /* @__PURE__ */ jsx("div", { style: S.popoverDivider }),
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Align Top", active: activeAlign === "top", onClick: () => {
          onAlign("top");
          setActiveAlign("top");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(AlignStartHorizontal, { size: 15 }) }),
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Align Middle", active: activeAlign === "middle", onClick: () => {
          onAlign("middle");
          setActiveAlign("middle");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(AlignCenterHorizontal, { size: 15 }) }),
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Align Bottom", active: activeAlign === "bottom", onClick: () => {
          onAlign("bottom");
          setActiveAlign("bottom");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(AlignEndHorizontal, { size: 15 }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { style: S.divider }),
    /* @__PURE__ */ jsxs("div", { ref: distributeRef, style: { ...S.action, position: "relative" }, children: [
      /* @__PURE__ */ jsx(
        PopoverTriggerIconOnly,
        {
          id: "distribute",
          ariaLabel: "Distribute",
          Icon: HSpaceIcon,
          isOpen: openPopover === "distribute",
          hoveredId,
          setHoveredId,
          onToggle: () => setOpenPopover((cur) => cur === "distribute" ? null : "distribute")
        }
      ),
      openPopover === "distribute" && /* @__PURE__ */ jsxs("div", { style: S.popover, children: [
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Horizontal Space", active: activeDistribute === "horizontal" || !activeDistribute, onClick: () => {
          onDistribute("horizontal");
          setActiveDistribute("horizontal");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(HSpaceIcon, {}) }),
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Vertical Space", active: activeDistribute === "vertical", onClick: () => {
          onDistribute("vertical");
          setActiveDistribute("vertical");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(VSpaceIcon, {}) }),
        /* @__PURE__ */ jsx(PopoverBtn, { title: "Auto Arrange", active: activeDistribute === "auto", onClick: () => {
          onAutoArrange();
          setActiveDistribute("auto");
          setOpenPopover(null);
        }, children: /* @__PURE__ */ jsx(LayoutGrid, { size: 15 }) })
      ] })
    ] })
  ] });
}
function HSpaceIcon({ style }) {
  return /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 15 15", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", style: { flexShrink: 0, ...style }, children: [
    /* @__PURE__ */ jsx("rect", { x: "3.5", y: "2.5", width: "1", height: "10", rx: "0.5", fill: "currentColor", opacity: "0.4" }),
    /* @__PURE__ */ jsx("rect", { x: "10.5", y: "2.5", width: "1", height: "10", rx: "0.5", fill: "currentColor", opacity: "0.4" }),
    /* @__PURE__ */ jsx("rect", { x: "6.5", y: "5.5", width: "2", height: "4", rx: "1", fill: "currentColor" })
  ] });
}
function VSpaceIcon({ style }) {
  return /* @__PURE__ */ jsxs("svg", { width: "15", height: "15", viewBox: "0 0 15 15", fill: "none", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": "true", style: { flexShrink: 0, ...style }, children: [
    /* @__PURE__ */ jsx("rect", { x: "2.5", y: "3.5", width: "10", height: "1", rx: "0.5", fill: "currentColor", opacity: "0.4" }),
    /* @__PURE__ */ jsx("rect", { x: "2.5", y: "10.5", width: "10", height: "1", rx: "0.5", fill: "currentColor", opacity: "0.4" }),
    /* @__PURE__ */ jsx("rect", { x: "5.5", y: "6.5", width: "4", height: "2", rx: "1", fill: "currentColor" })
  ] });
}
function PopoverTriggerIconOnly({ id, ariaLabel, Icon, isOpen, hoveredId, setHoveredId, onToggle }) {
  const hovered = hoveredId === id;
  return /* @__PURE__ */ jsx("div", { style: S.action, onMouseEnter: () => setHoveredId(id), onMouseLeave: () => setHoveredId((c) => c === id ? null : c), children: /* @__PURE__ */ jsxs("button", { type: "button", style: { ...S.btn(hovered || isOpen), width: "fit-content", paddingLeft: 8, paddingRight: 8, paddingTop: 0, paddingBottom: 0, justifyContent: "center" }, onClick: onToggle, "aria-label": ariaLabel, children: [
    /* @__PURE__ */ jsx(Icon, { style: S.icon }),
    /* @__PURE__ */ jsx(ChevronUp, { style: { ...S.chevron, transform: isOpen ? "none" : "rotate(180deg)", transition: "transform 150ms ease" } })
  ] }) });
}
function PopoverBtn({
  title,
  onClick,
  active,
  children
}) {
  const [hovered, setHovered] = useState(false);
  return /* @__PURE__ */ jsxs("div", { style: { position: "relative", flexShrink: 0 }, onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        style: S.popoverBtn(hovered, active),
        onClick,
        children
      }
    ),
    hovered && /* @__PURE__ */ jsx("div", { style: { ...S.tooltip, bottom: "calc(100% + 8px)" }, children: /* @__PURE__ */ jsx("div", { style: S.tooltipLabel, children: title }) })
  ] });
}
function ActionBtn({
  id,
  label,
  shortcutKeys,
  Icon,
  iconNode,
  onClick,
  danger = false,
  hoveredId,
  setHoveredId,
  iconOnly = false
}) {
  const hovered = hoveredId === id;
  const icon = iconNode ?? (Icon != null ? /* @__PURE__ */ jsx(Icon, { style: S.icon }) : null);
  return /* @__PURE__ */ jsxs("div", { style: S.action, onMouseEnter: () => setHoveredId(id), onMouseLeave: () => setHoveredId((c) => c === id ? null : c), children: [
    /* @__PURE__ */ jsxs("button", { type: "button", style: danger ? S.btnDanger(hovered) : S.btn(hovered, iconOnly), onClick, "aria-label": label, children: [
      icon,
      !iconOnly && /* @__PURE__ */ jsx("span", { children: label })
    ] }),
    hovered && iconOnly && /* @__PURE__ */ jsx("div", { style: { ...S.tooltip, bottom: "calc(100% + 8px)" }, children: /* @__PURE__ */ jsxs("div", { style: S.tooltipLabel, children: [
      /* @__PURE__ */ jsx("span", { children: label }),
      shortcutKeys && /* @__PURE__ */ jsx(ShortcutBadge, { keys: shortcutKeys })
    ] }) })
  ] });
}
var TYPE_LABELS = {
  [NodeType.IMAGE]: "image",
  [NodeType.VIDEO]: "video",
  [NodeType.AUDIO]: "audio",
  [NodeType.TEXT]: "text"
};
function pluralize(word, count) {
  return count === 1 ? word : `${word}s`;
}
function useMultiSelectInfo(selectedNodes) {
  return useMemo(() => {
    if (selectedNodes.length < 2)
      return null;
    const typeCounts = {};
    let hasAnyLocked = false;
    let hasAnyUnlocked = false;
    let hasAnyHidden = false;
    let hasAnyVisible = false;
    for (const node of selectedNodes) {
      const t = node.type;
      typeCounts[t] = (typeCounts[t] || 0) + 1;
      const isLocked = node.draggable === false;
      const isHidden = node.hidden === true;
      if (isLocked)
        hasAnyLocked = true;
      else
        hasAnyUnlocked = true;
      if (isHidden)
        hasAnyHidden = true;
      else
        hasAnyVisible = true;
    }
    const types = Object.keys(typeCounts);
    const isHomogeneous = types.length === 1;
    const primaryType = isHomogeneous ? types[0] : null;
    let label;
    if (isHomogeneous) {
      const typeLabel = TYPE_LABELS[types[0]] || types[0];
      label = `${selectedNodes.length} ${pluralize(typeLabel, selectedNodes.length)}`;
    } else {
      const parts = Object.entries(typeCounts).map(
        ([type, count]) => `${count} ${pluralize(TYPE_LABELS[type] || type, count)}`
      );
      label = parts.join(", ");
    }
    return {
      count: selectedNodes.length,
      nodeIds: selectedNodes.map((n) => n.id),
      nodes: selectedNodes,
      typeCounts,
      isHomogeneous,
      primaryType,
      label,
      hasAnyLocked,
      hasAnyUnlocked,
      hasAnyHidden,
      hasAnyVisible
    };
  }, [selectedNodes]);
}
var DEFAULT_SUBCANVAS_KEY = "__default__";
var FLOW_UI = {
  canvasBg: "#000000",
  panelBg: "#1c1e22",
  panelBorder: "rgba(255,255,255,0.08)",
  panelShadow: "0 4px 16px rgba(0,0,0,0.2)",
  panelText: "#ffffff",
  panelTextMuted: "rgba(255,255,255,0.7)",
  divider: "rgba(255,255,255,0.08)"};
var normalizeAudioNodeSize = (node) => {
  if (node.type !== NodeType.AUDIO) {
    return { node, changed: false };
  }
  const width = node.size?.width;
  const height = node.size?.height;
  if (!width || !height || width === height) {
    return { node, changed: false };
  }
  const side = Math.max(width, height);
  return {
    node: {
      ...node,
      size: { width: side, height: side }
    },
    changed: true
  };
};
var NAV_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 400,
  lineHeight: "14px",
  letterSpacing: "normal",
  color: "#D4D4D4"
};
var FOOTER_LABEL_STYLE = {
  fontSize: 10,
  fontWeight: 400,
  lineHeight: 1,
  color: "#fff"
};
var NAV_BTN_BASE = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  // gap-1 = 4px
  padding: 8,
  // p-2 = 8px
  borderRadius: 8,
  // rounded-lg
  border: "none",
  background: "transparent",
  color: "rgba(255,255,255,0.6)",
  // text-white/60
  cursor: "pointer",
  transition: "background 120ms ease, color 120ms ease",
  fontFamily: "Inter, -apple-system, sans-serif"
};
var FOOTER_BTN_BASE = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: 8,
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "#fff",
  cursor: "pointer",
  transition: "background 120ms ease",
  fontFamily: "Inter, -apple-system, sans-serif"
};
function SidebarNavBtn({
  children,
  onClick,
  disabled,
  "aria-label": ariaLabel
}) {
  const [hovered, setHovered] = React20.useState(false);
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      "aria-label": ariaLabel,
      disabled,
      onClick,
      style: {
        ...NAV_BTN_BASE,
        background: hovered && !disabled ? "rgba(255,255,255,0.05)" : "transparent",
        color: disabled ? "rgba(255,255,255,0.2)" : hovered ? "#fff" : "rgba(255,255,255,0.6)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1
      },
      onMouseEnter: () => !disabled && setHovered(true),
      onMouseLeave: () => setHovered(false),
      children
    }
  );
}
function SidebarFooterBtn({
  children,
  onClick,
  "aria-label": ariaLabel
}) {
  const [hovered, setHovered] = React20.useState(false);
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      "aria-label": ariaLabel,
      onClick,
      style: {
        ...FOOTER_BTN_BASE,
        background: hovered ? "rgba(255,255,255,0.05)" : "transparent"
      },
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      children
    }
  );
}
var TOOLBAR_MENU_STYLE = {
  borderRadius: 8,
  background: "#252525",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  userSelect: "none",
  overflow: "hidden",
  padding: 8,
  minWidth: 200
};
function ToolbarItemWithMenu({
  button,
  menu,
  disabled
}) {
  const [open, setOpen] = React20.useState(false);
  const btnRef = React20.useRef(null);
  const [pos, setPos] = React20.useState(null);
  const closeTimer = React20.useRef(null);
  const cancelClose = React20.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);
  const scheduleClose = React20.useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 100);
  }, [cancelClose]);
  React20.useEffect(() => () => {
    if (closeTimer.current)
      clearTimeout(closeTimer.current);
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: btnRef,
      style: { position: "relative" },
      onMouseEnter: () => {
        if (disabled)
          return;
        cancelClose();
        setOpen(true);
        if (btnRef.current) {
          const rect = btnRef.current.getBoundingClientRect();
          const sidebar = btnRef.current.closest("aside");
          const sidebarRight = sidebar ? sidebar.getBoundingClientRect().right : rect.right;
          setPos({ top: rect.top, left: sidebarRight });
        }
      },
      onMouseLeave: scheduleClose,
      children: [
        button,
        !disabled && open && pos && ReactDOM.createPortal(
          /* @__PURE__ */ jsxs(
            "div",
            {
              style: {
                position: "fixed",
                top: pos.top,
                left: pos.left + 4,
                zIndex: 1050,
                paddingLeft: 4
                // 桥接间隙
              },
              onMouseEnter: cancelClose,
              onMouseLeave: scheduleClose,
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      left: -8,
                      top: 0,
                      width: 8,
                      height: "100%",
                      background: "transparent"
                    }
                  }
                ),
                /* @__PURE__ */ jsx("div", { style: TOOLBAR_MENU_STYLE, children: menu })
              ]
            }
          ),
          document.body
        )
      ]
    }
  );
}
function ToolbarMenuItem({
  Icon,
  label,
  onClick
}) {
  const [hovered, setHovered] = React20.useState(false);
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      style: {
        width: "100%",
        height: 40,
        padding: "0 8px",
        border: "none",
        background: hovered ? "rgba(255,255,255,0.05)" : "transparent",
        color: hovered ? "#fff" : "#D4D4D4",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: "20px",
        textAlign: "left",
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "background 100ms ease, color 100ms ease",
        whiteSpace: "nowrap"
      },
      children: [
        /* @__PURE__ */ jsx(Icon, { size: 18, color: hovered ? "#fff" : "#D4D4D4", style: { flexShrink: 0 } }),
        label
      ]
    }
  );
}
function CollaborativeCanvas({
  canvasId: canvasIdProp,
  userId: userIdProp,
  userName: userNameProp,
  seedNodes: seedNodesProp = [],
  rawData,
  layoutConfig,
  config,
  initialBackgroundColor = FLOW_UI.canvasBg,
  enableCollaboration,
  dependencyEdgesVisible = true,
  className,
  style,
  width,
  height,
  minWidth,
  minHeight,
  invisible = false,
  role,
  topBarLogoUrl,
  userAvatarUrl,
  userCredits,
  modelPreviewVideoUrl,
  modelPreviewPosterUrl
}) {
  const resolvedRole = role ?? (invisible ? "viewer" : "editor");
  const isViewer = resolvedRole === "viewer";
  const canEdit = !isViewer;
  const resolvedLayout = useMemo(
    () => ({
      columns: 4,
      nodeWidth: 300,
      nodeHeight: 200,
      gap: 50,
      startX: 100,
      startY: 100,
      ...layoutConfig,
      includeRawData: true
    }),
    [layoutConfig]
  );
  const seedNodes = useMemo(() => {
    if (rawData !== void 0) {
      return parseRawData(rawData, resolvedLayout).map((node) => normalizeAudioNodeSize(node).node);
    }
    return (seedNodesProp ?? []).map((node) => normalizeAudioNodeSize(node).node);
  }, [rawData, resolvedLayout, seedNodesProp]);
  const userId = useMemo(
    () => userIdProp ?? `user_${Math.random().toString(36).slice(2, 8)}`,
    [userIdProp]
  );
  const userName = userNameProp ?? userId;
  const canvasIdParam = useMemo(() => {
    if (canvasIdProp !== void 0) {
      return canvasIdProp;
    }
    if (typeof window === "undefined") {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("canvasId");
  }, [canvasIdProp]);
  const collabEnabled = enableCollaboration ?? Boolean(canvasIdParam);
  const canvasId = canvasIdParam ? canvasIdParam : "local";
  const canvasConfig = useMemo(
    () => ({
      minZoom: 0.1,
      maxZoom: 4,
      defaultZoom: 0.8,
      snapToGrid: false,
      ...config
    }),
    [config]
  );
  const [nodes, setNodes] = useState([]);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [activeTool, setActiveTool] = useState("select");
  const [toolMode, setToolMode] = useState("edit");
  const [isLocked, setIsLocked] = useState(false);
  const effectiveToolMode = canEdit ? toolMode : "pan";
  const effectiveActiveTool = canEdit ? activeTool : "select";
  const [contextMenu, setContextMenu] = useState(null);
  const [sessionBlocked, setSessionBlocked] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [toasts, setToasts] = useState([]);
  const [selectMode, setSelectMode] = useState({
    isActive: false,
    mediaType: null
  });
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const multiSelectInfo = useMultiSelectInfo(selectedNodes);
  const lastSelectedIdsRef = useRef([]);
  useEffect(() => {
    if (selectedNodes.length > 0) {
      lastSelectedIdsRef.current = selectedNodes.map((n) => n.id);
    }
  }, [selectedNodes]);
  const [layoutPanelOpen, setLayoutPanelOpen] = useState(false);
  const layoutPanelRef = useRef(null);
  const [inpaintTutorialOpen, setInpaintTutorialOpen] = useState({ open: false });
  const [imageUpscaleOpen, setImageUpscaleOpen] = useState(false);
  const [videoUpscaleOpen, setVideoUpscaleOpen] = useState(false);
  const [aiAvatarModal, setAiAvatarModal] = useState({ open: false });
  const [lipSyncModal, setLipSyncModal] = useState({ open: false });
  const [designAvatarOpen, setDesignAvatarOpen] = useState(false);
  const [productAvatarModal, setProductAvatarModal] = useState({ open: false });
  const isImmersiveModalOpen = imageUpscaleOpen || videoUpscaleOpen || inpaintTutorialOpen.open || aiAvatarModal.open || lipSyncModal.open || designAvatarOpen || productAvatarModal.open;
  const [inpaintFocus, setInpaintFocus] = useState(null);
  const inpaintToolbarRef = useRef(null);
  const [layerDragId, setLayerDragId] = useState(null);
  const [layerDragOverId, setLayerDragOverId] = useState(null);
  const [aiCreateMode, setAiCreateMode] = useState(null);
  const [ppModalState, setPpModalState] = useState(null);
  const ppGeneratingRef = useRef(/* @__PURE__ */ new Set());
  const ppModalStateRef = useRef(ppModalState);
  ppModalStateRef.current = ppModalState;
  const ppClosedAtRef = useRef(0);
  const reactFlowInstanceRef = useRef(null);
  const [isFlowReady, setIsFlowReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const initialMediaLoadedRef = useRef(false);
  const tryActivatePlaceholderPanel = useCallback((nodeId) => {
    if (inpaintFocus || ppModalState?.open)
      return;
    if (ppGeneratingRef.current.has(nodeId))
      return;
    if (Date.now() - ppClosedAtRef.current < 500)
      return;
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node)
      return;
    const nodeAny = node;
    if (!nodeAny.toolId || node.url)
      return;
    if (nodeAny.raw?.status)
      return;
    if (nodeAny.toolId === "inpaint")
      return;
    if (nodeAny.toolId === "product-photography") {
      setPpModalState({ open: true, nodeId: node.id });
      return;
    }
    const category = nodeAny.toolCategory ?? "ai-image";
    setAiCreateMode((prev) => {
      if (prev?.nodeId === nodeId)
        return prev;
      return {
        type: category,
        subActionId: nodeAny.toolId,
        nodeId: node.id,
        prompt: ""
      };
    });
  }, [inpaintFocus, ppModalState]);
  useEffect(() => {
    if (aiCreateMode || inpaintFocus || ppModalState?.open)
      return;
    if (Date.now() - ppClosedAtRef.current < 500)
      return;
    const selectedNode = nodes.find((n) => n.selected);
    if (!selectedNode)
      return;
    if (ppGeneratingRef.current.has(selectedNode.id))
      return;
    if (selectedNode.url)
      return;
    const nodeAny = selectedNode;
    if (nodeAny.raw?.status)
      return;
    tryActivatePlaceholderPanel(selectedNode.id);
  }, [nodes, aiCreateMode, inpaintFocus, ppModalState, tryActivatePlaceholderPanel]);
  const collabRef = useRef(null);
  const seededRef = useRef(false);
  const localSeededRef = useRef(false);
  const nodesRef = useRef([]);
  const idMapRef = useRef(/* @__PURE__ */ new Map());
  const presencesRef = useRef(/* @__PURE__ */ new Map());
  const knownUsersRef = useRef(/* @__PURE__ */ new Set());
  const connectedRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const canvasRef = useRef(null);
  const draggingNodesRef = useRef(/* @__PURE__ */ new Set());
  const activeSubCanvasRef = useRef(null);
  const processedRawIdsRef = useRef(/* @__PURE__ */ new Set());
  const anchoredSubCanvasesRef = useRef(/* @__PURE__ */ new Map());
  const subCanvasByIdRef = useRef(/* @__PURE__ */ new Map());
  const readyForRawMergeRef = useRef(false);
  const localOperatingNodesRef = useRef(/* @__PURE__ */ new Map());
  const userColor = useMemo(() => {
    const palette = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0f766e"];
    const hash = Array.from(userId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return palette[hash % palette.length];
  }, [userId]);
  useEffect(() => {
    if (canvasReady) {
      const timer = setTimeout(() => setToolbarVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [canvasReady]);
  useEffect(() => {
    if (initialMediaLoadedRef.current || !readyForRawMergeRef.current || !isFlowReady) {
      return;
    }
    if (nodes.length === 0) {
      return;
    }
    initialMediaLoadedRef.current = true;
    const fallbackTimer = setTimeout(() => setCanvasReady(true), 6e3);
    const revealAfterPaint = () => {
      clearTimeout(fallbackTimer);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setCanvasReady(true);
        });
      });
    };
    const hasMediaNodes = nodes.some(
      (n) => (n.type === "image" || n.type === "video") && typeof n.url === "string" && n.url.length > 0
    );
    if (!hasMediaNodes) {
      requestAnimationFrame(() => requestAnimationFrame(revealAfterPaint));
      return () => clearTimeout(fallbackTimer);
    }
    const container = canvasRef.current;
    const waitForDomImages = (retriesLeft) => {
      const imgs = container ? Array.from(container.querySelectorAll(".react-flow__node img")) : [];
      const videos = container ? Array.from(container.querySelectorAll(".react-flow__node video")) : [];
      if (imgs.length === 0 && videos.length === 0) {
        if (retriesLeft > 0) {
          requestAnimationFrame(() => waitForDomImages(retriesLeft - 1));
        } else {
          revealAfterPaint();
        }
        return;
      }
      const imgPromises = imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return img.decode ? img.decode().catch(() => {
          }) : Promise.resolve();
        }
        return new Promise((resolve) => {
          const onLoad = () => {
            (img.decode ? img.decode().catch(() => {
            }) : Promise.resolve()).then(() => resolve());
          };
          img.addEventListener("load", onLoad, { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        });
      });
      const videoPromises = videos.map((video) => {
        if (video.readyState >= 1)
          return Promise.resolve();
        return new Promise((resolve) => {
          video.addEventListener("loadedmetadata", () => resolve(), { once: true });
          video.addEventListener("error", () => resolve(), { once: true });
        });
      });
      Promise.all([...imgPromises, ...videoPromises]).then(revealAfterPaint);
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        waitForDomImages(30);
      });
    });
    return () => clearTimeout(fallbackTimer);
  }, [nodes, isFlowReady]);
  const pushImmediateUpdates = useCallback(
    (updates) => {
      if (!canEdit || updates.length === 0) {
        return;
      }
      const collab2 = collabRef.current;
      if (!collab2) {
        return;
      }
      const now = Date.now();
      updates.forEach((update) => {
        localOperatingNodesRef.current.set(update.nodeId, now);
      });
      collab2.updateNodes(updates, true);
      setTimeout(() => {
        updates.forEach((update) => {
          const timestamp = localOperatingNodesRef.current.get(update.nodeId);
          if (timestamp === now) {
            localOperatingNodesRef.current.delete(update.nodeId);
          }
        });
      }, 100);
    },
    [canEdit]
  );
  const resolvePresenceCursor = useCallback((presence) => {
    if (!presence.cursor) {
      return null;
    }
    if (presence.cursorSpace === "screen" && presence.viewport) {
      return {
        x: (presence.cursor.x - presence.viewport.x) / presence.viewport.zoom,
        y: (presence.cursor.y - presence.viewport.y) / presence.viewport.zoom
      };
    }
    return presence.cursor;
  }, []);
  const pushToast = useCallback((message, variant = "info") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2500);
  }, []);
  const getRawTaskId = useCallback((node) => {
    const raw = node.raw;
    if (!raw || typeof raw.taskId !== "string") {
      return null;
    }
    return raw.taskId;
  }, []);
  const getInputDependencies = useCallback((item) => {
    if (!item) {
      return [];
    }
    const inputImages = item.parameters?.inputImages;
    if (!Array.isArray(inputImages) || inputImages.length === 0) {
      return [];
    }
    const dependencies = [];
    const possibleKeys = ["inputImageS3Path", "url", "filePath", "resourceId", "path"];
    inputImages.forEach((inputImage) => {
      if (typeof inputImage === "string") {
        dependencies.push({ path: inputImage });
      } else if (inputImage && typeof inputImage === "object") {
        const obj = inputImage;
        const name = typeof obj.name === "string" ? obj.name : void 0;
        for (const key of possibleKeys) {
          const value = obj[key];
          if (typeof value === "string" && value.length > 0) {
            dependencies.push({ path: value, name });
            break;
          }
        }
      }
    });
    return dependencies;
  }, []);
  const getInputImagePaths = useCallback((item) => {
    return getInputDependencies(item).map((dep) => dep.path);
  }, [getInputDependencies]);
  const getInputImagePath = useCallback((item) => {
    const paths = getInputImagePaths(item);
    return paths.length > 0 ? paths[0] : null;
  }, [getInputImagePaths]);
  const getNodeReferencePaths = useCallback(
    (node) => {
      const raw = node.raw;
      if (!raw) {
        return [];
      }
      const paths = [];
      const result = raw.result ?? void 0;
      const pushPath = (value) => {
        if (typeof value === "string" && value.length > 0) {
          paths.push(value);
        }
      };
      const resources = [
        result?.originImage,
        result?.compressedImage,
        result?.originVideo,
        result?.originAudio
      ];
      resources.forEach((resource) => {
        if (resource) {
          pushPath(resource.filePath);
          pushPath(resource.url);
          pushPath(resource.resourceId);
        }
      });
      const inputPath = getInputImagePath(raw);
      if (inputPath) {
        paths.push(inputPath);
      }
      return paths;
    },
    [getInputImagePath]
  );
  const getNodeOutputPaths = useCallback((node) => {
    const raw = node.raw;
    if (!raw) {
      return [];
    }
    const paths = [];
    const result = raw.result ?? void 0;
    const pushPath = (value) => {
      if (typeof value === "string" && value.length > 0) {
        paths.push(value);
      }
    };
    const resources = [
      result?.originImage,
      result?.compressedImage,
      result?.originVideo,
      result?.originAudio
    ];
    resources.forEach((resource) => {
      if (resource) {
        pushPath(resource.filePath);
        pushPath(resource.url);
        pushPath(resource.resourceId);
      }
    });
    return paths;
  }, []);
  const findAnchorNodeByInputPath = useCallback(
    (inputPaths, baseNodes) => {
      if (inputPaths.length === 0) {
        return null;
      }
      for (const node of baseNodes) {
        const nodePaths = getNodeReferencePaths(node);
        for (const inputPath of inputPaths) {
          if (nodePaths.includes(inputPath)) {
            return node;
          }
        }
      }
      return null;
    },
    [getNodeReferencePaths]
  );
  const getSubCanvasOrigin = useCallback(
    (baseNodes) => {
      const startX = resolvedLayout.startX ?? 100;
      const startY = resolvedLayout.startY ?? 100;
      if (baseNodes.length === 0) {
        return { x: startX, y: startY };
      }
      const rightBoundary = baseNodes.reduce(
        (max, node) => Math.max(max, node.position.x + node.size.width),
        startX
      );
      const zoom = viewport.zoom || 1;
      const offset = 200 / zoom;
      return { x: rightBoundary + offset, y: startY };
    },
    [resolvedLayout.startX, resolvedLayout.startY, viewport.zoom]
  );
  const createSubCanvasAt = useCallback(
    (origin, options) => {
      const groupKey = options?.groupKey ?? DEFAULT_SUBCANVAS_KEY;
      const info = {
        id: `subcanvas_${generateId()}`,
        status: "unread",
        origin,
        groupKey,
        anchorNodeId: options?.anchorNodeId
      };
      subCanvasByIdRef.current.set(info.id, info);
      if (options?.setActive) {
        activeSubCanvasRef.current = info;
      }
      return info;
    },
    []
  );
  const createSubCanvas = useCallback(
    (baseNodes) => {
      const origin = getSubCanvasOrigin(baseNodes);
      return createSubCanvasAt(origin, { setActive: true, groupKey: DEFAULT_SUBCANVAS_KEY });
    },
    [createSubCanvasAt, getSubCanvasOrigin]
  );
  const getAnchoredSubCanvas = useCallback(
    (inputPath, anchorNode) => {
      const existing = anchoredSubCanvasesRef.current.get(inputPath);
      if (existing && existing.status === "unread") {
        return existing;
      }
      const zoom = viewport.zoom || 1;
      const anchorGap = 1 / zoom;
      const origin = {
        x: anchorNode.position.x,
        y: anchorNode.position.y + anchorNode.size.height + anchorGap
      };
      const info = createSubCanvasAt(origin, {
        setActive: false,
        groupKey: inputPath,
        anchorNodeId: anchorNode.id
      });
      anchoredSubCanvasesRef.current.set(inputPath, info);
      return info;
    },
    [createSubCanvasAt, viewport.zoom]
  );
  const ensureActiveSubCanvas = useCallback(
    (baseNodes) => {
      const current = activeSubCanvasRef.current;
      if (current && current.status === "unread") {
        return current;
      }
      return createSubCanvas(baseNodes);
    },
    [createSubCanvas]
  );
  const markSubCanvasRead = useCallback(
    (subCanvasId, baseNodes) => {
      const info = subCanvasByIdRef.current.get(subCanvasId);
      if (!info || info.status === "read") {
        return;
      }
      info.status = "read";
      if (info.groupKey === DEFAULT_SUBCANVAS_KEY) {
        createSubCanvas(baseNodes);
        return;
      }
      const anchorNode = info.anchorNodeId ? baseNodes.find((node) => node.id === info.anchorNodeId) ?? null : null;
      if (anchorNode) {
        const zoom = viewport.zoom || 1;
        const anchorGap = 1 / zoom;
        const nextInfo = createSubCanvasAt(
          {
            x: anchorNode.position.x,
            y: anchorNode.position.y + anchorNode.size.height + anchorGap
          },
          {
            setActive: false,
            groupKey: info.groupKey,
            anchorNodeId: anchorNode.id
          }
        );
        anchoredSubCanvasesRef.current.set(info.groupKey, nextInfo);
      } else {
        const nextInfo = createSubCanvasAt(info.origin, {
          setActive: false,
          groupKey: info.groupKey,
          anchorNodeId: info.anchorNodeId
        });
        anchoredSubCanvasesRef.current.set(info.groupKey, nextInfo);
      }
    },
    [createSubCanvas, createSubCanvasAt]
  );
  const [dependencyEdges, setDependencyEdges] = useState([]);
  const dependencySignatureRef = useRef("");
  const dependencyFocusNodeId = useMemo(() => {
    const focused = nodes.find((node) => Boolean(node.dependencyFocus));
    return focused?.id ?? null;
  }, [nodes]);
  const toggleDependencyFocus = useCallback(
    (nodeId) => {
      const currentNodes = nodesRef.current;
      if (currentNodes.length === 0) {
        return;
      }
      const isActive = currentNodes.some(
        (node) => node.id === nodeId && Boolean(node.dependencyFocus)
      );
      const updates = [];
      const nextNodes = currentNodes.map((node) => {
        const nextFocus = node.id === nodeId ? !isActive : false;
        const currentFocus = Boolean(
          node.dependencyFocus
        );
        if (currentFocus === nextFocus) {
          return node;
        }
        updates.push({
          nodeId: idMapRef.current.get(node.id) ?? node.id,
          updates: { dependencyFocus: nextFocus }
        });
        return { ...node, dependencyFocus: nextFocus };
      });
      setNodes(nextNodes);
      if (updates.length > 0) {
        collabRef.current?.updateNodes(updates, true);
      }
    },
    []
  );
  useEffect(() => {
    if (!dependencyEdgesVisible || !dependencyFocusNodeId) {
      dependencySignatureRef.current = "";
      setDependencyEdges([]);
      return;
    }
    const signature = nodes.map((node) => {
      const raw = node.raw;
      const inputPath = getInputImagePath(raw) ?? "";
      const outputPaths = getNodeOutputPaths(node).sort().join(",");
      return `${node.id}:${inputPath}:${outputPaths}:${Math.round(node.position.x)}:${Math.round(node.position.y)}`;
    }).sort().join("|");
    const focusSignature = `${dependencyFocusNodeId}|${signature}`;
    if (focusSignature === dependencySignatureRef.current) {
      return;
    }
    dependencySignatureRef.current = focusSignature;
    const focusNode = nodes.find((node) => node.id === dependencyFocusNodeId);
    if (!focusNode) {
      setDependencyEdges([]);
      return;
    }
    const outputPathToNodeId = /* @__PURE__ */ new Map();
    nodes.forEach((node) => {
      const paths = getNodeOutputPaths(node);
      paths.forEach((path) => {
        if (!outputPathToNodeId.has(path)) {
          outputPathToNodeId.set(path, node.id);
        }
      });
    });
    const getHandleForDependencyName = (name) => {
      if (name === "firstFrame") {
        return { sourceHandle: "dep-source-left", targetHandle: "dep-target-right" };
      }
      if (name === "lastFrame") {
        return { sourceHandle: "dep-source-right", targetHandle: "dep-target-left" };
      }
      return { sourceHandle: "dep-source", targetHandle: "dep-target" };
    };
    const buildEdge = (sourceId, targetId, suffix, dependencyName) => {
      const handles = getHandleForDependencyName(dependencyName);
      return {
        id: `dep_${sourceId}_${targetId}_${suffix}`,
        source: sourceId,
        target: targetId,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: "bezier",
        markerEnd: { type: MarkerType.ArrowClosed, color: "rgb(210, 210, 210)" },
        style: {
          stroke: "rgb(210, 210, 210)",
          strokeWidth: 2,
          strokeDasharray: "6 6"
        },
        className: "dependency-edge-animated"
      };
    };
    const edges = [];
    const focusRaw = focusNode.raw;
    const focusInputDeps = getInputDependencies(focusRaw);
    focusInputDeps.forEach((dep, index) => {
      const targetId = outputPathToNodeId.get(dep.path);
      if (targetId && targetId !== focusNode.id) {
        edges.push(buildEdge(focusNode.id, targetId, `prev_${index}`, dep.name));
      }
    });
    const focusOutputs = new Set(getNodeOutputPaths(focusNode));
    if (focusOutputs.size > 0) {
      nodes.forEach((node) => {
        if (node.id === focusNode.id) {
          return;
        }
        const raw = node.raw;
        const nodeDeps = getInputDependencies(raw);
        nodeDeps.forEach((dep, depIndex) => {
          if (focusOutputs.has(dep.path)) {
            edges.push(buildEdge(node.id, focusNode.id, `next_${node.id}_${depIndex}`, dep.name));
          }
        });
      });
    }
    setDependencyEdges(edges);
  }, [dependencyEdgesVisible, dependencyFocusNodeId, getInputDependencies, getNodeOutputPaths, nodes]);
  const applyGridOffset = useCallback(
    (items, startIndex) => {
      if (startIndex <= 0 || items.length === 0) {
        return items;
      }
      const columns = resolvedLayout.columns ?? 4;
      const safeColumns = columns > 0 ? columns : 1;
      const nodeWidth = resolvedLayout.nodeWidth ?? 300;
      const nodeHeight = resolvedLayout.nodeHeight ?? 200;
      const gap = resolvedLayout.gap ?? 50;
      const step = Math.max(nodeWidth, nodeHeight) + gap;
      return items.map((node, index) => {
        const baseRow = Math.floor(index / safeColumns);
        const baseCol = index % safeColumns;
        const targetIndex = startIndex + index;
        const targetRow = Math.floor(targetIndex / safeColumns);
        const targetCol = targetIndex % safeColumns;
        const deltaX = (targetCol - baseCol) * step;
        const deltaY = (targetRow - baseRow) * step;
        if (deltaX === 0 && deltaY === 0) {
          return node;
        }
        return {
          ...node,
          position: {
            x: node.position.x + deltaX,
            y: node.position.y + deltaY
          }
        };
      });
    },
    [resolvedLayout.columns, resolvedLayout.gap, resolvedLayout.nodeHeight, resolvedLayout.nodeWidth]
  );
  const layoutDependentNodes = useCallback(
    (items, subCanvas, existingNodes) => {
      if (items.length === 0) {
        return items;
      }
      const zoom = viewport.zoom || 1;
      const baseGap = resolvedLayout.gap ?? 50;
      const compactGap = Math.max(4, Math.round(baseGap * 0.2));
      const gap = compactGap / zoom;
      const columnCount = Math.min(2, Math.max(1, existingNodes.length + items.length));
      const allNodes = [...existingNodes, ...items];
      const cellWidth = Math.max(...allNodes.map((node) => node.size.width));
      const cellHeight = Math.max(...allNodes.map((node) => node.size.height));
      return items.map((node, index) => {
        const placeIndex = existingNodes.length + index;
        const row = Math.floor(placeIndex / columnCount);
        const col = placeIndex % columnCount;
        return {
          ...node,
          position: {
            x: subCanvas.origin.x + col * (cellWidth + gap),
            y: subCanvas.origin.y + row * (cellHeight + gap)
          }
        };
      });
    },
    [resolvedLayout.gap, viewport.zoom]
  );
  const appendNodes = useCallback(
    (newNodes) => {
      if (newNodes.length === 0) {
        return;
      }
      const normalizedNodes = newNodes.map((node) => normalizeAudioNodeSize(node).node);
      if (collabEnabled) {
        const tempNodes = normalizedNodes.map((node) => ({
          ...node,
          id: `temp_${node.id}`
        }));
        setNodes((prevNodes) => [...prevNodes, ...tempNodes]);
        tempNodes.forEach((node) => {
          const { id: tempId, ...nodeData } = node;
          collabRef.current?.createNode(nodeData, tempId);
        });
        return;
      }
      setNodes((prevNodes) => [...prevNodes, ...normalizedNodes]);
    },
    [collabEnabled]
  );
  const seedCanvas = useCallback(() => {
    if (seededRef.current) {
      return;
    }
    seededRef.current = true;
    const shouldUseSubCanvas = rawData !== void 0;
    const subCanvas = shouldUseSubCanvas ? ensureActiveSubCanvas(nodesRef.current) : null;
    const preparedNodes = subCanvas ? seedNodes.map((node) => ({ ...node, subCanvasId: subCanvas.id })) : seedNodes;
    const tempNodes = preparedNodes.map((node) => ({
      ...node,
      id: `temp_${node.id}`
    }));
    setNodes(tempNodes);
    tempNodes.forEach((node) => {
      const { id: tempId, ...nodeData } = node;
      collabRef.current?.createNode(nodeData, tempId);
    });
    if (shouldUseSubCanvas) {
      preparedNodes.forEach((node) => {
        const taskId = getRawTaskId(node);
        if (taskId) {
          processedRawIdsRef.current.add(taskId);
        }
      });
    }
  }, [ensureActiveSubCanvas, getRawTaskId, rawData, seedNodes]);
  const handleMessage = useCallback(
    (message) => {
      switch (message.type) {
        case "sync_state":
          console.log("[Collaboration] Received sync_state:", {
            nodesCount: message.nodes.length,
            presencesCount: Object.keys(message.presences).length,
            currentNodesCount: nodesRef.current.length,
            seeded: seededRef.current
          });
          if (message.nodes.length > 0) {
            seededRef.current = true;
            const sizeUpdates = [];
            const normalizedNodes = message.nodes.map((node) => {
              const { node: normalizedNode, changed } = normalizeAudioNodeSize(node);
              if (changed) {
                sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
              }
              return normalizedNode;
            });
            setNodes(normalizedNodes);
            if (sizeUpdates.length > 0) {
              pushImmediateUpdates(sizeUpdates);
            }
          } else {
            if (!seededRef.current && nodesRef.current.length === 0) {
              seedCanvas();
            } else if (!seededRef.current) {
              console.log("[Collaboration] Keeping local nodes, not clearing");
            }
          }
          const otherUsers = Object.keys(message.presences).filter((id) => id !== userId);
          knownUsersRef.current = new Set(otherUsers);
          readyForRawMergeRef.current = true;
          break;
        case "node_created": {
          const { node: normalizedNode, changed } = normalizeAudioNodeSize(
            message.node
          );
          if (changed) {
            pushImmediateUpdates([{ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } }]);
          }
          if (message.tempId) {
            idMapRef.current.set(message.tempId, message.node.id);
          }
          setNodes((prevNodes) => {
            if (message.tempId) {
              const hasTemp = prevNodes.some((node) => node.id === message.tempId);
              if (hasTemp) {
                return prevNodes.map(
                  (node) => node.id === message.tempId ? normalizedNode : node
                );
              }
            }
            if (prevNodes.some((node) => node.id === normalizedNode.id)) {
              return prevNodes;
            }
            return [...prevNodes, normalizedNode];
          });
          break;
        }
        case "node_updated":
          if (message.userId && message.userId === userId) {
            break;
          }
          {
            const sizeUpdates = [];
            setNodes(
              (prevNodes) => prevNodes.map((node) => {
                if (node.id === message.nodeId) {
                  const merged = { ...node, ...message.updates };
                  const { node: normalizedNode, changed } = normalizeAudioNodeSize(merged);
                  if (changed) {
                    sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
                  }
                  return normalizedNode;
                }
                const mappedId = idMapRef.current.get(node.id);
                if (mappedId && mappedId === message.nodeId) {
                  const merged = {
                    ...node,
                    id: message.nodeId,
                    ...message.updates
                  };
                  const { node: normalizedNode, changed } = normalizeAudioNodeSize(merged);
                  if (changed) {
                    sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
                  }
                  return normalizedNode;
                }
                return node;
              })
            );
            if (sizeUpdates.length > 0) {
              pushImmediateUpdates(sizeUpdates);
            }
          }
          break;
        case "nodes_updated":
          const now = Date.now();
          const filteredUpdates = message.updates.filter((update) => {
            const markTimestamp = localOperatingNodesRef.current.get(update.nodeId);
            if (!markTimestamp) {
              return true;
            }
            const age = now - markTimestamp;
            const isRecentLocalOperation = age < 150;
            return !isRecentLocalOperation;
          });
          if (filteredUpdates.length === 0) {
            break;
          }
          {
            const sizeUpdates = [];
            setNodes((prevNodes) => {
              const updateMap = new Map(
                filteredUpdates.map((update) => [update.nodeId, update.updates])
              );
              const nextNodes = prevNodes.map((node) => {
                const directUpdate = updateMap.get(node.id);
                if (directUpdate) {
                  const merged = { ...node, ...directUpdate };
                  const { node: normalizedNode, changed } = normalizeAudioNodeSize(merged);
                  if (changed) {
                    sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
                  }
                  return normalizedNode;
                }
                const mappedId = idMapRef.current.get(node.id);
                if (mappedId) {
                  const mappedUpdate = updateMap.get(mappedId);
                  if (mappedUpdate) {
                    const merged = {
                      ...node,
                      id: mappedId,
                      ...mappedUpdate
                    };
                    const { node: normalizedNode, changed } = normalizeAudioNodeSize(merged);
                    if (changed) {
                      sizeUpdates.push({ nodeId: normalizedNode.id, updates: { size: normalizedNode.size } });
                    }
                    return normalizedNode;
                  }
                }
                return node;
              });
              return nextNodes;
            });
            if (sizeUpdates.length > 0) {
              pushImmediateUpdates(sizeUpdates);
            }
          }
          break;
        case "node_deleted":
          setNodes((prevNodes) => prevNodes.filter((node) => node.id !== message.nodeId));
          break;
        case "presence_update":
          if (message.userId === userId) {
            break;
          }
          if (message.presence) {
            if (!knownUsersRef.current.has(message.userId)) {
              const name = message.presence.userName || message.userId;
              pushToast(`${name} has entered the session`, "info");
              knownUsersRef.current.add(message.userId);
            }
          } else {
            if (knownUsersRef.current.has(message.userId)) {
              const name = presencesRef.current.get(message.userId)?.userName || message.userId;
              pushToast(`${name} left the session`, "info");
              knownUsersRef.current.delete(message.userId);
            }
          }
          break;
        case "error":
          if (message.code === "ROOM_FULL") {
            pushToast("The session is full, please try again later", "error");
          } else if (message.permanent) {
            pushToast(message.error || "Connection closed", "error");
            if (message.closeCode === 4004) {
              setSessionBlocked({
                message: 'You have been removed from the session. Refresh the page or click "Re-enter Session" to join again.'
              });
            }
          }
          break;
      }
    },
    [pushImmediateUpdates, pushToast, seedCanvas, userId]
  );
  const collab = useCollaboration(
    {
      canvasId,
      userId,
      userName,
      enabled: collabEnabled,
      invisible
    },
    handleMessage
  );
  collabRef.current = collab;
  connectedRef.current = collab.connected;
  useEffect(() => {
    if (!contextMenu) {
      return;
    }
    const handleClose = () => setContextMenu(null);
    const handleEsc = (e) => {
      if (e.key === "Escape")
        setContextMenu(null);
    };
    window.addEventListener("click", handleClose);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [contextMenu]);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    if (rawData === void 0) {
      return;
    }
    nodes.forEach((node) => {
      const taskId = getRawTaskId(node);
      if (taskId) {
        processedRawIdsRef.current.add(taskId);
      }
    });
  }, [getRawTaskId, nodes, rawData]);
  useEffect(() => {
    presencesRef.current = new Map(collab.presences);
  }, [collab.presences]);
  useEffect(() => {
    if (collab.connected) {
      collab.updatePresence({ userName, color: userColor });
    }
  }, [collab, userColor, userName]);
  useEffect(() => {
    if (sessionBlocked && collab.connected) {
      setSessionBlocked(null);
    }
  }, [collab.connected, sessionBlocked]);
  useEffect(() => {
    let spaceHeld = false;
    const handleKeyDownCapture = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
        return;
      }
      if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && event.code === "Digit1") {
        event.preventDefault();
        event.stopImmediatePropagation();
        reactFlowInstanceRef.current?.fitView({ padding: 0.15, duration: 300 });
        return;
      }
      if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && event.code === "Digit2") {
        event.preventDefault();
        event.stopImmediatePropagation();
        const instance = reactFlowInstanceRef.current;
        if (instance) {
          const selectedIds = lastSelectedIdsRef.current;
          if (selectedIds.length > 0) {
            const rfNodes = instance.getNodes();
            const targets = rfNodes.filter((n) => selectedIds.includes(n.id));
            if (targets.length > 0) {
              instance.fitView({ nodes: targets, padding: 0.1, maxZoom: 3, duration: 300 });
            } else {
              instance.fitView({ padding: 0.15, duration: 300 });
            }
          } else {
            instance.fitView({ padding: 0.15, duration: 300 });
          }
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomIn({ duration: 0 });
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "-") {
        event.preventDefault();
        reactFlowInstanceRef.current?.zoomOut({ duration: 0 });
        return;
      }
    };
    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) {
        return;
      }
      const key = event.key.toLowerCase();
      const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
      if (!hasModifier && !event.shiftKey && key === "f") {
        reactFlowInstanceRef.current?.fitView({ padding: 0.15, duration: 300 });
        return;
      }
      if (!canEdit) {
        return;
      }
      if (!hasModifier && !event.shiftKey && key === "v") {
        setToolMode("edit");
        setActiveTool("select");
      }
      if (!hasModifier && !event.shiftKey && key === "h") {
        setToolMode("pan");
      }
      if (key === "/" || key === "?") {
        setShortcutsOpen((prev) => !prev);
      }
      if (event.code === "Space" && !spaceHeld) {
        if (ppModalStateRef.current?.open)
          return;
        spaceHeld = true;
        event.preventDefault();
        setToolMode("pan");
      }
    };
    const handleKeyUp = (event) => {
      if (event.code === "Space" && spaceHeld) {
        spaceHeld = false;
        setToolMode("edit");
      }
    };
    window.addEventListener("keydown", handleKeyDownCapture, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDownCapture, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [canEdit]);
  useEffect(() => {
    if (!layoutPanelOpen)
      return;
    const handleMouseDown = (event) => {
      if (layoutPanelRef.current && !layoutPanelRef.current.contains(event.target)) {
        setLayoutPanelOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape")
        setLayoutPanelOpen(false);
    };
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [layoutPanelOpen]);
  useEffect(() => {
    const unsubscribe = widgetBridge.onCommand(
      "SET_SELECT_MODE",
      (payload) => {
        if (payload && typeof payload === "object") {
          console.log("[CollaborativeCanvas] SET_SELECT_MODE received:", payload);
          setSelectMode({
            isActive: Boolean(payload.isActive),
            mediaType: payload.mediaType ?? null
          });
        }
      }
    );
    return unsubscribe;
  }, []);
  useEffect(() => {
    const unsubscribe = widgetBridge.on(
      "NODE_QUICK_ACTION",
      (event) => {
        if (event.payload?.actionId === "inpaint" && event.payload?.nodeId && event.source !== "inpaint-toolbar") {
          const targetId = event.payload.nodeId;
          const node = nodesRef.current.find((n) => n.id === targetId);
          const nodeUrl = node?.url || "";
          setInpaintTutorialOpen({ open: true, initialImageUrl: nodeUrl || void 0 });
        }
      }
    );
    return unsubscribe;
  }, []);
  useEffect(() => {
    const unsubscribe = widgetBridge.on(
      "NODE_QUICK_ACTION",
      (event) => {
        const { actionId, nodeId } = event.payload ?? {};
        if (!actionId || !nodeId)
          return;
        const node = nodesRef.current.find((n) => n.id === nodeId);
        if (!node)
          return;
        const nodeUrl = node.url || "";
        if (actionId === "avatar") {
          if (node.type === NodeType.VIDEO) {
            setLipSyncModal({ open: true, initialVideoUrl: nodeUrl });
          } else {
            setAiAvatarModal({ open: true, initialAvatarUrl: nodeUrl });
          }
        }
        if (actionId === "product-avatar") {
          setProductAvatarModal({ open: true, initialProductImageUrl: nodeUrl });
        }
        if (actionId === "video-lip-sync") {
          setLipSyncModal({ open: true, initialVideoUrl: nodeUrl });
        }
        if (actionId === "video" && node.type === NodeType.IMAGE) {
          setAiCreateMode({
            type: "ai-video",
            subActionId: "image-to-video",
            nodeId,
            prompt: "",
            referenceImageUrl: nodeUrl
          });
        }
      }
    );
    return unsubscribe;
  }, []);
  useEffect(() => {
    if (!inpaintFocus && !aiCreateMode)
      return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (inpaintFocus)
          setInpaintFocus(null);
        if (aiCreateMode) {
          setAiCreateMode(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inpaintFocus, aiCreateMode]);
  useEffect(() => {
    if (!inpaintFocus || inpaintFocus.step !== "edit")
      return;
    const nodeEl = document.querySelector(`[data-id="${inpaintFocus.nodeId}"]`);
    if (!nodeEl)
      return;
    let rafId;
    const update = () => {
      const rect = nodeEl.getBoundingClientRect();
      const toolbar = inpaintToolbarRef.current;
      if (toolbar) {
        toolbar.style.left = `${rect.left + rect.width / 2}px`;
        toolbar.style.top = `${rect.top - 12}px`;
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [inpaintFocus?.nodeId, inpaintFocus?.step]);
  useEffect(() => {
    if (!collabEnabled) {
      return;
    }
    if (wasConnectedRef.current && !collab.connected) {
      setContextMenu(null);
      knownUsersRef.current.clear();
      if (!sessionBlocked) {
        pushToast("\u8FDE\u63A5\u65AD\u5F00\uFF0C\u6B63\u5728\u91CD\u8FDE...", "error");
      }
    } else if (!wasConnectedRef.current && collab.connected) {
      console.log("[Collaboration] Connected successfully");
    }
    wasConnectedRef.current = collab.connected;
  }, [collab.connected, collabEnabled, pushToast, sessionBlocked]);
  useEffect(() => {
    if (collabEnabled || localSeededRef.current) {
      return;
    }
    const shouldUseSubCanvas = rawData !== void 0;
    const subCanvas = shouldUseSubCanvas ? ensureActiveSubCanvas(nodesRef.current) : null;
    const preparedNodes = subCanvas ? seedNodes.map((node) => ({ ...node, subCanvasId: subCanvas.id })) : seedNodes;
    setNodes(preparedNodes);
    localSeededRef.current = true;
    readyForRawMergeRef.current = true;
    if (shouldUseSubCanvas) {
      preparedNodes.forEach((node) => {
        const taskId = getRawTaskId(node);
        if (taskId) {
          processedRawIdsRef.current.add(taskId);
        }
      });
    }
  }, [collabEnabled, ensureActiveSubCanvas, getRawTaskId, rawData, seedNodes]);
  useEffect(() => {
    if (!rawData || rawData.length === 0) {
      return;
    }
    if (!readyForRawMergeRef.current) {
      return;
    }
    const existingTaskIds = /* @__PURE__ */ new Set();
    nodes.forEach((node) => {
      const taskId = getRawTaskId(node);
      if (taskId) {
        existingTaskIds.add(taskId);
      }
    });
    const pendingItems = rawData.filter((item) => {
      const taskId = typeof item.taskId === "string" ? item.taskId : null;
      if (!taskId) {
        return false;
      }
      if (existingTaskIds.has(taskId)) {
        return false;
      }
      if (processedRawIdsRef.current.has(taskId)) {
        return false;
      }
      return true;
    });
    if (pendingItems.length === 0) {
      return;
    }
    const anchoredGroups = /* @__PURE__ */ new Map();
    const fallbackItems = [];
    pendingItems.forEach((item) => {
      const inputPaths = getInputImagePaths(item);
      if (inputPaths.length > 0) {
        const anchor = findAnchorNodeByInputPath(inputPaths, nodes);
        if (anchor) {
          const groupKey = inputPaths[0];
          const existing = anchoredGroups.get(groupKey);
          if (existing) {
            existing.items.push(item);
          } else {
            anchoredGroups.set(groupKey, { anchor, items: [item] });
          }
          return;
        }
      }
      fallbackItems.push(item);
    });
    const markProcessed = (list) => {
      list.forEach((node) => {
        const taskId = getRawTaskId(node);
        if (taskId) {
          processedRawIdsRef.current.add(taskId);
        }
      });
    };
    let dependencyFocusEnabled = false;
    if (anchoredGroups.size > 0) {
      const updates = [];
      setNodes((prevNodes) => {
        return prevNodes.map((node) => {
          const hasFocus = Boolean(node.dependencyFocus);
          if (hasFocus) {
            updates.push({
              nodeId: idMapRef.current.get(node.id) ?? node.id,
              updates: { dependencyFocus: false }
            });
            return { ...node, dependencyFocus: false };
          }
          return node;
        });
      });
      if (updates.length > 0) {
        collabRef.current?.updateNodes(updates, true);
      }
    }
    anchoredGroups.forEach(({ anchor, items }, inputPath) => {
      const subCanvas2 = getAnchoredSubCanvas(inputPath, anchor);
      const existingNodes = nodes.filter(
        (node) => node.subCanvasId === subCanvas2.id
      );
      const positionedNodes2 = parseRawData(items, {
        ...resolvedLayout,
        startX: subCanvas2.origin.x,
        startY: subCanvas2.origin.y
      });
      if (positionedNodes2.length === 0) {
        return;
      }
      const compactNodes = layoutDependentNodes(positionedNodes2, subCanvas2, existingNodes);
      const newNodes2 = compactNodes.map((node, index) => ({
        ...node,
        subCanvasId: subCanvas2.id,
        // 只为本批次第一个有依赖的节点启用 dependencyFocus
        dependencyFocus: !dependencyFocusEnabled && index === 0 ? true : void 0
      }));
      if (newNodes2.length > 0 && !dependencyFocusEnabled) {
        dependencyFocusEnabled = true;
      }
      appendNodes(newNodes2);
      markProcessed(newNodes2);
    });
    if (fallbackItems.length === 0) {
      return;
    }
    const subCanvas = ensureActiveSubCanvas(nodes);
    const existingCount = nodes.filter(
      (node) => node.subCanvasId === subCanvas.id
    ).length;
    const positionedNodes = parseRawData(fallbackItems, {
      ...resolvedLayout,
      startX: subCanvas.origin.x,
      startY: subCanvas.origin.y
    });
    if (positionedNodes.length === 0) {
      return;
    }
    const offsetNodes = applyGridOffset(positionedNodes, existingCount);
    const newNodes = offsetNodes.map((node) => ({ ...node, subCanvasId: subCanvas.id }));
    appendNodes(newNodes);
    markProcessed(newNodes);
  }, [
    appendNodes,
    applyGridOffset,
    ensureActiveSubCanvas,
    findAnchorNodeByInputPath,
    getAnchoredSubCanvas,
    getInputImagePaths,
    layoutDependentNodes,
    getRawTaskId,
    nodes,
    rawData,
    resolvedLayout
  ]);
  const handlePaneClick = useCallback(
    (position) => {
      if (!canEdit || isLocked || toolMode !== "edit" || activeTool !== "text") {
        return;
      }
      const tempId = `temp_${generateId()}`;
      const defaultContent = "Add some text..";
      const defaultFontSize = 24;
      const paddingSize = 12;
      const borderSize = 2;
      const lineHeight = 1.4;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      let textWidth = 100;
      if (context) {
        context.font = `${defaultFontSize}px sans-serif`;
        textWidth = context.measureText(defaultContent).width;
      }
      const singleLineHeight = Math.ceil(defaultFontSize * lineHeight) + paddingSize * 2;
      const defaultWidth = Math.max(200, Math.ceil((textWidth + paddingSize * 2 + 16) * 2));
      const newNode = {
        id: tempId,
        type: NodeType.TEXT,
        position: {
          x: position.x - paddingSize - borderSize,
          y: position.y - paddingSize - borderSize
        },
        size: {
          width: defaultWidth,
          height: singleLineHeight
        },
        content: defaultContent,
        fontSize: defaultFontSize,
        color: "#ffffff",
        backgroundColor: "transparent",
        autoEdit: true,
        // 标记为自动进入编辑模式
        selected: true
        // 自动选中新创建的节点
      };
      setNodes((prevNodes) => [...prevNodes, newNode]);
      collab.createNode(newNode, tempId);
      setActiveTool("select");
    },
    [activeTool, canEdit, collab, isLocked, toolMode]
  );
  const handleNodesChange = useCallback(
    (nextNodes) => {
      const prevNodes = nodesRef.current;
      setNodes(nextNodes);
      const nextNodeIds = new Set(nextNodes.map((node) => node.id));
      const deletedNodes = prevNodes.filter((node) => !nextNodeIds.has(node.id));
      deletedNodes.forEach((node) => {
        widgetBridge.emit(
          createWidgetEvent(
            "NODE_DELETED",
            {
              nodeId: node.id,
              nodeType: node.type,
              node
            },
            { source: "ui" }
          )
        );
      });
      deletedNodes.forEach((node) => {
        const mappedId = idMapRef.current.get(node.id) ?? node.id;
        if (isDev()) {
          console.log("[CollaborativeCanvas] local delete detected, send collab delete", {
            id: node.id,
            mappedId
          });
        }
        collab.deleteNode(mappedId);
        idMapRef.current.delete(node.id);
      });
      const movedNodes = nextNodes.filter((node) => {
        if (draggingNodesRef.current.has(node.id)) {
          return false;
        }
        const prev = prevNodes.find((prevNode) => prevNode.id === node.id);
        if (!prev) {
          return false;
        }
        return prev.position.x !== node.position.x || prev.position.y !== node.position.y;
      });
      if (rawData !== void 0 && movedNodes.length > 0) {
        const touchedSubCanvasIds = /* @__PURE__ */ new Set();
        movedNodes.forEach((node) => {
          const subCanvasId = node.subCanvasId;
          if (subCanvasId) {
            touchedSubCanvasIds.add(subCanvasId);
          }
        });
        touchedSubCanvasIds.forEach((subCanvasId) => {
          markSubCanvasRead(subCanvasId, nextNodes);
        });
      }
      if (movedNodes.length > 0 && draggingNodesRef.current.size === 0) {
        const updates = movedNodes.map((node) => ({
          nodeId: idMapRef.current.get(node.id) ?? node.id,
          updates: { position: node.position }
        }));
        collab.updateNodes(updates);
      }
      const dataUpdates = nextNodes.reduce((acc, node) => {
        const prev = prevNodes.find((prevNode) => prevNode.id === node.id);
        if (!prev) {
          return acc;
        }
        const updates = {};
        let hasSizeChange = false;
        Object.keys(node).forEach((key) => {
          if (key === "id" || key === "type" || key === "position") {
            return;
          }
          const nextValue = node[key];
          const prevValue = prev[key];
          if (typeof nextValue === "object" && nextValue !== null) {
            if (JSON.stringify(nextValue) !== JSON.stringify(prevValue)) {
              updates[key] = nextValue;
              if (key === "size") {
                hasSizeChange = true;
              }
            }
            return;
          }
          if (nextValue !== prevValue) {
            updates[key] = nextValue;
          }
        });
        if (hasSizeChange) {
          updates.position = node.position;
        }
        if (Object.keys(updates).length === 0) {
          return acc;
        }
        acc.push({
          nodeId: idMapRef.current.get(node.id) ?? node.id,
          updates
        });
        return acc;
      }, []);
      if (dataUpdates.length > 0) {
        const now = Date.now();
        dataUpdates.forEach((update) => {
          localOperatingNodesRef.current.set(update.nodeId, now);
        });
        collab.updateNodes(dataUpdates, true);
        setTimeout(() => {
          dataUpdates.forEach((update) => {
            const timestamp = localOperatingNodesRef.current.get(update.nodeId);
            if (timestamp === now) {
              localOperatingNodesRef.current.delete(update.nodeId);
            }
          });
        }, 100);
      }
    },
    [collab, markSubCanvasRead, rawData]
  );
  const handleNodeDragStart = useCallback(
    (nodeId, position) => {
      draggingNodesRef.current.add(nodeId);
      const mappedId = idMapRef.current.get(nodeId) ?? nodeId;
      localOperatingNodesRef.current.set(mappedId, Date.now());
      collab.dragStart(mappedId, position);
    },
    [collab]
  );
  const handleNodeDrag = useCallback(
    (nodeId, position, selectedNodeIds) => {
      if (selectedNodeIds && selectedNodeIds.length > 1) {
        selectedNodeIds.forEach((id) => {
          if (!draggingNodesRef.current.has(id)) {
            draggingNodesRef.current.add(id);
            const mappedId = idMapRef.current.get(id) ?? id;
            const node = nodesRef.current.find((n) => n.id === id);
            if (node) {
              collab.dragStart(mappedId, node.position);
            }
          }
        });
        const currentNodes = nodesRef.current;
        const updates = selectedNodeIds.map((id) => {
          const node = currentNodes.find((n) => n.id === id);
          if (!node)
            return null;
          return {
            nodeId: idMapRef.current.get(id) ?? id,
            updates: { position: node.position }
          };
        }).filter(
          (update) => update !== null
        );
        if (updates.length > 0) {
          collab.updateNodes(updates);
        }
      } else {
        const mappedId = idMapRef.current.get(nodeId) ?? nodeId;
        collab.dragMove(mappedId, position);
      }
    },
    [collab]
  );
  const handleNodeDragEnd = useCallback(
    (nodeId, position) => {
      const draggingNodeIds = Array.from(draggingNodesRef.current);
      draggingNodesRef.current.clear();
      draggingNodeIds.forEach((id) => {
        const mappedId = idMapRef.current.get(id) ?? id;
        const node = nodesRef.current.find((n) => n.id === id);
        if (node) {
          collab.dragEnd(mappedId, node.position);
          const timestamp = Date.now();
          localOperatingNodesRef.current.set(mappedId, timestamp);
          setTimeout(() => {
            const currentTimestamp = localOperatingNodesRef.current.get(mappedId);
            if (currentTimestamp === timestamp) {
              localOperatingNodesRef.current.delete(mappedId);
            }
          }, 500);
        }
      });
    },
    [collab]
  );
  const toFlowPosition = useCallback(
    (clientX, clientY) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        return null;
      }
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
        return null;
      }
      return {
        x: (localX - viewport.x) / viewport.zoom,
        y: (localY - viewport.y) / viewport.zoom
      };
    },
    [viewport]
  );
  const handlePaneMouseMove = useCallback(
    (position) => {
      if (!connectedRef.current) {
        return;
      }
      collab.updatePresence({
        cursor: position,
        cursorSpace: "flow",
        viewport,
        userName,
        color: userColor
      });
    },
    [collab, userColor, userName, viewport]
  );
  const handlePointerMove = useCallback(
    (event) => {
      if (!connectedRef.current) {
        return;
      }
      const position = toFlowPosition(event.clientX, event.clientY);
      if (!position) {
        return;
      }
      collab.updatePresence({
        cursor: position,
        cursorSpace: "flow",
        viewport,
        userName,
        color: userColor
      });
    },
    [collab, toFlowPosition, userColor, userName, viewport]
  );
  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, [handlePointerMove]);
  const handleViewportChange = useCallback(
    (nextViewport) => {
      setViewport(nextViewport);
      if (!connectedRef.current) {
        return;
      }
      collab.updatePresence({
        viewport: nextViewport,
        userName,
        color: userColor
      });
    },
    [collab, userColor, userName]
  );
  const handleNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      if (!canEdit || isLocked || toolMode !== "edit") {
        return;
      }
      const selectedNodes2 = nodesRef.current.filter((item) => item.selected);
      if (selectedNodes2.length > 1) {
        const isClickedNodeSelected = selectedNodes2.some((n) => n.id === node.id);
        if (isClickedNodeSelected) {
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            type: "multi-node",
            nodeIds: selectedNodes2.map((n) => n.id)
          });
        } else {
          const targetNode2 = nodesRef.current.find((item) => item.id === node.id);
          const raw2 = targetNode2?.raw;
          if (String(raw2?.status ?? "").toLowerCase() === "init")
            return;
          setContextMenu({
            x: event.clientX,
            y: event.clientY,
            type: "node",
            nodeId: node.id
          });
        }
        return;
      }
      const targetNode = nodesRef.current.find((item) => item.id === node.id);
      const raw = targetNode?.raw;
      if (String(raw?.status ?? "").toLowerCase() === "init") {
        return;
      }
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "node",
        nodeId: node.id
      });
    },
    [canEdit, isLocked, toolMode]
  );
  const handlePaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      const target = event.target;
      const nodeEl = target.closest(".react-flow__node");
      if (nodeEl && canEdit && !isLocked && toolMode === "edit") {
        const nodeId = nodeEl.getAttribute("data-id");
        if (nodeId) {
          const selectedNodes2 = nodesRef.current.filter((n) => n.selected);
          if (selectedNodes2.length > 1 && selectedNodes2.some((n) => n.id === nodeId)) {
            setContextMenu({ x: event.clientX, y: event.clientY, type: "multi-node", nodeIds: selectedNodes2.map((n) => n.id) });
            return;
          }
          const targetNode = nodesRef.current.find((n) => n.id === nodeId);
          const raw = targetNode?.raw;
          if (String(raw?.status ?? "").toLowerCase() !== "init") {
            setContextMenu({ x: event.clientX, y: event.clientY, type: "node", nodeId });
            return;
          }
        }
      }
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "canvas"
      });
    },
    [canEdit, isLocked, toolMode]
  );
  const getNewNodePosition = useCallback(
    (placeholderSize) => {
      const GAP2 = 40;
      if (nodes.length > 0) {
        let minX = Infinity, maxX = -Infinity, maxBottom = -Infinity;
        for (const n of nodes) {
          const nx = n.position.x;
          const nRight = nx + n.size.width;
          const nBottom = n.position.y + n.size.height;
          if (nx < minX)
            minX = nx;
          if (nRight > maxX)
            maxX = nRight;
          if (nBottom > maxBottom)
            maxBottom = nBottom;
        }
        const centerX = (minX + maxX) / 2;
        return {
          x: centerX - placeholderSize.width / 2,
          y: maxBottom + GAP2
        };
      }
      const instance = reactFlowInstanceRef.current;
      if (instance) {
        const containerEl = document.querySelector(".react-flow");
        const cw = containerEl?.clientWidth ?? 1200;
        const ch = containerEl?.clientHeight ?? 800;
        const center = instance.screenToFlowPosition({ x: cw / 2, y: ch / 2 });
        return {
          x: center.x - placeholderSize.width / 2,
          y: center.y - placeholderSize.height / 2
        };
      }
      return { x: -placeholderSize.width / 2, y: -placeholderSize.height / 2 };
    },
    [nodes]
  );
  const handlePlusAction = useCallback(
    (actionId, subActionId) => {
      if (subActionId === "product-photography") {
        const placeholderSize2 = { width: 320, height: 320 };
        const placeholderNode2 = {
          id: generateId(),
          type: NodeType.IMAGE,
          position: getNewNodePosition(placeholderSize2),
          size: placeholderSize2,
          url: "",
          title: "Image",
          zIndex: nodes.length,
          toolId: "product-photography",
          toolCategory: "ai-image"
        };
        setNodes((prev) => [...prev, placeholderNode2]);
        setPpModalState({ open: true, nodeId: placeholderNode2.id });
        return;
      }
      if (subActionId === "inpaint") {
        setInpaintTutorialOpen({ open: true });
        return;
      }
      if (subActionId === "image-upscale") {
        setImageUpscaleOpen(true);
        return;
      }
      if (subActionId === "video-upscale") {
        setVideoUpscaleOpen(true);
        return;
      }
      if (subActionId === "ai-avatar") {
        setAiAvatarModal({ open: true });
        return;
      }
      if (subActionId === "video-lip-sync") {
        setLipSyncModal({ open: true });
        return;
      }
      if (subActionId === "design-avatar") {
        setDesignAvatarOpen(true);
        return;
      }
      if (subActionId === "product-avatar") {
        setProductAvatarModal({ open: true });
        return;
      }
      if (actionId === "upload" || actionId === "upload-image" || actionId === "upload-video" || actionId === "select-from-board") {
        widgetBridge.emit(
          createWidgetEvent(
            "CANVAS_CREATE_ACTION",
            { actionId },
            { source: "ui" }
          )
        );
        return;
      }
      const placeholderSize = actionId === "ai-image" ? { width: 1024, height: 1024 } : actionId === "ai-audio" ? { width: 320, height: 80 } : { width: 1280, height: 720 };
      const nodeType = actionId === "ai-image" ? NodeType.IMAGE : actionId === "ai-audio" ? NodeType.AUDIO : NodeType.VIDEO;
      const nodeTitle = actionId === "ai-image" ? "Image" : actionId === "ai-audio" ? "Audio" : actionId === "ai-avatar" ? "Video" : "Video";
      const toolId = subActionId ?? actionId;
      const placeholderNode = {
        id: generateId(),
        type: nodeType,
        position: getNewNodePosition(placeholderSize),
        size: placeholderSize,
        url: "",
        title: nodeTitle,
        zIndex: nodes.length,
        toolId,
        toolCategory: actionId,
        selected: true
      };
      setNodes((prev) => [...prev.map((n) => ({ ...n, selected: false })), placeholderNode]);
      setAiCreateMode({
        type: actionId,
        subActionId: subActionId ?? actionId,
        nodeId: placeholderNode.id,
        prompt: ""
      });
      setTimeout(() => {
        const instance = reactFlowInstanceRef.current;
        if (instance) {
          instance.fitView({
            nodes: [{ id: placeholderNode.id }],
            padding: 0.35,
            maxZoom: 1,
            duration: 400
          });
        }
      }, 50);
    },
    [nodes.length, getNewNodePosition]
  );
  const sortNodesByLayer = useCallback((list) => {
    const indexMap = new Map(list.map((node, index) => [node.id, index]));
    return [...list].sort((a, b) => {
      const aZ = typeof a.zIndex === "number" ? a.zIndex : 0;
      const bZ = typeof b.zIndex === "number" ? b.zIndex : 0;
      if (aZ !== bZ) {
        return aZ - bZ;
      }
      return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
    });
  }, []);
  const getLayerInfo = useCallback(
    (nodeId) => {
      const ordered = sortNodesByLayer(nodesRef.current);
      const index = ordered.findIndex((node) => node.id === nodeId);
      if (index === -1) {
        return { isTop: false, isBottom: false };
      }
      return {
        isTop: index === ordered.length - 1,
        isBottom: index === 0
      };
    },
    [sortNodesByLayer]
  );
  const applyLayerAction = useCallback(
    (nodeId, action) => {
      const prevNodes = nodesRef.current;
      if (prevNodes.length < 2) {
        setContextMenu(null);
        return;
      }
      const ordered = sortNodesByLayer(prevNodes);
      const index = ordered.findIndex((node) => node.id === nodeId);
      if (index === -1) {
        setContextMenu(null);
        return;
      }
      const nextOrder = [...ordered];
      if (action === "forward") {
        if (index === ordered.length - 1) {
          setContextMenu(null);
          return;
        }
        [nextOrder[index], nextOrder[index + 1]] = [nextOrder[index + 1], nextOrder[index]];
      } else if (action === "backward") {
        if (index === 0) {
          setContextMenu(null);
          return;
        }
        [nextOrder[index], nextOrder[index - 1]] = [nextOrder[index - 1], nextOrder[index]];
      } else if (action === "front") {
        if (index === ordered.length - 1) {
          setContextMenu(null);
          return;
        }
        const [node] = nextOrder.splice(index, 1);
        nextOrder.push(node);
      } else if (action === "back") {
        if (index === 0) {
          setContextMenu(null);
          return;
        }
        const [node] = nextOrder.splice(index, 1);
        nextOrder.unshift(node);
      }
      const zIndexMap = new Map(nextOrder.map((node, idx) => [node.id, idx]));
      const pendingUpdates = [];
      const nextNodes = prevNodes.map((node) => {
        const nextZIndex = zIndexMap.get(node.id);
        if (nextZIndex === void 0 || nextZIndex === node.zIndex) {
          return node;
        }
        const mappedId = idMapRef.current.get(node.id) ?? node.id;
        pendingUpdates.push({
          nodeId: mappedId,
          updates: { zIndex: nextZIndex }
        });
        return { ...node, zIndex: nextZIndex };
      });
      setNodes(nextNodes);
      if (pendingUpdates.length > 0) {
        collab.updateNodes(pendingUpdates, true);
      }
      setContextMenu(null);
    },
    [collab, sortNodesByLayer]
  );
  const handleCloneNode = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    const source = nodesRef.current.find((node) => node.id === contextMenu.nodeId);
    if (!source) {
      setContextMenu(null);
      return;
    }
    const tempId = `temp_${generateId()}`;
    const clonedNode = {
      ...source,
      id: tempId,
      position: {
        x: source.position.x + 24,
        y: source.position.y + 24
      }
    };
    setNodes((prevNodes) => [...prevNodes, clonedNode]);
    collab.createNode(clonedNode, tempId);
    setContextMenu(null);
  }, [collab, contextMenu]);
  useCallback(() => {
    if (!contextMenu) {
      return;
    }
    const target = nodesRef.current.find((node) => node.id === contextMenu.nodeId);
    if (!target) {
      setContextMenu(null);
      return;
    }
    if (isDev()) {
      console.log("[CollaborativeCanvas] context menu delete", {
        id: target.id,
        type: target.type
      });
    }
    widgetBridge.emit(
      createWidgetEvent(
        "NODE_DELETE_REQUEST",
        {
          nodeId: target.id,
          nodeType: target.type,
          node: target
        },
        { source: "ui" }
      )
    );
    setContextMenu(null);
  }, [contextMenu]);
  useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    const nodeIds = selected.map((n) => n.id);
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_DELETE_REQUEST", { nodeIds, nodes: selected }, { source: "ui" })
    );
  }, []);
  const handleBatchGroup = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length < 2)
      return;
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_GROUP", {
        nodeIds: selected.map((n) => n.id),
        nodes: selected
      }, { source: "ui" })
    );
  }, []);
  const handleBatchCopy = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_QUICK_ACTION", {
        nodeIds: selected.map((n) => n.id),
        actionId: "copy",
        actionLabel: "Copy",
        nodes: selected
      }, { source: "ui" })
    );
  }, []);
  const handleBatchDownload = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_DOWNLOAD", {
        nodeIds: selected.map((n) => n.id),
        nodes: selected
      }, { source: "ui" })
    );
  }, []);
  const handleBatchLock = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_QUICK_ACTION", {
        nodeIds: selected.map((n) => n.id),
        actionId: "lock",
        actionLabel: "Lock All"
      }, { source: "ui" })
    );
  }, []);
  const handleBatchUnlock = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_QUICK_ACTION", {
        nodeIds: selected.map((n) => n.id),
        actionId: "unlock",
        actionLabel: "Unlock All"
      }, { source: "ui" })
    );
  }, []);
  const handleBatchHide = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_QUICK_ACTION", {
        nodeIds: selected.map((n) => n.id),
        actionId: "hide",
        actionLabel: "Hide All"
      }, { source: "ui" })
    );
  }, []);
  const handleBatchShow = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_QUICK_ACTION", {
        nodeIds: selected.map((n) => n.id),
        actionId: "show",
        actionLabel: "Show All"
      }, { source: "ui" })
    );
  }, []);
  const handleBatchBringToFront = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    const selectedIds = new Set(selected.map((n) => n.id));
    const sorted = sortNodesByLayer(nodesRef.current);
    const nonSelected = sorted.filter((n) => !selectedIds.has(n.id));
    const selectedSorted = sorted.filter((n) => selectedIds.has(n.id));
    const reordered = [...nonSelected, ...selectedSorted];
    const updatedNodes = reordered.map((n, i) => ({ ...n, zIndex: i }));
    setNodes(updatedNodes);
    const pendingUpdates = updatedNodes.map((n) => ({
      nodeId: n.id,
      updates: { zIndex: n.zIndex }
    }));
    if (pendingUpdates.length > 0)
      collab.updateNodes(pendingUpdates, true);
    setContextMenu(null);
  }, [collab, sortNodesByLayer]);
  const handleBatchSendToBack = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    const selectedIds = new Set(selected.map((n) => n.id));
    const sorted = sortNodesByLayer(nodesRef.current);
    const nonSelected = sorted.filter((n) => !selectedIds.has(n.id));
    const selectedSorted = sorted.filter((n) => selectedIds.has(n.id));
    const reordered = [...selectedSorted, ...nonSelected];
    const updatedNodes = reordered.map((n, i) => ({ ...n, zIndex: i }));
    setNodes(updatedNodes);
    const pendingUpdates = updatedNodes.map((n) => ({
      nodeId: n.id,
      updates: { zIndex: n.zIndex }
    }));
    if (pendingUpdates.length > 0)
      collab.updateNodes(pendingUpdates, true);
    setContextMenu(null);
  }, [collab, sortNodesByLayer]);
  const handleBatchExport = useCallback((format) => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length === 0)
      return;
    widgetBridge.emit(
      createWidgetEvent("NODE_BATCH_EXPORT", {
        nodeIds: selected.map((n) => n.id),
        format,
        nodes: selected
      }, { source: "ui" })
    );
  }, []);
  const handleAlign = useCallback((direction) => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length < 2)
      return;
    let updatedPositions = [];
    if (direction === "left") {
      const minX = Math.min(...selected.map((n) => n.position.x));
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: minX, y: n.position.y } }));
    } else if (direction === "right") {
      const maxRight = Math.max(...selected.map((n) => n.position.x + n.size.width));
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: maxRight - n.size.width, y: n.position.y } }));
    } else if (direction === "center") {
      const minX = Math.min(...selected.map((n) => n.position.x));
      const maxRight = Math.max(...selected.map((n) => n.position.x + n.size.width));
      const centerX = (minX + maxRight) / 2;
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: centerX - n.size.width / 2, y: n.position.y } }));
    } else if (direction === "top") {
      const minY = Math.min(...selected.map((n) => n.position.y));
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: n.position.x, y: minY } }));
    } else if (direction === "bottom") {
      const maxBottom = Math.max(...selected.map((n) => n.position.y + n.size.height));
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: n.position.x, y: maxBottom - n.size.height } }));
    } else if (direction === "middle") {
      const minY = Math.min(...selected.map((n) => n.position.y));
      const maxBottom = Math.max(...selected.map((n) => n.position.y + n.size.height));
      const centerY = (minY + maxBottom) / 2;
      updatedPositions = selected.map((n) => ({ id: n.id, position: { x: n.position.x, y: centerY - n.size.height / 2 } }));
    }
    setNodes(
      (prev) => prev.map((n) => {
        const update = updatedPositions.find((u) => u.id === n.id);
        return update ? { ...n, position: update.position } : n;
      })
    );
    const pendingUpdates = updatedPositions.map((u) => ({
      nodeId: u.id,
      updates: { position: u.position }
    }));
    if (pendingUpdates.length > 0)
      collab.updateNodes(pendingUpdates, true);
  }, [collab]);
  const handleDistribute = useCallback((axis) => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length < 3)
      return;
    let updatedPositions = [];
    if (axis === "horizontal") {
      const sorted = [...selected].sort((a, b) => a.position.x - b.position.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan = last.position.x + last.size.width - first.position.x;
      const totalNodeWidth = sorted.reduce((sum, n) => sum + n.size.width, 0);
      const gap = (totalSpan - totalNodeWidth) / (sorted.length - 1);
      let currentX = first.position.x;
      updatedPositions = sorted.map((n) => {
        const pos = { id: n.id, position: { x: currentX, y: n.position.y } };
        currentX += n.size.width + gap;
        return pos;
      });
    } else {
      const sorted = [...selected].sort((a, b) => a.position.y - b.position.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan = last.position.y + last.size.height - first.position.y;
      const totalNodeHeight = sorted.reduce((sum, n) => sum + n.size.height, 0);
      const gap = (totalSpan - totalNodeHeight) / (sorted.length - 1);
      let currentY = first.position.y;
      updatedPositions = sorted.map((n) => {
        const pos = { id: n.id, position: { x: n.position.x, y: currentY } };
        currentY += n.size.height + gap;
        return pos;
      });
    }
    setNodes(
      (prev) => prev.map((n) => {
        const update = updatedPositions.find((u) => u.id === n.id);
        return update ? { ...n, position: update.position } : n;
      })
    );
    const pendingUpdates = updatedPositions.map((u) => ({
      nodeId: u.id,
      updates: { position: u.position }
    }));
    if (pendingUpdates.length > 0)
      collab.updateNodes(pendingUpdates, true);
  }, [collab]);
  const handleAutoArrange = useCallback(() => {
    const selected = nodesRef.current.filter((n) => n.selected);
    if (selected.length < 2)
      return;
    const sorted = [...selected].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    const cols = Math.ceil(Math.sqrt(sorted.length));
    const GAP2 = 24;
    const minX = Math.min(...sorted.map((n) => n.position.x));
    const minY = Math.min(...sorted.map((n) => n.position.y));
    const colWidths = Array(cols).fill(0);
    const rowHeights = [];
    sorted.forEach((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      colWidths[col] = Math.max(colWidths[col], n.size.width);
      rowHeights[row] = Math.max(rowHeights[row] ?? 0, n.size.height);
    });
    const updatedPositions = sorted.map((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = minX + colWidths.slice(0, col).reduce((s, w) => s + w + GAP2, 0);
      const y = minY + rowHeights.slice(0, row).reduce((s, h) => s + h + GAP2, 0);
      return { id: n.id, position: { x, y } };
    });
    setNodes(
      (prev) => prev.map((n) => {
        const update = updatedPositions.find((u) => u.id === n.id);
        return update ? { ...n, position: update.position } : n;
      })
    );
    const pendingUpdates = updatedPositions.map((u) => ({
      nodeId: u.id,
      updates: { position: u.position }
    }));
    if (pendingUpdates.length > 0)
      collab.updateNodes(pendingUpdates, true);
  }, [collab]);
  useEffect(() => {
    if (!canEdit)
      return;
    const handleKeyDown = (e) => {
      const target = e.target;
      if (target?.tagName && /^(INPUT|TEXTAREA)$/.test(target.tagName ?? "") || target?.isContentEditable)
        return;
      const key = e.key?.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "c") {
        const selected = nodesRef.current.filter((n) => n.selected);
        if (selected.length > 0) {
          handleBatchCopy();
          try {
            const urls = selected.map((n) => n.url).filter(Boolean);
            if (urls.length > 0) {
              navigator.clipboard.writeText(urls.join("\n")).catch(() => {
              });
            }
          } catch {
          }
          e.preventDefault();
        }
      }
      if ((e.metaKey || e.ctrlKey) && key === "v") {
        e.preventDefault();
        widgetBridge.emit(
          createWidgetEvent("CANVAS_PASTE", {}, { source: "ui" })
        );
      }
      if (e.shiftKey && !e.metaKey && !e.ctrlKey) {
        const selected = nodesRef.current.filter((n) => n.selected);
        if (selected.length < 2)
          return;
        if (key === "h") {
          e.preventDefault();
          handleDistribute("horizontal");
        }
        if (key === "v") {
          e.preventDefault();
          handleDistribute("vertical");
        }
        if (key === "a") {
          e.preventDefault();
          handleAutoArrange();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEdit, handleBatchCopy, handleDistribute, handleAutoArrange]);
  useEffect(() => {
    if (!isViewer) {
      return;
    }
    setToolMode("pan");
    setActiveTool("select");
    setContextMenu(null);
  }, [isViewer]);
  const aiCreateContextValue = useMemo(() => ({
    aiCreateMode,
    credits: userCredits ?? 25,
    onSubmit: (tab, state, withWatermark) => {
      if (!aiCreateMode)
        return;
      const targetId = aiCreateMode.nodeId;
      widgetBridge.emit(
        createWidgetEvent(
          "CANVAS_CREATE_ACTION",
          {
            actionId: tab,
            nodeId: targetId,
            prompt: state.prompt,
            model: state.model,
            ratio: state.ratio,
            resolution: state.resolution,
            referenceImageUrl: state.referenceImageUrl || void 0,
            withWatermark
          },
          { source: "ui" }
        )
      );
      setAiCreateMode(null);
      if (tab === "text-to-image" || tab === "image-edit") {
        const mockUrl = "/demo-text-to-image-result.png";
        setNodes((prev) => {
          const next = prev.map((n) => {
            if (n.id !== targetId)
              return n;
            return { ...n, raw: { status: "init" }, url: "", selected: false };
          });
          nodesRef.current = next;
          return next;
        });
        collab.updateNodes([{ nodeId: targetId, updates: { raw: { status: "init" }, url: "" } }], true);
        setTimeout(() => {
          reactFlowInstanceRef.current?.fitView({
            nodes: [{ id: targetId }],
            padding: 0.4,
            maxZoom: 1.2,
            duration: 400
          });
        }, 100);
        setTimeout(() => {
          setNodes((prev) => {
            const next = prev.map((n) => {
              if (n.id !== targetId)
                return n;
              return { ...n, raw: { status: "success" }, url: mockUrl, thumbnailUrl: mockUrl };
            });
            nodesRef.current = next;
            return next;
          });
          collab.updateNodes([{
            nodeId: targetId,
            updates: { raw: { status: "success" }, url: mockUrl, thumbnailUrl: mockUrl }
          }], true);
        }, 2e3);
      }
    },
    onVideoSubmit: (tab, state) => {
      if (!aiCreateMode)
        return;
      const targetId = aiCreateMode.nodeId;
      widgetBridge.emit(
        createWidgetEvent(
          "CANVAS_CREATE_ACTION",
          {
            actionId: tab,
            nodeId: targetId,
            prompt: state.prompt,
            aspectRatio: state.aspectRatio,
            resolution: state.resolution,
            duration: state.duration,
            firstFrameUrl: state.firstFrameUrl || void 0,
            endFrameUrl: state.endFrameUrl || void 0,
            sourceVideoUrl: state.sourceVideoUrl || void 0
          },
          { source: "ui" }
        )
      );
      setAiCreateMode(null);
    },
    onDismiss: () => setAiCreateMode(null),
    onUploadReference: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent("CANVAS_CREATE_ACTION", { actionId: "upload-reference", nodeId }, { source: "ui" })
      );
    },
    onUploadFirstFrame: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent("CANVAS_CREATE_ACTION", { actionId: "upload-first-frame", nodeId }, { source: "ui" })
      );
    },
    onUploadEndFrame: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent("CANVAS_CREATE_ACTION", { actionId: "upload-end-frame", nodeId }, { source: "ui" })
      );
    },
    onUploadMedia: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent("CANVAS_CREATE_ACTION", { actionId: "upload-media", nodeId }, { source: "ui" })
      );
    },
    onSelectFromBoard: (nodeId) => {
      widgetBridge.emit(
        createWidgetEvent("CANVAS_NAVIGATE", { target: "board-select", context: "image-edit", nodeId }, { source: "ui" })
      );
    },
    enterRemixMode: (nodeId, imageUrl) => {
      setAiCreateMode({
        type: "ai-image",
        subActionId: "image-edit",
        nodeId,
        prompt: "",
        referenceImageUrl: imageUrl
      });
    }
  }), [aiCreateMode, userCredits]);
  return /* @__PURE__ */ jsxs(
    "main",
    {
      className,
      style: {
        position: "relative",
        width: "inherit",
        height: "inherit",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style
      },
      onContextMenu: isViewer ? (event) => event.preventDefault() : void 0,
      children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              position: "absolute",
              top: 0,
              left: 64,
              right: 0,
              height: 48,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              background: "rgba(17,17,19,0.75)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", gap: 4 }, children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    console.log("Board menu");
                  },
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: "none",
                    padding: "8px 4px",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "opacity 0.2s"
                  },
                  children: [
                    "My First Board",
                    /* @__PURE__ */ jsx(ChevronDown, { size: 14, color: "rgba(255,255,255,0.6)" })
                  ]
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                /* @__PURE__ */ jsxs("div", { ref: layoutPanelRef, style: { position: "relative" }, children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      title: "Layout",
                      onMouseDown: (e) => e.stopPropagation(),
                      onClick: (e) => {
                        e.stopPropagation();
                        setLayoutPanelOpen((prev) => !prev);
                      },
                      style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 30,
                        background: layoutPanelOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                        border: "none",
                        borderRadius: 6,
                        color: "#FFFFFF",
                        cursor: "pointer",
                        transition: "background 0.15s"
                      },
                      onMouseEnter: (e) => {
                        if (!layoutPanelOpen)
                          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                      },
                      onMouseLeave: (e) => {
                        if (!layoutPanelOpen)
                          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      },
                      children: /* @__PURE__ */ jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                        /* @__PURE__ */ jsx("path", { d: "M18 6L6 18" }),
                        /* @__PURE__ */ jsx("path", { d: "M8 4H4v4" }),
                        /* @__PURE__ */ jsx("path", { d: "M20 16v4h-4" }),
                        /* @__PURE__ */ jsx("rect", { x: "2", y: "2", width: "20", height: "20", rx: "2" })
                      ] })
                    }
                  ),
                  layoutPanelOpen && /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: 8,
                        width: 240,
                        padding: 16,
                        background: FLOW_UI.panelBg,
                        border: `1px solid ${FLOW_UI.panelBorder}`,
                        borderRadius: 12,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        zIndex: 100,
                        userSelect: "none"
                      },
                      children: [
                        /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: FLOW_UI.panelText, marginBottom: 12 }, children: "Layout" }),
                        /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }, children: [
                          { id: "grid", label: "Grid", icon: /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                            /* @__PURE__ */ jsx("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }),
                            /* @__PURE__ */ jsx("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }),
                            /* @__PURE__ */ jsx("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }),
                            /* @__PURE__ */ jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })
                          ] }) },
                          { id: "split", label: "Split", icon: /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                            /* @__PURE__ */ jsx("rect", { x: "3", y: "3", width: "7", height: "18", rx: "1" }),
                            /* @__PURE__ */ jsx("rect", { x: "14", y: "3", width: "7", height: "18", rx: "1" })
                          ] }) },
                          { id: "grouped", label: "Grouped", icon: /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                            /* @__PURE__ */ jsx("rect", { x: "3", y: "3", width: "18", height: "7", rx: "1" }),
                            /* @__PURE__ */ jsx("rect", { x: "3", y: "14", width: "8", height: "7", rx: "1" }),
                            /* @__PURE__ */ jsx("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })
                          ] }) },
                          { id: "canvas", label: "Canvas", icon: /* @__PURE__ */ jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                            /* @__PURE__ */ jsx("path", { d: "M18 6L6 18" }),
                            /* @__PURE__ */ jsx("path", { d: "M8 4H4v4" }),
                            /* @__PURE__ */ jsx("path", { d: "M20 16v4h-4" }),
                            /* @__PURE__ */ jsx("rect", { x: "2", y: "2", width: "20", height: "20", rx: "2" })
                          ] }) }
                        ].map((mode) => {
                          const isActive = mode.id === "canvas";
                          return /* @__PURE__ */ jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                setLayoutPanelOpen(false);
                                if (mode.id !== "canvas") {
                                  widgetBridge.emit(
                                    createWidgetEvent("CANVAS_LAYOUT_CHANGE", { layout: mode.id }, { source: "ui" })
                                  );
                                }
                              },
                              style: {
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 4,
                                padding: "8px 4px",
                                border: "none",
                                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                                color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                                borderRadius: 8,
                                cursor: mode.id === "canvas" ? "default" : "pointer",
                                fontSize: 10,
                                fontWeight: 500,
                                transition: "background 120ms ease, color 120ms ease"
                              },
                              onMouseEnter: (e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                  e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                                }
                              },
                              onMouseLeave: (e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = "transparent";
                                  e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                                }
                              },
                              children: [
                                mode.icon,
                                /* @__PURE__ */ jsx("span", { children: mode.label })
                              ]
                            },
                            mode.id
                          );
                        }) })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      height: 30,
                      padding: "0 12px",
                      background: "#3643FF",
                      border: "none",
                      borderRadius: 6,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s"
                    },
                    children: [
                      /* @__PURE__ */ jsx(UserPlus, { size: 15 }),
                      "Share"
                    ]
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1, position: "relative", paddingTop: 48 }, ref: canvasRef, children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `tc-canvas-loading-overlay${canvasReady ? " tc-canvas-loading-overlay--hidden" : ""}`,
              "aria-hidden": canvasReady,
              children: /* @__PURE__ */ jsx("div", { className: "tc-canvas-loading-spinner" })
            }
          ),
          sessionBlocked && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                inset: 0,
                zIndex: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)"
              },
              children: /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    width: "min(520px, 92vw)",
                    borderRadius: 16,
                    padding: "24px 22px",
                    background: "rgba(15, 18, 22, 0.92)",
                    border: `1px solid ${FLOW_UI.panelBorder}`,
                    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.35)",
                    color: "#e2e8f0",
                    textAlign: "center"
                  },
                  children: [
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 18, fontWeight: 600, marginBottom: 10 }, children: "Session Ended" }),
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 14, lineHeight: 1.5, color: "#cbd5f5", marginBottom: 18 }, children: sessionBlocked.message }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          setSessionBlocked(null);
                          collab.reconnect();
                        },
                        style: {
                          minWidth: 160,
                          padding: "10px 16px",
                          borderRadius: 999,
                          border: "1px solid rgba(148,163,184,0.35)",
                          background: "linear-gradient(135deg, rgba(94,234,212,0.2), rgba(56,189,248,0.25))",
                          color: "#e2e8f0",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer"
                        },
                        children: "Re-enter Session"
                      }
                    )
                  ]
                }
              )
            }
          ),
          toasts.length > 0 && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 60,
                display: "flex",
                flexDirection: "column",
                gap: 8
              },
              children: toasts.map((toast) => /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: toast.variant === "error" ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${FLOW_UI.panelBorder}`,
                    color: toast.variant === "error" ? "#fecaca" : "#e2e8f0",
                    fontSize: 13,
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)"
                  },
                  children: toast.message
                },
                toast.id
              ))
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                transformOrigin: "0 0",
                zIndex: 55
              },
              children: Array.from(collab.presences.entries()).map(([id, presence]) => {
                const cursor = resolvePresenceCursor(presence);
                if (id === userId || !cursor) {
                  return null;
                }
                const color = presence.color || "#5ad37b";
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      left: cursor.x,
                      top: cursor.y
                    },
                    children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          transform: `translate(6px, 6px) scale(${1 / viewport.zoom})`,
                          transformOrigin: "0 0"
                        },
                        children: /* @__PURE__ */ jsxs(
                          "div",
                          {
                            style: {
                              display: "inline-flex",
                              alignItems: "flex-start",
                              gap: 6
                            },
                            children: [
                              /* @__PURE__ */ jsx(
                                EditModeIcon,
                                {
                                  size: 16,
                                  style: { flex: "0 0 auto", color, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }
                                }
                              ),
                              /* @__PURE__ */ jsx(
                                "div",
                                {
                                  style: {
                                    marginTop: 6,
                                    padding: "3px 8px",
                                    borderRadius: 999,
                                    background: "rgba(15, 18, 22, 0.92)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    lineHeight: "16px",
                                    color,
                                    whiteSpace: "nowrap",
                                    boxShadow: "0 8px 18px rgba(0,0,0,0.35)"
                                  },
                                  children: presence.userName || id
                                }
                              )
                            ]
                          }
                        )
                      }
                    )
                  },
                  id
                );
              })
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                transformOrigin: "0 0",
                zIndex: 10
                // 在画布上方,光标下方
              },
              children: Array.from(collab.lockedNodes.entries()).map(([nodeId, lockUserId]) => {
                const node = nodes.find((n) => n.id === nodeId);
                const lockUser = collab.presences.get(lockUserId);
                if (!node || lockUserId === userId)
                  return null;
                const lockColor = lockUser?.color || "#ef4444";
                const lockName = lockUser?.userName || lockUserId;
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      position: "absolute",
                      left: node.position.x,
                      top: node.position.y,
                      width: node.size.width,
                      height: node.size.height,
                      border: `3px solid ${lockColor}`,
                      borderRadius: 8,
                      boxShadow: `0 0 0 1px rgba(255,255,255,0.5), 0 0 12px ${lockColor}`
                    },
                    children: /* @__PURE__ */ jsxs(
                      "div",
                      {
                        style: {
                          position: "absolute",
                          top: -28,
                          left: 0,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: lockColor,
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                        },
                        children: [
                          lockName,
                          " is editing"
                        ]
                      }
                    )
                  },
                  nodeId
                );
              })
            }
          ),
          /* @__PURE__ */ jsxs(
            "aside",
            {
              className: "tc-sidebar-b",
              onPointerDown: (e) => e.stopPropagation(),
              style: {
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 51,
                display: "flex",
                flexDirection: "column",
                background: isImmersiveModalOpen ? "#2D2D30" : void 0,
                userSelect: "none",
                transition: "background 200ms ease"
              },
              children: [
                /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: 56, flexShrink: 0 }, children: topBarLogoUrl ? /* @__PURE__ */ jsx("img", { alt: "Logo", src: topBarLogoUrl, style: { width: 28, height: 28, objectFit: "contain" } }) : /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "28", height: "28", viewBox: "0 0 210 210", fill: "none", children: /* @__PURE__ */ jsx("path", { d: "M162 0C188.51 0 210 21.4905 210 48V162C210 188.51 188.51 210 162 210H48C21.4903 210 0 188.51 0 162V48C0.000166991 21.4905 21.4904 0 48 0H162ZM161.586 69.124C161.556 69.1758 134.717 116.108 128.961 116.008C123.202 115.907 110.372 90.457 110.372 90.457C110.28 90.6044 84.343 131.966 79.5771 132.879C74.8031 133.799 74.6333 114.812 66.125 114.416C57.6174 114.013 36.9155 152.357 36.9111 152.365L46.6514 168.272L70.5635 132.722C70.5732 132.751 76.9933 152.315 89.2393 153.278C101.495 154.242 119.117 120.336 119.117 120.336C119.117 120.336 130.48 143.758 138.443 146.644C146.396 149.531 176.822 95.2796 176.911 95.1211L161.586 69.124ZM77.7305 36.3477C77.7303 52.0516 65.3453 64.9004 50.209 64.9004C65.3454 64.9004 77.7305 77.7491 77.7305 93.4531C77.7305 77.7491 90.1145 64.9004 105.251 64.9004C90.1146 64.9004 77.7306 52.0516 77.7305 36.3477Z", fill: "white" }) }) }),
                /* @__PURE__ */ jsx("nav", { style: { flex: 1, overflowY: "auto", overflowX: "hidden", padding: 8 }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [
                  canEdit && /* @__PURE__ */ jsxs(
                    SidebarNavBtn,
                    {
                      "aria-label": "Board",
                      disabled: isLocked,
                      onClick: () => widgetBridge.emit(createWidgetEvent("CANVAS_NAVIGATE", { target: "board" }, { source: "ui" })),
                      children: [
                        /* @__PURE__ */ jsx(Frame, { style: { width: 20, height: 20, flexShrink: 0, color: "#D4D4D4" } }),
                        /* @__PURE__ */ jsx("span", { style: NAV_LABEL_STYLE, children: "Board" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { style: { margin: "8px 0", display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "40", height: "1", viewBox: "0 0 40 1", fill: "none", children: [
                    /* @__PURE__ */ jsx("path", { d: "M0 0.25H40", stroke: "url(#sb-nav-sep)", strokeWidth: "0.5" }),
                    /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "sb-nav-sep", x1: "0", y1: "0.75", x2: "40", y2: "0.75", gradientUnits: "userSpaceOnUse", children: [
                      /* @__PURE__ */ jsx("stop", { stopColor: "white", stopOpacity: "0" }),
                      /* @__PURE__ */ jsx("stop", { offset: "0.5", stopColor: "white" }),
                      /* @__PURE__ */ jsx("stop", { offset: "1", stopColor: "white", stopOpacity: "0" })
                    ] }) })
                  ] }) }),
                  [
                    {
                      key: "image",
                      title: "Image",
                      Icon: Image$1,
                      items: [
                        { id: "text-to-image", label: "Text to Image", Icon: Type, demoDisabled: false },
                        { id: "image-edit", label: "Image Edit", Icon: PenTool, demoDisabled: false },
                        { id: "inpaint", label: "Inpaint", Icon: Paintbrush, demoDisabled: false },
                        { id: "image-character-swap", label: "Image Character Swap", Icon: Repeat, demoDisabled: true },
                        { id: "image-face-swap", label: "Image Face Swap", Icon: Smile, demoDisabled: true },
                        { id: "image-upscale", label: "Image Upscale", Icon: Maximize2, demoDisabled: false },
                        { id: "photo-angle-editor", label: "Photo Angle Editor", Icon: Rotate3d, demoDisabled: true },
                        { id: "product-photography", label: "Product Photography", Icon: Camera, demoDisabled: false }
                      ],
                      actionType: "ai-image"
                    },
                    {
                      key: "video",
                      title: "Video",
                      Icon: Video,
                      items: [
                        { id: "image-to-video", label: "Image to Video", Icon: ImagePlay, demoDisabled: false },
                        { id: "text-to-video", label: "Text to Video", Icon: Type, demoDisabled: false },
                        { id: "omni-reference", label: "Omni Reference", Icon: Wand2, demoDisabled: true },
                        { id: "video-character-swap", label: "Video Character Swap", Icon: Repeat, demoDisabled: true },
                        { id: "video-upscale", label: "Video Upscale", Icon: MoveDiagonal, demoDisabled: false },
                        { id: "motion-control", label: "Motion Control", Icon: PersonStanding, demoDisabled: true }
                      ],
                      actionType: "ai-video"
                    },
                    {
                      key: "avatar",
                      title: "Avatar",
                      Icon: User,
                      items: [
                        { id: "ai-avatar", label: "AI Avatar", Icon: CircleUser, demoDisabled: false },
                        { id: "product-avatar", label: "Product Avatar", Icon: ShoppingBag, demoDisabled: false },
                        { id: "design-avatar", label: "Design My Avatar", Icon: UserPen, demoDisabled: false },
                        { id: "video-lip-sync", label: "Video Lip Sync", Icon: MicVocal, demoDisabled: false }
                      ],
                      actionType: "ai-avatar"
                    },
                    {
                      key: "audio",
                      title: "Audio",
                      Icon: AudioLines,
                      items: [
                        { id: "voiceover", label: "Voiceover", Icon: Mic, demoDisabled: true }
                      ],
                      actionType: "ai-audio"
                    }
                  ].map((tool) => /* @__PURE__ */ jsx(
                    ToolbarItemWithMenu,
                    {
                      button: /* @__PURE__ */ jsxs(
                        SidebarNavBtn,
                        {
                          "aria-label": tool.title,
                          disabled: !canEdit || isLocked,
                          children: [
                            /* @__PURE__ */ jsx(tool.Icon, { style: { width: 18, height: 18, flexShrink: 0, color: "#D4D4D4" } }),
                            /* @__PURE__ */ jsx("span", { style: NAV_LABEL_STYLE, children: tool.title })
                          ]
                        }
                      ),
                      menu: /* @__PURE__ */ jsx("div", { children: tool.items.map((item) => /* @__PURE__ */ jsx(ToolbarMenuItem, { Icon: item.Icon, label: item.label, onClick: item.demoDisabled ? () => {
                      } : () => handlePlusAction(tool.actionType, item.id) }, item.id)) }),
                      disabled: !canEdit || isLocked
                    },
                    tool.key
                  ))
                ] }) }),
                /* @__PURE__ */ jsxs("div", { style: {
                  position: "relative",
                  zIndex: 10,
                  flexShrink: 0,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4
                }, children: [
                  /* @__PURE__ */ jsxs(SidebarFooterBtn, { "aria-label": "Promotion", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: "https://d1735p3aqhycef.cloudfront.net/topview/dc4c14f2aba1b71f8de715e760306463b4e4c2f1.png",
                        alt: "Promotion",
                        style: { width: 20, height: 20, display: "block" }
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { style: FOOTER_LABEL_STYLE, children: "47% OFF" })
                  ] }),
                  userCredits != null && /* @__PURE__ */ jsxs(SidebarFooterBtn, { "aria-label": "Credits", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: "https://d1735p3aqhycef.cloudfront.net/topview/ic_credit.svg",
                        alt: "Credits",
                        style: { width: 20, height: 20, display: "block", pointerEvents: "none" }
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { style: {
                      ...FOOTER_LABEL_STYLE,
                      fontSize: String(userCredits.toLocaleString()).length > 6 ? 8 : 10
                    }, children: userCredits.toLocaleString() }),
                    /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1, marginTop: 2 }, children: "Pro" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { style: { marginBottom: 10, display: "flex", justifyContent: "center" }, children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      "aria-label": "User profile",
                      onClick: () => widgetBridge.emit(createWidgetEvent("CANVAS_NAVIGATE", { target: "profile" }, { source: "ui" })),
                      style: {
                        width: 32,
                        height: 32,
                        padding: 0,
                        border: "none",
                        borderRadius: "50%",
                        cursor: "pointer",
                        overflow: "hidden",
                        background: "linear-gradient(to bottom right, #facc15, #fb923c, #ef4444, #a855f7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        transition: "opacity 0.15s"
                      },
                      onMouseEnter: (e) => {
                        e.currentTarget.style.opacity = "0.8";
                      },
                      onMouseLeave: (e) => {
                        e.currentTarget.style.opacity = "1";
                      },
                      children: userAvatarUrl ? /* @__PURE__ */ jsx("img", { src: userAvatarUrl, alt: "avatar", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsx("div", { style: { width: "100%", height: "100%", background: "linear-gradient(to bottom right, #facc15, #fb923c, #ef4444, #a855f7)", borderRadius: "50%" } })
                    }
                  ) })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: [
                inpaintFocus ? "tc-inpaint-active" : "",
                effectiveToolMode === "pan" ? "tc-pan-mode" : ""
              ].filter(Boolean).join(" ") || void 0,
              style: { width: "100%", height: "100%", marginLeft: 64 },
              onMouseMove: inpaintFocus?.step === "edit" ? (e) => {
                const el = document.getElementById("tc-brush-cursor");
                if (el) {
                  el.style.left = `${e.clientX}px`;
                  el.style.top = `${e.clientY}px`;
                  el.style.opacity = "1";
                }
              } : void 0,
              onMouseLeave: inpaintFocus?.step === "edit" ? () => {
                const el = document.getElementById("tc-brush-cursor");
                if (el)
                  el.style.opacity = "0";
              } : void 0,
              children: /* @__PURE__ */ jsx(AiCreateProvider, { value: aiCreateContextValue, children: /* @__PURE__ */ jsx(SelectModeProvider, { value: selectMode, children: /* @__PURE__ */ jsx(CanvasRoleProvider, { value: resolvedRole, children: /* @__PURE__ */ jsx(
                DependencyFocusProvider,
                {
                  value: { activeNodeId: dependencyFocusNodeId, toggleNode: toggleDependencyFocus },
                  children: /* @__PURE__ */ jsx(
                    InfiniteCanvas,
                    {
                      nodes,
                      edges: dependencyEdges,
                      onNodesChange: handleNodesChange,
                      backgroundColor,
                      onPaneClick: handlePaneClick,
                      onNodeClick: tryActivatePlaceholderPanel,
                      onNodeDragStart: handleNodeDragStart,
                      onNodeDrag: handleNodeDrag,
                      onNodeDragEnd: handleNodeDragEnd,
                      onNodeContextMenu: canEdit ? handleNodeContextMenu : void 0,
                      onPaneContextMenu: handlePaneContextMenu,
                      onPaneMouseMove: handlePaneMouseMove,
                      onViewportChange: handleViewportChange,
                      paneCursor: isLocked ? "not-allowed" : effectiveToolMode === "pan" ? "grab" : effectiveActiveTool === "text" ? "text" : "default",
                      nodesDraggable: !isLocked && effectiveToolMode === "edit" && !inpaintFocus && (!aiCreateMode || aiCreateMode.subActionId === "text-to-image" || aiCreateMode.subActionId === "image-edit"),
                      elementsSelectable: !isLocked && !inpaintFocus && (!aiCreateMode || aiCreateMode.subActionId === "text-to-image" || aiCreateMode.subActionId === "image-edit"),
                      selectionOnDrag: !isLocked && effectiveToolMode === "edit" && !inpaintFocus && (!aiCreateMode || aiCreateMode.subActionId === "text-to-image" || aiCreateMode.subActionId === "image-edit"),
                      panOnDrag: isLocked ? [] : effectiveToolMode === "pan" ? [0, 1, 2] : [1],
                      onLockChange: setIsLocked,
                      isLocked,
                      showControls: false,
                      config: canvasConfig,
                      width,
                      height,
                      minWidth,
                      minHeight,
                      onReactFlowInit: (instance) => {
                        reactFlowInstanceRef.current = instance;
                        setIsFlowReady(true);
                      }
                    }
                  )
                }
              ) }) }) })
            }
          ),
          inpaintFocus && (() => {
            const focusedNode = nodes.find((n) => n.id === inpaintFocus.nodeId);
            if (!focusedNode)
              return null;
            const handleInpaintSubmit = () => {
              if (!inpaintFocus.prompt.trim())
                return;
              widgetBridge.emit(
                createWidgetEvent(
                  "NODE_QUICK_ACTION",
                  {
                    nodeId: inpaintFocus.nodeId,
                    actionId: "inpaint",
                    actionLabel: "Inpaint",
                    prompt: inpaintFocus.prompt,
                    maskTool: inpaintFocus.maskTool,
                    brushSize: inpaintFocus.brushSize
                  },
                  { source: "inpaint-toolbar" }
                )
              );
            };
            const maskBtnStyle = (active) => ({
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: active ? "rgba(88,87,253,0.3)" : "transparent",
              color: active ? "#a5b4fc" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 100ms ease"
            });
            const brushDiameter = inpaintFocus.brushSize * viewport.zoom;
            return /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  id: "tc-brush-cursor",
                  style: {
                    position: "fixed",
                    width: brushDiameter,
                    height: brushDiameter,
                    borderRadius: "50%",
                    border: "2px solid #facc15",
                    pointerEvents: "none",
                    zIndex: 9999,
                    transform: "translate(-50%, -50%)",
                    opacity: 0,
                    transition: "width 80ms ease, height 80ms ease",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.3)"
                  }
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  ref: inpaintToolbarRef,
                  onClick: (e) => e.stopPropagation(),
                  onPointerDownCapture: (e) => e.stopPropagation(),
                  onMouseDownCapture: (e) => e.stopPropagation(),
                  onMouseMove: (e) => {
                    const el = document.getElementById("tc-brush-cursor");
                    if (el) {
                      el.style.left = `${e.clientX}px`;
                      el.style.top = `${e.clientY}px`;
                      el.style.opacity = "1";
                    }
                  },
                  style: {
                    position: "fixed",
                    left: 0,
                    top: 0,
                    transform: "translateX(-50%) translateY(-100%)",
                    willChange: "left, top",
                    cursor: "default",
                    zIndex: 42,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    padding: "4px 6px",
                    borderRadius: 14,
                    background: FLOW_UI.panelBg,
                    border: `1px solid ${FLOW_UI.panelBorder}`,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    pointerEvents: "auto"
                  },
                  children: [
                    /* @__PURE__ */ jsx("button", { type: "button", title: "Brush", onClick: () => setInpaintFocus((p) => p ? { ...p, maskTool: "brush" } : p), style: maskBtnStyle(inpaintFocus.maskTool === "brush"), children: /* @__PURE__ */ jsx(Paintbrush, { size: 15 }) }),
                    /* @__PURE__ */ jsx("button", { type: "button", title: "Eraser", onClick: () => setInpaintFocus((p) => p ? { ...p, maskTool: "eraser" } : p), style: maskBtnStyle(inpaintFocus.maskTool === "eraser"), children: /* @__PURE__ */ jsx(Eraser, { size: 15 }) }),
                    /* @__PURE__ */ jsx("div", { style: { width: 1, height: 18, background: FLOW_UI.divider, margin: "0 3px" } }),
                    /* @__PURE__ */ jsx("input", { type: "range", min: 5, max: 80, value: inpaintFocus.brushSize, onChange: (e) => setInpaintFocus((p) => p ? { ...p, brushSize: Number(e.target.value) } : p), style: { width: 72, accentColor: "#5857FD" } }),
                    /* @__PURE__ */ jsx("div", { style: { width: 1, height: 18, background: FLOW_UI.divider, margin: "0 3px" } }),
                    /* @__PURE__ */ jsx("button", { type: "button", title: "Undo", onClick: () => {
                      widgetBridge.emit(createWidgetEvent("INPAINT_MASK_ACTION", { action: "undo" }, { source: "ui" }));
                    }, style: maskBtnStyle(false), children: /* @__PURE__ */ jsx(Undo2, { size: 15 }) }),
                    /* @__PURE__ */ jsx("button", { type: "button", title: "Redo", onClick: () => {
                      widgetBridge.emit(createWidgetEvent("INPAINT_MASK_ACTION", { action: "redo" }, { source: "ui" }));
                    }, style: maskBtnStyle(false), children: /* @__PURE__ */ jsx(Redo2, { size: 15 }) }),
                    /* @__PURE__ */ jsx("div", { style: { width: 1, height: 18, background: FLOW_UI.divider, margin: "0 3px" } }),
                    /* @__PURE__ */ jsx("button", { type: "button", title: "Done", onClick: () => setInpaintFocus(null), style: { ...maskBtnStyle(false), color: "rgba(255,255,255,0.7)" }, children: /* @__PURE__ */ jsx(Check, { size: 15 }) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: (e) => e.stopPropagation(),
                  onMouseMove: (e) => {
                    const el = document.getElementById("tc-brush-cursor");
                    if (el) {
                      el.style.left = `${e.clientX}px`;
                      el.style.top = `${e.clientY}px`;
                      el.style.opacity = "1";
                    }
                  },
                  style: {
                    position: "absolute",
                    bottom: 64,
                    left: "calc(50% + 32px)",
                    transform: "translateX(-50%)",
                    width: Math.min(440, typeof window !== "undefined" ? window.innerWidth - 160 : 440),
                    zIndex: 42,
                    borderRadius: 14,
                    background: FLOW_UI.panelBg,
                    border: `1px solid ${FLOW_UI.panelBorder}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    display: "flex",
                    flexDirection: "column",
                    userSelect: "none",
                    overflow: "hidden",
                    cursor: "default"
                  },
                  children: [
                    /* @__PURE__ */ jsxs("div", { style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)"
                    }, children: [
                      /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: "#fff" }, children: "Inpaint" }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => setInpaintFocus(null),
                          style: {
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            border: "none",
                            background: "transparent",
                            color: "rgba(255,255,255,0.4)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          },
                          children: /* @__PURE__ */ jsx(X, { size: 14 })
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { style: { padding: "12px", display: "flex", flexDirection: "column", gap: 12 }, children: [
                      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-start" }, children: [
                        /* @__PURE__ */ jsx("div", { style: { width: 64, height: 64, flexShrink: 0 }, children: /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => {
                              widgetBridge.emit(createWidgetEvent("INPAINT_UPLOAD_REFERENCE", { nodeId: inpaintFocus.nodeId, slotIndex: 0 }, { source: "ui" }));
                            },
                            style: {
                              width: "100%",
                              height: "100%",
                              borderRadius: 8,
                              border: "none",
                              background: "rgba(255,255,255,0.04)",
                              color: "rgba(255,255,255,0.3)",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                              fontSize: 10,
                              fontWeight: 500,
                              transition: "background 120ms ease",
                              position: "relative",
                              overflow: "hidden"
                            },
                            onMouseEnter: (e) => {
                              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                            },
                            onMouseLeave: (e) => {
                              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                            },
                            children: inpaintFocus.uploadedImageUrl ? /* @__PURE__ */ jsx(
                              "img",
                              {
                                src: inpaintFocus.uploadedImageUrl,
                                alt: "Reference",
                                style: { width: "100%", height: "100%", objectFit: "cover" }
                              }
                            ) : /* @__PURE__ */ jsxs(Fragment, { children: [
                              /* @__PURE__ */ jsx(Plus, { size: 18, style: { opacity: 0.4 } }),
                              /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.2)" }, children: "Reference" })
                            ] })
                          }
                        ) }),
                        /* @__PURE__ */ jsx(
                          "textarea",
                          {
                            placeholder: "Describe what you want to change, or enter a prompt for the masked area",
                            value: inpaintFocus.prompt,
                            onChange: (e) => setInpaintFocus((prev) => prev ? { ...prev, prompt: e.target.value } : prev),
                            onKeyDown: (e) => {
                              if (e.key === "Enter" && !e.shiftKey && inpaintFocus.prompt.trim()) {
                                e.preventDefault();
                                handleInpaintSubmit();
                              }
                            },
                            style: {
                              flex: 1,
                              height: 64,
                              padding: "4px 0",
                              border: "none",
                              background: "transparent",
                              color: "#fff",
                              fontSize: 14,
                              lineHeight: "20px",
                              resize: "none",
                              fontFamily: "inherit",
                              outline: "none",
                              boxShadow: "none"
                            },
                            className: "tc-inpaint-textarea"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "flex-end" }, children: /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: inpaintFocus.prompt.trim() ? handleInpaintSubmit : void 0,
                          style: {
                            padding: "0 20px",
                            height: 32,
                            borderRadius: 8,
                            border: "none",
                            background: inpaintFocus.prompt.trim() ? "#fff" : "rgba(255,255,255,0.08)",
                            color: inpaintFocus.prompt.trim() ? "#000" : "rgba(255,255,255,0.3)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: inpaintFocus.prompt.trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "all 120ms ease",
                            boxShadow: inpaintFocus.prompt.trim() ? "0 2px 8px rgba(255,255,255,0.15)" : "none"
                          },
                          children: [
                            /* @__PURE__ */ jsx(Crown, { size: 14, color: inpaintFocus.prompt.trim() ? "#000" : "currentColor" }),
                            /* @__PURE__ */ jsx("span", { children: "Generate" })
                          ]
                        }
                      ) })
                    ] })
                  ]
                }
              )
            ] });
          })(),
          aiCreateMode && (() => {
            const placeholderNode = nodes.find((n) => n.id === aiCreateMode.nodeId);
            if (!placeholderNode)
              return null;
            const aiCanvasOffsetX = 64;
            const screenX = placeholderNode.position.x * viewport.zoom + viewport.x + aiCanvasOffsetX;
            const screenY = placeholderNode.position.y * viewport.zoom + viewport.y;
            const screenW = placeholderNode.size.width * viewport.zoom;
            const screenH = placeholderNode.size.height * viewport.zoom;
            const useNewPanel = aiCreateMode.subActionId === "text-to-image" || aiCreateMode.subActionId === "image-edit" || aiCreateMode.type === "ai-video";
            if (useNewPanel)
              return null;
            const isImage = aiCreateMode.type === "ai-image";
            const isAvatar = aiCreateMode.type === "ai-avatar";
            const isAudio = aiCreateMode.type === "ai-audio";
            return /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  onClick: () => {
                    setAiCreateMode(null);
                  },
                  style: { position: "absolute", inset: 0, zIndex: 39 }
                }
              ),
              /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    position: "absolute",
                    left: screenX - 2,
                    top: screenY - 2,
                    width: screenW + 4,
                    height: screenH + 4,
                    zIndex: 41,
                    border: "2px solid #5857FD",
                    pointerEvents: "none"
                  }
                }
              ),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: (e) => e.stopPropagation(),
                  style: {
                    position: "absolute",
                    left: screenX + screenW / 2 - 260,
                    top: screenY + screenH + 12,
                    width: 520,
                    zIndex: 42,
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: FLOW_UI.panelBg,
                    border: `1px solid ${FLOW_UI.panelBorder}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10
                  },
                  children: [
                    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          style: {
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: isImage ? "rgba(88,87,253,0.15)" : isAvatar ? "rgba(20,184,166,0.15)" : isAudio ? "rgba(245,158,11,0.15)" : "rgba(236,72,153,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          },
                          children: isImage ? /* @__PURE__ */ jsx(ImagePlus, { size: 14, color: "#818cf8" }) : isAvatar ? /* @__PURE__ */ jsx(ScanFace, { size: 14, color: "#2dd4bf" }) : isAudio ? /* @__PURE__ */ jsx(Mic, { size: 14, color: "#fbbf24" }) : /* @__PURE__ */ jsx(Video, { size: 14, color: "#f472b6" })
                        }
                      ),
                      /* @__PURE__ */ jsx("span", { style: { color: "rgba(255,255,255,0.5)", fontSize: 13 }, children: aiCreateMode.subActionId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") })
                    ] }),
                    /* @__PURE__ */ jsx(
                      "textarea",
                      {
                        placeholder: isImage ? "Describe anything you want to generate" : isAvatar ? "Enter script for your avatar..." : isAudio ? "Enter text to generate audio..." : "Describe the video you want to create...",
                        value: aiCreateMode.prompt,
                        onChange: (e) => setAiCreateMode((prev) => prev ? { ...prev, prompt: e.target.value } : prev),
                        onKeyDown: (e) => {
                          if (e.key === "Enter" && !e.shiftKey && aiCreateMode.prompt.trim()) {
                            e.preventDefault();
                            widgetBridge.emit(createWidgetEvent("CANVAS_CREATE_ACTION", { actionId: aiCreateMode.subActionId, nodeId: aiCreateMode.nodeId, prompt: aiCreateMode.prompt }, { source: "ui" }));
                            setAiCreateMode(null);
                          }
                        },
                        autoFocus: true,
                        rows: 3,
                        style: {
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.04)",
                          color: "#fff",
                          fontSize: 13,
                          lineHeight: "1.5",
                          resize: "none",
                          fontFamily: "inherit"
                        },
                        className: "tc-textarea-input"
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" }, children: [
                      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 12 }, children: [
                        /* @__PURE__ */ jsx(Sparkles, { size: 14 }),
                        /* @__PURE__ */ jsx("span", { children: "14" })
                      ] }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            if (!aiCreateMode.prompt.trim())
                              return;
                            widgetBridge.emit(createWidgetEvent("CANVAS_CREATE_ACTION", { actionId: aiCreateMode.subActionId, nodeId: aiCreateMode.nodeId, prompt: aiCreateMode.prompt }, { source: "ui" }));
                            setAiCreateMode(null);
                          },
                          style: {
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            border: "none",
                            background: aiCreateMode.prompt.trim() ? isImage ? "linear-gradient(135deg, #5857FD, #8b5cf6)" : isAvatar ? "linear-gradient(135deg, #14b8a6, #2dd4bf)" : isAudio ? "linear-gradient(135deg, #f59e0b, #fbbf24)" : "linear-gradient(135deg, #ec4899, #f472b6)" : "rgba(255,255,255,0.06)",
                            color: aiCreateMode.prompt.trim() ? "#fff" : "rgba(255,255,255,0.25)",
                            cursor: aiCreateMode.prompt.trim() ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "background 150ms ease, color 150ms ease"
                          },
                          children: /* @__PURE__ */ jsx(ArrowUp, { size: 16 })
                        }
                      )
                    ] })
                  ]
                }
              )
            ] });
          })(),
          /* @__PURE__ */ jsx(
            ProductPhotographyModal,
            {
              open: ppModalState?.open ?? false,
              nodeId: ppModalState?.nodeId ?? "",
              initialState: ppModalState?.initialProductImageUrl ? { productImageUrl: ppModalState.initialProductImageUrl } : void 0,
              credits: userCredits ?? 25,
              onSubmit: (state) => {
                widgetBridge.emit(
                  createWidgetEvent(
                    "CANVAS_CREATE_ACTION",
                    {
                      actionId: "product-photography",
                      nodeId: ppModalState?.nodeId,
                      productImageUrl: state.productImageUrl,
                      productMaskDataUrl: state.productMaskDataUrl,
                      backgroundPrompt: state.backgroundPrompt,
                      backgroundImageUrl: state.backgroundImageUrl || void 0,
                      selectedTemplateId: state.selectedTemplateId,
                      ratio: state.ratio
                    },
                    { source: "ui" }
                  )
                );
                if (ppModalState?.nodeId) {
                  const targetId = ppModalState.nodeId;
                  const mockUrl = "/demo-product-photo-result.png";
                  ppGeneratingRef.current.add(targetId);
                  setNodes((prevNodes) => {
                    const next = prevNodes.map((n) => {
                      if (n.id !== targetId)
                        return n;
                      return {
                        ...n,
                        raw: { status: "init" },
                        url: ""
                      };
                    });
                    nodesRef.current = next;
                    return next;
                  });
                  collab.updateNodes([{ nodeId: targetId, updates: { raw: { status: "init" }, url: "" } }], true);
                  ppClosedAtRef.current = Date.now();
                  setPpModalState(null);
                  setNodes((prev) => {
                    const next = prev.map(
                      (n) => n.id === targetId ? { ...n, selected: false } : n
                    );
                    nodesRef.current = next;
                    return next;
                  });
                  setTimeout(() => {
                    const instance = reactFlowInstanceRef.current;
                    if (instance) {
                      instance.fitView({
                        nodes: [{ id: targetId }],
                        padding: 0.4,
                        maxZoom: 1.2,
                        duration: 400
                      });
                    }
                  }, 100);
                  setTimeout(() => {
                    setNodes((prevNodes) => {
                      const next = prevNodes.map((n) => {
                        if (n.id !== targetId)
                          return n;
                        return {
                          ...n,
                          raw: { status: "success" },
                          url: mockUrl,
                          thumbnailUrl: mockUrl
                        };
                      });
                      nodesRef.current = next;
                      return next;
                    });
                    collab.updateNodes([{
                      nodeId: targetId,
                      updates: {
                        raw: { status: "success" },
                        url: mockUrl,
                        thumbnailUrl: mockUrl
                      }
                    }], true);
                    ppGeneratingRef.current.delete(targetId);
                  }, 1500);
                } else {
                  setPpModalState(null);
                }
              },
              onClose: () => {
                const closingNodeId = ppModalState?.nodeId;
                ppClosedAtRef.current = Date.now();
                setPpModalState(null);
                if (closingNodeId) {
                  setNodes((prev) => {
                    const next = prev.map(
                      (n) => n.id === closingNodeId ? { ...n, selected: false } : n
                    );
                    nodesRef.current = next;
                    return next;
                  });
                }
              },
              onUploadProduct: () => {
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_CREATE_ACTION", { actionId: "upload-product", nodeId: ppModalState?.nodeId }, { source: "ui" })
                );
              },
              onSelectFromBoard: () => {
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_NAVIGATE", { target: "board-select", context: "product-photography", nodeId: ppModalState?.nodeId }, { source: "ui" })
                );
              }
            }
          ),
          /* @__PURE__ */ jsx(
            InpaintTutorialModal,
            {
              open: inpaintTutorialOpen.open,
              initialImageUrl: inpaintTutorialOpen.initialImageUrl,
              onClose: () => setInpaintTutorialOpen({ open: false }),
              onSelectFromBoard: () => {
                setInpaintTutorialOpen({ open: false });
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_NAVIGATE", { target: "board-select", context: "inpaint" }, { source: "ui" })
                );
              },
              onSubmit: (data) => {
                setInpaintTutorialOpen({ open: false });
                widgetBridge.emit(
                  createWidgetEvent(
                    "CANVAS_CREATE_ACTION",
                    {
                      actionId: "inpaint",
                      imageUrl: data.imageUrl,
                      prompt: data.prompt,
                      maskTool: data.maskTool,
                      brushSize: data.brushSize
                    },
                    { source: "ui" }
                  )
                );
              }
            }
          ),
          /* @__PURE__ */ jsx(
            ImageUpscaleModal,
            {
              open: imageUpscaleOpen,
              credits: userCredits ?? 0.8,
              onClose: () => setImageUpscaleOpen(false),
              onSelectFromBoard: () => {
                setImageUpscaleOpen(false);
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_NAVIGATE", { target: "board-select", context: "image-upscale" }, { source: "ui" })
                );
              },
              onSubmit: (data) => {
                setImageUpscaleOpen(false);
                widgetBridge.emit(
                  createWidgetEvent(
                    "CANVAS_CREATE_ACTION",
                    {
                      actionId: "image-upscale",
                      imageUrl: data.imageUrl,
                      targetResolution: data.targetResolution,
                      withWatermark: data.withWatermark
                    },
                    { source: "ui" }
                  )
                );
              }
            }
          ),
          /* @__PURE__ */ jsx(
            VideoUpscaleModal,
            {
              open: videoUpscaleOpen,
              credits: userCredits ?? 0,
              onClose: () => setVideoUpscaleOpen(false),
              onSelectFromBoard: () => {
                setVideoUpscaleOpen(false);
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_NAVIGATE", { target: "board-select", context: "video-upscale" }, { source: "ui" })
                );
              },
              onSubmit: (data) => {
                setVideoUpscaleOpen(false);
                widgetBridge.emit(
                  createWidgetEvent(
                    "CANVAS_CREATE_ACTION",
                    {
                      actionId: "video-upscale",
                      videoUrl: data.videoUrl,
                      targetResolution: data.targetResolution
                    },
                    { source: "ui" }
                  )
                );
              }
            }
          ),
          /* @__PURE__ */ jsx(
            AIAvatarModal,
            {
              open: aiAvatarModal.open,
              credits: userCredits ?? 0,
              initialAvatarUrl: aiAvatarModal.initialAvatarUrl,
              modelPreviewVideoUrl,
              modelPreviewPosterUrl,
              onClose: () => setAiAvatarModal({ open: false }),
              onSubmit: (data) => {
                setAiAvatarModal({ open: false });
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_CREATE_ACTION", { ...data }, { source: "ui" })
                );
              },
              onSelectFromBoard: () => {
                setAiAvatarModal({ open: false });
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_NAVIGATE", { target: "board-select", context: "ai-avatar" }, { source: "ui" })
                );
              }
            }
          ),
          /* @__PURE__ */ jsx(
            VideoLipSyncModal,
            {
              open: lipSyncModal.open,
              credits: userCredits ?? 0,
              initialVideoUrl: lipSyncModal.initialVideoUrl,
              onClose: () => setLipSyncModal({ open: false }),
              onSubmit: (data) => {
                setLipSyncModal({ open: false });
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_CREATE_ACTION", { ...data }, { source: "ui" })
                );
              },
              onSelectFromBoard: () => {
                setLipSyncModal({ open: false });
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_NAVIGATE", { target: "board-select", context: "video-lip-sync" }, { source: "ui" })
                );
              }
            }
          ),
          /* @__PURE__ */ jsx(
            DesignMyAvatarModal,
            {
              open: designAvatarOpen,
              credits: userCredits ?? 2,
              onClose: () => setDesignAvatarOpen(false),
              onSubmit: (data) => {
                setDesignAvatarOpen(false);
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_CREATE_ACTION", { ...data }, { source: "ui" })
                );
              }
            }
          ),
          /* @__PURE__ */ jsx(
            ProductAvatarModal,
            {
              open: productAvatarModal.open,
              credits: userCredits ?? 0,
              initialProductImageUrl: productAvatarModal.initialProductImageUrl,
              onClose: () => setProductAvatarModal({ open: false }),
              onSubmit: (data) => {
                setProductAvatarModal({ open: false });
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_CREATE_ACTION", { ...data }, { source: "ui" })
                );
              },
              onSelectFromBoard: (context) => {
                setProductAvatarModal({ open: false });
                widgetBridge.emit(
                  createWidgetEvent("CANVAS_NAVIGATE", { target: "board-select", context: `product-avatar-${context}` }, { source: "ui" })
                );
              }
            }
          ),
          contextMenu && /* @__PURE__ */ jsxs(
            "div",
            {
              className: "widget-context-menu",
              style: {
                position: "fixed",
                left: contextMenu.x,
                top: contextMenu.y,
                zIndex: 200,
                background: "#1c1e22",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
                padding: 6,
                minWidth: 220,
                fontFamily: "Inter, -apple-system, sans-serif"
              },
              onClick: (event) => event.stopPropagation(),
              children: [
                /* @__PURE__ */ jsx("style", { children: `
                .widget-context-menu .ctx-item {
                  width: 100%;
                  text-align: left;
                  padding: 8px 12px;
                  border: none;
                  background: transparent;
                  cursor: pointer;
                  font-size: 13px;
                  font-weight: 400;
                  border-radius: 6px;
                  transition: background-color 100ms ease;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 24px;
                  color: rgba(255,255,255,0.9);
                }
                .widget-context-menu .ctx-item:disabled {
                  cursor: not-allowed;
                  color: rgba(255,255,255,0.3);
                }
                .widget-context-menu .ctx-item:not(:disabled):hover {
                  background: rgba(255,255,255,0.08);
                }
                .widget-context-menu .ctx-item.danger {
                  color: #ef4444;
                }
                .widget-context-menu .ctx-item.danger:not(:disabled):hover {
                  background: rgba(239, 68, 68, 0.12);
                }
                .widget-context-menu .ctx-shortcut {
                  font-size: 12px;
                  color: rgba(255,255,255,0.35);
                  white-space: nowrap;
                  font-weight: 400;
                }
                .widget-context-menu .ctx-divider {
                  height: 1px;
                  background: rgba(255,255,255,0.08);
                  margin: 4px 0;
                }
              ` }),
                contextMenu.type === "canvas" && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      className: "ctx-item",
                      disabled: true,
                      onClick: () => {
                        setContextMenu(null);
                      },
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Paste" }),
                        /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318V" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "ctx-divider" }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      className: "ctx-item",
                      onClick: () => {
                        reactFlowInstanceRef.current?.zoomIn({ duration: 200 });
                        setContextMenu(null);
                      },
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Zoom In" }),
                        /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318+" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      className: "ctx-item",
                      onClick: () => {
                        reactFlowInstanceRef.current?.zoomOut({ duration: 200 });
                        setContextMenu(null);
                      },
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Zoom Out" }),
                        /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u2212" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      className: "ctx-item",
                      onClick: () => {
                        reactFlowInstanceRef.current?.fitView({ padding: 0.15, duration: 300 });
                        setContextMenu(null);
                      },
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Zoom to Fit" }),
                        /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u23180" })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      className: "ctx-item",
                      onClick: () => {
                        reactFlowInstanceRef.current?.zoomTo(1, { duration: 200 });
                        setContextMenu(null);
                      },
                      children: [
                        /* @__PURE__ */ jsx("span", { children: "Zoom to 100%" }),
                        /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u23181" })
                      ]
                    }
                  )
                ] }),
                contextMenu.type === "node" && contextMenu.nodeId && (() => {
                  const nId = contextMenu.nodeId;
                  const targetNode = nodesRef.current.find((n) => n.id === nId);
                  const isHidden = targetNode?.hidden === true;
                  const isNodeLocked = targetNode?.draggable === false;
                  const layerInfo = getLayerInfo(nId);
                  return /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      widgetBridge.emit(createWidgetEvent("NODE_QUICK_ACTION", { nodeId: nId, actionId: "copy", actionLabel: "Copy" }, { source: "ui" }));
                      setContextMenu(null);
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Copy" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318C" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      widgetBridge.emit(createWidgetEvent("NODE_QUICK_ACTION", { nodeId: nId, actionId: "cut", actionLabel: "Cut" }, { source: "ui" }));
                      setContextMenu(null);
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Cut" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318X" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", disabled: true, children: [
                      /* @__PURE__ */ jsx("span", { children: "Paste" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318V" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: handleCloneNode, children: [
                      /* @__PURE__ */ jsx("span", { children: "Duplicate" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318D" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "ctx-divider" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", disabled: layerInfo.isTop, onClick: () => {
                      applyLayerAction(nId, "forward");
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Move up" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318]" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", disabled: layerInfo.isBottom, onClick: () => {
                      applyLayerAction(nId, "backward");
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Move down" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318[" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", disabled: layerInfo.isTop, onClick: () => {
                      applyLayerAction(nId, "front");
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Bring to front" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u21E7]" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", disabled: layerInfo.isBottom, onClick: () => {
                      applyLayerAction(nId, "back");
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Send to back" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u21E7[" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "ctx-divider" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      widgetBridge.emit(createWidgetEvent("NODE_QUICK_ACTION", { nodeId: nId, actionId: isHidden ? "show" : "hide", actionLabel: isHidden ? "Show" : "Hide" }, { source: "ui" }));
                      setContextMenu(null);
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: isHidden ? "Show" : "Hide" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u21E7H" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      widgetBridge.emit(createWidgetEvent("NODE_QUICK_ACTION", { nodeId: nId, actionId: isNodeLocked ? "unlock" : "lock", actionLabel: isNodeLocked ? "Unlock" : "Lock" }, { source: "ui" }));
                      setContextMenu(null);
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: isNodeLocked ? "Unlock" : "Lock" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u21E7L" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "ctx-divider" }),
                    /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
                      /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                        setContextMenu((prev) => prev ? { ...prev, exportSubmenuOpen: !prev.exportSubmenuOpen } : prev);
                      }, children: [
                        /* @__PURE__ */ jsx("span", { children: "Export" }),
                        /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: "rgba(255,255,255,0.4)" }, children: "\u203A" })
                      ] }),
                      contextMenu.exportSubmenuOpen && /* @__PURE__ */ jsx("div", { style: {
                        position: "absolute",
                        left: "100%",
                        top: 0,
                        marginLeft: 4,
                        background: "#1c1e22",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)",
                        padding: 6,
                        minWidth: 120,
                        zIndex: 10
                      }, children: ["PNG", "JPG", "SVG"].map((format) => /* @__PURE__ */ jsx("button", { type: "button", className: "ctx-item", onClick: () => {
                        widgetBridge.emit(createWidgetEvent("NODE_QUICK_ACTION", { nodeId: nId, actionId: "export", actionLabel: `Export ${format}`, format: format.toLowerCase() }, { source: "ui" }));
                        setContextMenu(null);
                      }, children: format }, format)) })
                    ] })
                  ] });
                })(),
                contextMenu.type === "multi-node" && contextMenu.nodeIds && (() => {
                  const count = contextMenu.nodeIds.length;
                  return /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsxs("div", { style: { padding: "6px 12px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500 }, children: [
                      count,
                      " items selected"
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "ctx-divider" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      handleBatchCopy();
                      setContextMenu(null);
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Copy" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318C" })
                    ] }),
                    /* @__PURE__ */ jsx("button", { type: "button", className: "ctx-item", onClick: () => {
                      handleBatchGroup();
                      setContextMenu(null);
                    }, disabled: count < 2, children: /* @__PURE__ */ jsx("span", { children: "Group" }) }),
                    /* @__PURE__ */ jsx("div", { className: "ctx-divider" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      handleBatchBringToFront();
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Bring to Front" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u21E7]" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      handleBatchSendToBack();
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Send to Back" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u21E7[" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "ctx-divider" }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      handleBatchLock();
                      setContextMenu(null);
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Lock All" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u21E7L" })
                    ] }),
                    /* @__PURE__ */ jsxs("button", { type: "button", className: "ctx-item", onClick: () => {
                      handleBatchHide();
                      setContextMenu(null);
                    }, children: [
                      /* @__PURE__ */ jsx("span", { children: "Hide All" }),
                      /* @__PURE__ */ jsx("span", { className: "ctx-shortcut", children: "\u2318\u21E7H" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "ctx-divider" }),
                    /* @__PURE__ */ jsx("button", { type: "button", className: "ctx-item", onClick: () => {
                      handleBatchDownload();
                      setContextMenu(null);
                    }, children: /* @__PURE__ */ jsx("span", { children: "Download All" }) })
                  ] });
                })()
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                position: "absolute",
                right: 16,
                bottom: 16,
                zIndex: 20,
                pointerEvents: "auto",
                display: inpaintFocus || aiCreateMode ? "none" : void 0,
                userSelect: "none"
              },
              children: layersPanelOpen && /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    marginBottom: 8,
                    width: 260,
                    maxHeight: 600,
                    borderRadius: 12,
                    background: FLOW_UI.panelBg,
                    border: `1px solid ${FLOW_UI.panelBorder}`,
                    boxShadow: FLOW_UI.panelShadow,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                  },
                  children: [
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        style: {
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom: `1px solid ${FLOW_UI.divider}`,
                          flexShrink: 0
                        },
                        children: [
                          /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 600, color: FLOW_UI.panelText }, children: "Layers" }),
                          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                            /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: FLOW_UI.panelTextMuted }, children: nodes.length }),
                            /* @__PURE__ */ jsx(
                              "button",
                              {
                                type: "button",
                                onClick: () => setLayersPanelOpen(false),
                                style: {
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 20,
                                  height: 20,
                                  borderRadius: 4,
                                  border: "none",
                                  background: "transparent",
                                  color: FLOW_UI.panelTextMuted,
                                  cursor: "pointer",
                                  padding: 0
                                },
                                children: /* @__PURE__ */ jsx(ChevronDown, { size: 14 })
                              }
                            )
                          ] })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          overflowY: "auto",
                          flex: 1,
                          padding: 4
                        },
                        children: (() => {
                          const sortedDesc = sortNodesByLayer(nodes).slice().reverse();
                          return sortedDesc.map((node, idx) => {
                            const raw = node.raw;
                            const thumbUrl = node.url || raw?.result?.compressedImage?.url || raw?.result?.originImage?.url || (node.type === "video" ? node.poster || raw?.result?.originVideo?.coverUrl || raw?.result?.originVideo?.url : null);
                            const isText = node.type === "text";
                            const isAudio = node.type === "audio";
                            const isVideo = node.type === "video";
                            const isDraft = Boolean(node.toolId && !node.url);
                            String(raw?.status ?? "").toLowerCase();
                            const typeName = `${(node.type ?? "image").charAt(0).toUpperCase()}${(node.type ?? "image").slice(1)}`;
                            const primaryLabel = raw?.title || typeName;
                            const label = primaryLabel;
                            const isDragging = layerDragId === node.id;
                            const isDragOver = layerDragOverId === node.id && layerDragId !== node.id;
                            return /* @__PURE__ */ jsxs(
                              "div",
                              {
                                draggable: true,
                                onDragStart: (e) => {
                                  setLayerDragId(node.id);
                                  e.dataTransfer.effectAllowed = "move";
                                },
                                onDragOver: (e) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = "move";
                                  setLayerDragOverId(node.id);
                                },
                                onDragLeave: () => {
                                  if (layerDragOverId === node.id)
                                    setLayerDragOverId(null);
                                },
                                onDrop: (e) => {
                                  e.preventDefault();
                                  if (!layerDragId || layerDragId === node.id) {
                                    setLayerDragId(null);
                                    setLayerDragOverId(null);
                                    return;
                                  }
                                  const fromIdx = sortedDesc.findIndex((n) => n.id === layerDragId);
                                  const toIdx = idx;
                                  if (fromIdx === -1 || fromIdx === toIdx) {
                                    setLayerDragId(null);
                                    setLayerDragOverId(null);
                                    return;
                                  }
                                  const reordered = [...sortedDesc];
                                  const [moved] = reordered.splice(fromIdx, 1);
                                  reordered.splice(toIdx, 0, moved);
                                  const newZMap = /* @__PURE__ */ new Map();
                                  reordered.forEach((n, i) => {
                                    newZMap.set(n.id, reordered.length - 1 - i);
                                  });
                                  setNodes(
                                    (prev) => prev.map((n) => ({
                                      ...n,
                                      zIndex: newZMap.get(n.id) ?? n.zIndex ?? 0
                                    }))
                                  );
                                  setLayerDragId(null);
                                  setLayerDragOverId(null);
                                },
                                onDragEnd: () => {
                                  setLayerDragId(null);
                                  setLayerDragOverId(null);
                                },
                                onClick: () => {
                                  setNodes(
                                    (prev) => prev.map((n) => ({
                                      ...n,
                                      selected: n.id === node.id
                                    }))
                                  );
                                  const instance = reactFlowInstanceRef.current;
                                  if (instance) {
                                    const rfNodes = instance.getNodes();
                                    const target = rfNodes.find((n) => n.id === node.id);
                                    if (target) {
                                      instance.fitView({ nodes: [target], padding: 0.3, duration: 300 });
                                    }
                                  }
                                  widgetBridge.emit(
                                    createWidgetEvent(
                                      "CANVAS_FOCUS_NODE",
                                      { nodeId: node.id },
                                      { source: "ui" }
                                    )
                                  );
                                },
                                style: {
                                  width: "100%",
                                  padding: "5px 6px",
                                  border: "none",
                                  background: isDragOver ? "rgba(88,87,253,0.15)" : node.selected ? "rgba(88,87,253,0.25)" : "transparent",
                                  color: FLOW_UI.panelText,
                                  fontSize: 12,
                                  textAlign: "left",
                                  borderRadius: 6,
                                  cursor: "grab",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  opacity: isDragging ? 0.4 : 1,
                                  transition: "background 100ms ease, opacity 100ms ease",
                                  borderTop: isDragOver ? "2px solid #5857FD" : "2px solid transparent"
                                },
                                onMouseEnter: (e) => {
                                  if (!node.selected && !isDragOver) {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                  }
                                },
                                onMouseLeave: (e) => {
                                  e.currentTarget.style.background = isDragOver ? "rgba(88,87,253,0.15)" : node.selected ? "rgba(88,87,253,0.25)" : "transparent";
                                },
                                children: [
                                  /* @__PURE__ */ jsx(
                                    "div",
                                    {
                                      style: {
                                        width: 36,
                                        height: 36,
                                        borderRadius: 4,
                                        overflow: "hidden",
                                        flexShrink: 0,
                                        background: "#2a2d32",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      },
                                      children: isDraft ? /* @__PURE__ */ jsx("span", { style: { fontSize: 14, opacity: 0.5, color: "#fff" }, children: "\u270F\uFE0F" }) : thumbUrl && !isText && !isAudio ? /* @__PURE__ */ jsx(
                                        "img",
                                        {
                                          src: thumbUrl,
                                          alt: "",
                                          draggable: false,
                                          style: {
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block"
                                          }
                                        }
                                      ) : /* @__PURE__ */ jsx("span", { style: { fontSize: 14, opacity: 0.5, color: "#fff" }, children: isVideo ? "\u25B6" : isAudio ? "\u266A" : isText ? "T" : "\u{1F5BC}" })
                                    }
                                  ),
                                  /* @__PURE__ */ jsxs(
                                    "span",
                                    {
                                      style: {
                                        flex: 1,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        lineHeight: "16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4
                                      },
                                      children: [
                                        isDraft && /* @__PURE__ */ jsx("span", { style: { fontSize: 11, flexShrink: 0 }, children: "\u270F\uFE0F" }),
                                        label
                                      ]
                                    }
                                  )
                                ]
                              },
                              node.id
                            );
                          });
                        })()
                      }
                    )
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(
            MultiSelectCornerHandles,
            {
              visible: !!(canEdit && !inpaintFocus && multiSelectInfo && multiSelectInfo.nodes.length >= 2)
            }
          ),
          /* @__PURE__ */ jsx(
            MultiSelectToolbar,
            {
              info: canEdit && !inpaintFocus ? multiSelectInfo : null,
              viewport,
              onBatchGroup: handleBatchGroup,
              onBatchCopy: handleBatchCopy,
              onBatchDownload: handleBatchDownload,
              onBatchLock: handleBatchLock,
              onBatchUnlock: handleBatchUnlock,
              onBatchHide: handleBatchHide,
              onBatchShow: handleBatchShow,
              onBatchBringToFront: handleBatchBringToFront,
              onBatchSendToBack: handleBatchSendToBack,
              onBatchExport: handleBatchExport,
              onAlign: handleAlign,
              onDistribute: handleDistribute,
              onAutoArrange: handleAutoArrange
            }
          ),
          /* @__PURE__ */ jsx(
            BottomToolbar,
            {
              visible: toolbarVisible,
              toolMode: effectiveToolMode,
              onToolModeChange: setToolMode,
              viewport,
              reactFlowInstance: reactFlowInstanceRef.current,
              layersPanelOpen,
              onLayersToggle: () => setLayersPanelOpen((prev) => !prev),
              canEdit,
              isLocked,
              sidebarOffset: 64,
              onAddAsset: () => handlePlusAction("upload")
            }
          )
        ] }),
        /* @__PURE__ */ jsx(KeyboardShortcutsModal, { open: shortcutsOpen, onClose: () => setShortcutsOpen(false) })
      ]
    }
  );
}

export { AudioNode, CollaborativeCanvas, EditModeIcon, ExpandIcon, ImageNode, InfiniteCanvas, LayersIcon, LockModeIcon, PanModeIcon, PlusIcon, SelectModeProvider, TextModeIcon, TextNode, VideoNode, WidgetBridge, createWidgetEvent, useCollaboration, useSelectMode, widgetBridge };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.mjs.map