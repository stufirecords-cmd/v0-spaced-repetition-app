import { NextResponse } from "next/server"

/**
 * Fetch a URL and try to extract a clean question title from
 * OG tags, meta tags, or <title>.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    const target = new URL(url) // validate
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RecallBot/1.0; +https://recall.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      // Avoid hanging forever
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 200 },
      )
    }

    const html = await res.text()

    const pick = (re: RegExp): string | null => {
      const m = html.match(re)
      return m ? m[1].trim() : null
    }

    const og =
      pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i)

    const titleTag = pick(/<title[^>]*>([^<]+)<\/title>/i)

    let title = og || titleTag || ""

    // Clean common suffixes ("- LeetCode", "| Codeforces", etc.)
    title = title
      .replace(/\s*[-|–·]\s*(LeetCode|Codeforces|GeeksforGeeks|HackerRank|AtCoder|Codewars).*$/i, "")
      .replace(/\s+/g, " ")
      .trim()

    return NextResponse.json({ title })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    console.log("[v0] fetch-title error:", message)
    return NextResponse.json({ error: message }, { status: 200 })
  }
}
