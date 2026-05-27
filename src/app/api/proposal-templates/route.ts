import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { proposalTemplates } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = db
    .select()
    .from(proposalTemplates)
    .orderBy(desc(proposalTemplates.updatedAt))
    .all();
  return NextResponse.json({ templates: rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const now = new Date().toISOString();

  const result = db
    .insert(proposalTemplates)
    .values({
      name: body.name,
      content: body.content,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  return NextResponse.json(result, { status: 201 });
}
