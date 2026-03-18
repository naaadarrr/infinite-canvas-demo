/**
 * Audio Helper Functions
 * 音频处理工具函数
 */
import toWav from 'audiobuffer-to-wav';

interface FileReadAsType {
  ArrayBuffer: ArrayBuffer;
  DataURL: string;
}

/**
 * FileReader in promise
 */
export const readFile = <Type extends keyof FileReadAsType>(
  file: Blob,
  dataType: Type
) =>
  new Promise<FileReadAsType[Type]>((resolve, reject) => {
    const reader = new FileReader();
    (reader as any)[`readAs${dataType}`](file);
    reader.onload = () => resolve(reader.result as any);
    reader.onerror = (err) => reject(err);
  });

/**
 * Read File/Blob to ArrayBuffer
 */
export const readArrayBuffer = (file: Blob) => readFile(file, 'ArrayBuffer');

export async function decodeAudioBuffer(blob: Blob) {
  const arrayBuffer = await readArrayBuffer(blob);
  const audioBuffer = await new AudioContext().decodeAudioData(arrayBuffer);

  return audioBuffer;
}

export function sliceAudioBuffer(
  audioBuffer: AudioBuffer,
  start = 0,
  end = audioBuffer.length
) {
  const newBuffer = new AudioContext().createBuffer(
    audioBuffer.numberOfChannels,
    end - start,
    audioBuffer.sampleRate
  );

  for (let i = 0; i < audioBuffer.numberOfChannels; i += 1) {
    newBuffer.copyToChannel(audioBuffer.getChannelData(i).slice(start, end), i);
  }

  return newBuffer;
}

/**
 * 切片音频文件并转换为 WAV 格式
 */
export const sliceAudioFileToWav = async ({
  file,
  audioStartTime,
  audioEndTime,
  fileName
}: {
  file: File;
  audioStartTime: number;
  audioEndTime: number;
  fileName?: string;
}) => {
  const audioBuffer = await decodeAudioBuffer(file);

  const { length, duration } = audioBuffer;

  const audioSliced = sliceAudioBuffer(
    audioBuffer,
    Math.floor((length * audioStartTime) / duration),
    Math.floor((length * audioEndTime) / duration)
  );

  // 使用 audiobuffer-to-wav 将 AudioBuffer 转换为 ArrayBuffer
  let wav = toWav(audioSliced);

  // 创建一个 Blob
  let blob = new Blob([new DataView(wav)], { type: 'audio/wav' });

  let audioFile = new File([blob], `${fileName || `sliced_audio`}.wav`, {
    type: 'audio/wav'
  });

  return audioFile;
};
