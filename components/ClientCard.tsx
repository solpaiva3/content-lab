"use client";

import Image from "next/image";
import Link from "next/link";
import { Client, parseClient } from "@/types";

export function ClientCard({ client }: { client: Client }) {
  const parsed = parseClient(client);

  return (
    <Link href={`/clients/${client.id}`}>
      <div className="group bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all p-5 flex flex-col gap-4 cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {parsed.logoUrl ? (
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                <Image
                  src={parsed.logoUrl}
                  alt={parsed.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <span className="text-lg font-bold text-violet-400">
                  {parsed.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-violet-700 transition">
                {parsed.name}
              </h3>
              <p className="text-xs text-gray-500">{parsed.sector}</p>
            </div>
          </div>
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {parsed.colors.length > 0 && (
          <div className="flex gap-1.5">
            {parsed.colors.map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {parsed.personality.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs bg-violet-50 text-violet-600 font-medium"
            >
              {tag}
            </span>
          ))}
          {parsed.personality.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
              +{parsed.personality.length - 3}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
