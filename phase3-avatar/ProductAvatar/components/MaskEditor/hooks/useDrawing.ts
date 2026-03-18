import { useState } from 'react';

interface Line {
  tool: string;
  points: number[];
  color: string;
  size: number;
}

export const useDrawing = () => {
  const [tool, setTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(10);
  const [eraserSize, setEraserSize] = useState(20);
  const [brushColor, setBrushColor] = useState('#FEFF5599');
  const [lines] = useState<
    Array<{
      tool: string;
      points: number[];
      brushSize: number;
      eraserSize: number;
      color: string;
    }>
  >([]);

  return {
    lines,
    tool,
    brushSize,
    eraserSize,
    brushColor,
    setTool,
    setBrushSize,
    setEraserSize,
    setBrushColor
  };
};
