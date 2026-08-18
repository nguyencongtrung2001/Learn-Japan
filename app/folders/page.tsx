"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getFolders, createFolder, deleteFolder } from "@/actions/folder-actions";
import type { Folder } from "@/db/schema";

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    const data = await getFolders();
    setFolders(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await createFolder({ name: name.trim(), description: description.trim() || undefined });
    setName("");
    setDescription("");
    setShowForm(false);
    setIsSubmitting(false);
    loadFolders();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thư mục này? Tất cả thẻ trong đó sẽ bị xóa.")) return;
    await deleteFolder(id);
    loadFolders();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          <span className="mr-2">📂</span>
          <span className="gradient-text">Bộ thẻ của tôi</span>
        </h1>
        <p className="text-foreground-muted text-sm">
          Tạo thư mục và thêm từ vựng để luyện tập
        </p>
      </div>

      {/* Create button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-shine px-6 py-3 rounded-2xl bg-gradient-to-r from-sakura to-indigo text-white font-semibold
                     hover:shadow-xl hover:shadow-sakura/20 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          {showForm ? "✕ Đóng" : "＋ Tạo thư mục mới"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="glass-card p-6 max-w-md mx-auto mb-8 space-y-4 animate-fade-in"
        >
          <div>
            <label className="block text-sm text-foreground-muted mb-1">
              Tên thư mục <span className="text-rose">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Từ vựng N5 Bài 1"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground
                         outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-foreground-muted mb-1">
              Mô tả (tùy chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: 50 từ vựng cơ bản"
              className="w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground
                         outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-sakura to-indigo text-white
                       hover:shadow-lg hover:shadow-sakura/25 hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang tạo..." : "Tạo thư mục"}
          </button>
        </form>
      )}

      {/* Folders list */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-indigo border-t-transparent rounded-full animate-spin" />
          <p className="text-foreground-muted text-sm mt-3">Đang tải...</p>
        </div>
      ) : folders.length === 0 ? (
        <div className="text-center py-20 glass-card max-w-md mx-auto">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-foreground-muted">Chưa có thư mục nào</p>
          <p className="text-foreground-dim text-sm mt-1">
            Bấm nút &quot;Tạo thư mục mới&quot; để bắt đầu!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder, index) => (
            <div
              key={folder.id}
              className="glass-card p-5 group hover:scale-[1.02] transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Link href={`/folders/${folder.id}`} className="block mb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-indigo-light transition-colors">
                      📂 {folder.name}
                    </h3>
                    {folder.description && (
                      <p className="text-foreground-muted text-sm mt-1 line-clamp-2">
                        {folder.description}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-foreground-dim text-xs mt-3">
                  {new Date(folder.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </Link>
              <div className="flex gap-2 pt-3 border-t border-border/50">
                <Link
                  href={`/folders/${folder.id}`}
                  className="flex-1 text-center py-2 rounded-lg text-sm font-medium
                             bg-indigo/10 text-indigo-light hover:bg-indigo/20 transition-colors"
                >
                  📝 Xem thẻ
                </Link>
                <button
                  onClick={() => handleDelete(folder.id)}
                  className="px-3 py-2 rounded-lg text-sm text-rose/70 hover:bg-rose/10 hover:text-rose
                             transition-colors cursor-pointer"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
