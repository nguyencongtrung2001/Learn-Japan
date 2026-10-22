import { QuestionPanel } from "./question-panel";
import { CorrectAnswer } from "./correct-answer";
import { getChoiceAnswer, type Feedback, type QuizItem } from "@/lib/quiz";

interface ChoiceStepProps {
  item: QuizItem;
  feedback: Feedback;
  selectedOption: string | null;
  onSelect: (option: string) => void;
  onPlay: (text: string) => void;
}

/** Dùng cho 3 dạng: Anh→Việt, Việt→Anh, Nghe chọn từ. */
export function ChoiceStep({ item, feedback, selectedOption, onSelect, onPlay }: ChoiceStepProps) {
  const { card } = item.word;
  const correctAnswer = getChoiceAnswer(item);
  const answered = feedback !== null;

  return (
    <>
      <QuestionPanel feedback={feedback} className="mb-8 p-8 sm:p-12">
        {item.levelType === "audio-select" ? (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => onPlay(card.word)}
              className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-full bg-indigo/10 text-5xl text-indigo-light shadow-lg transition-all hover:scale-105 hover:bg-indigo/20 active:scale-95"
              aria-label="Nghe phát âm"
            >
              🔊
            </button>
            <p className="mt-6 text-sm font-medium text-foreground-muted sm:text-base">Nghe và chọn đáp án đúng</p>
          </div>
        ) : (
          <div className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            {item.levelType === "abcd-en-vn" ? card.word : card.translation}
          </div>
        )}

        {feedback === "incorrect" && <CorrectAnswer>{correctAnswer}</CorrectAnswer>}
      </QuestionPanel>

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {item.options?.map((opt) => (
          <OptionButton
            key={opt}
            label={opt}
            disabled={answered}
            state={optionState(opt, selectedOption, correctAnswer, feedback)}
            onClick={() => onSelect(opt)}
          />
        ))}
      </div>
    </>
  );
}

type OptionState = "idle" | "selected-correct" | "selected-wrong" | "reveal-correct" | "faded";

function optionState(opt: string, selected: string | null, correct: string, feedback: Feedback): OptionState {
  if (selected === opt) return feedback === "correct" ? "selected-correct" : "selected-wrong";
  if (feedback) return opt === correct ? "reveal-correct" : "faded";
  return "idle";
}

const OPTION_STYLES: Record<OptionState, string> = {
  idle: "bg-surface border-2 border-border/50 text-foreground hover:bg-surface-hover hover:border-indigo/30 hover:shadow-md hover:-translate-y-1",
  "selected-correct": "bg-emerald/20 border-2 border-emerald/50 text-emerald shadow-emerald/20 scale-[1.02]",
  "selected-wrong": "bg-rose/20 border-2 border-rose/50 text-rose shadow-rose/20 scale-[0.98]",
  "reveal-correct": "bg-emerald/20 border-2 border-emerald/50 text-emerald shadow-emerald/20 scale-[1.02] animate-pulse",
  faded: "bg-surface border-2 border-border/50 text-foreground opacity-50 grayscale",
};

function OptionButton({
  label,
  state,
  disabled,
  onClick,
}: {
  label: string;
  state: OptionState;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-2xl p-5 text-center text-lg font-semibold shadow-sm transition-all sm:text-xl ${OPTION_STYLES[state]}`}
    >
      {label}
    </button>
  );
}
