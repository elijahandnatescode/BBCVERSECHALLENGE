import { createClient, type Client } from '@libsql/client';
import path from 'path';

let client: Client | null = null;
let initialized = false;

export function getDb(): Client {
  if (!client) {
    client = createClient({
      url: `file:${path.join(process.cwd(), 'bbc_challenge.db')}`,
    });
  }
  return client;
}

export async function ensureInit() {
  if (initialized) return;
  initialized = true;
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(participant_id, chapter, verse),
      FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL UNIQUE,
      admin_id INTEGER NOT NULL,
      FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS verse_attempts (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER NOT NULL,
      chapter        INTEGER NOT NULL,
      verse          INTEGER NOT NULL,
      score          REAL    NOT NULL,
      passed         INTEGER NOT NULL DEFAULT 0,
      admin_id       INTEGER NOT NULL,
      recorded_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY(admin_id)       REFERENCES admins(id)       ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS challenges (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      book        TEXT    NOT NULL,
      chapter_num INTEGER NOT NULL,
      version     TEXT    NOT NULL DEFAULT 'NKJV',
      is_active   INTEGER NOT NULL DEFAULT 1,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS challenge_verses (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id INTEGER NOT NULL,
      verse_number INTEGER NOT NULL,
      verse_text   TEXT    NOT NULL,
      UNIQUE(challenge_id, verse_number),
      FOREIGN KEY(challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS participant_challenge_optouts (
      participant_id INTEGER NOT NULL,
      challenge_id   INTEGER NOT NULL,
      PRIMARY KEY(participant_id, challenge_id),
      FOREIGN KEY(participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY(challenge_id)   REFERENCES challenges(id)  ON DELETE CASCADE
    );
  `);

  // Idempotent column migrations
  await db.execute('ALTER TABLE progress ADD COLUMN challenge_id INTEGER NOT NULL DEFAULT 1').catch(() => { });
  await db.execute('ALTER TABLE verse_attempts ADD COLUMN challenge_id INTEGER NOT NULL DEFAULT 1').catch(() => { });

  // Seed default challenge (John 1 & 2) if no challenges exist
  const countRes = await db.execute('SELECT COUNT(*) as cnt FROM challenges');
  const cnt = Number(countRes.rows[0]?.cnt ?? 0);
  if (cnt === 0) {
    await seedDefaultChallenge(db);
  }
}

async function seedDefaultChallenge(db: ReturnType<typeof getDb>) {
  const { JOHN1_VERSES, JOHN2_VERSES } = await import('@/lib/verseData');

  // Insert the challenge row with id=1
  await db.execute({
    sql: `INSERT INTO challenges (id, name, description, book, chapter_num, version, sort_order)
          VALUES (1, '1 John 1 & 2', 'The original BBC Verse Challenge passage', '1 John', 1, 'NKJV', 0)`,
    args: [],
  });

  // Insert 1 John 1 verses (stored with a synthetic chapter encoding: ch1 = verses 1-10)
  for (const v of JOHN1_VERSES) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO challenge_verses (challenge_id, verse_number, verse_text) VALUES (?, ?, ?)`,
      args: [1, v.v, v.text],
    });
  }

  // Insert 1 John 2 verses (verse numbers 101-129 to distinguish from ch1 within same challenge)
  for (const [vStr, text] of Object.entries(JOHN2_VERSES)) {
    const v = Number(vStr);
    await db.execute({
      sql: `INSERT OR IGNORE INTO challenge_verses (challenge_id, verse_number, verse_text) VALUES (?, ?, ?)`,
      args: [1, 100 + v, text],
    });
  }
}
