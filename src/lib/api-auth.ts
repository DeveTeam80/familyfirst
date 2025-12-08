// src/lib/api-auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { session, user: session.user };
}

// Usage in API routes
export async function withAuth(
  handler: (req: NextRequest, context: { session: any; user: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const auth = await requireAuth(req);
    
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }

    return handler(req, auth);
  };
}