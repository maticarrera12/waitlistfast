import { NextRequest, NextResponse } from "next/server";

import { auth, prisma } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAdmin = user?.role === "admin";
    
    // Debug log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Admin check API:', { userId: session.user.id, role: user?.role, isAdmin });
    }

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin role:', error);
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
}