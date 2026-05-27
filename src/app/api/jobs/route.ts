import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { sendSlackNotification } from "@/lib/slack";

export async function GET(req: NextRequest) {
  const statusFilter = req.nextUrl.searchParams.get("status");
  const conditions = [];

  if (statusFilter) {
    const statuses = statusFilter.split(",").map((s) => s.trim());
    conditions.push(inArray(jobs.status, statuses));
  }

  const query = db.select().from(jobs);
  const rows =
    conditions.length > 0
      ? query.where(conditions[0]).orderBy(desc(jobs.createdAt)).all()
      : query.orderBy(desc(jobs.createdAt)).all();

  return NextResponse.json({ jobs: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const now = new Date().toISOString();

  const result = db
    .insert(jobs)
    .values({
      ...body,
      status: body.status ?? "draft",
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  const budget = result.budget ? ` (${result.budget})` : "";
  sendSlackNotification(`New job tracked: ${result.title}${budget}`);

  return NextResponse.json(result, { status: 201 });
}
