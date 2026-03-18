'use strict';

// src/types.ts
var NodeType = /* @__PURE__ */ ((NodeType2) => {
  NodeType2["IMAGE"] = "image";
  NodeType2["VIDEO"] = "video";
  NodeType2["AUDIO"] = "audio";
  NodeType2["TEXT"] = "text";
  return NodeType2;
})(NodeType || {});

// src/utils.ts
function generateId() {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function calculateDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
function isPointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function sortNodesByZIndex(nodes) {
  return [...nodes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
}
function getNodeBounds(node) {
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + node.size.width,
    bottom: node.position.y + node.size.height
  };
}

// src/dataParser.ts
var ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
var ASPECT_RATIO_PATTERN = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/;
function joinCdnUrl(base, path) {
  if (!base) {
    return path;
  }
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${trimmedBase}/${trimmedPath}`;
}
function resolveUrl(value, cdnBaseUrl) {
  if (!value) {
    return void 0;
  }
  if (ABSOLUTE_URL_PATTERN.test(value)) {
    return value;
  }
  return joinCdnUrl(cdnBaseUrl, value);
}
function resolveMediaUrl(resource, cdnBaseUrl) {
  return resolveUrl(resource?.url, cdnBaseUrl) ?? resolveUrl(resource?.filePath, cdnBaseUrl);
}
function resolveMediaUrlFrom(resources, cdnBaseUrl) {
  for (const resource of resources) {
    const url = resolveMediaUrl(resource, cdnBaseUrl);
    if (url) {
      return url;
    }
  }
  return void 0;
}
function resolveCoverUrl(resource, cdnBaseUrl) {
  return resolveUrl(resource?.coverPath, cdnBaseUrl);
}
function resolveTitle(value) {
  if (typeof value !== "string") {
    return void 0;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function parseAspectRatio(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : void 0;
  }
  if (typeof value !== "string") {
    return void 0;
  }
  const match = ASPECT_RATIO_PATTERN.exec(value.trim());
  if (!match) {
    return void 0;
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return void 0;
  }
  return width / height;
}
function resolveAspectRatioFromParameters(parameters) {
  if (!parameters || typeof parameters !== "object") {
    return void 0;
  }
  const record = parameters;
  return parseAspectRatio(record.aspectRatio ?? record.aspect_ratio);
}
function resolveAspectRatioFromResources(resources) {
  for (const resource of resources) {
    const width = resource?.width;
    const height = resource?.height;
    if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
      return width / height;
    }
  }
  return void 0;
}
function resolveNodeSize(nodeWidth, nodeHeight, aspectRatio) {
  if (!aspectRatio || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return { width: nodeWidth, height: nodeHeight };
  }
  const containerRatio = nodeWidth / nodeHeight;
  if (aspectRatio >= containerRatio) {
    return { width: nodeWidth, height: nodeWidth / aspectRatio };
  }
  return { width: nodeHeight * aspectRatio, height: nodeHeight };
}
function resolveCenteredPosition(cellX, cellY, cellWidth, cellHeight, nodeSize) {
  return {
    x: cellX + (cellWidth - nodeSize.width) / 2,
    y: cellY + (cellHeight - nodeSize.height) / 2
  };
}
function parseRawData(rawData, layoutConfig = {}) {
  const {
    columns = 4,
    nodeWidth = 300,
    nodeHeight = 200,
    gap = 50,
    startX = 100,
    startY = 100,
    cdnBaseUrl = "https://dr1coeak04nbk.cloudfront.net",
    includeRawData = false
  } = layoutConfig;
  const nodes = [];
  let nodeIndex = 0;
  const layoutSide = Math.max(nodeWidth, nodeHeight);
  for (const item of rawData) {
    const status = String(item.status ?? "").toLowerCase();
    const isInit = status === "init";
    const isSuccess = status === "success";
    const isFail = status === "fail";
    if (!isInit && !isSuccess && !isFail) {
      continue;
    }
    const mediaType = String(item.mediaType ?? "").toUpperCase();
    let node = null;
    const result = item.result ?? void 0;
    const row = Math.floor(nodeIndex / columns);
    const col = nodeIndex % columns;
    const cellX = startX + col * (layoutSide + gap);
    const cellY = startY + row * (layoutSide + gap);
    switch (mediaType) {
      case "IMAGE":
        const imageUrl = resolveMediaUrlFrom(
          [result?.originImage, result?.compressedImage],
          cdnBaseUrl
        );
        if (imageUrl || isInit || isFail) {
          const aspectRatio = resolveAspectRatioFromParameters(item.parameters) ?? resolveAspectRatioFromResources([result?.originImage, result?.compressedImage]);
          const size = resolveNodeSize(layoutSide, layoutSide, aspectRatio);
          node = {
            id: generateId(),
            type: "image",
            position: resolveCenteredPosition(cellX, cellY, layoutSide, layoutSide, size),
            size,
            url: imageUrl ?? "",
            zIndex: 1
          };
        }
        break;
      case "VIDEO":
        const videoUrl = resolveMediaUrlFrom(
          [result?.originVideo, result?.originImage],
          cdnBaseUrl
        );
        if (videoUrl || isInit || isFail) {
          const poster = resolveCoverUrl(result?.originVideo, cdnBaseUrl) ?? resolveCoverUrl(result?.originImage, cdnBaseUrl);
          const aspectRatio = resolveAspectRatioFromParameters(item.parameters) ?? resolveAspectRatioFromResources([result?.originVideo, result?.originImage]);
          const size = resolveNodeSize(layoutSide, layoutSide, aspectRatio);
          node = {
            id: generateId(),
            type: "video",
            position: resolveCenteredPosition(cellX, cellY, layoutSide, layoutSide, size),
            size,
            url: videoUrl ?? "",
            poster,
            loop: true,
            muted: true,
            zIndex: 1
          };
        }
        break;
      case "AUDIO":
        const audioUrl = resolveMediaUrl(result?.originAudio, cdnBaseUrl);
        if (audioUrl || isInit || isFail) {
          const title = resolveTitle(item.parameters?.fileName) ?? resolveTitle(item.title) ?? "Untitled";
          const size = { width: layoutSide, height: layoutSide };
          node = {
            id: generateId(),
            type: "audio",
            position: resolveCenteredPosition(cellX, cellY, layoutSide, layoutSide, size),
            size,
            // 音频节点固定为正方形
            url: audioUrl ?? "",
            title,
            zIndex: 1
          };
        }
        break;
    }
    if (node) {
      if (includeRawData) {
        node.raw = item;
      }
      nodes.push(node);
      nodeIndex++;
    }
  }
  return nodes;
}

// src/boardTaskItem.ts
var MediaType = /* @__PURE__ */ ((MediaType2) => {
  MediaType2["IMAGE"] = "image";
  MediaType2["VIDEO"] = "video";
  MediaType2["AUDIO"] = "audio";
  return MediaType2;
})(MediaType || {});
var ToolCategory = /* @__PURE__ */ ((ToolCategory2) => {
  ToolCategory2["IMAGE"] = "image";
  ToolCategory2["VIDEO"] = "video";
  ToolCategory2["AVATAR"] = "avatar";
  ToolCategory2["VOICE"] = "voice";
  ToolCategory2["MUSIC"] = "music";
  return ToolCategory2;
})(ToolCategory || {});
var TaskStatus = /* @__PURE__ */ ((TaskStatus2) => {
  TaskStatus2["INIT"] = "init";
  TaskStatus2["RUNNING"] = "running";
  TaskStatus2["SUCCESS"] = "success";
  TaskStatus2["FAIL"] = "fail";
  return TaskStatus2;
})(TaskStatus || {});

exports.MediaType = MediaType;
exports.NodeType = NodeType;
exports.TaskStatus = TaskStatus;
exports.ToolCategory = ToolCategory;
exports.calculateDistance = calculateDistance;
exports.clamp = clamp;
exports.generateId = generateId;
exports.getNodeBounds = getNodeBounds;
exports.isPointInRect = isPointInRect;
exports.parseRawData = parseRawData;
exports.sortNodesByZIndex = sortNodesByZIndex;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.js.map