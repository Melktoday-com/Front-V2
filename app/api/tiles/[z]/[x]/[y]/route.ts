import { NextRequest } from "next/server";
import { processTileRequest } from "@/lib/tile-cache/tile-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  z: string;
  x: string;
  y: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
): Promise<Response> {
  const { z, x, y } = await context.params;
  return processTileRequest(z, x, y, request.headers);
}
