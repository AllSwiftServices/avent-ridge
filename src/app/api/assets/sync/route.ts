import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase-server";

// Map our asset symbols to CoinGecko IDs
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
};

// Fetch live crypto prices from CoinGecko (free, no key needed)
async function fetchCryptoPrices(symbols: string[]): Promise<Record<string, { price: number; change_percent: number }>> {
  const cryptoSymbols = symbols.filter((s) => COINGECKO_IDS[s]);
  if (cryptoSymbols.length === 0) return {};

  const ids = cryptoSymbols.map((s) => COINGECKO_IDS[s]).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`CoinGecko error: ${res.statusText}`);

  const data = await res.json();
  const result: Record<string, { price: number; change_percent: number }> = {};

  for (const symbol of cryptoSymbols) {
    const geckoId = COINGECKO_IDS[symbol];
    if (data[geckoId]) {
      result[symbol] = {
        price: data[geckoId].usd,
        change_percent: parseFloat((data[geckoId].usd_24h_change ?? 0).toFixed(2)),
      };
    }
  }
  return result;
}

// Fetch live stock prices from Yahoo Finance (unofficial, no key needed)
async function fetchStockPrices(symbols: string[]): Promise<Record<string, { price: number; change_percent: number }>> {
  if (symbols.length === 0) return {};

  const result: Record<string, { price: number; change_percent: number }> = {};

  // Fetch each stock in parallel
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          next: { revalidate: 0 },
        });
        if (!res.ok) return;
        const data = await res.json();
        const quote = data?.chart?.result?.[0];
        if (!quote) return;

        const closes = quote.indicators?.quote?.[0]?.close || [];
        const latest = closes[closes.length - 1];
        const prev = closes[closes.length - 2] ?? latest;
        if (!latest) return;

        result[symbol] = {
          price: parseFloat(latest.toFixed(2)),
          change_percent: parseFloat((((latest - prev) / prev) * 100).toFixed(2)),
        };
      } catch (e) {
        console.error(`Failed to fetch ${symbol}:`, e);
      }
    })
  );

  return result;
}

// POST /api/assets/sync — admin only
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all assets from DB
    const { data: assets, error: assetsErr } = await supabaseAdmin
      .from("assets")
      .select("id, symbol, type");
    if (assetsErr) throw assetsErr;

    const cryptoSymbols = assets?.filter((a) => a.type === "crypto").map((a) => a.symbol) || [];
    const stockSymbols = assets?.filter((a) => a.type === "stock").map((a) => a.symbol) || [];

    // Fetch prices in parallel
    const [cryptoPrices, stockPrices] = await Promise.all([
      fetchCryptoPrices(cryptoSymbols),
      fetchStockPrices(stockSymbols),
    ]);

    const allPrices = { ...cryptoPrices, ...stockPrices };

    let updated = 0;
    let failed: string[] = [];

    // Update each asset in the DB
    await Promise.all(
      assets?.map(async (asset) => {
        const priceData = allPrices[asset.symbol];
        if (!priceData) {
          failed.push(asset.symbol);
          return;
        }
        const { error } = await supabaseAdmin
          .from("assets")
          .update({
            price: priceData.price,
            change_percent: priceData.change_percent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", asset.id);

        if (error) {
          failed.push(asset.symbol);
        } else {
          updated++;
        }
      }) || []
    );

    return NextResponse.json({
      success: true,
      updated,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Price sync error:", error);
    return NextResponse.json({ message: error.message || "Price sync failed" }, { status: 500 });
  }
}
