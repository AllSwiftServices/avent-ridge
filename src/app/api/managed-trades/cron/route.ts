import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { processTradePayout } from "@/lib/managed-trades";

// POST /api/managed-trades/cron — Automated payout for expired trades
export async function POST(request: Request) {
  try {
    // Check for Vercel Cron header to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Find all active trades that have passed their ends_at time
    const { data: expiredTrades, error } = await supabaseAdmin
      .from("managed_trades")
      .select("id")
      .eq("status", "active")
      .lt("ends_at", new Date().toISOString());

    if (error) throw error;

    const results = [];

    if (expiredTrades && expiredTrades.length > 0) {
      for (const trade of expiredTrades) {
        try {
          const res = await processTradePayout(trade.id);
          results.push({ id: trade.id, status: 'success', ...res });
        } catch (e: any) {
          console.error(`Cron: Failed to process trade ${trade.id}:`, e);
          results.push({ id: trade.id, status: 'failed', error: e.message });
        }
      }
    }

    return NextResponse.json({
      processed: results.length,
      details: results
    });
  } catch (error: any) {
    console.error("Managed trades cron error:", error);
    return NextResponse.json({ message: error.message || "Cron failed" }, { status: 500 });
  }
}
