"use client";

import React from "react";
import Image from "next/image";
import { Member } from "@/types";

interface MemberCardProps {
  member: Member;
  onClick?: () => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  // Extract initials if no avatar
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      className="brutalist-border brutalist-shadow bg-[var(--bg-color)] p-6 md:p-8 flex flex-col gap-6 cursor-pointer group hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-colors h-full justify-between"
    >
      <div className="flex justify-between items-start w-full">
        {/* Avatar/Initials Frame */}
        <div className="relative w-20 h-20 md:w-24 md:h-24 brutalist-border bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.name}
              fill
              className="object-cover group-hover:grayscale transition-all duration-300"
            />
          ) : (
            <span className="text-3xl font-black text-[var(--text-color)] group-hover:text-[var(--bg-color)]">
              {initials}
            </span>
          )}
          {/* Brutalist overlay accent */}
          <div className="absolute top-0 right-0 w-3 h-3 bg-[var(--success-color)] border-b-[var(--base-border-width)] border-l-[var(--base-border-width)] border-[var(--text-color)] zip-in" />
        </div>

        {/* Points Badge */}
        <div className="bg-[var(--text-color)] text-[var(--bg-color)] px-4 py-2 brutalist-border border-[var(--text-color)] group-hover:bg-[var(--bg-color)] group-hover:text-[var(--text-color)] group-hover:border-[var(--bg-color)] transition-colors flex flex-col items-center">
          <span className="text-sm font-bold tracking-widest uppercase opacity-80 leading-none mb-1">Score</span>
          <span className="text-2xl font-black leading-none">{member.totalPoints}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t-[var(--base-border-width)] border-[var(--text-color)] pt-4 group-hover:border-[var(--bg-color)] transition-colors mt-auto">
        <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter truncate" title={member.name}>
          {member.name}
        </h3>

        <div className="flex justify-between items-center mt-2 font-bold uppercase tracking-widest text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[var(--text-color)] group-hover:bg-[var(--bg-color)] inline-block"></span>
            <span className="opacity-70">Passes: {member.passedVerses?.length || 0}</span>
          </div>
          <span className="opacity-50">JND {new Date(member.joinedDate).getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}
