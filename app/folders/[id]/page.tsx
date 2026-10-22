import { notFound } from "next/navigation";
import { getFolderById } from "@/actions/folder-actions";
import { getCardListByFolder } from "@/actions/card-actions";
import FolderDetail from "@/components/folder/folder-detail";
import { getServerNow } from "@/lib/time";

/**
 * Server Component: fetch folder + thẻ song song ngay trên server
 * (không còn spinner + waterfall "tải JS → useEffect → gọi server action").
 */
export default async function FolderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const folderId = Number.parseInt(id, 10);
  if (!Number.isInteger(folderId)) notFound();

  const [folder, cards] = await Promise.all([getFolderById(folderId), getCardListByFolder(folderId)]);
  if (!folder) notFound();

  return <FolderDetail folder={folder} initialCards={cards} serverNow={getServerNow()} />;
}
