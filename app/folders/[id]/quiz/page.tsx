import { redirect } from "next/navigation";
import { getCardsByFolder } from "@/actions/card-actions";
import QuizSession from "@/components/quiz/quiz-session";
import { getServerNow } from "@/lib/time";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const { mode } = await searchParams;
  const folderId = Number.parseInt(id, 10);
  const folderUrl = `/folders/${id}`;

  if (!Number.isInteger(folderId)) redirect("/folders");

  // Cần ≥ 4 thẻ để sinh đủ đáp án ABCD. Thư mục không tồn tại cũng rơi vào nhánh này
  // và sẽ hiện trang "không tìm thấy" ở trang thư mục.
  const cards = await getCardsByFolder(folderId);
  if (cards.length < 4) redirect(folderUrl);

  return (
    <QuizSession
      folderId={folderId}
      initialCards={cards}
      serverNow={getServerNow()}
      initialMode={mode}
    />
  );
}
