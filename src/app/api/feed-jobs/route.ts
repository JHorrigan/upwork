import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { feedJobs } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const showDismissed = req.nextUrl.searchParams.get("dismissed") === "true";

  const conditions = showDismissed ? [] : [eq(feedJobs.dismissed, 0)];

  const rows =
    conditions.length > 0
      ? db
          .select()
          .from(feedJobs)
          .where(and(...conditions))
          .orderBy(desc(feedJobs.postedAt))
          .all()
      : db.select().from(feedJobs).orderBy(desc(feedJobs.postedAt)).all();

  return NextResponse.json({ jobs: rows });
}
