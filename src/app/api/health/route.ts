import { NextResponse } from 'next/server';

export interface HealthResponse {
  status: 'ok';
  service: 'algowash-serverless';
  timestamp: string;
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'algowash-serverless',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
