import { NextResponse } from 'next/server';

const UPSTREAM_MEDIA_URL_ENDPOINT = 'https://backend-test.topview.ai/s3/file/url';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get('filePath');

  if (!filePath) {
    return NextResponse.json(
      {
        code: '400',
        message: 'Missing filePath',
      },
      { status: 400 }
    );
  }

  const upstreamUrl = new URL(UPSTREAM_MEDIA_URL_ENDPOINT);
  upstreamUrl.searchParams.set('filePath', filePath);

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
    });

    const text = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get('content-type') ?? 'application/json; charset=utf-8';

    return new Response(text, {
      status: upstreamResponse.status,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[demo api/media-url] upstream request failed', error);
    return NextResponse.json(
      {
        code: '500',
        message: 'Failed to resolve media url',
      },
      { status: 500 }
    );
  }
}
