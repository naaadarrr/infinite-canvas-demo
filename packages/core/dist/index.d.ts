/**
 * 节点类型枚举
 */
declare enum NodeType {
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    TEXT = "text"
}
/**
 * 基础位置信息
 */
interface Position {
    x: number;
    y: number;
}
/**
 * 尺寸信息
 */
interface Size {
    width: number;
    height: number;
}
/**
 * 基础节点数据
 */
interface BaseNodeData extends Record<string, unknown> {
    id: string;
    type: NodeType;
    position: Position;
    size: Size;
    zIndex?: number;
    rotation?: number;
    selected?: boolean;
}
/**
 * 图片节点数据
 */
interface ImageNodeData extends BaseNodeData {
    type: NodeType.IMAGE;
    url: string;
    alt?: string;
}
/**
 * 视频节点数据
 */
interface VideoNodeData extends BaseNodeData {
    type: NodeType.VIDEO;
    url: string;
    poster?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
}
/**
 * 音频节点数据
 */
interface AudioNodeData extends BaseNodeData {
    type: NodeType.AUDIO;
    url: string;
    title?: string;
    artist?: string;
    autoplay?: boolean;
    loop?: boolean;
}
/**
 * 文本对齐方式
 */
type TextAlign = 'left' | 'center' | 'right';
/**
 * 文本节点数据
 */
interface TextNodeData extends BaseNodeData {
    type: NodeType.TEXT;
    content: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    textAlign?: TextAlign;
    color?: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    scale?: number;
}
/**
 * 联合节点数据类型
 */
type CanvasNodeData = ImageNodeData | VideoNodeData | AudioNodeData | TextNodeData;
/**
 * 视口状态
 */
interface ViewportState {
    x: number;
    y: number;
    zoom: number;
}
/**
 * 画布配置
 */
interface CanvasConfig {
    minZoom?: number;
    maxZoom?: number;
    defaultZoom?: number;
    snapToGrid?: boolean;
    gridSize?: number;
    snapToNodes?: boolean;
    snapThreshold?: number;
    showSnapLines?: boolean;
}

/**
 * 生成唯一 ID
 */
declare function generateId(): string;
/**
 * 计算两点之间的距离
 */
declare function calculateDistance(p1: Position, p2: Position): number;
/**
 * 检查点是否在矩形内
 */
declare function isPointInRect(point: Position, rect: Position & Size): boolean;
/**
 * 限制数值在范围内
 */
declare function clamp(value: number, min: number, max: number): number;
/**
 * 按 zIndex 排序节点
 */
declare function sortNodesByZIndex(nodes: CanvasNodeData[]): CanvasNodeData[];
/**
 * 计算节点的边界框
 */
declare function getNodeBounds(node: CanvasNodeData): {
    left: number;
    top: number;
    right: number;
    bottom: number;
};

/** 媒体类型 */
declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio"
}
/** 工具分类 */
declare enum ToolCategory {
    IMAGE = "image",
    VIDEO = "video",
    AVATAR = "avatar",
    VOICE = "voice",
    MUSIC = "music"
}
/** 任务状态 */
declare enum TaskStatus {
    INIT = "init",
    RUNNING = "running",
    SUCCESS = "success",
    FAIL = "fail"
}
/**
 * 视频任务参数
 *{
 * "duration": 5,
    "taskType": "imageToVideo",
    "positivePrompt": "Kiki flies back into the foreground after a smooth aerial spin, slowing down gently on her broomstick.\nThe camera returns to a close, intimate distance — her face fills the frame, hair and red bow still fluttering softly in the wind.\nShe holds the small delivery package close to her chest, smiling with relief and quiet pride.\nThe background is softly blurred with motion, blue sky and white clouds melting into light streaks, giving a sense of calm after motion.\nWarm sunlight lights the edges of her hair and face, subtle rim light glowing around her silhouette.\nThe feeling is peaceful, accomplished, and hopeful — a moment of rest after flight.\nHand-drawn anime film style, soft painted texture, emotional still frame, gentle ending mood, Studio Ghibli–like atmosphere (original, non-copyright).\nCinematic depth of field, slight film grain, movie ending shot, lingering frame.",
    "modelId": "seedance-1.5-pro",
    "imageMode": "startEndFrame"
 *}
 * 图片任务参数
 * {
    "mode": "nano_banana2",
    "imageCount": 1,
    "promptEnhancementStatus": "Auto",
    "aspectRatio": "16:9",
    "type": "textToImage",
    "prompt": "A cinematic, hand-drawn anime-style scene inspired by a gentle fantasy world:\nA young witch girl (Kiki) flying on a broomstick while delivering goods. She wears a simple dark-blue dress, a large red bow on her hair fluttering in the wind, holding a small package tied with rope in her arms.\nBelow her is a European coastal town with red-tiled roofs, stone streets, small harbors, and sunlight reflecting on the sea.\nThe sky is bright blue with soft fluffy clouds, visible wind flow lines and light particles moving through the air, creating a strong sense of motion and freedom.\nWide-angle aerial composition, dynamic perspective, subtle motion blur on the broom tail to emphasize speed.\nWarm, soft lighting, bright and clean color palette, peaceful and healing atmosphere.\nStudio Ghibli–like hand-painted texture, detailed background, film-quality lighting, emotional, nostalgic, and full of adventure.\nUltra high detail, cinematic frame, 35mm lens feeling, soft depth of field, anime movie still quality."
 * }
 */
