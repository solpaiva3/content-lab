"use client";

import { Idea } from "@/types";

interface IdeaCardProps {
  idea: Idea;
  onApprove: () => void;
  onReject: () => void;
  isGeneratingPost: boolean;
}

export function IdeaCard({ idea, onApprove, onReject, isGeneratingPost }: IdeaCardProps) {
  const isRejected = idea.status === "rejected";
  const isApproved = idea.status === "approved";

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
        isRejected
          ? "opacity-40 bg-gray-50 border-gray-100"
          : isApproved
          ? "border-green-300 bg-green-50"
          : "bg-white border-gray-100 hover:border-violet-200 hover:shadow-md"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-1 truncate">{idea.userIdea}</p>
          <h3 className={`font-semibold text-base leading-snug ${isApproved ? "text-green-800" : "text-gray-900"}`}>
            {idea.title}
          </h3>
        </div>
        {isApproved && (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-green-200 text-green-800 font-medium">
            Approved
          </span>
        )}
        {isRejected && (
          <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-500 font-medium">
            Rejected
          </span>
        )}
      </div>

      {/* Characteristics */}
      <div className="flex flex-col gap-2">
        <CharacteristicRow index={1} text={idea.characteristic1} />
        <CharacteristicRow index={2} text={idea.characteristic2} />
        {idea.characteristic3 && <CharacteristicRow index={3} text={idea.characteristic3} />}
      </div>

      {/* Actions */}
      {idea.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onApprove}
            disabled={isGeneratingPost}
            className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGeneratingPost ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              "Approve"
            )}
          </button>
          <button
            onClick={onReject}
            disabled={isGeneratingPost}
            className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm hover:border-red-300 hover:text-red-500 transition disabled:opacity-50"
            title="Reject"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {isRejected && (
        <button
          onClick={onApprove}
          className="text-xs text-gray-400 hover:text-violet-600 transition self-start underline underline-offset-2"
        >
          Revert
        </button>
      )}
    </div>
  );
}

function CharacteristicRow({ index, text }: { index: number; text: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}
