/**
 * Verification Engine for VerseFlow
 * Handles recitation verification using Levenshtein distance
 * and normalized text comparison
 */

const FILLER_WORDS = [
  'um',
  'uh',
  'uhh',
  'umm',
  'like',
  'you know',
  'youknow',
  'basically',
  'literally',
  'so',
  'uh huh',
  'uhhuh',
  'er',
  'erm',
  'ah',
  'hmm',
  'well',
];

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = new Array(str2.length + 1)
    .fill(null)
    .map(() => new Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

/**
 * Normalize text for comparison
 * - Convert to lowercase
 * - Remove punctuation (except apostrophes within words)
 * - Remove extra whitespace
 * - Remove filler words
 * @param text Text to normalize
 * @returns Normalized text
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();

  // Remove most punctuation but preserve some sentence structure context
  normalized = normalized.replace(/[.,!?;:\-—"()[\]{}]/g, ' ');

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Remove filler words
  const words = normalized.split(' ');
  const filteredWords = words.filter((word) => {
    const lowerWord = word.toLowerCase();
    return !FILLER_WORDS.includes(lowerWord);
  });

  normalized = filteredWords.join(' ').trim();

  return normalized;
}

/**
 * Verification result interface
 */
export interface VerificationResult {
  score: number;
  passed: boolean;
  normalizedSpoken: string;
  normalizedMaster: string;
  distance: number;
}

/**
 * Verify a recitation against the master text
 * Uses the grace formula: Score = (1 - distance / max(lenSpoken, lenMaster)) * 100
 * @param spokenText The text spoken by the member
 * @param masterText The correct verse text
 * @param passThreshold Minimum accuracy score to pass (default: 90)
 * @returns VerificationResult with score and pass/fail status
 */
export function verifyRecitation(
  spokenText: string,
  masterText: string,
  passThreshold: number = 90
): VerificationResult {
  // Normalize both texts
  const normalizedSpoken = normalizeText(spokenText);
  const normalizedMaster = normalizeText(masterText);

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedSpoken, normalizedMaster);

  // Calculate maximum length for grace formula
  const maxLength = Math.max(
    normalizedSpoken.length,
    normalizedMaster.length
  );

  // Apply grace formula: Score = (1 - d / maxLen) * 100
  let score = 0;
  if (maxLength === 0) {
    // Both strings are empty
    score = 100;
  } else {
    score = Math.max(0, (1 - distance / maxLength) * 100);
  }

  // Round to 2 decimal places
  score = Math.round(score * 100) / 100;

  // Determine if passed
  const passed = score >= passThreshold;

  return {
    score,
    passed,
    normalizedSpoken,
    normalizedMaster,
    distance,
  };
}

/**
 * Get detailed verification metrics
 * Useful for debugging and detailed feedback
 * @param spokenText The text spoken by the member
 * @param masterText The correct verse text
 * @returns Object with detailed metrics
 */
export function getDetailedMetrics(spokenText: string, masterText: string) {
  const result = verifyRecitation(spokenText, masterText);

  const spokenWords = result.normalizedSpoken.split(' ').filter((w) => w);
  const masterWords = result.normalizedMaster.split(' ').filter((w) => w);

  return {
    ...result,
    spokenWordCount: spokenWords.length,
    masterWordCount: masterWords.length,
    originalSpokenLength: spokenText.length,
    originalMasterLength: masterText.length,
    normalizedSpokenLength: result.normalizedSpoken.length,
    normalizedMasterLength: result.normalizedMaster.length,
  };
}
