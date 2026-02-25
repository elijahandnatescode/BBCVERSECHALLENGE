import { verifyRecitation } from './verification';

export interface VerseSegmentResult {
  verse: number;
  segment: string;   // the slice of spoken text attributed to this verse
  score: number;     // 0–100
  passed: boolean;
}

/**
 * Normalize text the same way verification.ts does — lowercase, strip punctuation,
 * remove filler words — then return a word array.
 * We reproduce a minimal version here so this file stays a pure TS module with
 * no browser dependencies (it runs on the client, but needs no DOM).
 */
const FILLER_WORDS = new Set([
  'um','uh','uhh','umm','like','you','know','youknow','basically','literally',
  'so','uh','huh','uhhuh','er','erm','ah','hmm','well',
]);

function toWords(text: string): string[] {
  let s = text.toLowerCase().trim();
  s = s.replace(/[.,!?;:\-—"()[\]{}]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s.split(' ').filter(w => w && !FILLER_WORDS.has(w));
}

/**
 * Score a candidate slice of spoken words against a master verse text.
 * Delegates to the existing verifyRecitation() for consistency.
 */
function scoreWindow(spokenWords: string[], masterText: string, threshold: number): number {
  if (spokenWords.length === 0) return 0;
  const result = verifyRecitation(spokenWords.join(' '), masterText, threshold);
  return result.score;
}

/**
 * Segment a continuous spoken transcript into individual verse matches.
 *
 * Algorithm: greedy forward segmentation with a variable-size window.
 * For each verse in the sequence, we try window sizes from 55% to 180% of
 * the master word count and pick the window that scores highest. The cursor
 * advances by the chosen window size.
 *
 * @param spokenText  Raw transcript from the speech recognizer.
 * @param verseSequence  Ordered list of {verse, text} to match against.
 *                       Should be the consecutive uncompleted verses starting
 *                       from the one the participant begins reciting.
 * @param passThreshold  Minimum score to mark a verse as passed (default 80).
 */
export function segmentAndVerify(
  spokenText: string,
  verseSequence: Array<{ verse: number; text: string }>,
  passThreshold = 80,
): VerseSegmentResult[] {
  const spokenWords = toWords(spokenText);
  const results: VerseSegmentResult[] = [];
  let cursor = 0;

  for (const { verse, text: masterText } of verseSequence) {
    const remaining = spokenWords.length - cursor;
    if (remaining <= 0) {
      // No more spoken words — mark rest as zero-score
      results.push({ verse, segment: '', score: 0, passed: false });
      continue;
    }

    const masterWords = toWords(masterText);
    const masterLen = masterWords.length || 1;

    const minWindow = Math.max(1, Math.floor(masterLen * 0.55));
    const maxWindow = Math.min(remaining, Math.ceil(masterLen * 1.8));

    let bestScore = -1;
    let bestEnd = cursor + Math.min(masterLen, remaining);

    for (let w = minWindow; w <= maxWindow; w++) {
      const candidate = spokenWords.slice(cursor, cursor + w);
      const score = scoreWindow(candidate, masterText, passThreshold);
      if (score > bestScore) {
        bestScore = score;
        bestEnd = cursor + w;
      }
    }

    const segmentWords = spokenWords.slice(cursor, bestEnd);
    cursor = bestEnd;

    results.push({
      verse,
      segment: segmentWords.join(' '),
      score: Math.round(bestScore * 100) / 100,
      passed: bestScore >= passThreshold,
    });
  }

  return results;
}
