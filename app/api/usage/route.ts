import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/api-user";
import { getUsageSnapshot } from "@/lib/usage/enforce";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized", message: "Iniciá sesión." }, { status: 401 });
  }

  try {
    const snapshot = await getUsageSnapshot(user.id);
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("[api/usage]", error);
    return NextResponse.json(
      { error: "usage_unavailable", message: "No se pudo cargar el uso." },
      { status: 503 }
    );
  }
}
