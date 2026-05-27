import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { profile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const JSON_FIELDS = [
  "skillsJson",
  "portfolioJson",
  "employmentJson",
  "educationJson",
  "languagesJson",
] as const;

export async function GET() {
  const row = db.select().from(profile).where(eq(profile.id, 1)).get();
  if (!row) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id: _, ...updates } = body;
  updates.updatedAt = new Date().toISOString();

  for (const field of JSON_FIELDS) {
    if (field in updates && typeof updates[field] !== "string") {
      updates[field] = JSON.stringify(updates[field]);
    }
  }

  db.update(profile).set(updates).where(eq(profile.id, 1)).run();
  const updated = db.select().from(profile).where(eq(profile.id, 1)).get();
  return NextResponse.json(updated);
}
