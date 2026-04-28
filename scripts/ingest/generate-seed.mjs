#!/usr/bin/env node
// Generate a COMSATS University Islamabad seed migration from the spec.
// Output: supabase/migrations/<ts>_northbridge_seed.sql
//
// Run: node scripts/ingest/generate-seed.mjs
// Then: npx supabase db push

import {
  UNIVERSITY, COLLEGES, DEPT_PREFIX, BUILDINGS, ROOM_PROFILES,
  FIRST_NAMES_M, FIRST_NAMES_F, LAST_NAMES, HOMETOWNS,
  USDA_FOODS, RESEARCH_AREAS, CLUB_DEFS, EVENT_TEMPLATES, LIBRARY_RESOURCES,
} from './spec.mjs';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

// Deterministic RNG (mulberry32) so reruns produce identical SQL.
function rng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(42);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const range = (n) => Array.from({ length: n }, (_, i) => i);

// SQL helpers
const q = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) {
    const inner = v.map(x => `"${String(x).replace(/"/g, '\\"')}"`).join(',');
    return `'{${inner}}'::text[]`;
  }
  if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const insertRow = (table, cols, vals) =>
  `INSERT INTO public.${table} (${cols.join(', ')}) VALUES (${vals.map(q).join(', ')});`;

// Stable UUID-v4-ish generator from a string (deterministic across runs).
function stableUuid(input) {
  let h1 = 0x811c9dc5, h2 = 0xdeadbeef;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  // 16 bytes from two 32-bit hashes mixed
  const bytes = [];
  for (let i = 0; i < 16; i++) {
    h1 = (h1 + 0x9e3779b9) >>> 0;
    h2 = Math.imul(h2 ^ h1, 0xc2b2ae35) >>> 0;
    bytes.push(h2 & 0xff);
    h2 = (h2 >>> 8) | ((h1 & 0xff) << 24);
    h1 = (h1 >>> 8) | ((h2 & 0xff) << 24);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// =============================================================================
// 1. Buildings + rooms
// =============================================================================

const buildings = BUILDINGS.map(b => ({
  ...b,
  id: stableUuid('building:' + b.code),
  address: `COMSATS University Islamabad Campus, University Road, ${UNIVERSITY.city}`,
}));

const rooms = [];
for (const b of buildings) {
  const profile = ROOM_PROFILES[b.code] || {};
  for (let floor = 1; floor <= b.floors; floor++) {
    let counter = 1;
    for (const [type, count] of Object.entries(profile)) {
      for (let i = 0; i < count; i++) {
        const roomNumber = `${b.code}-${floor}${String(counter).padStart(2, '0')}`;
        const capacityByType = {
          lecture: pick([60, 80, 120, 150]),
          lab: pick([24, 30, 40]),
          seminar: pick([20, 25, 30]),
          office: pick([1, 2, 3]),
          study: pick([4, 6, 8]),
          common: pick([20, 40, 60]),
          dining: pick([100, 150, 200]),
          library: 200,
          auditorium: 900,
          other: 30,
        };
        const av = type === 'lecture' || type === 'seminar' || type === 'auditorium'
          ? ['projector', 'whiteboard', 'PA system']
          : type === 'lab'
            ? ['workstations', 'projector', 'whiteboard']
            : [];
        rooms.push({
          id: stableUuid(`room:${roomNumber}`),
          building_id: b.id,
          room_number: roomNumber,
          floor,
          room_type: type,
          capacity: capacityByType[type] ?? 20,
          av_equipment: av,
          notes: null,
        });
        counter++;
      }
    }
  }
}

// =============================================================================
// 2. Faculty
// =============================================================================

// Pull pools of office rooms per building so we can assign sensibly.
const officeRoomsByBuilding = {};
for (const r of rooms) {
  if (r.room_type === 'office') {
    (officeRoomsByBuilding[r.building_id] ||= []).push(r);
  }
}

// Map: department -> building code (which building hosts that dept)
const DEPT_BUILDING = {};
for (const c of COLLEGES) {
  for (const d of c.departments) DEPT_BUILDING[d] = c.code;
}

const TITLES_WEIGHTED = [
  ...Array(4).fill('Lecturer'),
  ...Array(6).fill('Assistant Professor'),
  ...Array(4).fill('Associate Professor'),
  ...Array(3).fill('Professor'),
  ...Array(1).fill('Distinguished Professor'),
];

const faculty = [];
const facultyPerDept = 4; // ~25 depts × 4 ≈ 100 faculty
for (const c of COLLEGES) {
  for (const dept of c.departments) {
    for (let i = 0; i < facultyPerDept; i++) {
      const isFemale = rand() < 0.4;
      const first = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
      const last = pick(LAST_NAMES);
      const fullName = `${first} ${last}`;
      const title = i === 0 ? 'Professor' : pick(TITLES_WEIGHTED); // first hire per dept is full prof
      const buildingCode = DEPT_BUILDING[dept];
      const buildingId = stableUuid('building:' + buildingCode);
      const officePool = officeRoomsByBuilding[buildingId] || [];
      const office = officePool[(faculty.length) % Math.max(1, officePool.length)] || null;
      const areas = RESEARCH_AREAS[dept] || [];
      const picked = [pick(areas), pick(areas)].filter(Boolean);
      const research = [...new Set(picked)];
      faculty.push({
        id: stableUuid(`faculty:${fullName}:${dept}:${i}`),
        full_name: fullName,
        title,
        email: `${first.toLowerCase()}.${last.toLowerCase()}.${(DEPT_PREFIX[dept] || dept.slice(0,3)).toLowerCase()}${i || ''}@nu.edu.pk`,
        college: c.name,
        department: dept,
        research_areas: research,
        bio: `${title} of ${dept} in the ${c.name}. Research interests: ${research.join(', ')}. Joined COMSATS in ${2000 + Math.floor(rand() * 25)}.`,
        office_room_id: office?.id ?? null,
        joined_year: 2000 + Math.floor(rand() * 25),
        phone_extension: `${1000 + Math.floor(rand() * 8999)}`,
      });
    }
  }
}

// Assign 8 deans (one per college) — promote first faculty per college to Dean.
for (const c of COLLEGES) {
  const f = faculty.find(x => x.college === c.name);
  if (f) {
    f.title = 'Dean';
    f.bio = `Dean of the ${c.name}. ${f.bio}`;
  }
}

// =============================================================================
// 3. Office hours
// =============================================================================

const officeHours = [];
for (const f of faculty) {
  // 2 office-hour blocks per faculty during weekdays.
  const days = [];
  while (days.length < 2) {
    const d = 1 + Math.floor(rand() * 5); // Mon-Fri (1..5)
    if (!days.includes(d)) days.push(d);
  }
  for (const d of days) {
    const startHour = 9 + Math.floor(rand() * 7); // 09-15
    officeHours.push({
      id: stableUuid(`oh:${f.id}:${d}`),
      faculty_id: f.id,
      day_of_week: d,
      start_time: `${String(startHour).padStart(2, '0')}:00`,
      end_time: `${String(startHour + 2).padStart(2, '0')}:00`,
      location_room_id: f.office_room_id,
      notes: rand() < 0.2 ? 'Email to confirm' : null,
    });
  }
}

// =============================================================================
// 4. Students
// =============================================================================

const STUDENT_COUNT = 240;
const students = [];
for (let i = 0; i < STUDENT_COUNT; i++) {
  const isFemale = rand() < 0.45;
  const first = isFemale ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
  const last = pick(LAST_NAMES);
  const college = pick(COLLEGES);
  const dept = pick(college.departments);
  const year = 1 + Math.floor(rand() * 4);
  const enrollmentYear = 2026 - year + 1;
  const rollNumber = `NU-${enrollmentYear}-${DEPT_PREFIX[dept]}-${String(i + 1).padStart(4, '0')}`;
  const programByCollege = {
    'College of Computing': `BS ${dept}`,
    'College of Engineering': `BE ${dept}`,
    'College of Business': dept === 'Management' ? 'BBA' : `BBA (${dept})`,
    'College of Sciences': `BS ${dept}`,
    'College of Humanities': `BA ${dept}`,
    'College of Arts': `BFA ${dept}`,
    'College of Health Sciences': dept === 'Pharmacy' ? 'PharmD' : `BS ${dept}`,
    'College of Law': 'LLB (5-Year)',
  };
  const gpa = (1.5 + rand() * 2.5).toFixed(2);
  const dobYear = 2026 - (17 + year + Math.floor(rand() * 2));
  students.push({
    id: stableUuid(`student:${rollNumber}`),
    roll_number: rollNumber,
    full_name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}.${i + 1}@students.nu.edu.pk`,
    program: programByCollege[college.name],
    college: college.name,
    department: dept,
    year_of_study: year,
    enrollment_year: enrollmentYear,
    gpa: parseFloat(gpa),
    date_of_birth: `${dobYear}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
    hometown: pick(HOMETOWNS),
  });
}

// =============================================================================
// 5. Dining
// =============================================================================

const studentCentre = buildings.find(b => b.code === 'STU');

const outlets = [
  { id: stableUuid('outlet:main-cafeteria'),  name: 'Main Cafeteria',     building_id: studentCentre.id, description: 'The main campus dining hall on the ground floor of the Student Centre. Mixed desi + Western menu, halal across the board.', cuisine_type: 'Mixed (Desi + Western)', accepts_meal_plan: true,
    opening_hours: { mon: '07:30-21:00', tue: '07:30-21:00', wed: '07:30-21:00', thu: '07:30-21:00', fri: '07:30-21:00', sat: '09:00-18:00', sun: '09:00-18:00' } },
  { id: stableUuid('outlet:cha-bar'),         name: 'Cha Bar',            building_id: studentCentre.id, description: 'Tea, coffee and quick bites — popular between classes. First floor of the Student Centre.', cuisine_type: 'Tea / Coffee / Snacks', accepts_meal_plan: true,
    opening_hours: { mon: '08:00-22:00', tue: '08:00-22:00', wed: '08:00-22:00', thu: '08:00-22:00', fri: '08:00-22:00', sat: '10:00-20:00', sun: '10:00-20:00' } },
  { id: stableUuid('outlet:lib-cafe'),        name: 'Library Café',       building_id: stableUuid('building:LIB'), description: 'Quiet espresso bar inside the Quaid Central Library lobby. No hot meals.', cuisine_type: 'Coffee / Pastries', accepts_meal_plan: false,
    opening_hours: { mon: '08:00-23:00', tue: '08:00-23:00', wed: '08:00-23:00', thu: '08:00-23:00', fri: '08:00-23:00', sat: '10:00-20:00', sun: '10:00-20:00' } },
];

const menus = [];
const menuItems = [];

// Cha Bar — drinks + light snacks, all 7 days, breakfast + lunch + snack
const chaBarItems = USDA_FOODS.filter(f =>
  /Chai|Coffee|Cappuccino|Lassi|Juice|Samosa|Pakora|Brownie|Fruit Salad|Toast|Aloo Paratha|Halwa Puri/i.test(f.name));
const libCafeItems = USDA_FOODS.filter(f =>
  /Coffee|Cappuccino|Brownie|Fruit Salad|Caesar|Wrap/i.test(f.name));
const mainCafItems = USDA_FOODS.filter(f =>
  !/Cappuccino|Black Coffee/i.test(f.name)); // basically the full menu

function addMenu(outlet_id, day, mealType, items, priceRange) {
  const menuId = stableUuid(`menu:${outlet_id}:${day}:${mealType}`);
  menus.push({ id: menuId, outlet_id, day_of_week: day, meal_type: mealType });
  // Pick 4-7 items for this menu deterministically based on day.
  const count = 4 + Math.floor(rand() * 4);
  const shuffled = [...items].sort(() => rand() - 0.5).slice(0, count);
  for (const it of shuffled) {
    const [lo, hi] = priceRange;
    const pricePkr = lo + Math.round(rand() * (hi - lo));
    menuItems.push({
      id: stableUuid(`item:${menuId}:${it.fdc_id}:${it.name}`),
      menu_id: menuId,
      name: it.name,
      description: it.desc,
      price_cents: pricePkr * 100, // PKR rupees → "cents" (paisa)
      calories: it.cal,
      protein_g: it.p,
      carbs_g: it.c,
      fat_g: it.f,
      allergens: it.allergens,
      tags: it.tags,
      source_fdc_id: it.fdc_id,
    });
  }
}

for (let day = 0; day < 7; day++) {
  // Main Cafeteria — breakfast, lunch, dinner all 7 days
  addMenu(outlets[0].id, day, 'breakfast', mainCafItems.filter(f => /Halwa Puri|Omelette|Aloo Paratha|Toast|Chai|Doodh Patti|Coffee/.test(f.name)), [180, 450]);
  addMenu(outlets[0].id, day, 'lunch',     mainCafItems, [250, 650]);
  addMenu(outlets[0].id, day, 'dinner',    mainCafItems, [300, 750]);
  // Cha Bar — snack + lunch
  addMenu(outlets[1].id, day, 'snack',     chaBarItems, [80, 350]);
  addMenu(outlets[1].id, day, 'lunch',     chaBarItems, [150, 450]);
  // Library Café — breakfast + snack only
  addMenu(outlets[2].id, day, 'breakfast', libCafeItems, [120, 400]);
  addMenu(outlets[2].id, day, 'snack',     libCafeItems, [120, 450]);
}

// =============================================================================
// 6. Clubs + members
// =============================================================================

// Pick a sensible meeting room for each club.
const seminarRooms = rooms.filter(r => r.room_type === 'seminar' || r.room_type === 'common');
const clubs = CLUB_DEFS.map((c, i) => {
  const advisor = pick(faculty.filter(f => {
    if (c.category === 'academic') return f.college !== 'College of Arts';
    if (c.category === 'sports')   return true;
    return true;
  }));
  return {
    id: stableUuid(`club:${c.name}`),
    name: c.name,
    description: c.description,
    category: c.category,
    faculty_advisor_id: advisor?.id ?? null,
    meeting_room_id: seminarRooms[i % seminarRooms.length]?.id ?? null,
    meeting_day: 1 + (i % 5),
    meeting_time: `${15 + (i % 4)}:00`,
    founded_year: 1990 + Math.floor(rand() * 30),
    member_count: 0, // updated after members assigned
    contact_email: `${c.name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@students.nu.edu.pk`,
  };
});

const clubMembers = [];
const ROLES = ['president', 'vice_president', 'secretary', 'treasurer'];
for (const club of clubs) {
  const memberCount = 15 + Math.floor(rand() * 30);
  const picked = new Set();
  while (picked.size < memberCount && picked.size < students.length) {
    picked.add(students[Math.floor(rand() * students.length)].id);
  }
  const ids = [...picked];
  ids.forEach((sid, idx) => {
    clubMembers.push({
      id: stableUuid(`cm:${club.id}:${sid}`),
      club_id: club.id,
      student_id: sid,
      role: idx < ROLES.length ? ROLES[idx] : 'member',
      joined_at: `${2024 + Math.floor(rand() * 2)}-${String(1 + Math.floor(rand() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rand() * 28)).padStart(2, '0')}`,
    });
  });
  club.member_count = ids.length;
}

// =============================================================================
// 7. Events
// =============================================================================

const lectureRooms = rooms.filter(r =>
  r.room_type === 'auditorium' || r.room_type === 'lecture' || r.room_type === 'common');

// Spread events across the term Feb–May 2026.
const TERM_START = new Date('2026-02-05T00:00:00Z');
const events = EVENT_TEMPLATES.map((e, i) => {
  const dayOffset = Math.floor(rand() * 110);
  const start = new Date(TERM_START);
  start.setUTCDate(start.getUTCDate() + dayOffset);
  start.setUTCHours(10 + Math.floor(rand() * 8));
  const end = new Date(start.getTime() + e.dur * 60 * 60 * 1000);
  return {
    id: stableUuid(`event:${e.title}`),
    title: e.title,
    description: `${e.title}. Organised by ${e.org}. ${e.category === 'sports' ? 'Open to all spectators.' : e.category === 'workshop' ? 'Hands-on session — laptop required.' : 'Open to all students and faculty.'}`,
    category: e.category,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    location_room_id: lectureRooms[i % lectureRooms.length]?.id ?? null,
    location_text: null,
    organizer: e.org,
    rsvp_required: e.capacity < 100,
    capacity: e.capacity,
  };
});

// =============================================================================
// 8. Library
// =============================================================================

const libraryResources = LIBRARY_RESOURCES.map((r, i) => ({
  id: stableUuid(`libres:${r.title}`),
  title: r.title,
  resource_type: r.type,
  description: r.desc,
  location: r.location,
  is_reservable: r.type === 'study_room' || r.type === 'equipment',
  quantity: r.quantity,
}));

const libraryHours = [
  { id: stableUuid('libhours:0'), day_of_week: 0, start_time: '10:00', end_time: '20:00', notes: 'Sunday hours' },
  { id: stableUuid('libhours:1'), day_of_week: 1, start_time: '08:00', end_time: '23:00', notes: null },
  { id: stableUuid('libhours:2'), day_of_week: 2, start_time: '08:00', end_time: '23:00', notes: null },
  { id: stableUuid('libhours:3'), day_of_week: 3, start_time: '08:00', end_time: '23:00', notes: null },
  { id: stableUuid('libhours:4'), day_of_week: 4, start_time: '08:00', end_time: '23:00', notes: null },
  { id: stableUuid('libhours:5'), day_of_week: 5, start_time: '08:00', end_time: '23:00', notes: null },
  { id: stableUuid('libhours:6'), day_of_week: 6, start_time: '10:00', end_time: '20:00', notes: 'Saturday hours' },
];

// =============================================================================
// 9. Emit SQL
// =============================================================================

const lines = [];
lines.push(`-- =============================================================================`);
lines.push(`-- COMSATS University Islamabad seed data (Session 1).`);
lines.push(`-- Generated by scripts/ingest/generate-seed.mjs — do not hand-edit.`);
lines.push(`-- =============================================================================`);
lines.push('');
lines.push('BEGIN;');
lines.push('');

// Wipe (idempotent re-seeds during dev).
lines.push('-- Idempotent reset: drop seeded rows in dependency order.');
lines.push('TRUNCATE TABLE');
lines.push('  public.club_members,');
lines.push('  public.clubs,');
lines.push('  public.events,');
lines.push('  public.dining_items,');
lines.push('  public.dining_menus,');
lines.push('  public.dining_outlets,');
lines.push('  public.office_hours,');
lines.push('  public.faculty,');
lines.push('  public.students,');
lines.push('  public.library_resources,');
lines.push('  public.library_hours,');
lines.push('  public.rooms,');
lines.push('  public.buildings');
lines.push('  CASCADE;');
lines.push('');

const emit = (label, table, cols, rows) => {
  lines.push(`-- ${label}: ${rows.length} rows`);
  for (const r of rows) lines.push(insertRow(table, cols, cols.map(c => r[c])));
  lines.push('');
};

emit('Buildings',  'buildings',
  ['id','code','name','floors','year_built','address','description','has_elevator','has_wheelchair_access'],
  buildings.map(b => ({ ...b, year_built: b.yearBuilt, has_elevator: true, has_wheelchair_access: true })));

emit('Rooms',      'rooms',
  ['id','building_id','room_number','floor','room_type','capacity','av_equipment','notes'], rooms);

emit('Faculty',    'faculty',
  ['id','full_name','title','email','college','department','research_areas','bio','office_room_id','joined_year','phone_extension'],
  faculty);

emit('Office hours','office_hours',
  ['id','faculty_id','day_of_week','start_time','end_time','location_room_id','notes'], officeHours);

emit('Students',   'students',
  ['id','roll_number','full_name','email','program','college','department','year_of_study','enrollment_year','gpa','date_of_birth','hometown'],
  students);

emit('Dining outlets','dining_outlets',
  ['id','name','building_id','description','cuisine_type','opening_hours','accepts_meal_plan'], outlets);

emit('Dining menus','dining_menus',
  ['id','outlet_id','day_of_week','meal_type'], menus);

emit('Dining items','dining_items',
  ['id','menu_id','name','description','price_cents','calories','protein_g','carbs_g','fat_g','allergens','tags','source_fdc_id'],
  menuItems);

emit('Events',     'events',
  ['id','title','description','category','start_at','end_at','location_room_id','location_text','organizer','rsvp_required','capacity'],
  events);

emit('Clubs',      'clubs',
  ['id','name','description','category','faculty_advisor_id','meeting_room_id','meeting_day','meeting_time','founded_year','member_count','contact_email'],
  clubs);

emit('Club members','club_members',
  ['id','club_id','student_id','role','joined_at'], clubMembers);

emit('Library resources','library_resources',
  ['id','title','resource_type','description','location','is_reservable','quantity'], libraryResources);

emit('Library hours','library_hours',
  ['id','day_of_week','start_time','end_time','notes'], libraryHours);

lines.push('COMMIT;');
lines.push('');

// =============================================================================
// 10. Write the migration file
// =============================================================================

const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
const outPath = join(REPO_ROOT, 'supabase', 'migrations', `${ts}_northbridge_seed.sql`);
writeFileSync(outPath, lines.join('\n'));

console.log('Generated:', outPath);
console.log('Counts:');
console.log('  buildings        ', buildings.length);
console.log('  rooms            ', rooms.length);
console.log('  faculty          ', faculty.length);
console.log('  office_hours     ', officeHours.length);
console.log('  students         ', students.length);
console.log('  dining_outlets   ', outlets.length);
console.log('  dining_menus     ', menus.length);
console.log('  dining_items     ', menuItems.length);
console.log('  events           ', events.length);
console.log('  clubs            ', clubs.length);
console.log('  club_members     ', clubMembers.length);
console.log('  library_resources', libraryResources.length);
console.log('  library_hours    ', libraryHours.length);
