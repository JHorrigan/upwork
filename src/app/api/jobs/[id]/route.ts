import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const row = db
    .select()
    .from(jobs)
    .where(eq(jobs.id, Number(id)))
    .get();
  if (!row) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { id: _, createdAt: __, ...updates } = body;
  updates.updatedAt = new Date().toISOString();

  db.update(jobs)
    .set(updates)
    .where(eq(jobs.id, Number(id)))
    .run();
  const updated = db
    .select()
    .from(jobs)
    .where(eq(jobs.id, Number(id)))
    .get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  db.delete(jobs)
    .where(eq(jobs.id, Number(id)))
    .run();
  return NextResponse.json({ ok: true });
}
