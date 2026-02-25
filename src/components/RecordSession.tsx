'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Check } from 'lucide-react'
import { useApp } from '@/lib/store'
import { VersionPicker } from './VersionPicker'
import { RecordingModal } from './RecordingModal'
import type { Member, VerseReference, BibleVersion } from '@/types'

type Step = 1 | 2 | 3 | 4

export function RecordSession() {
  const { members, verses } = useApp()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedVerse, setSelectedVerse] = useState<VerseReference | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('KJV')
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false)

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member)
    setCurrentStep(2)
  }

  const handleVerseSelect = (verse: VerseReference) => {
    setSelectedVerse(verse)
    setCurrentStep(3)
  }

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId.toUpperCase() as BibleVersion)
  }

  const handleProceedToConfirm = () => {
    setCurrentStep(4)
  }

  const handleStartRecording = () => {
    setIsRecordingModalOpen(true)
  }

  const handleCloseRecordingModal = () => {
    setIsRecordingModalOpen(false)
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSelectedMember(null)
    setSelectedVerse(null)
    setSelectedVersion('KJV')
  }

  const isStepCompleted = (step: Step): boolean => step < currentStep
  const isStepActive = (step: Step): boolean => step === currentStep

  const getStepColor = (step: Step): string => {
    if (isStepCompleted(step) || isStepActive(step)) {
      return 'bg-[var(--text-color)] text-[var(--bg-color)] shadow-[4px_4px_0_0_var(--text-color)]'
    }
    return 'bg-[var(--bg-color)] text-[var(--text-color)] border-dashed opacity-50'
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-black uppercase tracking-tighter border-b-[var(--base-border-width)] border-[var(--text-color)] pb-4">Define Vector</h3>
            <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-4 pr-2">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className="brutalist-border brutalist-shadow bg-[var(--bg-color)] p-6 hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] group transition-none w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-black text-3xl uppercase tracking-tighter">{member.name}</p>
                      <p className="font-bold text-sm tracking-widest uppercase mt-2 group-hover:opacity-80">
                        Passes: {member.passedVerses.length} // Net PTS: {member.totalPoints}
                      </p>
                    </div>
                    {member.avatarUrl && (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-16 h-16 brutalist-border bg-white ml-4 object-cover group-hover:grayscale"
                      />
                    )}
                  </div>
                </button>
              ))}
              {members.length === 0 && (
                <p className="text-center font-bold uppercase tracking-widest opacity-20 py-20 text-3xl">ROSTER EMPTY</p>
              )}
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-3xl font-black uppercase tracking-tighter border-b-[var(--base-border-width)] border-[var(--text-color)] pb-4">Acquire Target</h3>
            <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-4 pr-2">
              {verses.map((verse) => (
                <button
                  key={verse.id}
                  onClick={() => handleVerseSelect(verse)}
                  className="brutalist-border brutalist-shadow bg-[var(--bg-color)] p-6 hover:bg-[var(--text-color)] hover:text-[var(--bg-color)] group transition-none w-full text-left"
                >
                  <p className="font-black text-3xl uppercase tracking-tighter">{verse.reference}</p>
                  <p className="font-bold text-sm tracking-widest uppercase mt-2 group-hover:opacity-80">
                    ID: {verse.id.toUpperCase()} // LOC: {verse.book} {verse.chapter}:{verse.verse}
                  </p>
                </button>
              ))}
              {verses.length === 0 && (
                <p className="text-center font-bold uppercase tracking-widest opacity-20 py-20 text-3xl">CATALOG EMPTY</p>
              )}
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="mt-6 border-b-2 border-transparent hover:border-[var(--text-color)] font-bold uppercase tracking-widest"
            >
              ← Abort Vector
            </button>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <h3 className="text-3xl font-black uppercase tracking-tighter border-b-[var(--base-border-width)] border-[var(--text-color)] pb-4">Set Parameters</h3>

            <div className="flex gap-4">
              <div className="flex-1 p-6 brutalist-border bg-white flex flex-col">
                <p className="text-sm uppercase font-bold tracking-widest opacity-60 mb-2">Vector</p>
                <p className="text-2xl font-black uppercase">{selectedMember?.name}</p>
              </div>
              <div className="flex-1 p-6 brutalist-border bg-white flex flex-col">
                <p className="text-sm uppercase font-bold tracking-widest opacity-60 mb-2">Target</p>
                <p className="text-2xl font-black uppercase">{selectedVerse?.reference}</p>
              </div>
            </div>

            <div className="bg-[var(--text-color)] p-6 brutalist-border">
              <label className="block text-sm font-bold uppercase tracking-widest mb-4 text-[var(--bg-color)]">
                Engine Protocol Version
              </label>
              <VersionPicker value={selectedVersion.toLowerCase()} onChange={handleVersionChange} />
            </div>

            {selectedVerse && selectedVersion in selectedVerse.versions && (
              <div className="p-6 brutalist-border border-dashed bg-white max-h-[30vh] overflow-y-auto">
                <p className="text-sm font-bold uppercase tracking-widest mb-4 border-b-[var(--base-border-width)] border-[var(--text-color)] pb-2 opacity-50">Validation Telemetry Preview</p>
                <p className="text-xl font-medium leading-relaxed mt-4">
                  "{selectedVerse.versions[selectedVersion]}"
                </p>
              </div>
            )}

            <div className="flex gap-6 mt-12">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-8 py-4 brutalist-border bg-[var(--bg-color)] text-[var(--text-color)] font-black uppercase tracking-widest text-xl hover:bg-[var(--error-color)] hover:text-[var(--bg-color)]"
              >
                Retreat
              </button>
              <button
                onClick={handleProceedToConfirm}
                className="flex-1 py-4 brutalist-border brutalist-shadow bg-[var(--text-color)] text-[var(--bg-color)] font-black uppercase tracking-widest text-2xl flex items-center justify-center gap-4 hover:-translate-y-1 hover:-translate-x-1 shadow-[8px_8px_0_0_var(--text-color)] transition-none"
              >
                Advance Sequence
                <ChevronRight className="w-8 h-8" strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <h3 className="text-3xl font-black uppercase tracking-tighter border-b-[var(--base-border-width)] border-[var(--text-color)] pb-4">Initiate</h3>

            <div className="brutalist-border">
              <div className="p-6 flex justify-between items-center border-b-[var(--base-border-width)] border-[var(--text-color)] bg-white">
                <div>
                  <p className="text-xs uppercase font-bold tracking-widest opacity-60">Vector</p>
                  <p className="text-2xl font-black uppercase mt-1">{selectedMember?.name}</p>
                </div>
                {isStepCompleted(2) && <Check className="w-8 h-8 text-[var(--text-color)] border-2 border-[var(--text-color)] p-1 bg-[var(--success-color)]" strokeWidth={3} />}
              </div>

              <div className="p-6 flex justify-between items-center border-b-[var(--base-border-width)] border-[var(--text-color)] bg-white">
                <div>
                  <p className="text-xs uppercase font-bold tracking-widest opacity-60">Target</p>
                  <p className="text-2xl font-black uppercase mt-1">{selectedVerse?.reference}</p>
                </div>
                {isStepCompleted(3) && <Check className="w-8 h-8 text-[var(--text-color)] border-2 border-[var(--text-color)] p-1 bg-[var(--success-color)]" strokeWidth={3} />}
              </div>

              <div className="p-6 flex justify-between items-center bg-[var(--text-color)] text-[var(--bg-color)]">
                <div>
                  <p className="text-xs uppercase font-bold tracking-widest opacity-60">Protocol</p>
                  <p className="text-2xl font-black uppercase mt-1">{selectedVersion}</p>
                </div>
                <Check className="w-8 h-8 text-[var(--text-color)] border-2 border-[var(--text-color)] p-1 bg-[var(--success-color)]" strokeWidth={3} />
              </div>
            </div>

            {selectedVerse && selectedVersion in selectedVerse.versions && (
              <div className="p-8 brutalist-border border-[var(--text-color)] bg-white shadow-[8px_8px_0_0_var(--text-color)]">
                <p className="text-sm font-bold uppercase tracking-widest mb-4 opacity-50 border-b-[var(--base-border-width)] border-[var(--text-color)] pb-2">Diagnostic Data Point</p>
                <div className="text-2xl font-medium leading-relaxed mt-4 bg-[var(--bg-color)] p-4 border-l-8 border-[var(--text-color)]">
                  "{selectedVerse.versions[selectedVersion]}"
                </div>
              </div>
            )}

            <div className="flex gap-6 mt-12">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-8 py-4 brutalist-border bg-[var(--bg-color)] text-[var(--text-color)] font-black uppercase tracking-widest text-xl hover:bg-[var(--text-color)] hover:text-[var(--bg-color)]"
              >
                Recalibrate
              </button>
              <button
                onClick={handleStartRecording}
                className="flex-1 py-4 brutalist-border brutalist-shadow bg-[var(--success-color)] text-[var(--text-color)] font-black uppercase tracking-widest text-3xl hover:bg-[var(--text-color)] hover:text-[var(--success-color)] transition-none shadow-[8px_8px_0_0_var(--text-color)]"
              >
                ENGAGE ENGINE
              </button>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 mt-4">
      <div className="mb-12 border-b-4 border-[var(--text-color)] pb-12">
        <div className="flex justify-between items-center relative">
          {/* Steps Path */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[var(--text-color)] -translate-y-1/2 z-0 opacity-20" />

          {([1, 2, 3, 4] as const).map((step) => (
            <div key={step} className="relative z-10 bg-[var(--bg-color)] px-4">
              <div
                className={`w-16 h-16 brutalist-border flex items-center justify-center font-black text-2xl transition-none ${getStepColor(step)}`}
              >
                {isStepCompleted(step) ? <Check className="w-8 h-8" strokeWidth={4} /> : step}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-between font-black text-sm uppercase tracking-widest px-4">
          <span>Vector</span>
          <span>Target</span>
          <span>Engine</span>
          <span>Execute</span>
        </div>
      </div>

      <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={handleCloseRecordingModal}
        member={selectedMember}
        verse={selectedVerse}
      />
    </div>
  )
}
