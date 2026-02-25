'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Search as SearchIcon, X, Trophy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/store'

export function MemberSearch() {
  const { members, showCommandPalette, setShowCommandPalette, selectMember } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showCommandPalette) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev < filteredMembers.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredMembers[selectedIndex]) {
            selectMember(filteredMembers[selectedIndex])
            setShowCommandPalette(false)
            setSearchQuery('')
          }
          break
        case 'Escape':
          e.preventDefault()
          setShowCommandPalette(false)
          setSearchQuery('')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCommandPalette, filteredMembers, selectedIndex, selectMember, setShowCommandPalette])

  return (
    <AnimatePresence>
      {showCommandPalette && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowCommandPalette(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-[var(--bg-color)] brutalist-border brutalist-shadow flex flex-col max-h-[70vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header + Search Input */}
            <div className="flex items-center p-6 border-b-[var(--base-border-width)] border-[var(--text-color)] bg-[var(--text-color)] text-[var(--bg-color)] relative">
              <SearchIcon className="w-8 h-8 mr-4 text-[var(--bg-color)]" />
              <input
                autoFocus
                type="text"
                placeholder="Command K..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-3xl font-bold uppercase placeholder:text-[var(--bg-color)] placeholder:opacity-50"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowCommandPalette(false);
                }}
                className="ml-4 p-2 brutalist-border bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--error-color)] hover:text-[var(--bg-color)] transition-none"
              >
                <X className="w-6 h-6" strokeWidth={3} />
              </button>
            </div>

            {/* Results Grid */}
            <div className="overflow-y-auto p-4 flex-1 bg-[var(--bg-color)] min-h-[50vh]">
              {searchQuery !== '' && filteredMembers.length === 0 && (
                <div className="p-8 text-center text-2xl font-bold uppercase opacity-30 mt-10">
                  No signal found for "{searchQuery}"
                </div>
              )}

              <div className="flex flex-col gap-4 mt-2">
                {filteredMembers.map((member, index) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      selectMember(member)
                      setShowCommandPalette(false)
                      setSearchQuery('')
                    }}
                    className={`brutalist-border p-4 flex justify-between items-center cursor-pointer w-full group transition-none ${index === selectedIndex
                        ? 'bg-[var(--text-color)] text-[var(--bg-color)] shadow-[4px_4px_0_0_var(--text-color)] transform -translate-x-1 -translate-y-1'
                        : 'hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] bg-white'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-12 h-12 brutalist-border bg-white" />
                      ) : (
                        <div className="w-12 h-12 brutalist-border bg-white flex items-center justify-center font-black text-xl text-[var(--text-color)]">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-xl md:text-2xl uppercase tracking-wider">{member.name}</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${index === selectedIndex ? 'opacity-80' : 'opacity-60'}`}>
                          Passed: {member.passedVerses.length}
                        </span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 px-4 py-2 brutalist-border transition-none ${index === selectedIndex
                        ? 'bg-[var(--bg-color)] text-[var(--text-color)] border-[var(--text-color)]'
                        : 'bg-[var(--text-color)] text-[var(--bg-color)] border-[var(--bg-color)] group-hover:bg-[var(--bg-color)] group-hover:text-[var(--text-color)] group-hover:border-[var(--text-color)]'
                      }`}>
                      <Trophy className="w-4 h-4" />
                      <span className="font-bold text-lg">{member.totalPoints}</span>
                    </div>
                  </button>
                ))}
              </div>

              {searchQuery === '' && filteredMembers.length > 0 && (
                <div className="p-8 text-center text-3xl font-black uppercase opacity-20 mt-10 tracking-widest">
                  Awaiting Input
                </div>
              )}
            </div>

            {/* Footer Commands */}
            <div className="p-4 text-xs md:text-sm bg-[var(--text-color)] text-[var(--bg-color)] font-bold uppercase tracking-widest flex justify-between items-center border-t-[var(--base-border-width)] border-[var(--text-color)]">
              <div className="flex gap-4">
                <span>↓↑ Navigate</span>
                <span>↵ Select</span>
              </div>
              <span className="opacity-50">[ESC] Abort</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
