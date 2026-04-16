"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Client, parseClient, parseClientPersonality } from "@/types";

export function ClientCard({ client }: { client: Client }) {
  const parsed = parseClient(client);
  const [personalityTags, setPersonalityTags] = useState<string[]>([]);

  useEffect(() => {
    setPersonalityTags(parseClientPersonality(client));
  }, [client.personality]);

  return (
    <Link href={`/clients/${client.id}`}>
      <div className="group bg-white transition-all duration-200 p-7 flex flex-col gap-5 cursor-pointer h-full rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] hover:-translate-y-0.5">
        {/* Logo + name */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {parsed.logoUrl ? (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-[#F7F7F7]">
                <img
                  src={parsed.logoUrl}
                  alt={parsed.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F7F7F7]">
                <span className="text-sm font-medium text-[#474747]">
                  {parsed.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-base font-medium text-black leading-tight tracking-tight group-hover:text-[#FC0100] transition-colors">
                {parsed.name}
              </h3>
              <p className="text-xs text-[#A0A0A0] font-light mt-0.5">{parsed.sector}</p>
            </div>
          </div>
          <svg
            className="w-3.5 h-3.5 text-[#E5E5E5] group-hover:text-[#FC0100] transition-colors mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        {/* Color palette */}
        {parsed.colors.length > 0 && (
          <div className="flex gap-1">
            {parsed.colors.map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 border border-white"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Personality tags */}
        {personalityTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {personalityTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-xs text-[#FC0100] bg-[#FC0100]/8 rounded-lg font-light tracking-tight"
              >
                {tag}
              </span>
            ))}
            {personalityTags.length > 2 && (
              <span className="px-2 py-0.5 text-xs text-[#A0A0A0] font-light">
                +{personalityTags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