interface TaskParameters {
    model_id?: string;
    model_name?: string;
    prompt?: string;
    negative_prompt?: string;
    aspect_ratio?: string;
    steps?: number;
    cfg_scale?: number;
    seed?: number;
    [key: string]: unknown;
}
/** 媒体资源信息 */
interface MediaResourceInfo {
    url?: string;
    width?: number;
    height?: number;
    filePath?: string;
    filePathWithWatermark?: string;
    format?: string;
    type?: string;
    duration?: number;
    coverPath?: string;
    resourceId?: string;
    coverUrl?: string;
}
/** 任务结果输出 */
interface TaskResultOutput {
    type?: string;
    /** @deprecated 使用 compressedImage.url 代替 */
    url?: string;
    /** @deprecated 使用 compressedImage.url 代替 */
    thumbnail_url?: string;
    width?: number;
    height?: number;
    file_size?: number;
    /** 压缩图（用于列表展示） */
    compressedImage?: MediaResourceInfo;
    /** 原图（用于详情页展示） */
    originImage?: MediaResourceInfo;
    /** 原视频（用于视频任务） */
    originVideo?: MediaResourceInfo;
    /** 原音频（用于音频任务） */
    originAudio?: MediaResourceInfo;
    /** 输出资源 ID 列表 */
    outputResourceIds?: string[];
}
/** Board 任务 */
interface BoardTaskItem {
    taskId: string;
    boardId: string;
    /** 排序权重，decimal(20,10) 类型，越大越靠后 */
    sortWeight: number;
    uid: string;
    userName: string;
    /** 可选标题（例如音频/上传文件名的展示） */
    title?: string | null;
    toolType: string;
    toolCategory: ToolCategory | string;
    status: TaskStatus | string;
    mediaType: MediaType | string;
    rating: number;
    parameters: TaskParameters | null;
    result?: TaskResultOutput | null;
    creditsCost: number;
    creditsPayerUid?: string | null;
    creditsPayerName?: string | null;
    gmtCreate: string;
    gmtModify: string;
    completedAt: string | null;
    /** 是否置顶 */
    isPinned?: boolean;
    /** 错误信息 */
    errorMessage?: string | null;
    /** 错误码 */
    errorCode?: string | null;
    /** 置顶前的原始排序权重（用于取消置顶时恢复） */
    pinnedOriginalSortWeight?: number | null;
    /** 任务分组 */
    groupIds?: string[];
}

/**
 * 原始数据项接口
 */
type RawDataItem = BoardTaskItem;
/**
 * 布局配置
 */
interface LayoutConfig {
    columns?: number;
    nodeWidth?: number;
    nodeHeight?: number;
    gap?: number;
    startX?: number;
    startY?: number;
    cdnBaseUrl?: string;
    includeRawData?: boolean;
}
/**
 * 解析原始数据为画布节点
 */
declare function parseRawData(rawData: RawDataItem[], layoutConfig?: LayoutConfig): CanvasNodeData[];

export { type AudioNodeData, type BaseNodeData, type BoardTaskItem, type CanvasConfig, type CanvasNodeData, type ImageNodeData, type LayoutConfig, type MediaResourceInfo, MediaType, NodeType, type Position, type RawDataItem, type Size, type TaskParameters, type TaskResultOutput, TaskStatus, type TextAlign, type TextNodeData, ToolCategory, type VideoNodeData, type ViewportState, calculateDistance, clamp, generateId, getNodeBounds, isPointInRect, parseRawData, sortNodesByZIndex };
