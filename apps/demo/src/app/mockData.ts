import { RawDataItem } from '@tc/infinite-core';

export const mockData: RawDataItem[] = [
  {
    taskId: '0b198aa1fd5f49efac7f637032e46192',
    status: 'success',
    mediaType: 'image',
    result: {
      originImage: {
        url: '/analyzed_video_task_object_replace_llm_939ee65412dd4d7a8ccd67f5f56769fd_inline_image_0_resized.jpeg',
      },
    },
  },
  {
    taskId: 'ba6b5c1486df4976b04416ea674b7d96',
    status: 'success',
    mediaType: 'image',
    result: {
      originImage: {
        url: '/analyzed_video_task_object_replace_llm_49c4ade377f14396b293ab70fa405eeb_inline_image_0.jpeg',
      },
    },
  },
  {
    taskId: '56a8d6bcc8494f10b06ec0d5ac3d407c',
    status: 'success',
    mediaType: 'image',
    result: {
      originImage: {
        url: '/analyzed_video_task_object_replace_llm_8b8553a8435f486588b71fd43d3983ac_inline_image_0.jpeg',
      },
    },
  },
  {
    taskId: 'ae30e5a486aa4a1984e4820cd2d7d522',
    status: 'success',
    mediaType: 'image',
    result: {
      originImage: {
        url: '/analyzed_video_task_object_replace_llm_939ee65412dd4d7a8ccd67f5f56769fd_inline_image_0_resized.jpeg',
      },
    },
  },
  {
    taskId: 'eb9199923e454c77add8881873184e0a',
    status: 'success',
    mediaType: 'image',
    result: {
      originImage: {
        url: '/analyzed_video_task_object_replace_llm_b971f2461dbf4ecda814213fe29dd784_inline_image_0.jpeg',
      },
    },
  },
  {
    taskId: '5baeea6c9ea742f7a35a137aab919533',
    status: 'success',
    mediaType: 'image',
    result: {
      originImage: {
        url: '/analyzed_video_task_object_replace_llm_df317ff873344f0aaac13659b6514ae2_inline_image_0.jpeg',
      },
    },
  },
  {
    taskId: 'a30da9baf7f04b34a970aac4821be6e2',
    status: 'success',
    mediaType: 'IMAGE',
    result: {
      originImage: {
        url: '/board_eb7e9efeb118432e8bbc49366c9fbc66_upload_71-i0T9WWBL._AC_SX466_.jpg',
      },
    },
  },
  {
    taskId: '47ed2aa5cd9240ee9a3479ae08588160',
    status: 'success',
    mediaType: 'VIDEO',
    parameters: {
      fileName: '20231116-150621.mp4',
    },
    result: {
      originVideo: {
        filePath: '/board_eb7e9efeb118432e8bbc49366c9fbc66_upload_20231116-150621.mp4',
      },
    },
  },
  {
    taskId: '8f1dad98f2944ad4ae6c5b1ae2c7e54f',
    status: 'success',
    mediaType: 'AUDIO',
    parameters: {
      fileName: '1702713892000_67tool.mp3',
    },
    result: {
      originAudio: {
        filePath: '/board_eb7e9efeb118432e8bbc49366c9fbc66_upload_1702713892000_67tool.mp3',
      },
    },
  },
  {
    taskId: '97f91bba461a46918c9e514d372833fb',
    status: 'success',
    mediaType: 'IMAGE',
    result: {
      originImage: {
        url: '/board_eb7e9efeb118432e8bbc49366c9fbc66_upload_banana_pro.jpg',
      },
    },
  },
  // status 不是 success 的数据，这些不会被渲染
  {
    taskId: 'e7e9ed25b8df467c92402b0a0157574d',
    status: 'init',
    mediaType: 'image',
  },
  {
    taskId: '4ce6c2a90b594e5191bede569c01e3c4',
    status: 'init',
    mediaType: 'image',
  },
];
