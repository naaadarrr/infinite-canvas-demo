/**
 * useSliceAndUploadAudio Hook
 * 用于切片并上传音频文件
 */
'use client';

import { sliceAudioFileToWav } from '../helpers/audioHelper';
import useAwsS3 from '@/hooks/useAwsS3';
import { MimeType } from '@/types/common/resource';
import { getFileExt } from '@/utils/file';
import { nanoid } from 'nanoid';

export const useSliceAndUploadAudio = () => {
  const { uploadFileToS3, getS3UserFolderName } = useAwsS3();

  const uploadAudioFileToS3 = async ({
    audioFile,
    s3PathPrefix
  }: {
    audioFile: File;
    s3PathPrefix: string;
  }) => {
    const originalExt = getFileExt(audioFile.name);
    const uploadS3Path = `${s3PathPrefix}/${getS3UserFolderName()}/${nanoid()}.${originalExt}`;
    const uploadResult = await uploadFileToS3({
      file: audioFile,
      s3Path: uploadS3Path,
      mimeType: audioFile.type as MimeType
    });
    if (!uploadResult) throw new Error('Failed to upload audio file');

    return uploadS3Path;
  };

  const sliceAndUploadAudio = async ({
    originalAudioFile,
    audioStartTime,
    audioEndTime,
    s3PathPrefix
  }: {
    originalAudioFile: File;
    audioStartTime: number;
    audioEndTime: number;
    s3PathPrefix: string;
  }) => {
    const newFile = await sliceAudioFileToWav({
      file: originalAudioFile,
      audioStartTime,
      audioEndTime
    });
    // 上传音频
    const audioS3Path = await uploadAudioFileToS3({
      audioFile: newFile,
      s3PathPrefix
    });

    return audioS3Path;
  };

  return {
    sliceAndUploadAudio
  };
};
