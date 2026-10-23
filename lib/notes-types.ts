export type NoteLabelColor =
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "purple"
  | "blue";

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NoteCard {
  id: string;
  title: string;
  description?: string;
  color?: NoteLabelColor;
  checklist?: NoteChecklistItem[];
  createdAt: number;
}

export interface NoteColumn {
  id: string;
  title: string;
  cards: NoteCard[];
}

export interface NotesBoardData {
  columns: NoteColumn[];
}

export const LABEL_COLORS: Record<
  NoteLabelColor,
  { name: string; bg: string; text: string; border: string; dot: string }
> = {
  green: {
    name: "Xanh lá",
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    dot: "bg-emerald-400",
  },
  yellow: {
    name: "Vàng",
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/40",
    dot: "bg-amber-400",
  },
  orange: {
    name: "Cam",
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/40",
    dot: "bg-orange-400",
  },
  red: {
    name: "Đỏ",
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/40",
    dot: "bg-rose-400",
  },
  purple: {
    name: "Tím",
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/40",
    dot: "bg-purple-400",
  },
  blue: {
    name: "Xanh lam",
    bg: "bg-indigo-500/20",
    text: "text-indigo-400",
    border: "border-indigo-500/40",
    dot: "bg-indigo-400",
  },
};

export const DEFAULT_BOARD_DATA: NotesBoardData = {
  columns: [
    {
      id: "col-todo",
      title: "📌 Cần nhớ / To Do",
      cards: [
        {
          id: "card-1",
          title: "Các từ vựng chủ đề Travel",
          description: "Ôn lại các từ: Itinerary, Accommodation, Departure, Destination",
          color: "blue",
          checklist: [
            { id: "c1", text: "Học phát âm từ Itinerary", completed: true },
            { id: "c2", text: "Thêm ví dụ cho Accommodation", completed: false },
          ],
          createdAt: Date.now() - 3600000 * 24,
        },
        {
          id: "card-2",
          title: "Phân biệt Affect và Effect",
          description: "Affect thường là Động từ (verb), Effect là Danh từ (noun).",
          color: "yellow",
          createdAt: Date.now() - 3600000 * 12,
        },
      ],
    },
    {
      id: "col-doing",
      title: "📖 Đang học / In Progress",
      cards: [
        {
          id: "card-3",
          title: "5 Cụm Idiom phổ biến",
          description: "Piece of cake, Break a leg, Once in a blue moon, Spill the beans",
          color: "purple",
          checklist: [
            { id: "c3", text: "Đặt 3 câu với 'Piece of cake'", completed: true },
            { id: "c4", text: "Luyện phát âm với Audio", completed: false },
          ],
          createdAt: Date.now() - 3600000 * 6,
        },
      ],
    },
    {
      id: "col-done",
      title: "✅ Đã nắm vững / Done",
      cards: [
        {
          id: "card-4",
          title: "Bảng 12 thì tiếng Anh cơ bản",
          description: "Đã thuộc công thức và dấu hiệu nhận biết của 12 thì.",
          color: "green",
          createdAt: Date.now() - 3600000 * 48,
        },
      ],
    },
  ],
};
