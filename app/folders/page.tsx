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
  const [limit, setLimit] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFolders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getFolders();
      if (res.success && res.data) {
        setFolders(res.data);
      } else {
        console.error("Lỗi khi tải thư mục:", res.error);
        alert(res.error || "Lỗi khi tải dữ liệu. Vui lòng thử lại!");
      }
    } catch (error) {
      console.error("Lỗi catch khi tải:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createFolder({ name: name.trim(), description: description.trim() || undefined, limit: limit ? parseInt(limit, 10) : undefined });
      if (res.success) {
        setName("");
        setDescription("");
        setLimit("");
        setShowForm(false);
        loadFolders();
      } else {
        alert(res.error || "Lỗi khi tạo thư mục!");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối khi tạo thư mục!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa thư mục này? Tất cả thẻ trong đó sẽ bị xóa.")) return;
    await deleteFolder(id);
    loadFolders();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-14 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo/10 blur-[80px] rounded-full pointer-events-none -z-10" />
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
          <span className="mr-3">📂</span>
          <span className="gradient-text">Bộ Thẻ Của Tôi</span>
        </h1>
        <p className="text-foreground-muted text-base sm:text-lg max-w-xl mx-auto">
          Tạo và quản lý các chủ đề từ vựng của bạn để bắt đầu quá trình học tập
        </p>
      </div>

      {/* Create button */}
      <div className="flex justify-center mb-10">
        <button
          onClick={() => setShowForm(!showForm)}
          className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sakura to-indigo transition-transform duration-300 group-hover:scale-110" />
          <span className="relative z-10">{showForm ? "✕ Đóng" : "＋ Tạo Thư Mục Mới"}</span>
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="glass-card p-8 sm:p-10 max-w-lg mx-auto mb-12 space-y-6 animate-fade-in shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sakura to-indigo opacity-50" />
          <h3 className="text-2xl font-bold text-center mb-2">Thêm Thư Mục</h3>
          <div>
            <label className="block text-sm font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
              Tên thư mục <span className="text-rose">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Từ vựng N5 Bài 1"
              className="w-full px-5 py-4 rounded-2xl bg-surface/50 border-2 border-border/50 text-foreground font-medium
                         outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all placeholder:text-foreground-muted/40"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
              Mô tả (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Từ vựng chủ đề gia đình, giao tiếp cơ bản..."
              rows={2}
              className="w-full px-5 py-4 rounded-2xl bg-surface/50 border-2 border-border/50 text-foreground font-medium
                         outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all placeholder:text-foreground-muted/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground-muted mb-2 uppercase tracking-wide">
              Giới hạn số từ (tùy chọn)
            </label>
            <input
              type="number"
              min="1"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="VD: 50"
              className="w-full px-5 py-4 rounded-2xl bg-surface/50 border-2 border-border/50 text-foreground font-medium
                         outline-none focus:border-indigo focus:ring-4 focus:ring-indigo/10 transition-all placeholder:text-foreground-muted/40"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-sakura to-indigo text-white
                       hover:shadow-lg hover:shadow-sakura/30 hover:-translate-y-1 active:translate-y-0
                       transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none"
          >
            {isSubmitting ? "⏳ Đang tạo..." : "✅ Lưu Thư Mục"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder, index) => (
            <div
              key={folder.id}
              className="glass-card p-6 group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 animate-fade-in-up flex flex-col h-full relative overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo/5 rounded-full -mr-16 -mt-16 group-hover:bg-indigo/10 transition-colors" />
              <Link href={`/folders/${folder.id}`} className="block mb-6 flex-1 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="w-full">
                    <h3 className="font-extrabold text-xl text-foreground group-hover:text-indigo-light transition-colors flex items-center gap-2">
                      <span className="text-2xl group-hover:scale-110 transition-transform">📁</span>
                      <span className="truncate">{folder.name}</span>
                    </h3>
                    {folder.description && (
                      <p className="text-foreground-muted text-sm mt-3 line-clamp-2 leading-relaxed">
                        {folder.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-foreground-dim text-xs font-medium bg-surface inline-block px-3 py-1 rounded-full border border-border/50">
                    🗓️ {new Date(folder.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  {folder.limit && (
                    <span className="text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full">
                      📊 Giới hạn: {folder.limit} từ
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex gap-3 pt-4 border-t border-border/50 relative z-10">
                <Link
                  href={`/folders/${folder.id}`}
                  className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold
                             bg-indigo/10 text-indigo-light hover:bg-indigo hover:text-white transition-all duration-300"
                >
                  Mở Thư Mục
                </Link>
                <button
                  onClick={() => handleDelete(folder.id)}
                  className="px-4 py-2.5 rounded-xl text-sm text-rose/70 bg-rose/5 border border-rose/10 hover:bg-rose hover:text-white
                             transition-all duration-300 cursor-pointer shadow-sm"
                  title="Xóa thư mục"
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
