# AGENT.md — @tc/infinite 项目说明（供 AI/Agent 执行）

## 项目目标

构建一个可嵌入的 npm 包 `@tc/infinite`，用于无限画布（基于 React + React Flow），支持：

1. 图片节点、视频节点（视频在节点中可预览）
2. 视口平移、缩放
3. 节点的组织、拖动、缩放、层级堆叠
4. 文本节点 / 文本内容

库可发布、可供业务嵌入，并带有 demo 示例。

## Monorepo 结构（pnpm workspace）

/
├── pnpm-workspace.yaml
├── packages/
│   ├── core/
│   │   ├── src/
│   │   ├── dist/
│   │   ├── package.json
│   │   └── tsup.config.ts
│   ├── widget/
│   │   ├── src/
│   │   ├── dist/
│   │   ├── package.json
│   │   └── tsup.config.ts
├── apps/
│   └── demo/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── next.config.js
├── package.json
└── tsconfig.base.json

## Workspace 配置

packages:
  - "packages/*"
  - "apps/*"

## packages/core

不依赖 React，仅包含逻辑与类型。

## packages/widget

React 组件层，基于 @xyflow/react (React Flow)。

## Demo

Next.js 15 应用，用于调试和展示。

## 模拟数据
[
    {
        "taskId": "0b198aa1fd5f49efac7f637032e46192",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 20,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 1,
        "parameters": {
            "model_id": "nano-banana-pro",
            "model_name": "Nano Banana Pro",
            "prompt": "一个杯子放在桌面上",
            "aspect_ratio": "1:1",
            "mode": "nano_banana2",
            "image_count": 1,
            "aspectRatio": "1:1"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/b971f2461dbf4ecda814213fe29dd784/inline_image_0_resized.jpeg",
                "format": "JPEG",
                "width": 512,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/b971f2461dbf4ecda814213fe29dd784/inline_image_0_resized_watermark.png",
                "height": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fb971f2461dbf4ecda814213fe29dd784%2Finline_image_0_resized.jpeg?Expires=1769236669&Signature=RWgsgJW~Rn9MOScWqDEOxVFKREwO3TUPSpDbB6XnvPM3AdlDJ-KQqvE~q-b06fCRSz5wucp~7IBrjS-Ns8KNkJlCY7OpFnIGeM4zTCdAFGyZIdh1BV6ignyGBuynA9SADQXAHh6liSch2yS1aW1wc86y5VD2WZop3vEcTHwVeZMqMj5CCnhU7xQlFkZlqFpk67ORUQY3j934hkGfxnPmUVXhVHNvpKWZO-CeVD60H9MEwtuvoWmGg6wmYWHqgwCrDOcXZnHcVpEptgozgowvZaeSyQyI0v2hQAVLSbfjFcc2mrA6DIDWBIaW8MGc-FBf9dBvsZy~Yiw3~SUpwB9e8A__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "filePath": "analyzed_video/task/object_replace_llm/b971f2461dbf4ecda814213fe29dd784/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2048,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/b971f2461dbf4ecda814213fe29dd784/inline_image_0_watermark.png",
                "height": 2048,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fb971f2461dbf4ecda814213fe29dd784%2Finline_image_0.jpeg?Expires=1769236669&Signature=oMGbZQ~Go91mBscRPw4ft1gsvDrG2HrTPdC9tnKcAp5ljKOkIt5eZ00TQBOSkDyylrBPc4Nxx--UawzF1k6qsleEeMon11m6zuEPy-yUnZFM4SfgtfVFGZR3ARutd-ECmxRrlllFkl0dmh1rTS3vlCqmse4cqkMTgkGBH-18vyQa~hHb01IJLC2PaoxYklLSrFXoHn~h8h8KCIQVTeIqRihmMpeZ1OZeFIAGVgzO7cI5SZTEehRX1VsYOdRrJwCxLgUx5J3kzJQHYvApyXdjgglGvM0m1xcV4NYNyo5te9OjgJ047EKTcp3M6oq7TgikuBH3BF~btACxhEXOmoqBvg__&Key-Pair-Id=K21X5TGS0ALJI4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 10:02:06",
        "gmtModify": "2026-01-21 03:00:23",
        "completedAt": "2026-01-09 10:16:30",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "ba6b5c1486df4976b04416ea674b7d96",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 30,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 3,
        "parameters": {
            "model_id": "nano-banana-pro",
            "model_name": "Nano Banana Pro",
            "prompt": "一个杯子放在桌面上",
            "aspect_ratio": "1:1",
            "mode": "nano_banana2",
            "image_count": 1,
            "aspectRatio": "1:1"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/939ee65412dd4d7a8ccd67f5f56769fd/inline_image_0_resized.jpeg",
                "format": "JPEG",
                "width": 512,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/939ee65412dd4d7a8ccd67f5f56769fd/inline_image_0_resized_watermark.png",
                "height": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F939ee65412dd4d7a8ccd67f5f56769fd%2Finline_image_0_resized.jpeg?Expires=1769236669&Signature=DqrZR~IAIR6~6J0La9chemNpG1HvPuAsKVYKLuBcHpDzjnsL617EOoOQTIOG3GHhaECM5AFxaOvxFTXb3RE-Jt3CSkd~TvQoj0UM5wKAkYeNQCsXYH4sEZ9auMQFba-dbTTeID2WZKnOIrAeTym8Ijq3jDbomK1fPk8we11SKsA~WRMWqVPlSRolujGGsHlXezXudZkNzsI~TefmlGc~BbOW-TDezbVVwPN9JJ3lpm9VxI3ZWMElpq1A1I0eEjf8w8W3v0XbTUvxFo9fgIO34Kpk~fo5DP4bqErVrSH-TrCfuBOnrf~c4E0dOGaZBSnr5uEtqrbcsa5tPA5hfk1L4A__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "filePath": "analyzed_video/task/object_replace_llm/939ee65412dd4d7a8ccd67f5f56769fd/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2048,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/939ee65412dd4d7a8ccd67f5f56769fd/inline_image_0_watermark.png",
                "height": 2048,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F939ee65412dd4d7a8ccd67f5f56769fd%2Finline_image_0.jpeg?Expires=1769236669&Signature=IN0oRwatubm3fZZMYLqhdEi61V3UYedVJ971rdp6eF9Bi0aebRm8Z1sX6YQ0k4uyy2L3BF1GTC8r9RujMN1eJsrcyHJLMhLm2JoqTo2hAcq4fANbbTuIDNQS8lJEGi9RwwMb7QbQAUwtt7Q5-bOI8SIqawsvi7SVJNhvyg58MZAR5~P4w0HrhUGqHgi3g0pjLNfucdngjSJs2pFAeTUe7mTCqOMskOeQlXv9TrCOMwU2-9DQULNPejhwMXUHLmL5MBMr7nDrj82FE~ms5quZNodkwo9mi6A8GJK6yacgKnVw4bvppXtGzu5TFSzYUwFTTG3NDkehYJscHHUyGSM~vg__&Key-Pair-Id=K21X5TGS0ALJI4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 10:02:07",
        "gmtModify": "2026-01-20 11:47:50",
        "completedAt": "2026-01-09 10:16:24",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "56a8d6bcc8494f10b06ec0d5ac3d407c",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 40,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 3,
        "parameters": {
            "model_id": "nano-banana-pro",
            "model_name": "Nano Banana Pro",
            "prompt": "电闪雷鸣",
            "aspect_ratio": "1:1",
            "mode": "nano_banana2",
            "image_count": 1,
            "aspectRatio": "1:1"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/0f8a93c595b54d32a9807d5ba67af8b0/inline_image_0_resized.jpeg",
                "format": "JPEG",
                "width": 512,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/0f8a93c595b54d32a9807d5ba67af8b0/inline_image_0_resized_watermark.png",
                "height": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F0f8a93c595b54d32a9807d5ba67af8b0%2Finline_image_0_resized.jpeg?Expires=1769236669&Signature=DUD9n7cTrrCFYaIant0Qz9odyBCzin-Ho-JwZSf1TaK2xBegdbvM2LUAusQdTw1-DVuOooZBENoxwql4vxMx9lNcrZYiuk6ikPdZUpOjCdHZRb32i7rRMFtAqCWtgcalVTLPrMsZZJWQdU-5vuXqt3VyDuZfGzPHlFKpUrB-MaHt8dUraQ6dCtfnB1OkqYMFBsnFv6if3OBYyt7U3ZFnFaCZIe8iw-QGyYMVQKMxfTKg5lncNojkP43B-LwI3EWYeTtIMBUWhDtpjz0jqJP1WheFkmt5jgWMZNPvgpCRyOLcF6x4yeGtXEHa3ozZkeTb8myCwVGV7NWK0NjCjU0dPQ__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "filePath": "analyzed_video/task/object_replace_llm/0f8a93c595b54d32a9807d5ba67af8b0/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2048,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/0f8a93c595b54d32a9807d5ba67af8b0/inline_image_0_watermark.png",
                "height": 2048,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F0f8a93c595b54d32a9807d5ba67af8b0%2Finline_image_0.jpeg?Expires=1769236669&Signature=t0GNnHoXpAUZZYNLdRiEt7JU2BTFurCTY0T9IjdNaW6NoZMmPca8w5D9hDYiCeRy5lKu81DMrdQzaeumFuY2~-10qTx8woN5TrH9Yml5ex1pZNK1u~X4HxOSflid~tp1niUvV7FZCUG0gxQSrEkxgRZw6RngrlfcRGmY65r2Ri0Z6whyxKVLU3keQQqeURsvHmY0Sl6O-mdUZgULKxY-HHEFVqCh6v2mk5kUfhJiTyp1lSm3Bw5V1QMNW1buTCpPWRD~9HByR0m48Zwj8TfrRCWYiSWs0O28pU6b~fysPoMIPG1JWPc9T-cSx4daefIfMDcDqtUBVa1HoLhQy23oQw__&Key-Pair-Id=K21X5TGS0ALJI4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 10:15:53",
        "gmtModify": "2026-01-21 03:00:21",
        "completedAt": "2026-01-09 10:17:09",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "ae30e5a486aa4a1984e4820cd2d7d522",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 50,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "model_id": "nano-banana-pro",
            "model_name": "Nano Banana Pro",
            "prompt": "风和日丽",
            "aspect_ratio": "16:9",
            "mode": "nano_banana2",
            "image_count": 1,
            "aspectRatio": "16:9"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/49c4ade377f14396b293ab70fa405eeb/inline_image_0_resized.jpeg",
                "format": "JPEG",
                "width": 512,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/49c4ade377f14396b293ab70fa405eeb/inline_image_0_resized_watermark.png",
                "height": 285,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F49c4ade377f14396b293ab70fa405eeb%2Finline_image_0_resized.jpeg?Expires=1769236669&Signature=mz8L5eBpIH4F~PuiZE2yPJLrNzliKYY4psmyVdvhvsVEAaak9Q9brMjoz0ovph05zUMmyRiYDm4Pbhk9mfE2qjtFrGxtPNq1gQE1sSA4u1wumJDfSGGNNtX0NUWox9r4ZtSPffh2CPnxWzoYvXTwrZ8zS1KRlF6xXsl5~Rew2pEPuZDcXpkfCW6KLofcAH-jV-SQi6xTptbaWAglOtb5ntAARuq0DYd7cxXr1TRrGGq7OgDyQqlXlYRpcUQpIAQqyWKvidzjuY28gNmBS4L5ymtd9KetawTwZMPC7-Tfh8tVvf6uCjs-AUuZKXlB9oGy0iWw-l9Kx5uvXccgjYUrPw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "filePath": "analyzed_video/task/object_replace_llm/49c4ade377f14396b293ab70fa405eeb/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/49c4ade377f14396b293ab70fa405eeb/inline_image_0_watermark.png",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F49c4ade377f14396b293ab70fa405eeb%2Finline_image_0.jpeg?Expires=1769236669&Signature=Cs~78GNwJ9aMDF4NCkUJzaFGCdkZeYpEKO56SL79QhfTJvgBZid3393PwM3YKE1BxyanBjO2oopBE2JsQM0IMt37qPsf4jakyW~Uk2Xp0U7yd6q0SkalOHxQzYrYNHgV9ZA-F3G040N-Zr7WM9teteL0vTOPv4vezaEvORCUSiAf~bLFaQvn6fSSHpGPe8AU3ThboQf7petp9oqvMinnrbGyVwn457XJOgpuxo4HElY5tg5yzQkuUUSGbwHSERwXnhp2Wc9An8V5eKjkksxhI68SXsNUeOKefVQjR0Qud~ljjxYngMHqEONKxqgkYSSFmu9Bno1He-btV5jNbhkZvA__&Key-Pair-Id=K21X5TGS0ALJI4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 10:36:58",
        "gmtModify": "2026-01-21 03:00:18",
        "completedAt": "2026-01-09 10:37:38",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "eb9199923e454c77add8881873184e0a",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 60,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 2,
        "parameters": {
            "model_id": "nano-banana-pro",
            "model_name": "Nano Banana Pro",
            "prompt": "风和日丽",
            "aspect_ratio": "16:9",
            "mode": "nano_banana2",
            "image_count": 1,
            "aspectRatio": "16:9"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/df317ff873344f0aaac13659b6514ae2/inline_image_0_resized.jpeg",
                "format": "JPEG",
                "width": 512,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/df317ff873344f0aaac13659b6514ae2/inline_image_0_resized_watermark.png",
                "height": 285,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fdf317ff873344f0aaac13659b6514ae2%2Finline_image_0_resized.jpeg?Expires=1769236669&Signature=A861t9MsR6zbzImLsdTPf5X4zkDFdBk5xdl7SxcV3o0tUxhRC6hbF3FCJv49aeme6DLWcsPmkxehBEWSj6DrRcPBhVBfJtvN10JyROmbef7~BPx7jh0GZA4EWvrL1kc-DLGFpjmWyui~WTFMEuyhXhREZQybNoewqYbj4FJriPnrnoywnlGNjjZ8wn4RU3awTeu7pARexHYC7GCn0fzywe4BeYrS8DtI3kxHvCJBcFinjpqY7~AXzk61-s~Njf~11sYuDEvfLY4RHaNHquMWtLnt5PEPOxb7bP1Q206IlD2aNgAcWK1QeYf7xC7jUAcqj2QRQb~QU1kHIEW4PXJe2w__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "filePath": "analyzed_video/task/object_replace_llm/df317ff873344f0aaac13659b6514ae2/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/df317ff873344f0aaac13659b6514ae2/inline_image_0_watermark.png",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fdf317ff873344f0aaac13659b6514ae2%2Finline_image_0.jpeg?Expires=1769236669&Signature=kn1nq5-sCcm~qCOe4-G02P1bFWMrP9s-TR0kiXZfYHAbdV2Su-CUxv2dEkY8Mvtx9pq~FpXcyNHzzGhZU7Rq1oEUNEehAN5u4XeewjFKLd2crMJvy9utDpN6BEPRwLdkYT1cZIu-xzhd6tqEe9pgpY43gW7BJCV4S8IA6BiLooBRaAtDXvu~ROEQQQZLPDPhStfCyl9Gyalg95Jovq-bD6C~ofv6SNIX~7j46caFHw6E3YGD5ZExpASSNPH2z7bijHLPa9eIIB2SEjd~Mm1oSK~SbjexexiQgxH4Vz8d28lL16HtqTmfzV3yWjRYRV1rJld~KKf6VVGxytcl4MORHA__&Key-Pair-Id=K21X5TGS0ALJI4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 10:36:56",
        "gmtModify": "2026-01-19 10:22:55",
        "completedAt": "2026-01-09 10:37:28",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "5baeea6c9ea742f7a35a137aab919533",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 70,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 3,
        "parameters": {
            "model_id": "nano-banana-pro",
            "model_name": "Nano Banana Pro",
            "prompt": "电闪雷鸣",
            "aspect_ratio": "1:1",
            "mode": "nano_banana2",
            "image_count": 1,
            "aspectRatio": "1:1"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/8b8553a8435f486588b71fd43d3983ac/inline_image_0_resized.jpeg",
                "format": "JPEG",
                "width": 512,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/8b8553a8435f486588b71fd43d3983ac/inline_image_0_resized_watermark.png",
                "height": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F8b8553a8435f486588b71fd43d3983ac%2Finline_image_0_resized.jpeg?Expires=1769236669&Signature=l-T-u4uwuTPr2ve0uTPHmTiOqw2xcYgwJTvjVcYp7g1U32M1zHKq14u6oLjIaQF7hGBb3OycvTB-MlNjTns9xyV0Po9GrT9sAIduKz7-GzNuRUxDPlrAPCa6nUHpBL1UTMhA-I0TMIqdT~WVH7nYrHqk9PevvMZCJ98jsB1dWxP3wAnG5boctfn6YIXS9JX1N008821gsiJTE7ei1LY4vWGvZ9XpK4I2CBURBNlvn9DRQQGtgttnRPvXFfUjcTaDPDmlAigHTDVzJeJ9Wd8EtSfzalMSFe4ImcRLr0SwuoN6YlYd0r9KfSqIWKzK1LsOp8BvwmHawSxukt7LUnKbOA__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "filePath": "analyzed_video/task/object_replace_llm/8b8553a8435f486588b71fd43d3983ac/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2048,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/8b8553a8435f486588b71fd43d3983ac/inline_image_0_watermark.png",
                "height": 2048,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F8b8553a8435f486588b71fd43d3983ac%2Finline_image_0.jpeg?Expires=1769236669&Signature=oGDxnygUbB5zdbpuMo3-89oltyRoxqu0koCuPWAnFUTh3c8QOaz-k3Wer-DCoGwQWgqzabWX5Lia9DPyK96Ax1w9sVJItqeo1K-1xtVd9WHNsY1-cDQaLjf63FHuKa0u7CsIKdBG55Sx-XqbfqqUA1NC~dR3EOynAOy97JJhpFSDC25BhK1rSm3GSRQNwsEcyJP3njCgA-qPnK1sYGxpMg1qMzFDa-AS-tNhPK68k2-SjrH5Kbx14ZOrXyZebtsjSodGP--dHF~FqK6YtObEfibFg2gqTBrSNt~hDgI3EvPuAWoC9TSl1M7KQBjoi22kQhaWuhIBBg0bzRJRAZgUCw__&Key-Pair-Id=K21X5TGS0ALJI4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 10:15:55",
        "gmtModify": "2026-01-21 03:00:19",
        "completedAt": "2026-01-09 10:17:32",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "e7e9ed25b8df467c92402b0a0157574d",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 130,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "init",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "model_id": "nano_banana",
            "model_name": "Nano Banana",
            "prompt": "今天天气很好，蓝天白云的",
            "aspect_ratio": "16:9",
            "mode": "nano_banana",
            "aspectRatio": "16:9",
            "numberOfImages": 4
        },
        "result": null,
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 04:02:20",
        "gmtModify": "2026-01-19 09:25:20",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "4ce6c2a90b594e5191bede569c01e3c4",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 140,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "init",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "model_id": "nano_banana",
            "model_name": "Nano Banana",
            "prompt": "今天天气很好，蓝天白云的",
            "aspect_ratio": "16:9",
            "mode": "nano_banana",
            "aspectRatio": "16:9",
            "numberOfImages": 4
        },
        "result": null,
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 04:02:16",
        "gmtModify": "2026-01-19 09:25:22",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "0bb431b5278e4cc08e71574ac4cc3929",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 150,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "init",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "model_id": "nano_banana",
            "model_name": "Nano Banana",
            "prompt": "今天天气很好，蓝天白云的",
            "aspect_ratio": "16:9",
            "mode": "nano_banana",
            "aspectRatio": "16:9",
            "numberOfImages": 4
        },
        "result": null,
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 04:02:12",
        "gmtModify": "2026-01-19 09:25:25",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "83792f79533b4262b9ba332a6424d42a",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 160,
        "uid": "O5gN8gltR1E7PFDcFCbV",
        "userName": "qbluo",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "init",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "model_id": "nano_banana",
            "model_name": "Nano Banana",
            "prompt": "今天天气很好，蓝天白云的",
            "aspect_ratio": "16:9",
            "mode": "nano_banana",
            "aspectRatio": "16:9",
            "numberOfImages": 4
        },
        "result": null,
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "O5gN8gltR1E7PFDcFCbV",
        "creditsPayerName": "qbluo",
        "gmtCreate": "2026-01-09 04:02:03",
        "gmtModify": "2026-01-19 09:25:27",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "a30da9baf7f04b34a970aac4821be6e2",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 161,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "user-upload",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "IMAGE",
        "rating": 0,
        "parameters": {
            "fileName": "71-i0T9WWBL._AC_SX466_.jpg",
            "fileSize": 25469,
            "mimeType": "image/jpeg",
            "s3Path": "board/eb7e9efeb118432e8bbc49366c9fbc66/upload/71-i0T9WWBL._AC_SX466_.jpg",
            "source": "upload"
        },
        "result": {
            "originImage": {
                "filePath": "board/eb7e9efeb118432e8bbc49366c9fbc66/upload/71-i0T9WWBL._AC_SX466_.jpg",
                "format": "jpg",
                "url": "https://dr1coeak04nbk.cloudfront.net/board%2Feb7e9efeb118432e8bbc49366c9fbc66%2Fupload%2F71-i0T9WWBL._AC_SX466_.jpg?Expires=1769236669&Signature=Yy6Qoq7sd-MIK0la0KY05G-jLbpM67~vxD8jDSU8MiISN47gkREJX3-nxcr-ZJwmeLP6i761k6JHp0QhJlSkviw-aHpStVlbOG7p76eY4524VX6AFHHtXW4RQFwe5WbIat-pfhs2ZjRJFl0jRfSXLtmfA~7f07EQ4Us4WB84~5ak139gvYGoxRDInWgzwND1Gqcrtx4N41T82HSQ2DAHT-eAZVAT8DJjt6WTUoUHKgSPbGnIyS1cXWQ5YcjKrM18hK8X4AJ9k1eJtoXHMmGHaY2FgvA4kd~S0BoikSKySzaniSrAMQg3kTGNdHN1gVX~wLkq83ctBupNiBMUdwUg1g__&Key-Pair-Id=K21X5TGS0ALJI4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-20 13:54:49",
        "gmtModify": "2026-01-20 13:54:49",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "47ed2aa5cd9240ee9a3479ae08588160",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 162,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "user-upload",
        "toolCategory": "video",
        "status": "success",
        "mediaType": "VIDEO",
        "rating": 0,
        "parameters": {
            "fileName": "20231116-150621.mp4",
            "fileSize": 326943,
            "mimeType": "video/mp4",
            "s3Path": "board/eb7e9efeb118432e8bbc49366c9fbc66/upload/20231116-150621.mp4",
            "source": "upload"
        },
        "result": {
            "originVideo": {
                "filePath": "board/eb7e9efeb118432e8bbc49366c9fbc66/upload/20231116-150621.mp4",
                "format": "mp4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-20 13:54:50",
        "gmtModify": "2026-01-20 13:54:50",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "8f1dad98f2944ad4ae6c5b1ae2c7e54f",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 163,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "user-upload",
        "toolCategory": "music",
        "status": "success",
        "mediaType": "AUDIO",
        "rating": 0,
        "parameters": {
            "fileName": "1702713892000_67tool.mp3",
            "fileSize": 134417,
            "mimeType": "audio/mpeg",
            "s3Path": "board/eb7e9efeb118432e8bbc49366c9fbc66/upload/1702713892000_67tool.mp3",
            "source": "upload"
        },
        "result": {
            "originAudio": {
                "filePath": "board/eb7e9efeb118432e8bbc49366c9fbc66/upload/1702713892000_67tool.mp3"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-20 13:54:51",
        "gmtModify": "2026-01-20 13:54:51",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "97f91bba461a46918c9e514d372833fb",
        "boardId": "eb7e9efeb118432e8bbc49366c9fbc66",
        "sortWeight": 164,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "user-upload",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "IMAGE",
        "rating": 0,
        "parameters": {
            "fileName": "banana_pro.jpg",
            "fileSize": 9029,
            "mimeType": "image/jpeg",
            "s3Path": "board/eb7e9efeb118432e8bbc49366c9fbc66/upload/banana_pro.jpg",
            "source": "upload"
        },
        "result": {
            "originImage": {
                "filePath": "board/eb7e9efeb118432e8bbc49366c9fbc66/upload/banana_pro.jpg",
                "format": "jpg",
                "url": "https://dr1coeak04nbk.cloudfront.net/board%2Feb7e9efeb118432e8bbc49366c9fbc66%2Fupload%2Fbanana_pro.jpg?Expires=1769236669&Signature=Pt7rTEFovjTbkr4QvIsyCCimB31ae1T1ILVb-NMo3uJp78yJFbXCCMRuN1HWrbyfANMJEqv0e2-FeAmtIUSTxqjx5NYoIXC7lkBfV5uGi9BmXGhwLD~7LVWU2zue-ytj7PRlAmj03B4nXZroF9cN2QPWFzlA~Uk9XZInxR0Bs674PaCTpv2~6lrkpywMv7ktHrRtG7yOLWNER2y7wKQeLyLRVlivIYhKhyyQTg~5PJNH~E0oGaR3frpZym0fxdgXtR0orkW~HsJbZCssJLgKoX9ojRIYM1FKA4FMY0oJtWtP3x4P8kcQYfYdRFXYHHP-ZPU6GkdT-I5LWNZc-ujcMQ__&Key-Pair-Id=K21X5TGS0ALJI4"
            }
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-21 02:49:39",
        "gmtModify": "2026-01-21 02:49:39",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    }
]

## 构建命令

pnpm install
pnpm --filter @tc/infinite-core build
pnpm --filter @tc/infinite-widget build
pnpm --filter demo dev
