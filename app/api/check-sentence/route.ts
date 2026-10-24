import { NextResponse } from "next/server";
import { checkSentenceLocally } from "@/lib/sentence-checker";

export async function POST(req: Request) {
  try {
    const { sentence, targetWord, modelExample } = await req.json();

    if (!sentence || typeof sentence !== "string") {
      return NextResponse.json(
        { error: "Vui lòng cung cấp câu cần kiểm tra." },
        { status: 400 }
      );
    }

    const localResult = checkSentenceLocally(
      sentence,
      targetWord || "",
      modelExample
    );

    // Thử gọi LanguageTool API để bổ sung kiểm tra chuyên sâu nếu có kết nối mạng
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

      const res = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text: sentence,
          language: "en-US",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
          for (const m of data.matches) {
            // Tránh thêm các gợi ý trùng lặp
            const repl = m.replacements?.[0]?.value;
            const originalPart = sentence.slice(m.offset, m.offset + m.length);

            const alreadyReported = localResult.suggestions.some(
              (s) => s.original && s.original.toLowerCase() === originalPart.toLowerCase()
            );

            if (!alreadyReported) {
              localResult.suggestions.push({
                type: m.rule?.issueType === "misspelling" ? "spelling" : "grammar",
                message: m.message,
                original: originalPart,
                replacement: repl,
              });

              if (localResult.score === "perfect") {
                localResult.score = "good";
              }
            }
          }
        }
      }
    } catch {
      // Offline hoặc sandbox không có mạng ngoài -> Dùng kết quả localResult chuẩn xác
    }

    return NextResponse.json(localResult);
  } catch (error) {
    console.error("Lỗi khi kiểm tra câu:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi phân tích câu." },
      { status: 500 }
    );
  }
}
