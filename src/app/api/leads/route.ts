import { NextResponse } from "next/server";
import pool from "@/lib/mysql";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, role, tier, message, source } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    // Ensure table exists
    await pool.execute(`CREATE TABLE IF NOT EXISTS leads (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(200) NOT NULL,
      company VARCHAR(200),
      role VARCHAR(200),
      tier VARCHAR(50),
      message TEXT,
      source VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await pool.execute(
      `INSERT INTO leads (name, email, company, role, tier, message, source) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, company || null, role || null, tier || null, message || null, source || "website"]
    );

    return NextResponse.json({ success: true, message: "Thank you! We'll be in touch shortly." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Admin endpoint to view leads (no auth for now)
  try {
    const [rows] = await pool.execute("SELECT * FROM leads ORDER BY created_at DESC LIMIT 100");
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
