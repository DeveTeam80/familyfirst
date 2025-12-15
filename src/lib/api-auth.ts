// src/lib/api-auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/nextauth.config";
import { NextRequest, NextResponse } from "next/server";
import { Session } from "next-auth";

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth(_request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { session, user: session.user };
}

// Type for auth context
interface AuthContext {
  session: Session;
  user: Session["user"];
}

// Usage in API routes
export async function withAuth(
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const auth = await requireAuth(req);
    
    if (auth instanceof NextResponse) {
      return auth; // Return error response
    }

    return handler(req, auth);
  };
}