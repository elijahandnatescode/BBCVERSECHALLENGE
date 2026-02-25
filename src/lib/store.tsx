'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  Member,
  BibleVersion,
  VerseReference,
  RecordingSession,
  ChurchGoal,
  AppState,
} from '../types/index';
import { MEMBERS } from '../data/members';
import { VERSES } from '../data/verses';

interface AppContextType {
  // State properties
  members: Member[];
  verses: VerseReference[];
  records: RecordingSession[];
  churchGoal: ChurchGoal;
  selectedMember: Member | null;
  selectedVerse: VerseReference | null;
  selectedVersion: BibleVersion;
  isRecording: boolean;
  searchQuery: string;
  showCommandPalette: boolean;
  // Action methods
  selectMember: (member: Member | null) => void;
  selectVerse: (verse: VerseReference | null) => void;
  setVersion: (version: BibleVersion) => void;
  addRecord: (record: RecordingSession) => void;
  updateMember: (member: Member) => void;
  addMember: (member: Member) => void;
  searchMembers: (query: string) => void;
  toggleCommandPalette: () => void;
  setShowCommandPalette: (show: boolean) => void;
  updateChurchGoal: (goal: Partial<ChurchGoal>) => void;
  setIsRecording: (recording: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_CHURCH_GOAL: ChurchGoal = {
  id: 'goal-1',
  title: 'Church-Wide Memory Challenge 2025',
  targetVerses: 100,
  completedVerses: 0,
};

const DEFAULT_SELECTED_VERSION: BibleVersion = 'KJV';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [verses, setVerses] = useState<VerseReference[]>([]);
  const [records, setRecords] = useState<RecordingSession[]>([]);
  const [churchGoal, setChurchGoal] = useState<ChurchGoal>(INITIAL_CHURCH_GOAL);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<VerseReference | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>(
    DEFAULT_SELECTED_VERSION
  );
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      try {
        const state: AppState = JSON.parse(savedState);
        setMembers(state.members || MEMBERS);
        setVerses(state.verses || VERSES);
        setRecords(state.records || []);
        setChurchGoal(state.churchGoal || INITIAL_CHURCH_GOAL);
        setSelectedVersion(state.selectedVersion || DEFAULT_SELECTED_VERSION);
      } catch (error) {
        console.error('Failed to load app state:', error);
        setMembers(MEMBERS);
        setVerses(VERSES);
      }
    } else {
      setMembers(MEMBERS);
      setVerses(VERSES);
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isLoading) {
      const persistedState = {
        members,
        verses,
        records,
        churchGoal,
        selectedVersion,
      };
      localStorage.setItem('appState', JSON.stringify(persistedState));
    }
  }, [members, verses, records, churchGoal, selectedVersion, isLoading]);

  const selectMember = (member: Member | null) => {
    setSelectedMember(member);
  };

  const selectVerse = (verse: VerseReference | null) => {
    setSelectedVerse(verse);
  };

  const setVersion = (version: BibleVersion) => {
    setSelectedVersion(version);
  };

  const addRecord = (record: RecordingSession) => {
    setRecords((prev) => [...prev, record]);

    // Update member's passedVerses if the recitation passed
    if (record.status === 'passed' && record.memberId) {
      setMembers((prev) =>
        prev.map((member) => {
          if (member.id === record.memberId) {
            // Check if already passed this verse+version combo
            const alreadyPassed = member.passedVerses.some(
              (pv) => pv.verseId === record.verseId && pv.versionUsed === record.versionUsed
            );
            if (alreadyPassed) return member;

            return {
              ...member,
              passedVerses: [
                ...member.passedVerses,
                {
                  verseId: record.verseId,
                  versionUsed: record.versionUsed,
                  accuracyScore: record.accuracyScore,
                  date: record.date,
                },
              ],
              totalPoints: member.totalPoints + Math.round(record.accuracyScore),
            };
          }
          return member;
        })
      );

      // Increment church goal completed verses
      setChurchGoal((prev) => ({
        ...prev,
        completedVerses: prev.completedVerses + 1,
      }));
    }
  };

  const updateMember = (member: Member) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? member : m))
    );
  };

  const addMember = (member: Member) => {
    setMembers((prev) => [...prev, member]);
  };

  const searchMembers = (query: string) => {
    setSearchQuery(query);
  };

  const toggleCommandPalette = () => {
    setShowCommandPalette((prev) => !prev);
  };

  const handleSetShowCommandPalette = (show: boolean) => {
    setShowCommandPalette(show);
  };

  const updateChurchGoal = (goal: Partial<ChurchGoal>) => {
    setChurchGoal((prev) => ({
      ...prev,
      ...goal,
    }));
  };

  const handleSetIsRecording = (recording: boolean) => {
    setIsRecording(recording);
  };

  const value: AppContextType = {
    // State properties
    members,
    verses,
    records,
    churchGoal,
    selectedMember,
    selectedVerse,
    selectedVersion,
    isRecording,
    searchQuery,
    showCommandPalette,
    // Action methods
    selectMember,
    selectVerse,
    setVersion,
    addRecord,
    updateMember,
    addMember,
    searchMembers,
    toggleCommandPalette,
    setShowCommandPalette: handleSetShowCommandPalette,
    updateChurchGoal,
    setIsRecording: handleSetIsRecording,
  };

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
