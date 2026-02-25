'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Loader2 } from 'lucide-react'
import { useApp } from '@/lib/store'
import { MemberCard } from './MemberCard'
import { Member } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export function MemberList() {
  const { members, addMember } = useApp()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'points' | 'verses' | 'name'>('points')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    return members.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [members, searchTerm])

  // Sort members
  const sortedMembers = useMemo(() => {
    const sorted = [...filteredMembers]
    switch (sortBy) {
      case 'points':
        sorted.sort((a, b) => b.totalPoints - a.totalPoints)
        break
      case 'verses':
        sorted.sort((a, b) => b.passedVerses.length - a.passedVerses.length)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    return sorted
  }, [filteredMembers, sortBy])

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return

    const newMember: Member = {
      id: uuidv4(),
      name: newMemberName.trim(),
      totalPoints: 0,
      passedVerses: [],
      joinedDate: new Date().toISOString(),
    }

    setIsAddingMember(true)
    try {
      addMember(newMember)
      setNewMemberName('')
      setIsAddingMember(false)
    } catch (e) {
      setIsAddingMember(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95 },
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="space-y-6 flex flex-col items-start border-b-[var(--base-border-width)] border-[var(--text-color)] pb-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Directory</h1>
          <p className="text-xl md:text-2xl font-bold uppercase tracking-widest opacity-60 mt-2">Manage Operator Roster</p>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <div className="relative flex-1">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-[var(--text-color)] flex items-center justify-center border-r-[var(--base-border-width)] border-[var(--bg-color)]">
              <Search className="w-8 h-8 text-[var(--bg-color)]" />
            </div>
            <input
              type="text"
              placeholder="Query Name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-4 py-4 brutalist-border bg-[var(--bg-color)] text-2xl font-bold uppercase text-[var(--text-color)] placeholder:opacity-30 focus:outline-none focus:ring-0 shadow-[4px_4px_0_0_var(--text-color)]"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'points' | 'verses' | 'name')}
            className="px-6 py-4 brutalist-border bg-[var(--bg-color)] text-xl font-bold uppercase text-[var(--text-color)] shadow-[4px_4px_0_0_var(--text-color)] focus:outline-none cursor-pointer hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] transition-colors"
            style={{ appearance: 'none' }}
          >
            <option value="points">Sort: PTS</option>
            <option value="verses">Sort: PASSED</option>
            <option value="name">Sort: NAME</option>
          </select>

          <button
            onClick={() => setIsAddingMember(!isAddingMember)}
            className="flex items-center justify-center gap-3 px-8 py-4 brutalist-border brutalist-shadow bg-[var(--text-color)] text-[var(--bg-color)] hover:bg-[var(--bg-color)] hover:text-[var(--text-color)] text-xl font-black uppercase tracking-widest w-full sm:w-auto"
          >
            <Plus className="w-6 h-6" strokeWidth={3} />
            <span>Init Op</span>
          </button>
        </div>
      </div>

      {/* Add Member Form */}
      <AnimatePresence>
        {isAddingMember && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 md:p-8 brutalist-border brutalist-shadow bg-[var(--bg-color)] space-y-6 my-6 border-l-8 border-[var(--success-color)]">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Initialize New Operator</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Designate target name..."
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter') handleAddMember()
                  }}
                  className="flex-1 px-4 py-4 brutalist-border text-2xl font-bold uppercase bg-white focus:outline-none placeholder:opacity-30"
                  autoFocus
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim() || isAddingMember}
                  className="px-8 py-4 brutalist-border brutalist-shadow bg-[var(--text-color)] text-[var(--bg-color)] hover:bg-[var(--success-color)] hover:text-[var(--text-color)] disabled:opacity-50 disabled:cursor-not-allowed text-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 min-w-[160px]"
                >
                  {isAddingMember ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Commit'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingMember(false)
                    setNewMemberName('')
                  }}
                  className="px-8 py-4 brutalist-border brutalist-shadow bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--error-color)] hover:text-[var(--bg-color)] text-xl font-black uppercase tracking-widest"
                >
                  Abort
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Members Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bento-grid"
      >
        <AnimatePresence>
          {sortedMembers.length > 0 ? (
            sortedMembers.map(member => (
              <motion.div key={member.id} variants={itemVariants} className="h-full">
                <MemberCard member={member} />
              </motion.div>
            ))
          ) : (
            <motion.div
              variants={itemVariants}
              className="col-span-full text-center py-20 brutalist-border bg-white"
            >
              <p className="text-3xl font-bold uppercase tracking-widest opacity-20">No Operators Found in Sector</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats Footer */}
      {sortedMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-8 brutalist-border bg-[var(--text-color)] text-[var(--bg-color)]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[var(--bg-color)] text-center">
            <div className="pt-4 sm:pt-0">
              <p className="text-sm font-bold tracking-widest uppercase opacity-80 mb-2">Total Operators</p>
              <p className="text-5xl md:text-7xl font-black leading-none">{sortedMembers.length}</p>
            </div>
            <div className="pt-8 sm:pt-0">
              <p className="text-sm font-bold tracking-widest uppercase opacity-80 mb-2">Network PTS</p>
              <p className="text-5xl md:text-7xl font-black leading-none text-[var(--success-color)] text-shadow-sm">
                {sortedMembers.reduce((sum, m) => sum + m.totalPoints, 0)}
              </p>
            </div>
            <div className="pt-8 sm:pt-0">
              <p className="text-sm font-bold tracking-widest uppercase opacity-80 mb-2">Targets Acquired</p>
              <p className="text-5xl md:text-7xl font-black leading-none">
                {sortedMembers.reduce((sum, m) => sum + m.passedVerses.length, 0)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
