'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Zap } from 'lucide-react'
import { useApp } from '@/lib/store'

export function ChurchGoal() {
  const { churchGoal, members, records } = useApp()

  const progress = useMemo(() => {
    return churchGoal.targetVerses > 0
      ? (churchGoal.completedVerses / churchGoal.targetVerses) * 100
      : 0
  }, [churchGoal.completedVerses, churchGoal.targetVerses])

  const recentCompletions = useMemo(() => {
    return records
      .filter(r => r.status === 'passed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(record => {
        const member = members.find(m => m.id === record.memberId)
        return {
          memberName: member?.name || 'Unknown',
          verseReference: `Verse ${record.verseId}`,
          date: new Date(record.date).toLocaleDateString(),
        }
      })
  }, [records, members])

  const activeMembers = useMemo(() => {
    return members.filter(m => m.passedVerses.length > 0).length
  }, [members])

  const motivationalMessage = useMemo(() => {
    if (progress >= 100) return "You've reached the church goal! Celebrate this achievement!"
    if (progress >= 75) return "Almost there! Keep the momentum going!"
    if (progress >= 50) return "Halfway there! Let's keep building on this progress!"
    if (progress >= 25) return "Great start! Keep growing and encouraging others!"
    return "Every verse memorized brings us closer to our goal!"
  }, [progress])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-8 h-8 text-amber-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {churchGoal.title}
        </h2>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Progress
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {churchGoal.completedVerses} / {churchGoal.targetVerses}
          </p>
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {progress.toFixed(1)}%
        </p>
      </div>

      {/* Motivational Message */}
      <motion.div
        key={Math.floor(progress / 25)}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg p-4 mb-6"
      >
        <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {motivationalMessage}
        </p>
      </motion.div>

      {/* Recent Completions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Recent Completions
        </h3>
        <div className="space-y-3">
          {recentCompletions.length > 0 ? (
            recentCompletions.map((completion, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {completion.memberName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {completion.verseReference}
                  </p>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {completion.date}
                </p>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No completions yet. Start recording!
            </p>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {activeMembers}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Active Members
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {members.length}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Total Members
          </p>
        </div>
      </div>
    </motion.div>
  )
}
