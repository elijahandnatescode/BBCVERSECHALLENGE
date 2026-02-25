'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Eye, RotateCw } from 'lucide-react'
import type { VerseReference, BibleVersion } from '@/types'

export function BlurStudyTool({ verse, version }: { verse: VerseReference; version: BibleVersion }) {
  const [blurAmount, setBlurAmount] = useState(50)
  const [shuffleMode, setShuffleMode] = useState(false)
  const [revealActive, setRevealActive] = useState(false)

  const verseText = verse.versions[version] || verse.versions.KJV || ''

  // Split text into words
  const words = useMemo(() => {
    return verseText.split(/\s+/).filter(w => w.length > 0)
  }, [verseText])

  // Get shuffled words if shuffle mode is on
  const displayWords = useMemo(() => {
    if (!shuffleMode || revealActive) return words
    return [...words].sort(() => Math.random() - 0.5)
  }, [words, shuffleMode, revealActive])

  // Calculate which words to show
  const visibleWordCount = useMemo(() => {
    return Math.ceil((words.length * (100 - blurAmount)) / 100)
  }, [blurAmount, words.length])

  // Get difficulty level
  const difficultyLevel = useMemo(() => {
    if (blurAmount < 25) return 'Expert'
    if (blurAmount < 50) return 'Hard'
    if (blurAmount < 75) return 'Medium'
    return 'Easy'
  }, [blurAmount])

  // Handle reveal
  const handleReveal = () => {
    setRevealActive(true)
    setTimeout(() => {
      setRevealActive(false)
    }, 2000)
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-6">
      {/* Verse Text Display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-slate-700 rounded-lg p-6 min-h-32 flex items-center justify-center"
      >
        <div className="text-center space-y-4">
          {revealActive ? (
            <motion.p
              key="revealed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-lg text-slate-900 dark:text-white leading-relaxed font-serif"
            >
              {verseText}
            </motion.p>
          ) : (
            <div className="text-lg text-slate-900 dark:text-white leading-relaxed space-y-2">
              <div className="flex flex-wrap justify-center gap-2">
                {displayWords.map((word, idx) => {
                  const isVisible = idx < visibleWordCount
                  return (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.02 }}
                      className={`transition-all ${
                        isVisible
                          ? 'text-slate-900 dark:text-white font-medium'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                      style={{
                        filter: isVisible ? 'blur(0px)' : `blur(${Math.max(2, (100 - blurAmount) / 10)}px)`,
                        opacity: isVisible ? 1 : 0.5,
                      }}
                    >
                      {word}
                    </motion.span>
                  )
                })}
              </div>
            </div>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-slate-600 dark:text-slate-400 mt-4"
          >
            {visibleWordCount} / {words.length} words visible
          </motion.p>
        </div>
      </motion.div>

      {/* Blur Slider */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Difficulty: {difficultyLevel}
          </label>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {blurAmount}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={blurAmount}
          onChange={(e) => setBlurAmount(Number(e.target.value))}
          className="w-full h-3 bg-slate-300 dark:bg-slate-600 rounded-full appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span>Easy</span>
          <span>Expert</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReveal}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          Reveal (2s)
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShuffleMode(!shuffleMode)}
          className={`flex-1 flex items-center justify-center gap-2 font-medium py-2 px-4 rounded-lg transition-colors ${
            shuffleMode
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-900 dark:text-white'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          Shuffle
        </motion.button>
      </div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-slate-600 dark:text-slate-400 text-center"
      >
        Adjust the difficulty slider to hide more words. Use shuffle mode to randomize word order.
      </motion.p>
    </div>
  )
}
