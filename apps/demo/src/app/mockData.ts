import type { RawDataItem } from '@tc/infinite-core';

export const mockData: RawDataItem[] = 
[
    {
        "taskId": "e79da41e750c4427980e63887e062db5",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 24,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-to-video",
        "toolCategory": "video",
        "status": "init",
        "mediaType": "video",
        "rating": 0,
        "parameters": {
            "boardTaskId": "e79da41e750c4427980e63887e062db5",
            "duration": 10,
            "imageMode": "singleImage",
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/77b6360b39be4b34a28660204129d29b/image_0_0.jpg",
                    "name": "firstFrame"
                }
            ],
            "modelId": "kling-v2-6-pro",
            "positivePrompt": "让Kiki 再天空飞来飞去，镜头由远到近",
            "taskType": "imageToVideo"
        },
        "result": null,
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-27 02:38:47",
        "gmtModify": "2026-01-27 02:38:50",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "819d705e974c4a9c8606b34ba052c718",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 23,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-to-video",
        "toolCategory": "video",
        "status": "init",
        "mediaType": "video",
        "rating": 0,
        "parameters": {
            "aspectRatio": "16:9",
            "boardTaskId": "819d705e974c4a9c8606b34ba052c718",
            "duration": 10,
            "imageMode": "singleImage",
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/77b6360b39be4b34a28660204129d29b/image_0_0.jpg",
                    "name": "firstFrame"
                }
            ],
            "modelId": "gpt-sora2",
            "positivePrompt": "让Kiki 再天空飞来飞去，镜头由远到近",
            "taskType": "imageToVideo"
        },
        "result": null,
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-27 02:35:28",
        "gmtModify": "2026-01-27 02:35:30",
        "completedAt": null,
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "6dc88c57f4b34cfeb2a8dc7719db2503",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 22,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-to-video",
        "toolCategory": "video",
        "status": "fail",
        "mediaType": "video",
        "rating": 0,
        "parameters": {
            "aspectRatio": "16:9",
            "boardTaskId": "6dc88c57f4b34cfeb2a8dc7719db2503",
            "duration": 10,
            "imageMode": "singleImage",
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/77b6360b39be4b34a28660204129d29b/image_0_0.jpg",
                    "name": "firstFrame"
                }
            ],
            "modelId": "gpt-sora2",
            "positivePrompt": "",
            "taskType": "imageToVideo"
        },
        "result": {},
        "errorMessage": "Failed to generate video, error: Failed to generate video using gpt, error: All providers failed: Failed to submit async task: HTTP Error: 400 Bad Request, response: {\"message\":\"prompt is required\",\"data\":{\"code\":\"invalid_request\",\"data\":null,\"message\":\"prompt is required\"}}; Failed to submit async task: HTTP Error: 400 Bad Request, response: {\"error\":{\"code\":400,\"message\":\"prompt 参数不能为空 (请提供 prompt 或 messages 字段)\",\"type\":\"invalid_request_error\"}}, task_id: 2c49af8ce2474054bc1f6bdc110c3185",
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-27 02:33:51",
        "gmtModify": "2026-01-27 02:34:15",
        "completedAt": "2026-01-27 02:34:15",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    }, 
    {
        "taskId": "1b96e477cd514b46bcb7f172ed154f20",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 21,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-to-video",
        "toolCategory": "video",
        "status": "fail",
        "mediaType": "video",
        "rating": 0,
        "parameters": {
            "aspectRatio": "16:9",
            "boardTaskId": "1b96e477cd514b46bcb7f172ed154f20",
            "duration": 8,
            "imageMode": "startEndFrame",
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/77b6360b39be4b34a28660204129d29b/image_0_0.jpg",
                    "name": "firstFrame"
                },
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/23f1061e1d164de4b07ea18ce59bbee0/image_0_0.jpg",
                    "name": "lastFrame"
                }
            ],
            "modelId": "gemini-veo-3.1",
            "positivePrompt": "",
            "resolution": 2160,
            "taskType": "imageToVideo"
        },
        "result": {},
        "errorMessage": "Failed to generate video, error: Failed to generate video using gemini, error: Prompt is required for video generation, task_id: cdf5367d669c457fbf27f6791d75b642",
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-27 02:29:30",
        "gmtModify": "2026-01-27 02:29:37",
        "completedAt": "2026-01-27 02:29:37",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "fb2d4402ee8240f68aead55ea79d9bcb",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 19,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-edit",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "aspectRatio": "9:16",
            "boardTaskId": "fb2d4402ee8240f68aead55ea79d9bcb",
            "imageCount": 1,
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/e546849e6bc048178adcbff49d87721c/inline_image_0.jpeg"
                }
            ],
            "mode": "nano_banana2",
            "prompt": "背景，放烟火，变成晚上了。 ",
            "promptEnhancementStatus": "Auto",
            "type": "imageEdit"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/d350bc47ecbc400fba7d6a8e84d2d076/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/d350bc47ecbc400fba7d6a8e84d2d076/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 512,
                "width": 285,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fd350bc47ecbc400fba7d6a8e84d2d076%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=We0ES~WGHc8o4lC-Jp4nf~fYLCcvg1CaBNnSG~-ka2tZBElqEXn7tMRrm5JSoqJS~ril6IYOJtQtiHhKqfH960z8wG184a7Z9wsTHk5XJfa93Oen15zyY3Nb4wBjbFEp7FfBRV82KllrwMQxMZIrrt8YfewZhBCXbvXX45lyNAWcoQJTNSqU91zNHB8ac9AsN7jqEaVtl7kXkr0NzkPk9-tjI4aanHuIbPgM0m01Uy24gP0il6KARztl-2Q2w7eKNZatvdp~-zx-VAfEVGyZ0tIl72pOL4Pe5XDty2bqP0bI0XhW0g9~skz2gBx8PGksgi8X1KYJFoLTHV4xY3hOtA__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "ece884885c0a45cfacb10db7c8a92222",
                "filePath": "analyzed_video/task/object_replace_llm/d350bc47ecbc400fba7d6a8e84d2d076/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 1536,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/d350bc47ecbc400fba7d6a8e84d2d076/inline_image_0_watermark.png",
                "type": "image",
                "height": 2752,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fd350bc47ecbc400fba7d6a8e84d2d076%2Finline_image_0.jpeg?Expires=1769688935&Signature=mE2gRYufjynBOJ6gxnZxXUnrDJXyQUC8~nbimbJHIQL1DmbD89aZm3fxMeJyGIa2zDE7sM0LIc7WcteLdzTOzppCbI4dHj~387ncYQxWW8repwRf2GoFPNknxjN1Ufb7dXj7RPKkT7tK-iSqSFiNtu07aMsDWL8b3EF2~it6Fbp5Hpv1QvnUsmtafpkG3SW~ra1fsLK3wXRjWyT9JnIQJFSJdRDmxO0KkTl1NFzVe7Ja7aTgEKmnBQgTDwQU~bcEvjfgfZ1nMQvXlV17E-hms4uEyqRfNoNr4XWOlXCGH5twKT6xQnTYizmRUPRX4CmIS96dPWh0yszhK~66Oenr3A__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "ece884885c0a45cfacb10db7c8a92222"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 11:18:09",
        "gmtModify": "2026-01-26 11:18:57",
        "completedAt": "2026-01-26 11:18:57",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "e55d51495f83455586ee90a2d1aaf557",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 18,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-edit",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "aspectRatio": "9:16",
            "boardTaskId": "e55d51495f83455586ee90a2d1aaf557",
            "imageCount": 1,
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/e546849e6bc048178adcbff49d87721c/inline_image_0.jpeg"
                }
            ],
            "mode": "nano_banana2",
            "prompt": "背景，放烟火，变成晚上了。 ",
            "promptEnhancementStatus": "Auto",
            "type": "imageEdit"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/3779cf18c6474766889e0f9094633b99/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/3779cf18c6474766889e0f9094633b99/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 512,
                "width": 285,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F3779cf18c6474766889e0f9094633b99%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=glyk6tLKIq33ALLsszazgsshloYEc-MG4U09zJ3aXSkPJe~Xk5T4CNcqVeMYd13tEfFnJWCL5tZxA41Kzvgq--ki2pGl-wX8UMRjpDMhtl12ULRHGQPxnw43TEDuyok8pOFa~JwrbDo-Ok672-jXxDfRorcAX12sH8AKO9qxQzqmB8geW-UwBdMiwnJx-xRKI4Xfktn~Vezb2uHwPJSVsYO7d1PHPspOjLtjgYOF~nFr6UbLBIc4RlyA5jEebKsuPXtQFeM39Fw5hvjTfPphQ81wZNNMp0w5LbgJ8Ldf3FU9aXwH~xlyCLusUKi403s8OWeqLQ-FwcobGQw~brJK3A__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "84b95d205955448fbd8c1885b8f5f0f8",
                "filePath": "analyzed_video/task/object_replace_llm/3779cf18c6474766889e0f9094633b99/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 1536,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/3779cf18c6474766889e0f9094633b99/inline_image_0_watermark.png",
                "type": "image",
                "height": 2752,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F3779cf18c6474766889e0f9094633b99%2Finline_image_0.jpeg?Expires=1769688935&Signature=emofOCfD1OgLYg3zSffBS9-X6Ye8lojSJfKng~cqaHkTfHdUp0hr9r7SYiRosagJ~7TYD3tWk292kdFD5mfLTbIL4e~Rsd41KyDQ~Et9DBx2L5iJwHZeRYtehiCyNqMcN41Z3IzYlxAzvM1-27ME~cz80-XRcaz5VAAzVJdUscJNckMvC-U1-cX1h90aYV0TvWbg9~FgFGfO4bUXZM3pwvt3s2vM~HGOOueSNu0SwL9T4p6dFE~fPwUQWcI4XqwuaAYxIXeIA4L4EoSra-FaNuMD8Anz2IvqEMwaGny3Gg3pIObOmuXLdox6CYLg7FmxMmHT-XePP5IbfbBa5hF1hw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "84b95d205955448fbd8c1885b8f5f0f8"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 11:18:08",
        "gmtModify": "2026-01-26 11:18:59",
        "completedAt": "2026-01-26 11:18:59",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "cee36e8c59154ee5ad90075c0cf69192",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 14,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-edit",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "aspectRatio": "16:9",
            "boardTaskId": "cee36e8c59154ee5ad90075c0cf69192",
            "imageCount": 1,
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/f0d9a9571da24c839051e8f81e6a8d1d/inline_image_0.jpeg"
                }
            ],
            "mode": "nano_banana2",
            "prompt": "夏天的感觉",
            "promptEnhancementStatus": "Auto",
            "type": "imageEdit"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/23f1061e1d164de4b07ea18ce59bbee0/image_0_0_resized.jpg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/23f1061e1d164de4b07ea18ce59bbee0/image_0_0_resized_watermark.png",
                "format": "JPEG",
                "height": 285,
                "width": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F23f1061e1d164de4b07ea18ce59bbee0%2Fimage_0_0_resized.jpg?Expires=1769688935&Signature=l51Z~kA6iki1o-O7W71GCB0dnTkD7fn2F48~yI4RQ4dBxwI0DerEHBKI9mbC5Oz2h89e~R9IhbiQ8MT2G4sF07MHo9w8Mk3qbEq8dHJ1ai7Nh55QrF58bVFXArMV2cPns1NTC8nk7TPbTU7X9FO2tS~mENwa73vUk~KJbPsENVOKt-pbDRj3kuBRMhJZy0MV7AJFNy9uNg807rAKp7pBOvOd~ExOJXttb5jZw7pGFdfmtT3gEKlHwCQ0moafSOmWP4A1pbNRJE13nENEEznpqaUuotwL~tGqVVPqrz0ZCAInoVF6L~fc3puZ6nME1HUiNtUHxrkU3EsJykHWMxOsaw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "3398ab5cc4e746b781702b1652ad5486",
                "filePath": "analyzed_video/task/object_replace_llm/23f1061e1d164de4b07ea18ce59bbee0/image_0_0.jpg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/23f1061e1d164de4b07ea18ce59bbee0/image_0_0_watermark.png",
                "type": "image",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F23f1061e1d164de4b07ea18ce59bbee0%2Fimage_0_0.jpg?Expires=1769688935&Signature=ePqyyoLqGAGBoPOT2eWCGbAQoi6GMKxfozTqf9SLB0uR56ROCMNJ1X6fZUTejawBWxMsfjw0jLFeY9LEZXnr3RMHjLyJEeAv4Czt~nsEOw5bXWBsmTa4cjrbXvPmxlyV3K2pEwGa-UFcFbPC-NgrLMc91WREUmLPoymWI0DTxsTyht~Kx-~kPTDxEWOwlewJ3ZkkERtIlPUhYZ94ZuRW5HUDAjT-Z3eJBRoxCC93Go2S1Du3OkDXA-p6xBI7ahsHomo-hwQrlqLjn8Iwy8V2BIRurULEYc-yFJHkDQUMwl0OBjwm~uIsoP3C4EPjTKrnL4FrAZ0kNfUcYeTlXEbjnA__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "3398ab5cc4e746b781702b1652ad5486"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 10:16:59",
        "gmtModify": "2026-01-26 10:19:03",
        "completedAt": "2026-01-26 10:19:03",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "079508df2f7e4041bce523274e3c5852",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 13,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-edit",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "aspectRatio": "16:9",
            "boardTaskId": "079508df2f7e4041bce523274e3c5852",
            "imageCount": 1,
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/f0d9a9571da24c839051e8f81e6a8d1d/inline_image_0.jpeg"
                }
            ],
            "mode": "nano_banana2",
            "prompt": "夏天的感觉",
            "promptEnhancementStatus": "Auto",
            "type": "imageEdit"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/9e5afd69303e494fbde4d9f815e6dfb3/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/9e5afd69303e494fbde4d9f815e6dfb3/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 285,
                "width": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F9e5afd69303e494fbde4d9f815e6dfb3%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=hQyWSrnwloHI35MWDI-ZxagoJIn3zP5UUhsOeHQrjaqFP5ZrW5mH2KzrakQ6YNNDg1qnnr1YOfMt-TLrB4Gqg74hP30KHkmuE0W3rPzd4XAdQ1DsU5Uj5XpxdjUDWOlAhAAE9j2VliIims7wVfOmLspYGglKO59LCRzqJkrXqzrLBJtl2CTIlFhOKQT~jKcslBnHVmX4nYf8KH-37GkQbFMBccA-Z7vZ1QSWA3h2RPzkwHrtUlYLalt16RW42eW5vEMvw3PiRnccTAktI1I~Dm0hss95wWREJp9mkdrx6wY7cJ2RDR4A8H55WtNcZErDQlz9BKov3RHbtO3nOQxyCw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "c62f0cf065a541b19bc28d0bb957ff30",
                "filePath": "analyzed_video/task/object_replace_llm/9e5afd69303e494fbde4d9f815e6dfb3/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/9e5afd69303e494fbde4d9f815e6dfb3/inline_image_0_watermark.png",
                "type": "image",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F9e5afd69303e494fbde4d9f815e6dfb3%2Finline_image_0.jpeg?Expires=1769688935&Signature=nlJxSH7E7cr2OCQskMhY109ERdw0qn~Nr4oORV4PZwG~RIMe6PSt8a37iYzY~1xtWoyWMU5sGGtxrEHkchrcHqGrb6TKv3prVxy3DwRi1j9l40zyQ0ZJZnVgul4dy0ENa0c~~o2XOnAntxwWODydr83DHhbeNOdQZttYXACHDxnTWy8u3cnlzP6c1GAYLAmEhR2TVgwU7Iwn4qsg4UsTMEHWHV0kDMGbEVOhHlLWKjXl4jjf9Kr53l1i0~-jfzG~eS7OjgWnwOHMcN9~lCDYhLUXUfOTNyjB57rsKo7UScjMCHu-LWpgL7oPqlJEqcdhOuw69ugsLA~mBjENRFl3QQ__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "c62f0cf065a541b19bc28d0bb957ff30"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 10:16:58",
        "gmtModify": "2026-01-26 10:18:39",
        "completedAt": "2026-01-26 10:18:39",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "c26c2780f15e416dadd6da594b9cba4e",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 12,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-edit",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "aspectRatio": "16:9",
            "boardTaskId": "c26c2780f15e416dadd6da594b9cba4e",
            "imageCount": 1,
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/f0d9a9571da24c839051e8f81e6a8d1d/inline_image_0.jpeg"
                }
            ],
            "mode": "nano_banana2",
            "prompt": "夏天的感觉",
            "promptEnhancementStatus": "Auto",
            "type": "imageEdit"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/c9273ea7c3a346cea00ceba605c616e6/image_0_0_resized.jpg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/c9273ea7c3a346cea00ceba605c616e6/image_0_0_resized_watermark.png",
                "format": "JPEG",
                "height": 285,
                "width": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fc9273ea7c3a346cea00ceba605c616e6%2Fimage_0_0_resized.jpg?Expires=1769688935&Signature=I2yLLMPMr6dsC9yunw3gNbKd~YSC3k9prKZYqP-tqOHyPo~A7dbnSB2NaVc31bHO-X4kpE4NNH6VFufbqOuvtnXutvnpsFEAn4qOF2742GDc4erh7aJ53yV0J~HW5a92r-2GcPaFlytBUa9Slo1~8HBX6L4XxY~kZqsmtBSQ~HJ7tZi4bddGXhdDyFCUYGXIspu3JxzLkk3ttjH--SQ1TR7rpGVFIXH-bs7upniAAnfn629xC~MO1KLbUNQkL1pbQ4WkdGfFvKRX2QzWSpX6~n~G-lihpL6OvkwypTRHMEttiHNhzzCVdNXHCT6ubFGXzh3Exl1MI6LgTbOjWQvu7w__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "dd6769d3d0a2431187988d62e3fddf48",
                "filePath": "analyzed_video/task/object_replace_llm/c9273ea7c3a346cea00ceba605c616e6/image_0_0.jpg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/c9273ea7c3a346cea00ceba605c616e6/image_0_0_watermark.png",
                "type": "image",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fc9273ea7c3a346cea00ceba605c616e6%2Fimage_0_0.jpg?Expires=1769688935&Signature=f-exOAUYbGiWD6xo7AlrAj0-c-7fK2kzwXHX7D7aEOX4whRH~7C2pZIoLHsIbCWH0vY6A0W3MVA7Qg56JOJLMBkVMuFd20q51~CtOomwZlk1fmy-VRPSAJuWeciCxS~D~Gpx51Cy~T8XrG4Tkfkg7PQS7L0GPBSyrfSPaCiw-D76VFu4ScbaJbI0TZF-zoe3bBRhtpThN3nJ5DQU6z2xx9jGjGRabsho6Q8JSVGXxOTtXPw1A6WUZnZXdjvaWZADtx3Wq-KNSW4GZvVGlzMgV-DD8tHRTP9kEzZbNXa8pEDFX35CG~BqV6wnMXAa1zaRC7QGW3RR67kL2NpGZpx1UQ__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "dd6769d3d0a2431187988d62e3fddf48"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 10:16:56",
        "gmtModify": "2026-01-26 10:18:11",
        "completedAt": "2026-01-26 10:18:11",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "c26a695aeecd4ba08f0c399c7da95e92",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 11,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-edit",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "aspectRatio": "9:16",
            "boardTaskId": "c26a695aeecd4ba08f0c399c7da95e92",
            "imageCount": 1,
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/baaae2f41daa48258fbd660fac5ae543/inline_image_0.jpeg"
                }
            ],
            "mode": "nano_banana2",
            "prompt": "Sunset feel",
            "promptEnhancementStatus": "Auto",
            "type": "imageEdit"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/f0d9a9571da24c839051e8f81e6a8d1d/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/f0d9a9571da24c839051e8f81e6a8d1d/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 512,
                "width": 285,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Ff0d9a9571da24c839051e8f81e6a8d1d%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=VKmRK1HGYncAziAubjTB-HS-h6tWoLba1CJFLh~UJJnlfhNTlnz3Qv38RSIviEZQKunFhNqAvARoBHtRFmTBrqmPiOQUBSFeB~sNwBWxlRrx4C8NGCWs9shZcRUfu~jGZzFerYUEWobd5mlESpNOR9TAyYgqQ56CS7AE54IeX-HMToZJsw6oHGshcmfiuv3TeLWUiTRojgPDOfWVnKTJ5hg4fQGcSarksfWzMZlX1Ime8U74IuIys8a5aeGFUTxHm~e0R7~m7aa3KGlUsiJ5zT9ZvGAWLPiPxXomQMPzycmB5zHtPeEGpt-EBtsX6R8ZdGsoZ1iieP9SINm5AjNdpw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "ca49af04a2fb49e89310bf53aa6e4623",
                "filePath": "analyzed_video/task/object_replace_llm/f0d9a9571da24c839051e8f81e6a8d1d/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 1536,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/f0d9a9571da24c839051e8f81e6a8d1d/inline_image_0_watermark.png",
                "type": "image",
                "height": 2752,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Ff0d9a9571da24c839051e8f81e6a8d1d%2Finline_image_0.jpeg?Expires=1769688935&Signature=jMgc-SBpHbWxvu0XVf5XfisjibcDEWNnVYSLVycSDbSBVzoDBatVQkQfrsNBvHaQAB1T1TYgNKGtYqc4h~paZVSozP2ggG9Z4yXEOF3tvPcED9n21t4PIw~kdz5sE4aUJ3cCuNoz2vwcEXclsGaW1yGeRl97CK19ZcwUWMJsvH1dTth1JccPD15SrO9EaIjhwecEeQ2DkF9iZi8YQ5MJJohqMul9H~gqZSQY3B~aTq7tpp0yRuZ1mC-c9zebQqTxpIWr9yrnWL8mlaMcgpMyyEFn1wzypdmlnVVO~NpV0OFjx0zICJIZWAa-l9KFE4DR9cHBKInFIJRystXbSZdyyw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "ca49af04a2fb49e89310bf53aa6e4623"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 09:10:00",
        "gmtModify": "2026-01-26 09:10:53",
        "completedAt": "2026-01-26 09:10:53",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "ccffb056275d4cd5b00327351ef7cc49",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 10,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-edit",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "aspectRatio": "9:16",
            "boardTaskId": "ccffb056275d4cd5b00327351ef7cc49",
            "imageCount": 1,
            "inputImages": [
                {
                    "inputImageS3Path": "analyzed_video/task/object_replace_llm/baaae2f41daa48258fbd660fac5ae543/inline_image_0.jpeg"
                }
            ],
            "mode": "nano_banana2",
            "prompt": "Sunset feel",
            "promptEnhancementStatus": "Auto",
            "type": "imageEdit"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/e546849e6bc048178adcbff49d87721c/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/e546849e6bc048178adcbff49d87721c/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 512,
                "width": 285,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fe546849e6bc048178adcbff49d87721c%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=pbikMrdunqJpzTYe7xyr6N0JsDzaI2OM~j77AJaqqU-6NI-9w7v4YU~HD91mmhq1JUCLP2qh8t4rQJkVQe8PMpeDon-CTgBgGJngUU7NEAlAXWpwWV7vFLaDx-Ne0WtHEwJ9PPYvoNS0F99AImiACgpFjr3N2Qi-1icRzTLRNoSZazOV3trIEYLBaE~-n74K1YGivve8Zsa003Xpb93euR0S5PMe7hoBe0gYrX8XczXQ0O5FV2lz-3CRZYM0fvgQ9D8RtHBnEAYjx7xitLCmbxs8JgRjMk1ATFtRyj7KaLC9HUicq-dVj0ZffLQVcFXJXuuZwUTtQRqqAv7aNboobg__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "71143cf60edf42068154f25c285dfe73",
                "filePath": "analyzed_video/task/object_replace_llm/e546849e6bc048178adcbff49d87721c/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 1536,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/e546849e6bc048178adcbff49d87721c/inline_image_0_watermark.png",
                "type": "image",
                "height": 2752,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fe546849e6bc048178adcbff49d87721c%2Finline_image_0.jpeg?Expires=1769688935&Signature=rm-Yk6-xqxCG2NC7j8HI8k7k8kZuRVeHDBbjnMTct2VsjRiakjOfyQXi-folWyqMISq1mgVQQzJTvK0PBqsJuJ~78LH5QYE1eqGc4HAuuW6FkzRt6WLVqmXIc6uxQJXhHX52g2-Jz3pbhj9rwRbtzSMvLO9SQ~HXMk3WkTAQ5uEUxIk8to~Pyfx4HsirHjMj0Tn0k6vF7Nrv3Zzlm4lQv923eMyRh6hfJW1s6SNTRqqx7pqxGCknmkc6HMyoMbC3PSiFbNnZhtY55eJXuCykICdMRSwsJiRlpJUWm9Rrty5F-MfmNljVzmdrAchS7Zxc1oEGrMjGUreMfecGjfdYbw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "71143cf60edf42068154f25c285dfe73"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 09:09:58",
        "gmtModify": "2026-01-26 09:10:49",
        "completedAt": "2026-01-26 09:10:49",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "333a34a8085c49b1ae5fb3fdb1d454f4",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 9,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "aspectRatio": "9:16",
            "boardTaskId": "333a34a8085c49b1ae5fb3fdb1d454f4",
            "imageCount": 1,
            "mode": "nano_banana2",
            "prompt": "A cinematic, hand-drawn anime-style scene inspired by a gentle fantasy world:\nA young witch girl (Kiki) flying on a broomstick while delivering goods. She wears a simple dark-blue dress, a large red bow on her hair fluttering in the wind, holding a small package tied with rope in her arms.\nBelow her is a European coastal town with red-tiled roofs, stone streets, small harbors, and sunlight reflecting on the sea.\nThe sky is bright blue with soft fluffy clouds, visible wind flow lines and light particles moving through the air, creating a strong sense of motion and freedom.\nWide-angle aerial composition, dynamic perspective, subtle motion blur on the broom tail to emphasize speed.\nWarm, soft lighting, bright and clean color palette, peaceful and healing atmosphere.\nStudio Ghibli–like hand-painted texture, detailed background, film-quality lighting, emotional, nostalgic, and full of adventure.\nUltra high detail, cinematic frame, 35mm lens feeling, soft depth of field, anime movie still quality.",
            "promptEnhancementStatus": "Auto",
            "type": "textToImage"
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/f1235c1f1cd74551a0e77aa47b86e87d/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/f1235c1f1cd74551a0e77aa47b86e87d/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 512,
                "width": 285,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Ff1235c1f1cd74551a0e77aa47b86e87d%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=vSNHdXvSHULycLkzlR97jrlQUAeXL5ZhrpuTYWazkJUgM6QPYuHrl~dcpAob1P9KrYK~bCXJzABUrdhgADg4mE1euXKzBpQiT0SfRkbUelSSj6gyZb8EgLT1lqBR2aEaM8gM9ZIxu7S4nDnf58CBmNk8aMP98JyJ9nzYbTnsQyQW4AMWXxQCpWN9XyULBPxguvlf3U1yIJ9Y0vaVH6Or~sh62op0dMkl2LvLg6c6ul7pJYf-opNtg10L8Z~yEZ7-dsA5c7nhZhVFkYca9nXGSFBPwCs8w8MdG0XVYErRU4FQeZ40KzP-Chpz8b83L7SCczUkvA3RoHFyRyMsv7a81A__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "025291947fbc4f34a6c3bc314230097e",
                "filePath": "analyzed_video/task/object_replace_llm/f1235c1f1cd74551a0e77aa47b86e87d/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 1536,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/f1235c1f1cd74551a0e77aa47b86e87d/inline_image_0_watermark.png",
                "type": "image",
                "height": 2752,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Ff1235c1f1cd74551a0e77aa47b86e87d%2Finline_image_0.jpeg?Expires=1769688935&Signature=iZ-l9WrQVi3X7X7BTUmEnFn3J3bwzc8v8gkl5Fwr~~VuLPFGqyLjjvyfvYlvUn-ZZERAoK3NUC4nmT8H676IndyVWxdT4wqVSfh582Gu5l1AqYNAH5s9PmTRboXyco2Bo-FlUnOlZyGWFUzKy4AyuqIidPo81Qy2nIs8D5Qjb8RpO2B6iThvRzTX6cJ8kfsROh1QE~CACydxjnD3-1Ndr55ZSJQ~zmbGKaMKUmpfx8gGLFSB9Oec~JkRDCGg8l~QRKSLRYjpGtd5o8lZ64~exJSDLlar4cxkEMY~-5zPs66jqmukehnbpg85lScA7MsYAj~Ncxrf3uvM7Rr0S1IbuA__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "025291947fbc4f34a6c3bc314230097e"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 09:02:09",
        "gmtModify": "2026-01-26 09:03:12",
        "completedAt": "2026-01-26 09:03:12",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "936224b0d6f5404db3a7fcbf31b6f508",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 7,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "mode": "seedream-4.5",
            "imageCount": 1,
            "promptEnhancementStatus": "Auto",
            "aspectRatio": "9:16",
            "type": "textToImage",
            "prompt": "A cinematic, hand-drawn anime-style scene inspired by a gentle fantasy world:\nA young witch girl (Kiki) flying on a broomstick while delivering goods. She wears a simple dark-blue dress, a large red bow on her hair fluttering in the wind, holding a small package tied with rope in her arms.\nBelow her is a European coastal town with red-tiled roofs, stone streets, small harbors, and sunlight reflecting on the sea.\nThe sky is bright blue with soft fluffy clouds, visible wind flow lines and light particles moving through the air, creating a strong sense of motion and freedom.\nWide-angle aerial composition, dynamic perspective, subtle motion blur on the broom tail to emphasize speed.\nWarm, soft lighting, bright and clean color palette, peaceful and healing atmosphere.\nStudio Ghibli–like hand-painted texture, detailed background, film-quality lighting, emotional, nostalgic, and full of adventure.\nUltra high detail, cinematic frame, 35mm lens feeling, soft depth of field, anime movie still quality."
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/0882949ef4e54ae88d83b20d2957f18d/0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/0882949ef4e54ae88d83b20d2957f18d/0_resized_watermark.png",
                "format": "JPEG",
                "height": 512,
                "width": 288,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F0882949ef4e54ae88d83b20d2957f18d%2F0_resized.jpeg?Expires=1769688935&Signature=NnH2S-uGeQZ~QchjbTR81FMPm61FG6NgH1L3Txnr-BJztTwq8bgrkH63Q39FFbeogTXj70qNpO4FpdMHh-P0q8CPYQug13TtQPNwNWkQ0uwd2TEuIQkFLPJlwu~J4ut9qSxCP5vvd30AzSUAX0QJdU8qm0MhPGtLaj0ajf8iZwG46IneKVczWCSd-t9YS-knerRoiD4FtvKXXs67BVDyI~rrQfwpnjXIlZBgLnrlJj1yURXAtz6FG9sPr64QOiSchFnGTCdDK~HSNdhUWZVtakpuecPTZmfd6YsihyXXOmmoPdeJ~RHE4HcV~VMOaioiCbuIFbcvHheTCpx605TECA__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "5090479db8654246bd82dd47aa501710",
                "filePath": "analyzed_video/task/object_replace_llm/0882949ef4e54ae88d83b20d2957f18d/0.jpeg",
                "format": "JPEG",
                "width": 1440,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/0882949ef4e54ae88d83b20d2957f18d/0_watermark.png",
                "type": "image",
                "height": 2560,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F0882949ef4e54ae88d83b20d2957f18d%2F0.jpeg?Expires=1769688935&Signature=fTRgz3mV8U6CqdIL3kQqZEYpoVykyl1efnKBSBIPXOKVXzwlWwIffTn157DVelgNfIFawo7UCVfaxqbj4OmHV50C9pAf5y~-m3R0TJB~8RJ62h0Ip5J90xhLoO7amJnhrcfWOhnizfJeR4-0nYDMrEtDsY9cok5mb-VZOTYFlvch~2KUZ8NNrIUhJHGcsS3K2FwOdEYZNTMXeVXrGxa1WEM3zl7OJK9rHeufH-T0yr5QNGfHZni4qqQrlMhyu5qQfzashQ5WlSFIgPEVwWi7cZJ2P3gLrTliOJPLi5D4DXKb5l5WP6TGxoklFNTW9ivww4NoITYvi3DDqBaLcBuG5Q__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "5090479db8654246bd82dd47aa501710"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 03:53:37",
        "gmtModify": "2026-01-26 03:54:03",
        "completedAt": "2026-01-26 03:54:03",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "d91241f361b648aeba86e18387248459",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 6,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "mode": "seedream-4.5",
            "imageCount": 1,
            "promptEnhancementStatus": "Auto",
            "aspectRatio": "9:16",
            "type": "textToImage",
            "prompt": "A cinematic, hand-drawn anime-style scene inspired by a gentle fantasy world:\nA young witch girl (Kiki) flying on a broomstick while delivering goods. She wears a simple dark-blue dress, a large red bow on her hair fluttering in the wind, holding a small package tied with rope in her arms.\nBelow her is a European coastal town with red-tiled roofs, stone streets, small harbors, and sunlight reflecting on the sea.\nThe sky is bright blue with soft fluffy clouds, visible wind flow lines and light particles moving through the air, creating a strong sense of motion and freedom.\nWide-angle aerial composition, dynamic perspective, subtle motion blur on the broom tail to emphasize speed.\nWarm, soft lighting, bright and clean color palette, peaceful and healing atmosphere.\nStudio Ghibli–like hand-painted texture, detailed background, film-quality lighting, emotional, nostalgic, and full of adventure.\nUltra high detail, cinematic frame, 35mm lens feeling, soft depth of field, anime movie still quality."
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/d4abbe9c46f145aeb461b85594bb679f/0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/d4abbe9c46f145aeb461b85594bb679f/0_resized_watermark.png",
                "format": "JPEG",
                "height": 512,
                "width": 288,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fd4abbe9c46f145aeb461b85594bb679f%2F0_resized.jpeg?Expires=1769688935&Signature=HMfASuE1TRrKvLpxFK4BOlc4hisATb-KHlVnhaxA5Dg~1evrowlVCSxULqymk6ls8SVOSOdWQadN04~005xvSY8WIltjZ-mf1240kE9CLVT3u7gb~tmrESWc2k9yTAceI71EZ331-C7ntqMajGsthGKzcxqB4vmV2~Y--0EXXn04csxBFAMCAyUbl6Ai1DXLTS5FHU-w0ftxagajJidVsqqZMhAEHKGuSgBU4PUbRFIm3kyIFkGmXmMSJ2ysoJ-K8QtaFE7~1daIhGc4M5jwuxDhalo-5g10RmSGpgy4ghMZBtOGRWipbla3LGIStZ7uOCMKegyg7alp3e~fQMeF4g__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "24c38a66862444f69d5b58b9bc58c84c",
                "filePath": "analyzed_video/task/object_replace_llm/d4abbe9c46f145aeb461b85594bb679f/0.jpeg",
                "format": "JPEG",
                "width": 1440,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/d4abbe9c46f145aeb461b85594bb679f/0_watermark.png",
                "type": "image",
                "height": 2560,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fd4abbe9c46f145aeb461b85594bb679f%2F0.jpeg?Expires=1769688935&Signature=VjQAoTX5VXBB~xc-O5PfKh5Mn2NwFaJ-QeNLu4mXyQk9znAXOx4EDQ9v-NDKGmPLmnjUAs806MWfFAk-kJEaOoiU9XDj0cpKhA32QiO9ehi-o1fJG4LtsAZ1yG~WJuKBK8oEkRJSODbyzZPDYlkC5F36-6swAlLhFGvpizarYbN6w9XV0oajsLLlyWM8M86tLc-aLIiUGVdo4QZkBA4J7rjgVPXxzfnT7vmJPqK1gDQFO6qfghV5zk06-ySOh1cqLoqjr6Fh0GLaJ9TqAPn5ytte38e5MfThV9ssV7jrcaLeQpCyVcRLfnmVc2HbiyzoKWNpLj3U-NU2IGfBndA2rg__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "24c38a66862444f69d5b58b9bc58c84c"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 03:53:36",
        "gmtModify": "2026-01-26 03:54:04",
        "completedAt": "2026-01-26 03:54:04",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "713a9ff61db146708e1bd99c670928fe",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": -1,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-to-video",
        "toolCategory": "video",
        "status": "success",
        "mediaType": "video",
        "rating": 3,
        "parameters": {
            "duration": 5,
            "taskType": "imageToVideo",
            "positivePrompt": "Kiki flies back into the foreground after a smooth aerial spin, slowing down gently on her broomstick.\nThe camera returns to a close, intimate distance — her face fills the frame, hair and red bow still fluttering softly in the wind.\nShe holds the small delivery package close to her chest, smiling with relief and quiet pride.\nThe background is softly blurred with motion, blue sky and white clouds melting into light streaks, giving a sense of calm after motion.\nWarm sunlight lights the edges of her hair and face, subtle rim light glowing around her silhouette.\nThe feeling is peaceful, accomplished, and hopeful — a moment of rest after flight.\nHand-drawn anime film style, soft painted texture, emotional still frame, gentle ending mood, Studio Ghibli–like atmosphere (original, non-copyright).\nCinematic depth of field, slight film grain, movie ending shot, lingering frame.",
            "modelId": "seedance-1.5-pro",
            "imageMode": "startEndFrame"
        },
        "result": {
            "originImage": {
                "duration": 5,
                "resourceId": "05b6b5d22df04437aca53f45156b763a",
                "coverPath": "analyzed_video/task/video_generator/332dee7f734b4cce9ade5a300efb9c65/332dee7f734b4cce9ade5a300efb9c65.jpg",
                "filePath": "analyzed_video/task/object_replace_llm/332dee7f734b4cce9ade5a300efb9c65/332dee7f734b4cce9ade5a300efb9c65.mp4",
                "format": "mp4",
                "width": 1280,
                "type": "video",
                "height": 720,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F332dee7f734b4cce9ade5a300efb9c65%2F332dee7f734b4cce9ade5a300efb9c65.mp4?Expires=1769688935&Signature=TW2vB2eDOBbjAAWEvQZmm0BuE7m7zV5PdSclFVuut~bPTLiEjFeft2gkay6A1zzIHeWoY2yuAt3NeoRgKAGPM4PYl9qxKTdXw6raKKpnt6MO0vHsBVgpVCbRhqPERNdaGW3A5dujIUcu2Xz2Vm-1fd4Gr2a2-6bmeeOrIy9WeAP8IZL3-Z2fJsTXfyxMdH4W6f4OkVdfsBiYKcUiHgqIL0D8oTDaZt8f6ewRc8XF4fCLLNAW8oJsOk8mbfGVeoOBI6IwYs5WncMVM4sFrxVITdc~Q1eLtUKV7wUW0wghA3INQuvkqG~gfeqwpWd~gN5Y5a1uY2B-Ms~~9EsQ4tu40Q__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "05b6b5d22df04437aca53f45156b763a"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 03:09:11",
        "gmtModify": "2026-01-26 03:28:58",
        "completedAt": "2026-01-26 03:11:22",
        "isPinned": true,
        "pinnedOriginalSortWeight": 6
    },
    {
        "taskId": "58ddd3501b454aa491af1636770c0bf0",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 5,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "image-to-video",
        "toolCategory": "video",
        "status": "success",
        "mediaType": "video",
        "rating": 0,
        "parameters": {
            "duration": 5,
            "taskType": "imageToVideo",
            "positivePrompt": "Kiki flies back into the foreground after a smooth aerial spin, slowing down gently on her broomstick.\nThe camera returns to a close, intimate distance — her face fills the frame, hair and red bow still fluttering softly in the wind.\nShe holds the small delivery package close to her chest, smiling with relief and quiet pride.\nThe background is softly blurred with motion, blue sky and white clouds melting into light streaks, giving a sense of calm after motion.\nWarm sunlight lights the edges of her hair and face, subtle rim light glowing around her silhouette.\nThe feeling is peaceful, accomplished, and hopeful — a moment of rest after flight.\nHand-drawn anime film style, soft painted texture, emotional still frame, gentle ending mood, Studio Ghibli–like atmosphere (original, non-copyright).\nCinematic depth of field, slight film grain, movie ending shot, lingering frame.",
            "modelId": "seedance-1.5-pro",
            "imageMode": "startEndFrame"
        },
        "result": {
            "originImage": {
                "duration": 5,
                "resourceId": "62fdedadb6c5462882909ee95cb5ba06",
                "coverPath": "analyzed_video/task/video_generator/10ac309f95ad4779b925c43efb21ad88/10ac309f95ad4779b925c43efb21ad88.jpg",
                "filePath": "analyzed_video/task/object_replace_llm/10ac309f95ad4779b925c43efb21ad88/10ac309f95ad4779b925c43efb21ad88.mp4",
                "format": "mp4",
                "width": 1280,
                "type": "video",
                "height": 720,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F10ac309f95ad4779b925c43efb21ad88%2F10ac309f95ad4779b925c43efb21ad88.mp4?Expires=1769688935&Signature=DceW9hrxbhOYUficpomW1GMtE32ULIrffKdN~eDxMgFmPwUxLp0S1v0dqPzqb5yyMuJbgCvGpeTTWWB5p1qB8TfEKEIo8Sw~Sy5Qhz8S1vCUvUWlDXTCM2AaghDJW81gL-Pw0w1zt~4ga59soco90PLHB9hGR9sGLo3pYbQi6hLVJdBU1G4b3eLK3dRWL3NgBOkZyrd-uByQoVsWxfptMzDSMO760B6kW6dbTi-LepmyDkcU0uTy0o1~UB8UGKqJAhBZCZfA5urfUM49bUwwudR7HsdPVpI2OaOvuRRyf8cNMsWHmdb1kKdjpDbgOPbSgDzFcJwKx3bYCH3WywoWow__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "62fdedadb6c5462882909ee95cb5ba06"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 03:09:08",
        "gmtModify": "2026-01-26 03:33:16",
        "completedAt": "2026-01-26 03:13:29",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "689e1a810e864480acae9368a50ff35c",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": -2,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 3,
        "parameters": {
            "mode": "nano_banana2",
            "imageCount": 1,
            "promptEnhancementStatus": "Auto",
            "aspectRatio": "16:9",
            "type": "textToImage",
            "prompt": "A cinematic, hand-drawn anime-style scene inspired by a gentle fantasy world:\nA young witch girl (Kiki) flying on a broomstick while delivering goods. She wears a simple dark-blue dress, a large red bow on her hair fluttering in the wind, holding a small package tied with rope in her arms.\nBelow her is a European coastal town with red-tiled roofs, stone streets, small harbors, and sunlight reflecting on the sea.\nThe sky is bright blue with soft fluffy clouds, visible wind flow lines and light particles moving through the air, creating a strong sense of motion and freedom.\nWide-angle aerial composition, dynamic perspective, subtle motion blur on the broom tail to emphasize speed.\nWarm, soft lighting, bright and clean color palette, peaceful and healing atmosphere.\nStudio Ghibli–like hand-painted texture, detailed background, film-quality lighting, emotional, nostalgic, and full of adventure.\nUltra high detail, cinematic frame, 35mm lens feeling, soft depth of field, anime movie still quality."
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/59dfa415fc2342c291e6b2937bf345ef/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/59dfa415fc2342c291e6b2937bf345ef/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 285,
                "width": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F59dfa415fc2342c291e6b2937bf345ef%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=BxZi~54HCQv5ojf7oF~Iw2bKZwWW0FyX~hJ-cTlZc5hqJpDW-PIp6YSxnbRIAkvFDdPOigN19dwdy8HGlXiO-OHwCgL7a4QvAA1txX35ovqObMhAR4uwsQz-cwyBt19GhEHhQkH9lsu81wc8VWNijHCc4fyuH8Kof-LQIYdfW73IM2Z-tF2xEeLbeI~BsnV4IMYyYgHFsTPTc5663iJ3vrKRoRKWQVavcVxN5WeV1mSd3XSHGiC0Tw8UPo2Y1mKeO81cvUmiTsApdXCBIKDxsc8Y4RizJJr76ili7uspXXM4s2E9wK-DGklSVCboyiGsS5actkWYolYD8mNKUhdoLw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "dd333fd6f34e49afaea139197b3f7749",
                "filePath": "analyzed_video/task/object_replace_llm/59dfa415fc2342c291e6b2937bf345ef/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/59dfa415fc2342c291e6b2937bf345ef/inline_image_0_watermark.png",
                "type": "image",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F59dfa415fc2342c291e6b2937bf345ef%2Finline_image_0.jpeg?Expires=1769688935&Signature=w6ug77td~jLbGiD70QVwu~dOJvS3cL6lO6Pyud3K30F0pXKXPmlZfbc6GcGKEyg5Ybq0hlJfucM-QD1BRPY1Q0pCxi8h~8bvhWZM-9UWiU8Ddz4K666elCm7DZ0Wg~sw8P0eccTksOcMKtv8qI2Z9lYYRUPT2pBG3GXyQd56qUePZQ~fsSDn4-m8f8QPs06V5ILdlIyRMCTxjDLY9gkV3y2xs7-R-qlTUTFsYsBFFIk0r0TxYVGHY076xNyHtVo0eiWzrdAN6GrKe7hJinIB9BTNEjaFRE8k114zwKugWcLDJcMqkT9FjnfDv-MuuOHCcKA2~QkzT3zBP7ZxT4dvAQ__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "dd333fd6f34e49afaea139197b3f7749"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 02:50:17",
        "gmtModify": "2026-01-26 03:33:14",
        "completedAt": "2026-01-26 02:50:57",
        "isPinned": true,
        "pinnedOriginalSortWeight": 4
    },
    {
        "taskId": "875b5926074642a3adc4ef1342b6852f",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": -3,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 2,
        "parameters": {
            "mode": "nano_banana2",
            "imageCount": 1,
            "promptEnhancementStatus": "Auto",
            "aspectRatio": "16:9",
            "type": "textToImage",
            "prompt": "A cinematic, hand-drawn anime-style scene inspired by a gentle fantasy world:\nA young witch girl (Kiki) flying on a broomstick while delivering goods. She wears a simple dark-blue dress, a large red bow on her hair fluttering in the wind, holding a small package tied with rope in her arms.\nBelow her is a European coastal town with red-tiled roofs, stone streets, small harbors, and sunlight reflecting on the sea.\nThe sky is bright blue with soft fluffy clouds, visible wind flow lines and light particles moving through the air, creating a strong sense of motion and freedom.\nWide-angle aerial composition, dynamic perspective, subtle motion blur on the broom tail to emphasize speed.\nWarm, soft lighting, bright and clean color palette, peaceful and healing atmosphere.\nStudio Ghibli–like hand-painted texture, detailed background, film-quality lighting, emotional, nostalgic, and full of adventure.\nUltra high detail, cinematic frame, 35mm lens feeling, soft depth of field, anime movie still quality."
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/baaae2f41daa48258fbd660fac5ae543/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/baaae2f41daa48258fbd660fac5ae543/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 285,
                "width": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fbaaae2f41daa48258fbd660fac5ae543%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=EF448qvfBbROPcap40qrZ3VeuribZbWON62TrsJARX~~IlkzC5uXmD3Bjcm77cLzoJ9CUXw4EFb6rALAn5uAbyNTCyYuta-vYMSoLMPfuawCpb5183D9Bq8sFwq3T~dBgIxEW~lyPnrLZricSXyjC9Qrko5WabRiY1p6oa~f62wJAxlUJ8q0cCEyclV2rkJZp4PjAP~T19okqGcdXN3-FtT0n-0mjNQeJ0hHMgN-AwCDAHiwWCX7y83aO5rOd1TZyCv9NWLTb4gtMu97DMKMJ51BYnUHeBkuMZ1bIVIKTij61QBQyQ1aJyf32COguOcGeL1YiNayGIPHjp8wlhAICQ__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "f14833fa25644fe09e60bbbb49861cb3",
                "filePath": "analyzed_video/task/object_replace_llm/baaae2f41daa48258fbd660fac5ae543/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/baaae2f41daa48258fbd660fac5ae543/inline_image_0_watermark.png",
                "type": "image",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fbaaae2f41daa48258fbd660fac5ae543%2Finline_image_0.jpeg?Expires=1769688935&Signature=tFpkamT9h6hmfTcX9FwA6vpTslJhYt~YRYBl2SzmDtL19DxcrmguI9xLSSgo2m4Frai4HaYrN0hGSJZIcXAvFKb3CjvyDdCQNLOh7BqsCZvQYhvwIgfWEZAQHd3SxlWyEhMxvPhNnbZYYBYdPL5uK4tw4k7pUqn~T3f-4wlzi5Dd2euMNaDh2rylAOjp~VG1iqyqVNkjJ2hOxwpWknx-WZmp7vh6HVydRPK~Ycf2Ln66~vYhSzOPiCNoR9qQmJk1P4RK6Shs6L1lJgEmH0bMzzFzN46T6biSg2ySxhgP33z9vZAs~noBzilYvu8cQP~gxUUzCf3rOsKgSFJLYiCMwA__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "f14833fa25644fe09e60bbbb49861cb3"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 02:50:04",
        "gmtModify": "2026-01-26 03:41:44",
        "completedAt": "2026-01-26 02:51:01",
        "isPinned": true,
        "pinnedOriginalSortWeight": 3
    },
    {
        "taskId": "6682c7425ac64dfd9d8f49f5c6ab9993",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 2,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 0,
        "parameters": {
            "mode": "nano_banana2",
            "imageCount": 1,
            "promptEnhancementStatus": "Auto",
            "aspectRatio": "16:9",
            "type": "textToImage",
            "prompt": "A cinematic, hand-drawn anime-style scene inspired by a gentle fantasy world:\nA young witch girl (Kiki) flying on a broomstick while delivering goods. She wears a simple dark-blue dress, a large red bow on her hair fluttering in the wind, holding a small package tied with rope in her arms.\nBelow her is a European coastal town with red-tiled roofs, stone streets, small harbors, and sunlight reflecting on the sea.\nThe sky is bright blue with soft fluffy clouds, visible wind flow lines and light particles moving through the air, creating a strong sense of motion and freedom.\nWide-angle aerial composition, dynamic perspective, subtle motion blur on the broom tail to emphasize speed.\nWarm, soft lighting, bright and clean color palette, peaceful and healing atmosphere.\nStudio Ghibli–like hand-painted texture, detailed background, film-quality lighting, emotional, nostalgic, and full of adventure.\nUltra high detail, cinematic frame, 35mm lens feeling, soft depth of field, anime movie still quality."
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/77b6360b39be4b34a28660204129d29b/image_0_0_resized.jpg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/77b6360b39be4b34a28660204129d29b/image_0_0_resized_watermark.png",
                "format": "JPEG",
                "height": 285,
                "width": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F77b6360b39be4b34a28660204129d29b%2Fimage_0_0_resized.jpg?Expires=1769688935&Signature=iqlYrYjfOAyglZlSjP4ps1o1XDcfMFUBGX0~p8B17LDD1xzCt1faVnOtN5na7BAr1RhD1CtISqrZxRkSSMqCYjLqBicw9w1DMFp0Ko0p1eGeraOOL-10420S~OKUwFLKLn-DOAb-XoNApMwT9NMUKDNZnP3XihvTESuSfpgFarqY~7psPgLIqWXbscGEfsuLMVAYTHeuGGiZ12dLhgUKii4SVdMBCjHcCDJSlItUFsHQueLrGg03Lv-rKnGOQmLwuG4bgwhrpwkEuvfVfgJ4LC4OiJDF0EjQGmQhIQWM3aCZ6c0OLS6AKICqj5~aARAAkejYpMIAXusqaU9jPDtF4A__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "95f6eb98626f4455a01eeaf4d6a469b3",
                "filePath": "analyzed_video/task/object_replace_llm/77b6360b39be4b34a28660204129d29b/image_0_0.jpg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/77b6360b39be4b34a28660204129d29b/image_0_0_watermark.png",
                "type": "image",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2F77b6360b39be4b34a28660204129d29b%2Fimage_0_0.jpg?Expires=1769688935&Signature=qHN-nAmfQ2ToGFgCzIUMqUGvJx7ziWSpYQ~EEE~gYiPaubufXX~EsZ0MDEby88T~qvJr59YPafgFwOZFcMfNjVmPj8matYbrS0VXZPr4pFwgqLZmxpOnTq7QEOJgH1xN9ekfOuR4mueR2JuJfs~g9X6ag6c5Vf1Ur0ILkUoP4ajM6bqIH-tTiO1dwV8QuOAH7K-r2C-eYcyjfEow1~DDjygdcb467HSW1NC2TGPq6Qqo4Ca-aUfc3wXMXuM1VBHQeZJpVv6iCYl5cmEZxQjRA4A-8IOzgyKmT7snBseRl4dpusGP~edVmKP5vwlQsz8GKdIt0Ifh2ToBxe7~gXo9ug__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "95f6eb98626f4455a01eeaf4d6a469b3"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 02:50:01",
        "gmtModify": "2026-01-26 03:41:44",
        "completedAt": "2026-01-26 02:50:45",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    },
    {
        "taskId": "febe4bc15b43467abfee6c383e27ed8d",
        "boardId": "e0823bc2d449419080dd2bd20c1e03f0",
        "sortWeight": 1,
        "uid": "oksWvIchg9MX2fJcEdva",
        "userName": "im13ng",
        "toolType": "text-to-image",
        "toolCategory": "image",
        "status": "success",
        "mediaType": "image",
        "rating": 3,
        "parameters": {
            "mode": "nano_banana2",
            "imageCount": 1,
            "promptEnhancementStatus": "Auto",
            "aspectRatio": "16:9",
            "type": "textToImage",
            "prompt": "A cinematic, hand-drawn anime-style scene inspired by a gentle fantasy world:\nA young witch girl (Kiki) flying on a broomstick while delivering goods. She wears a simple dark-blue dress, a large red bow on her hair fluttering in the wind, holding a small package tied with rope in her arms.\nBelow her is a European coastal town with red-tiled roofs, stone streets, small harbors, and sunlight reflecting on the sea.\nThe sky is bright blue with soft fluffy clouds, visible wind flow lines and light particles moving through the air, creating a strong sense of motion and freedom.\nWide-angle aerial composition, dynamic perspective, subtle motion blur on the broom tail to emphasize speed.\nWarm, soft lighting, bright and clean color palette, peaceful and healing atmosphere.\nStudio Ghibli–like hand-painted texture, detailed background, film-quality lighting, emotional, nostalgic, and full of adventure.\nUltra high detail, cinematic frame, 35mm lens feeling, soft depth of field, anime movie still quality."
        },
        "result": {
            "compressedImage": {
                "filePath": "analyzed_video/task/object_replace_llm/a8534fea5eed4445b9b068432f573d82/inline_image_0_resized.jpeg",
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/a8534fea5eed4445b9b068432f573d82/inline_image_0_resized_watermark.png",
                "format": "JPEG",
                "height": 285,
                "width": 512,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fa8534fea5eed4445b9b068432f573d82%2Finline_image_0_resized.jpeg?Expires=1769688935&Signature=EDTERKJSKQzW2PrR7g1za6ALw7W4r9F27WOnbGGKuvLAOp-DHgAUXOUSsVzuQgk4mi-zytaX740W~pOFBmo7Nrseq4AgBUL3OyG6S9PcmDOc3H2zJEqFj0zTFs1B1YSIBIskl79fN~LHqOZlxKYqnsxxJNFYoaTqmvuiU-T-~FyRFxOcko1yyOwlz7Ya-2dWGGSQ5iUDYr4vmN8FJQp5gnEarKrh0sxxhfbi5~9k34XBGEZjS3d4el~ulX5DmsrQPJcnJ0ChFgsQP5v8s9qncU8~sY~sQmzEwvYF7rT54DhoQsRu3qMcd5tp4NPuDdMSMp9Hhe0Pl4JtHfZVdj6w4g__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "originImage": {
                "resourceId": "86d71a59be0848e89a9de695ae136108",
                "filePath": "analyzed_video/task/object_replace_llm/a8534fea5eed4445b9b068432f573d82/inline_image_0.jpeg",
                "format": "JPEG",
                "width": 2752,
                "filePathWithWatermark": "analyzed_video/task/object_replace_llm/a8534fea5eed4445b9b068432f573d82/inline_image_0_watermark.png",
                "type": "image",
                "height": 1536,
                "url": "https://dr1coeak04nbk.cloudfront.net/analyzed_video%2Ftask%2Fobject_replace_llm%2Fa8534fea5eed4445b9b068432f573d82%2Finline_image_0.jpeg?Expires=1769688935&Signature=KHgNkrNz01FY4gCC6n1dTtLgUVeMOuEUHHPGNbAN2fDj2NKyIrnSmtVDKEq84gdqt3Oaxk9I~5OFIeLUid4SmOpKSRp5KKTydPYwqHnoSW7Yz4wCE5nKyAw7OTha2ctwqHRmlK9xgnugixxGpjJnnhsLjmkRPdZMSnv-mGiucrhmFj0LrG5~ORW8tWX5aLu7Re02e-LtQqwrXyLrJx2aL~KlK7BTzaSR6AzSlnX8SP2Vc3GcPhXa0~qInWZRfvWhi1fzkDhMc9~Xee6sE1YWg~QvXKga-yJXGgMcRHRlHqomjlnBYD1WhfZBC-FL7GVam8vbHptjkm8m-gb~7MSMPw__&Key-Pair-Id=K21X5TGS0ALJI4"
            },
            "outputResourceIds": [
                "86d71a59be0848e89a9de695ae136108"
            ]
        },
        "errorMessage": null,
        "creditsCost": 0,
        "creditsPayerUid": "oksWvIchg9MX2fJcEdva",
        "creditsPayerName": "im13ng",
        "gmtCreate": "2026-01-26 02:49:58",
        "gmtModify": "2026-01-26 03:05:58",
        "completedAt": "2026-01-26 02:50:39",
        "isPinned": false,
        "pinnedOriginalSortWeight": null
    }
];
