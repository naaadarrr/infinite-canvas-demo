'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stage, Layer, Image, Circle } from 'react-konva';
import Konva from 'konva';
import { useDrawing } from './hooks/useDrawing';
import { useImage } from './hooks/useImage';
import ToolBar from './ToolBar';
import GlobalLoading from './components/GlobalLoading';
import ThicknessControl from './ThicknessControl';
import useAwsS3 from '@/hooks/useAwsS3';
import { getFileNameByUrl } from '@/utils/file';
import { debounce } from 'lodash';
import { MaskImageLocationProps } from './type';
import MaskColorPicker from './MaskColorPicker';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Spinner } from '@/components/ui/spinner';
import { MimeType } from '@/types/common/resource';
import { PRODUCT_AVATAR_MASK_IMAGE_S3_PATH_PREFIX } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/ProductAvatar/config';
import { getLocalStorageTeamId } from '@/utils/team';

interface DrawingCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string;
  maskImageUrl?: string;
  onSuccess: ({
    s3Path,
    coordinate
  }: {
    s3Path: string;
    coordinate: { x: number; y: number; w: number; h: number };
  }) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isOpen,
  onClose,
  title,
  imageUrl,
  maskImageUrl,
  onSuccess
}) => {
  const teamId = getLocalStorageTeamId();
  const { uploadFileToS3 } = useAwsS3();
  const CONTAINER_SIZE = 560;

  const {
    lines,
    tool,
    brushSize,
    eraserSize,
    brushColor,
    setTool,
    setBrushSize,
    setEraserSize,
    setBrushColor: originalSetBrushColor
  } = useDrawing();

  const { image, stageRef } = useImage(imageUrl);
  const { image: maskImage } = useImage(maskImageUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasValidBrushStrokes, setHasValidBrushStrokes] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isMaskInitialized, setIsMaskInitialized] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const devicePixelRatio = useMemo(() => window.devicePixelRatio || 1, []);

  const brushLayerRef = useRef<Konva.Layer>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const canvasSize = useMemo(() => {
    if (!image) return { width: 0, height: 0 };
    const scale = Math.min(
      CONTAINER_SIZE / image.width,
      CONTAINER_SIZE / image.height
    );
    return {
      width: image.width * scale,
      height: image.height * scale
    };
  }, [image]);

  const getImageTransform = (imageWidth: number, imageHeight: number) => {
    const scale = Math.min(
      canvasSize.width / imageWidth,
      canvasSize.height / imageHeight
    );

    return {
      scale,
      offsetX: (canvasSize.width - imageWidth * scale) / 2,
      offsetY: (canvasSize.height - imageHeight * scale) / 2
    };
  };

  const checkForMaskPresence = () => {
    if (!brushLayerRef.current) {
      setHasValidBrushStrokes(false);
      return;
    }

    const layerCanvas = brushLayerRef.current.getCanvas()._canvas;
    const context = layerCanvas.getContext('2d');
    if (!context) {
      setHasValidBrushStrokes(false);
      return;
    }
    const imageData = context.getImageData(
      0,
      0,
      layerCanvas.width,
      layerCanvas.height
    );
    const data = imageData.data;

    let hasMask = false;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        hasMask = true;
        break;
      }
    }

    setHasValidBrushStrokes(hasMask);
  };

  const handleBrushStart = (e: {
    target: { getStage: () => Konva.Stage | null };
  }) => {
    const pos = e.target?.getStage()?.getPointerPosition();
    if (pos && brushLayerRef.current) {
      isDrawingRef.current = true;
      const newLine = new Konva.Line({
        points: [pos.x, pos.y],
        stroke: tool === 'brush' ? brushColor : '#FFFFFF',
        strokeWidth: tool === 'brush' ? brushSize : eraserSize,
        lineCap: 'round',
        lineJoin: 'round',
        globalCompositeOperation:
          tool === 'brush' ? 'source-over' : 'destination-out'
      });
      brushLayerRef.current.add(newLine);
    }
  };

  const handleMouseMoveWithCursor = (e: {
    target: { getStage: () => Konva.Stage | null };
  }) => {
    const stage = e.target?.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    const radius = tool === 'brush' ? brushSize / 2 : eraserSize / 2;

    let x, y;
    if (tool === 'brush') {
      x = Math.max(
        radius - 20,
        Math.min(point.x, canvasSize.width - radius + 20)
      );
      y = Math.max(
        radius - 20,
        Math.min(point.y, canvasSize.height - radius + 20)
      );
    } else {
      x = Math.max(0, Math.min(point.x, canvasSize.width));
      y = Math.max(0, Math.min(point.y, canvasSize.height));
    }

    setCursorPosition({ x, y });

    if (isDrawingRef.current && brushLayerRef.current) {
      const lastPoint = lastPointRef.current;
      if (lastPoint) {
        const dx = x - lastPoint.x;
        const dy = y - lastPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const maxDistance = radius * 0.1;
        const steps = Math.max(1, Math.ceil(distance / maxDistance));

        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          const interpolatedX = lastPoint.x + dx * t;
          const interpolatedY = lastPoint.y + dy * t;

          const circle = new Konva.Circle({
            x: interpolatedX,
            y: interpolatedY,
            radius: radius,
            fill: tool === 'brush' ? brushColor : '#FFFFFF',
            globalCompositeOperation:
              tool === 'brush' ? 'source-over' : 'destination-out',
            listening: false
          });

          brushLayerRef.current.add(circle);
        }
      }

      lastPointRef.current = { x, y };
      brushLayerRef.current.batchDraw();
    }
  };

  const handleBrushEnd = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null; // 重置最后一个点

    // 清除无效的 Line
    if (brushLayerRef.current) {
      brushLayerRef.current.getChildren().forEach((child) => {
        if (
          child instanceof Konva.Line &&
          child.globalCompositeOperation() === 'source-over' &&
          child.points().length === 0 // 检查 points 数组是否为空
        ) {
          child.destroy();
        }
      });
      brushLayerRef.current.batchDraw();
    }

    checkForMaskPresence();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // 定义调整步长
    const step = 2;
    // 向上滚动为负值，我们希望向上增大，所以要取反
    const delta = -e.deltaY;

    if (tool === 'brush') {
      // 调整笔刷大小，限制在 2-100 之间
      const newSize = Math.min(
        Math.max(brushSize + (delta > 0 ? step : -step), 2),
        100
      );
      setBrushSize(newSize);
    } else if (tool === 'eraser') {
      // 调整橡皮擦大小，限制在 2-100 之间
      const newSize = Math.min(
        Math.max(eraserSize + (delta > 0 ? step : -step), 2),
        100
      );
      setEraserSize(newSize);
    }
  };

  const handleToolChange = (newTool: 'brush' | 'eraser') => {
    setTool(newTool);
  };

  const handleClearBrush = () => {
    if (!brushLayerRef.current) return;
    brushLayerRef.current.destroyChildren();
    brushLayerRef.current.batchDraw();
    setHasValidBrushStrokes(false);
  };

  // useEffect 钩子
  useEffect(() => {
    // 初始化 maskImage
    if (maskImage) {
      const { scale, offsetX, offsetY } = getImageTransform(
        maskImage.width,
        maskImage.height
      );

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskImage.width;
      tempCanvas.height = maskImage.height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(maskImage, 0, 0);
        const imageData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        const data = imageData.data;

        const r = parseInt(brushColor.slice(1, 3), 16);
        const g = parseInt(brushColor.slice(3, 5), 16);
        const b = parseInt(brushColor.slice(5, 7), 16);

        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (gray > 128) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
          } else {
            data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
          }
        }

        tempCtx.putImageData(imageData, 0, 0);

        const maskShape = new Konva.Image({
          image: tempCanvas,
          x: offsetX,
          y: offsetY,
          scaleX: scale,
          scaleY: scale,
          globalCompositeOperation: 'source-over',
          listening: false
        });

        if (brushLayerRef.current) {
          brushLayerRef.current.getChildren().forEach((child) => {
            if (child.attrs.id === 'maskImage') {
              child.destroy();
            }
          });

          maskShape.setAttr('id', 'maskImage');
          brushLayerRef.current.add(maskShape);
          brushLayerRef.current.batchDraw();
        }
      }

      setHasValidBrushStrokes(true);
    }
  }, [maskImage, isMaskInitialized]);

  useEffect(() => {
    // 设置笔刷图层的透明度
    if (brushLayerRef.current) {
      const canvas = brushLayerRef.current.getCanvas()._canvas;
      canvas.style.opacity = '0.7'; // 设置固定的透明度

      // 填充白色背景
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = 'rgba(255, 255, 255, 1)';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [brushLayerRef.current]);

  const updateMaskColor = (newColor: string) => {
    if (!brushLayerRef.current) return;

    brushLayerRef.current.getChildren().forEach((child) => {
      if (child.attrs.id === 'maskImage') {
        const image = child.attrs.image;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          tempCtx.drawImage(image, 0, 0);
          const imageData = tempCtx.getImageData(
            0,
            0,
            tempCanvas.width,
            tempCanvas.height
          );
          const data = imageData.data;

          const r = parseInt(newColor.slice(1, 3), 16);
          const g = parseInt(newColor.slice(3, 5), 16);
          const b = parseInt(newColor.slice(5, 7), 16);

          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) {
              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
            }
          }

          tempCtx.putImageData(imageData, 0, 0);
          child.attrs.image = tempCanvas;
          if (brushLayerRef.current) {
            brushLayerRef.current.batchDraw();
          }
        }
      }
    });
  };

  const updateBrushLinesColor = (newColor: string) => {
    if (!brushLayerRef.current) return;

    brushLayerRef.current.getChildren().forEach((child) => {
      if (
        child instanceof Konva.Line &&
        child.attrs.globalCompositeOperation !== 'destination-out'
      ) {
        child.stroke(newColor);
      }
    });

    brushLayerRef.current.batchDraw();
  };

  // 修改setBrushColorWithUpdate函数
  const setBrushColorWithUpdate = (color: string) => {
    updateMaskColor(color); // 更新遮罩颜色
    updateBrushLinesColor(color); // 更新用户绘制的区域颜色
    originalSetBrushColor(color); // 更新当前笔刷颜色
  };

  const getImageCoordinate = (
    maskImage: HTMLImageElement
  ): Promise<MaskImageLocationProps> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = maskImage.width;
      canvas.height = maskImage.height;
      ctx!.drawImage(maskImage, 0, 0);

      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];

          if (r! > 0 || g! > 0 || b! > 0) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      const width = maxX - minX;
      const height = maxY - minY;

      const coordinate = {
        x: minX / maskImage.width,
        y: minY / maskImage.height,
        w: width / maskImage.width,
        h: height / maskImage.height
      };
      resolve(coordinate);
    });
  };

  const debouncedHandleConfirm = debounce(async () => {
    setIsButtonLoading(true); // 开始加载
    if (stageRef.current && brushLayerRef.current && maskImage) {
      const { scale, offsetX, offsetY } = getImageTransform(
        maskImage?.width as number,
        maskImage?.height as number
      );

      // 创建一个临时 canvas
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = maskImage?.width as number;
      tempCanvas.height = maskImage?.height as number;

      const brushCanvas = brushLayerRef.current.getCanvas()._canvas;
      const brushCtx = brushCanvas.getContext('2d');
      if (brushCtx) {
        const imageData = brushCtx.getImageData(
          0,
          0,
          brushCanvas.width,
          brushCanvas.height
        );
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 0) {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
            data[i + 3] = 255;
          }
        }

        // Put the modified image data back to the canvas
        brushCtx.putImageData(imageData, 0, 0);
      }

      // 打印一下brushLayer的Base64出来
      const brushLayerBase64 = brushCanvas.toDataURL('image/png');
      console.log('Brush Layer Base64:', brushLayerBase64);

      // 设置临时 canvas 的尺寸为 maskImage 的尺寸
      tempCanvas.width = image?.width as number;
      tempCanvas.height = image?.height as number;

      if (tempCtx) {
        // 填充白色背景
        tempCtx.fillStyle = 'rgba(255, 255, 255, 1)';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 应用缩放和偏移，考虑 devicePixelRatio
        const brushScaleX = tempCanvas.width / brushCanvas.width;
        const brushScaleY = tempCanvas.height / brushCanvas.height;

        tempCtx.drawImage(
          brushCanvas,
          offsetX * devicePixelRatio,
          offsetY * devicePixelRatio,
          brushCanvas.width * brushScaleX,
          brushCanvas.height * brushScaleY
        ); // brushCanvas可能会比tempCanvas大，所以正确应用缩放和偏移

        const base64Image0 = tempCanvas.toDataURL('image/png');
        console.log('Base64 Image 0:', base64Image0); // 调试代码

        // 获取图像数据

        const imageData = tempCtx.getImageData(
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );
        const data = imageData.data;

        // 二值化处理并反转黑白
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 128; // 阈值
          if (brightness < threshold) {
            data[i] = 255; // Red
            data[i + 1] = 255; // Green
            data[i + 2] = 255; // Blue
          } else {
            data[i] = 0; // Red
            data[i + 1] = 0; // Green
            data[i + 2] = 0; // Blue
          }
          // Alpha 通道保持不变
        }
        tempCtx.putImageData(imageData, 0, 0);

        const canvasToImage = (
          canvas: HTMLCanvasElement
        ): Promise<HTMLImageElement> => {
          return new Promise((resolve) => {
            const image = new window.Image(); // 使用全局 Image
            image.onload = () => resolve(image);
            image.src = canvas.toDataURL();
          });
        };

        const image = await canvasToImage(tempCanvas);
        const coordinate = await getImageCoordinate(image);

        // 上传到 S3
        tempCanvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const file = new File([blob], 'mask.png', {
                type: 'image/png'
              });
              const originalFileName = getFileNameByUrl(imageUrl) || 'image';
              const timestamp = Date.now();
              const s3Path = `${PRODUCT_AVATAR_MASK_IMAGE_S3_PATH_PREFIX}/${teamId}/${originalFileName}_mask_${timestamp}.png`;
              const mimeType = MimeType.PNG;
              const uploadRes = await uploadFileToS3({
                s3Path,
                file,
                mimeType
              });
              if (uploadRes) {
                onSuccess({ s3Path, coordinate });
                onClose();
              }
            } catch (error) {
              console.error('Error uploading file:', error);
            } finally {
              setIsButtonLoading(false); // 停止加载
            }
          }
        }, 'image/png');
      }
    }
  }, 1000);

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
      >
        <SheetContent
          side='left'
          className='!w-[1000px] !max-w-[1000px] sm:!max-w-[1000px] h-full bg-[#181818] text-white p-0 border-none rounded-none [&>button]:hidden mr-auto'
          overlayClassName='bg-black/40 transition-colors duration-500 ease-out'
        >
          <SheetHeader className='h-[60px] border-b border-[#353537] flex flex-row items-center justify-center px-0'>
            <SheetTitle className='text-lg font-semibold text-white text-center'>
              {title}
            </SheetTitle>
            <SheetClose className='absolute right-3 top-3 text-base text-white' />
          </SheetHeader>
          <div className='h-[calc(100%-60px)] overflow-auto p-0'>
            <div className='flex justify-center items-center w-full h-full gap-x-[40px] p-0'>
              <div
                className='w-[560px] h-[560px] bg-[#181818] rounded-md relative shadow-[0px_4px_6px_rgba(0,0,0,0.1)] flex justify-center items-center overflow-hidden'
                onWheel={handleWheel}
                style={{
                  touchAction: 'none'
                }}
              >
                <Stage
                  width={canvasSize?.width}
                  height={canvasSize?.height}
                  onMouseDown={handleBrushStart}
                  onMousemove={handleMouseMoveWithCursor}
                  onMouseup={handleBrushEnd}
                  onMouseleave={handleBrushEnd}
                  ref={stageRef}
                  style={{
                    backgroundColor: '#181818',
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                  listening={true}
                  perfectDrawEnabled={false}
                  transformsEnabled='position'
                >
                  <Layer>
                    {image && (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image
                        image={image}
                        {...(() => {
                          const { scale, offsetX, offsetY } = getImageTransform(
                            image.width,
                            image.height
                          );
                          return {
                            x: offsetX,
                            y: offsetY,
                            scaleX: scale,
                            scaleY: scale
                          };
                        })()}
                      />
                    )}
                  </Layer>

                  <Layer ref={brushLayerRef} />

                  {cursorPosition &&
                    canvasSize.width > 0 &&
                    canvasSize.height > 0 && (
                      <Layer>
                        <Circle
                          x={cursorPosition.x}
                          y={cursorPosition.y}
                          radius={
                            tool === 'brush' ? brushSize / 2 : eraserSize / 2
                          }
                          stroke={tool === 'brush' ? brushColor : '#FFFFFF'}
                          strokeWidth={tool === 'brush' ? 0 : 1}
                          fill={tool === 'brush' ? brushColor : 'transparent'}
                          listening={false}
                          opacity={tool === 'brush' ? 0.7 : 1}
                        />
                        {tool === 'eraser' && (
                          <Circle
                            x={cursorPosition.x}
                            y={cursorPosition.y}
                            radius={eraserSize / 2 + 1}
                            stroke='#000000'
                            strokeWidth={1}
                            fill='transparent'
                            listening={false}
                          />
                        )}
                      </Layer>
                    )}
                </Stage>
              </div>

              <div className='flex flex-col justify-between w-[300px] h-[560px] pt-10'>
                <div className='flex flex-col gap-10'>
                  <ToolBar
                    tool={tool}
                    setTool={handleToolChange}
                    brushColor={brushColor}
                    setBrushColor={setBrushColorWithUpdate}
                    onClear={handleClearBrush}
                  />
                  <ThicknessControl
                    value={tool === 'eraser' ? eraserSize : brushSize}
                    onChange={tool === 'eraser' ? setEraserSize : setBrushSize}
                    tool={tool}
                  />
                  <MaskColorPicker
                    brushColor={brushColor}
                    setBrushColor={setBrushColorWithUpdate}
                    tool={tool}
                  />
                </div>
                <div className='flex gap-4'>
                  <Button
                    className='flex-1 h-10 p-0 text-sm font-semibold rounded-lg bg-[#272729] text-white hover:bg-[#3A3A3C] transition-colors duration-200'
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Tooltip
                    content={
                      lines.length === 0
                        ? 'Please draw something first'
                        : 'Please draw some area with brush'
                    }
                  >
                    <Button
                      className='flex-1 h-10 p-0 text-sm font-semibold rounded-lg w-full bg-[#4E40F3] text-white hover:bg-[#6255FF] disabled:bg-[#1C1C1D] disabled:text-[#FFFFFF33] disabled:cursor-not-allowed transition-colors duration-200'
                      onClick={debouncedHandleConfirm}
                      disabled={!hasValidBrushStrokes}
                    >
                      {isButtonLoading ? (
                        <span className='flex items-center gap-2'>
                          <Spinner className='w-4 h-4' />
                          Confirm
                        </span>
                      ) : (
                        'Confirm'
                      )}
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <GlobalLoading isLoading={isProcessing} />
    </>
  );
};

export default DrawingCanvas;
