"use client";

import { type KanaGroup, getGroupInfo } from "@/data/kana-data";

interface GroupSelectorProps {
  selectedGroups: KanaGroup[];
  onToggleGroup: (group: KanaGroup) => void;
  onStartStudy: () => void;
}

export default function GroupSelector({
  selectedGroups,
  onToggleGroup,
  onStartStudy,
}: GroupSelectorProps) {
  const groups = getGroupInfo();
  const totalSelected = groups
    .filter((g) => selectedGroups.includes(g.id))
    .reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
        Chọn nhóm ký tự
      </h2>
      <p className="text-foreground-muted text-center mb-6 text-sm">
        Chọn một hoặc nhiều nhóm để bắt đầu luyện tập
      </p>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8"
        id="group-selector-grid"
      >
        {groups.map((group, index) => {
          const isSelected = selectedGroups.includes(group.id);
          return (
            <button
              key={group.id}
              onClick={() => onToggleGroup(group.id)}
              className={`
                glass-card p-5 text-left cursor-pointer
                opacity-0 animate-fade-in-up
                ${isSelected ? "!border-indigo !bg-indigo/10" : ""}
                stagger-${index + 1}
              `}
              id={`group-selector-${group.id}`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl kana-display">{group.icon}</span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? "border-indigo bg-indigo"
                      : "border-border-light"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3.5 h-3.5 text-white animate-confetti-pop"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-foreground mb-0.5">
                {group.name}
                <span className="ml-2 text-foreground-dim text-sm font-normal">
                  {group.nameJp}
                </span>
              </h3>
              <p className="text-foreground-muted text-xs mb-2">
                {group.description}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-hover text-foreground-dim">
                  {group.count} ký tự
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Start button */}
      <div className="text-center">
        <div className="text-foreground-muted text-sm mb-3">
          {totalSelected > 0 ? (
            <>
              Đã chọn{" "}
              <span className="text-indigo-light font-semibold">
                {totalSelected}
              </span>{" "}
              ký tự
            </>
          ) : (
            "Vui lòng chọn ít nhất 1 nhóm"
          )}
        </div>
        <button
          onClick={onStartStudy}
          disabled={selectedGroups.length === 0}
          className={`
            btn-shine px-8 py-3 rounded-2xl font-semibold text-white
            transition-all duration-300
            ${
              selectedGroups.length > 0
                ? "bg-gradient-to-r from-sakura to-indigo hover:shadow-lg hover:shadow-sakura/25 hover:scale-105 cursor-pointer"
                : "bg-surface-hover text-foreground-dim cursor-not-allowed"
            }
          `}
          id="start-study-btn"
        >
          🚀 Bắt đầu luyện tập
        </button>
      </div>
    </div>
  );
}
