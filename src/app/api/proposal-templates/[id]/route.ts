import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { proposalTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const row = db
    .select()
    .from(proposalTemplates)
    .where(eq(proposalTemplates.id, Number(id)))
    .get();
  if (!row) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { id: _, createdAt: __, ...updates } = body;
  updates.updatedAt = new Date().toISOString();

  db.update(proposalTemplates)
    .set(updates)
    .where(eq(proposalTemplates.id, Number(id)))
    .run();
  const updated = db
    .select()
    .from(proposalTemplates)
    .where(eq(proposalTemplates.id, Number(id)))
    .get();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  db.delete(proposalTemplates)
    .where(eq(proposalTemplates.id, Number(id)))
    .run();
  return NextResponse.json({ ok: true });
}
