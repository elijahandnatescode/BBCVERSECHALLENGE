export type BibleVersion = 'KJV' | 'NKJV' | 'ESV' | 'NIV' | 'NLT' | 'NASB';

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  totalPoints: number;
  passedVerses: PassedVerse[];
  joinedDate: string;
}

export interface PassedVerse {
  verseId: string;
  versionUsed: BibleVersion;
  accuracyScore: number;
  date: string;
}

export interface VerseReference {
  id: string;
  book: string;
  chapter: number;
  verse: string;
  reference: string; // e.g. "John 3:16"
  versions: Partial<Record<BibleVersion, string>>;
}

export interface RecordingSession {
  id: string;
  memberId: string;
  verseId: string;
  versionUsed: BibleVersion;
  accuracyScore: number;
  spokenText: string;
  masterText: string;
  date: string;
  status: 'passed' | 'failed' | 'pending';
}

export interface ChurchGoal {
  id: string;
  title: string;
  targetVerses: number;
  completedVerses: number;
  deadline?: string;
}

export interface AppState {
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
}
