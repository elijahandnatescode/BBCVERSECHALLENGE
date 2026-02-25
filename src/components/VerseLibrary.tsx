'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'
import { useApp } from '@/lib/store'
import { BlurStudyTool } from './BlurStudyTool'
import { VersionPicker } from './VersionPicker'
import type { BibleVersion } from '@/types'

export function VerseLibrary() {
  const { verses, searchQuery, selectVerse } = useApp()
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('KJV')
  const [expandedVerseId, setExpandedVerseId] = useState<string | null>(null)
  const [selectedBookFilter, setSelectedBookFilter] = useState<string>('all')

  const uniqueBooks = useMemo(() => {
    return Array.from(new Set(verses.map(v => v.book))).sort()
  }, [verses])

  const filteredVerses = useMemo(() => {
    return verses.filter(verse => {
      const matchesSearch = !searchQuery ||
        verse.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (verse.versions[selectedVersion] || verse.versions.KJV || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())

      const matchesBook = selectedBookFilter === 'all' || verse.book === selectedBookFilter

      return matchesSearch && matchesBook
    })
  }, [verses, searchQuery, selectedVersion, selectedBookFilter])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header & Filters */}
      <div className="flex flex-col space-y-6 border-b-[var(--base-border-width)] border-[var(--text-color)] pb-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Library</h1>
          <p className="text-xl md:text-2xl font-bold uppercase tracking-widest opacity-60 mt-2">Target Acquisition Array</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="relative flex-1">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-[var(--text-color)] flex items-center justify-center border-r-[var(--base-border-width)] border-[var(--bg-color)]">
              <Search className="w-8 h-8 text-[var(--bg-color)]" />
            </div>
            {/* Note: In the original app, searchQuery came from global state, but it wasn't hooked up to a local input here. 
                 We'll just add the book filter to match the original explicitly defined filter. */}
            <select
              value={selectedBookFilter}
              onChange={(e) => setSelectedBookFilter(e.target.value)}
              className="w-full pl-20 pr-4 py-4 brutalist-border bg-[var(--bg-color)] text-2xl font-bold uppercase text-[var(--text-color)] shadow-[4px_4px_0_0_var(--text-color)] focus:outline-none appearance-none cursor-pointer hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-colors"
              style={{ appearance: 'none' }}
            >
              <option value="all">ALL BOOKS</option>
              {uniqueBooks.map(book => (
                <option key={book} value={book}>{book.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Verses Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredVerses.length > 0 ? (
            filteredVerses.map((verse) => {
              const verseText = verse.versions[selectedVersion] || verse.versions.KJV || ''
              const isExpanded = expandedVerseId === verse.id

              return (
                <motion.div
                  key={verse.id}
                  variants={itemVariants}
                  layout
                  className="brutalist-border brutalist-shadow bg-[var(--bg-color)] overflow-hidden transition-none"
                >
                  <motion.button
                    onClick={() => setExpandedVerseId(isExpanded ? null : verse.id)}
                    className="w-full text-left p-6 flex items-center justify-between hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-none group border-b-[var(--base-border-width)] border-transparent data-[expanded=true]:border-[var(--text-color)]"
                    data-expanded={isExpanded}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-black text-2xl md:text-3xl uppercase tracking-tighter">
                        {verse.reference}
                      </h3>
                      <p className="text-lg font-medium leading-snug mt-2 line-clamp-2 opacity-90 group-hover:opacity-100">
                        {verseText}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {Object.keys(verse.versions).map((version) => (
                          <span
                            key={version}
                            className={`text-xs font-bold uppercase tracking-widest px-3 py-1 brutalist-border transition-none ${version === selectedVersion
                                ? 'bg-[var(--text-color)] text-[var(--bg-color)] border-[var(--bg-color)] group-hover:bg-[var(--bg-color)] group-hover:text-[var(--text-color)] group-hover:border-[var(--text-color)]'
                                : 'bg-[var(--bg-color)] text-[var(--text-color)] border-[var(--text-color)] group-hover:bg-[var(--text-color)] group-hover:text-[var(--bg-color)] group-hover:border-[var(--bg-color)]'
                              }`}
                          >
                            {version}
                          </span>
                        ))}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 flex-shrink-0"
                    >
                      <ChevronDown className="w-8 h-8" strokeWidth={3} />
                    </motion.div>
                  </motion.button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white border-t-[var(--base-border-width)] border-[var(--text-color)]"
                      >
                        <div className="p-6 md:p-8 space-y-8">
                          {/* Version Picker */}
                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest mb-4">
                              Override Engine Version
                            </label>
                            <VersionPicker
                              value={selectedVersion.toLowerCase()}
                              onChange={(v) => setSelectedVersion(v.toUpperCase() as BibleVersion)}
                            />
                          </div>

                          {/* Blur Study Tool */}
                          <div className="pt-6 border-t-[var(--base-border-width)] border-[var(--text-color)] border-dashed">
                            <h4 className="text-sm font-bold uppercase tracking-widest mb-4">
                              Memorization Matrix
                            </h4>
                            <BlurStudyTool verse={verse} version={selectedVersion} />
                          </div>

                          {/* Action Button */}
                          <motion.button
                            onClick={() => selectVerse(verse)}
                            className="w-full brutalist-border brutalist-shadow bg-[var(--text-color)] text-[var(--bg-color)] hover:bg-[var(--success-color)] hover:text-[var(--text-color)] font-black uppercase tracking-widest text-2xl py-6 mt-8 transition-none"
                          >
                            Init Recording Sequence
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          ) : (
            <motion.div
              variants={itemVariants}
              className="text-center py-20 brutalist-border bg-white"
            >
              <Search className="w-16 h-16 text-[var(--text-color)] mx-auto mb-6 opacity-20" strokeWidth={3} />
              <p className="text-3xl font-bold uppercase tracking-widest opacity-20">
                No targets found.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
