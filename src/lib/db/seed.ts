import { getDb, ensureInit } from './schema';

function expandChapter2(arr: number[]): number[] {
  const expanded = [...arr];
  while (expanded.length < 29) expanded.push(0);
  return expanded;
}

const participantData = [
  { lastName: "Abe", firstName: "Karun", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Abe", firstName: "Mounika", chapter1: [0,1,1,1,1,1,0,1], chapter2: expandChapter2([1,1,1,1,1,1,0,1,1,1]) },
  { lastName: "Abe", firstName: "Aathdya", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Abe", firstName: "Diya", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Abe", firstName: "Padmaja", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Banham", firstName: "Prabhu", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Banham", firstName: "Susie", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Banham", firstName: "Shepherd", chapter1: [1,1,1,1,1,1,0,1], chapter2: expandChapter2([1,1,1,1,1,1,0,1,1,1]) },
  { lastName: "Banham", firstName: "Verity", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Banham", firstName: "Sanity", chapter1: [1,1,0,1,1,1,0,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Banham", firstName: "Steadfast", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Banham", firstName: "Resolute", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Biasi", firstName: "Mario", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Biasi", firstName: "Mike", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Biasi", firstName: "Michelle", chapter1: [1,1,1,1,1,1,0,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Biasi", firstName: "Hope", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Biasi", firstName: "Sam", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Biasi", firstName: "Leah", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Biasi", firstName: "Pam", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Capan", firstName: "Andy", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Capan", firstName: "Anna", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,0,0,0,0,0,0,0]) },
  { lastName: "Capan", firstName: "Andrew/Drew", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Capan", firstName: "Amelia", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Cherian", firstName: "Joseph", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Cherian", firstName: "Sheelah", chapter1: [1,1,1,1,1,1,1,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Cherian", firstName: "Jonah", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Cherian", firstName: "Isaac", chapter1: [0,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Curtin", firstName: "Henry", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,1,1,1,1,1,0,0,0,0]) },
  { lastName: "De La Rosa", firstName: "Luis", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "De La Rosa", firstName: "Cristina", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "De La Rosa", firstName: "Chloe", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Greenhow", firstName: "Adam", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Greenhow", firstName: "Stephanie", chapter1: [1,1,1,1,1,1,1,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,0]) },
  { lastName: "Greenhow", firstName: "Nathan", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Greenhow", firstName: "Jenny", chapter1: [0,1,1,1,1,1,1,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Hong", firstName: "Elijah", chapter1: [1,1,1,1,0,0,0,0], chapter2: expandChapter2([1,1,1,1,0,0,0,0,0,0]) },
  { lastName: "Hong", firstName: "Matthew", chapter1: [1,1,1,1,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Hylton", firstName: "Dan", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Hylton", firstName: "Julia", chapter1: [1,1,1,1,1,1,1,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Hylton", firstName: "Abigail", chapter1: [1,1,1,1,1,1,0,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Hylton", firstName: "Jonathan", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,0,0,0,0,0,0]) },
  { lastName: "Hylton", firstName: "Josiah", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Iyer", firstName: "Sri", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Iyer", firstName: "Judy", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Joseph", firstName: "Josephine", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Joseph", firstName: "Nathan", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Joseph", firstName: "Ben", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Miller", firstName: "Joel", chapter1: [1,1,1,1,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,1,1]) },
  { lastName: "Miller", firstName: "Rania", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Quintero", firstName: "Joel", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Quintero", firstName: "Mariana", chapter1: [1,1,1,1,1,1,1,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Quintero", firstName: "Sofia", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Quintero", firstName: "Ann+e", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Quintero", firstName: "Sarai", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Rochon", firstName: "Scott", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Rochon", firstName: "Lisa", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Sam", firstName: "Caleb", chapter1: [1,1,1,1,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Sam", firstName: "Bethany", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Sam (Abe)", firstName: "Hephziah", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Sam (Abe)", firstName: "Meri", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Sanner", firstName: "Josh", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Sanner", firstName: "Julie", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Sanner", firstName: "Andrew", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Sanner", firstName: "Eliah", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Sanner", firstName: "Timoti", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Tan", firstName: "Jude", chapter1: [1,1,1,1,1,1,1,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Taubaugh", firstName: "Susan", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,0,0,0,0,0,0]) },
  { lastName: "Toggdon", firstName: "Rex", chapter1: [1,1,1,1,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
  { lastName: "Toggdon", firstName: "Nancy", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Young", firstName: "Curt", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Young", firstName: "Kristin", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Young", firstName: "Ava", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Young", firstName: "Evelyn", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Young", firstName: "Josiah", chapter1: [1,1,1,1,1,1,1,1], chapter2: expandChapter2([1,1,1,1,1,1,1,1,1,1]) },
  { lastName: "Zimmerman", firstName: "Steve", chapter1: [0,0,0,0,0,0,0,0], chapter2: expandChapter2([0,0,0,0,0,0,0,0,0,0]) },
];

let seeded = false;

export async function seedDatabase() {
  await ensureInit();
  if (seeded) return;

  const db = getDb();
  const result = await db.execute('SELECT COUNT(*) as count FROM admins');
  const count = Number(result.rows[0].count);
  if (count > 0) { seeded = true; return; }

  seeded = true;

  for (const name of ['Tim', 'AiAi', 'Nathan', 'BBC_Other']) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)', args: [name, 'BBC'] });
  }

  for (const p of participantData) {
    const res = await db.execute({ sql: 'INSERT INTO participants (first_name, last_name) VALUES (?, ?)', args: [p.firstName, p.lastName] });
    const pid = Number(res.lastInsertRowid);
    for (let i = 0; i < p.chapter1.length; i++) {
      await db.execute({ sql: 'INSERT OR IGNORE INTO progress (participant_id, chapter, verse, completed) VALUES (?, ?, ?, ?)', args: [pid, 1, i + 1, p.chapter1[i]] });
    }
    for (let i = 0; i < p.chapter2.length; i++) {
      await db.execute({ sql: 'INSERT OR IGNORE INTO progress (participant_id, chapter, verse, completed) VALUES (?, ?, ?, ?)', args: [pid, 2, i + 1, p.chapter2[i]] });
    }
  }
  console.log('Database seeded with 76 participants.');
}
