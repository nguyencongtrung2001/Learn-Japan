import Link from "next/link";

export default function FolderNotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-foreground-muted">Không tìm thấy thư mục.</p>
      <Link href="/folders" className="mt-2 inline-block text-sm text-indigo-light hover:underline">
        ← Quay lại
      </Link>
    </div>
  );
}
