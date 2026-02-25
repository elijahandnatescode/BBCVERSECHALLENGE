"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

interface BibleVersion {
  id: string;
  abbr: string;
  name: string;
}

const BIBLE_VERSIONS: BibleVersion[] = [
  { id: "kjv", abbr: "KJV", name: "King James Version" },
  { id: "nkjv", abbr: "NKJV", name: "New King James Version" },
  { id: "nasb", abbr: "NASB", name: "New American Standard Bible" },
  { id: "esv", abbr: "ESV", name: "English Standard Version" },
  { id: "niv", abbr: "NIV", name: "New International Version" },
  { id: "nlt", abbr: "NLT", name: "New Living Translation" },
  { id: "msg", abbr: "MSG", name: "The Message" },
  { id: "amp", abbr: "AMP", name: "Amplified Bible" },
];

interface VersionPickerProps {
  value: string;
  onChange: (versionId: string) => void;
}

export function VersionPicker({ value, onChange }: VersionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedVersion = BIBLE_VERSIONS.find((v) => v.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ backgroundColor: "rgb(245, 245, 244)" }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-4 py-3 text-left bg-white border border-stone-200 rounded-xl transition-colors duration-200 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium">
              Bible Version
            </span>
            <span className="text-slate-900 font-medium">
              {selectedVersion
                ? `${selectedVersion.abbr} - ${selectedVersion.name}`
                : "Select a version"}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{
              duration: 0.15,
              ease: "easeOut",
            }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="max-h-80 overflow-y-auto">
              {BIBLE_VERSIONS.map((version, index) => {
                const isSelected = version.id === value;
                return (
                  <motion.button
                    key={version.id}
                    onClick={() => {
                      onChange(version.id);
                      setIsOpen(false);
                    }}
                    initial={false}
                    animate={{
                      backgroundColor: isSelected
                        ? "rgb(236, 253, 245)"
                        : "transparent",
                    }}
                    whileHover={{
                      backgroundColor: isSelected
                        ? "rgb(209, 250, 229)"
                        : "rgb(245, 245, 244)",
                    }}
                    className="w-full px-4 py-3 text-left flex items-center justify-between transition-colors duration-150 border-b border-stone-100 last:border-b-0"
                  >
                    <div className="flex flex-col flex-1">
                      <span
                        className={`text-sm font-semibold ${
                          isSelected
                            ? "text-emerald-600"
                            : "text-slate-900"
                        }`}
                      >
                        {version.abbr}
                      </span>
                      <span className="text-xs text-slate-500">
                        {version.name}
                      </span>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="ml-3 flex-shrink-0"
                        >
                          <Check className="w-5 h-5 text-emerald-600" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
