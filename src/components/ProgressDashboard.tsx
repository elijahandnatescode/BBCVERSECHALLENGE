'use client'

import { motion } from 'framer-motion'
import { Users, BookOpen, Target, Trophy } from 'lucide-react'
import { useApp } from '@/lib/store'

export function ProgressDashboard() {
  const { members, verses, churchGoal, selectVerse } = useApp()

  // Calculate stats
  const totalMembers = members.length

  const totalVersesMemoized = new Set(
    members.flatMap(m => m.passedVerses.map(pv => pv.verseId))
  ).size

  const averageAccuracy = members.length > 0
    ? (members.reduce((sum, m) => {
      const memberAccuracy = m.passedVerses.length > 0
        ? m.passedVerses.reduce((acc, pv) => acc + pv.accuracyScore, 0) / m.passedVerses.length
        : 0
      return sum + memberAccuracy
    }, 0) / members.length)
    : 0

  const goalProgress = churchGoal.targetVerses > 0
    ? (churchGoal.completedVerses / churchGoal.targetVerses) * 100
    : 0

  const stats = [
    { title: 'Units', value: totalMembers },
    { title: 'Cleared', value: totalVersesMemoized },
    { title: 'Avg ACC', value: `${averageAccuracy.toFixed(1)}%` },
    { title: 'Obj Progress', value: `${goalProgress.toFixed(0)}%` },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="border-b-[var(--base-border-width)] border-[var(--text-color)] pb-6 mb-8">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
          <Target className="w-12 h-12 md:w-16 md:h-16" strokeWidth={3} />
          System Dashboard
        </h1>
      </div>

      {/* Primary Stat Block (Bento Header) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            className={`brutalist-border brutalist-shadow p-6 flex flex-col justify-between h-40 ${i % 2 === 0 ? 'bg-[var(--text-color)] text-[var(--bg-color)]' : 'bg-white text-[var(--text-color)]'
              }`}
          >
            <p className="text-sm md:text-base font-bold tracking-widest uppercase opacity-80">{stat.title}</p>
            <p className={`text-4xl md:text-6xl font-black tracking-tighter ${stat.title === 'Obj Progress' ? 'text-[var(--success-color)] text-shadow-sm' : ''}`}>
              {stat.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Target Array (Verses Grid) */}
      <div>
        <h2 className="text-3xl font-black uppercase tracking-widest border-b-[var(--base-border-width)] border-[var(--text-color)] pb-4 mb-6 mt-12">Target Array Status</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bento-grid !px-0 !py-0"
        >
          {verses.map((verse) => {
            const membersPassed = members.filter(m => m.passedVerses.some(pv => pv.verseId === verse.id))
            const passPercentage = members.length > 0 ? (membersPassed.length / members.length) * 100 : 0

            // Brutalist status coloring strategy
            const isCompleted = passPercentage === 100;
            const isStarted = passPercentage > 0;
            const bgColor = isCompleted ? 'bg-[var(--success-color)] text-[var(--text-color)]' : 'bg-white text-[var(--text-color)]';
            const borderOverride = isCompleted ? 'border-[var(--text-color)]' : '';

            const verseText = verse.versions.KJV || ''
            const truncatedText = verseText.substring(0, 60) + (verseText.length > 60 ? '...' : '')

            return (
              <motion.button
                key={verse.id}
                variants={itemVariants}
                onClick={() => selectVerse(verse)}
                className={`text-left brutalist-border brutalist-shadow p-6 flex flex-col justify-between min-h-[220px] transition-none hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] group ${bgColor} ${borderOverride}`}
              >
                <div className="flex-1 w-full border-b-[var(--base-border-width)] border-current pb-4 mb-4">
                  <div className="flex justify-between items-start w-full mb-2">
                    <h3 className="font-black text-2xl uppercase tracking-tighter">
                      {verse.reference}
                    </h3>
                    <div className="px-3 py-1 brutalist-border text-xs font-bold uppercase tracking-widest bg-[var(--text-color)] text-[var(--bg-color)]">
                      {passPercentage.toFixed(0)}%
                    </div>
                  </div>
                  <p className="font-medium text-lg leading-snug opacity-90 group-hover:opacity-100">
                    {truncatedText}
                  </p>
                </div>

                <div className="flex items-center justify-between w-full font-bold uppercase tracking-widest text-xs md:text-sm">
                  <div className="flex -space-x-3">
                    {membersPassed.slice(0, 4).map((member, idx) => (
                      <div key={member.id} className="w-8 h-8 rounded-full brutalist-border bg-white flex items-center justify-center overflow-hidden z-10" style={{ zIndex: 10 - idx }}>
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover group-hover:grayscale" />
                        ) : (
                          <span className="text-xs text-[var(--text-color)]">{member.name.substring(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                    ))}
                    {membersPassed.length > 4 && (
                      <div className="w-8 h-8 rounded-full brutalist-border bg-[var(--text-color)] text-[var(--bg-color)] flex items-center justify-center z-0 text-xs shadow-none">
                        +{membersPassed.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="opacity-60">{isCompleted ? 'SECURED' : isStarted ? 'IN PROGRESS' : 'AWAITING'}</span>
                    <span>{membersPassed.length}/{members.length} CLR</span>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
