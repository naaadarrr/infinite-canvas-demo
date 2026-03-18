import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';

export const useImage = (imageUrl: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.src = imageUrl;

          img.onload = () => resolve(img);
          img.onerror = (e) => reject(new Error('Error loading image'));
        });

        setImage(img);
      } catch (error) {
        console.error(error);
      }
    };

    if (imageUrl) {
      loadImage();
    }
  }, [imageUrl]);

  return {
    image,
    stageRef
  };
};
