/**
 * Seed Script — populates the database with 5 sample leads in various stages
 * so the dashboard looks alive on first launch.
 *
 * Run: cd backend && node database/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('./db');

console.log('🌱 Seeding Ava database...\n');

// ── Clear existing seed data ─────────────────────────────────────────────────
db.prepare('DELETE FROM followups').run();
db.prepare('DELETE FROM appointments').run();
db.prepare('DELETE FROM conversations').run();
db.prepare('DELETE FROM leads').run();
db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('leads','conversations','appointments','followups')").run();

// ── 1. Maria Santos — HOT buyer, pre-approved, Clearwater Beach ───────────────
const maria = db.prepare(`
  INSERT INTO leads (name, email, phone, source, intent, budget, timeline, area, pre_approval, status, urgency, escalation_ready, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'Maria Santos', 'maria.santos@email.com', '(407) 555-0182', 'website',
  'buy', '$320k–$380k', 'ASAP — within 60 days', 'Clearwater Beach',
  'yes', 'escalated', 'hot', 1,
  'Pre-approved buyer looking for 2BR condo near Clearwater Beach. Relocating from Chicago for work. Very motivated — wants to close before end of quarter. Loves ocean views. Has already toured 3 properties elsewhere.'
);

const mariaConvos = [
  ['user', 'Hi! I saw Ayoub\'s listing on Zillow and wanted to learn more about condos in Clearwater Beach.'],
  ['assistant', 'Hi Maria! I\'m Ava, Ayoub\'s assistant 😊 Clearwater Beach is a fantastic choice — one of the most stunning waterfront communities in all of Florida! Are you looking to buy, or are you exploring rentals first?'],
  ['user', 'Buying! I\'m relocating from Chicago for work and I need something in the next 60 days. Is that doable?'],
  ['assistant', 'Absolutely doable — and 60 days is actually a comfortable timeline for a motivated buyer! Do you have a budget range in mind? And are you already pre-approved for a mortgage?'],
  ['user', 'Yes! I\'m pre-approved up to $380k. Looking for a 2 bedroom, ideally with ocean views. Budget is around $320-380k.'],
  ['assistant', 'Amazing — you\'re perfectly positioned! Pre-approved with a clear budget and timeline, Ayoub is going to love working with you 🏖️ A 2BR with ocean views at that range in Clearwater Beach is definitely achievable. I\'m flagging you as a priority — Ayoub will reach out shortly with some current listings. Would Tuesday or Wednesday morning work for a quick intro call?'],
  ['user', 'Wednesday morning works great! Around 10am?'],
  ['assistant', 'Perfect — I\'ve noted Wednesday at 10am EST for a call with Ayoub. He\'ll reach out to confirm and come prepared with listings that match your exact needs. You\'re going to love Clearwater, Maria — it\'s an incredible place to call home! 🌊'],
];

mariaConvos.forEach(([role, message]) => {
  db.prepare('INSERT INTO conversations (lead_id, role, message) VALUES (?, ?, ?)').run(maria.lastInsertRowid, role, message);
});

// Appointment for Maria
const nextWed = getNextWeekday(3); // Wednesday
db.prepare('INSERT INTO appointments (lead_id, date, time, type, notes) VALUES (?, ?, ?, ?, ?)').run(
  maria.lastInsertRowid, nextWed, '10:00', 'consultation',
  'Pre-approved buyer. Budget $320k-$380k. 2BR condo, Clearwater Beach, ocean view preferred. Relocating from Chicago.'
);


// ── 2. James Wilson — WARM seller + buyer combo, Orlando to Tampa ─────────────
const james = db.prepare(`
  INSERT INTO leads (name, email, phone, source, intent, budget, timeline, area, pre_approval, status, urgency, escalation_ready, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'James Wilson', 'jwilson@gmail.com', '(321) 555-0441', 'referral',
  'sell', '$450k–$550k', '3–6 months', 'Orlando (selling) + Tampa (buying)',
  'in_progress', 'active', 'warm', 0,
  'Needs to sell current home in Lake Nona before buying in Tampa area. Getting pre-approval in progress. Timeline is flexible but wants to move by summer.'
);

const jamesConvos = [
  ['user', 'Hey, my friend Mike referred me to Ayoub. I\'m looking to sell my place in Lake Nona and then buy something in the Tampa/St. Pete area.'],
  ['assistant', 'Welcome, James! Any friend of Mike\'s is family here 😄 Lake Nona is a great market right now — Ayoub has sold several homes there recently. Are you thinking of selling first and then buying, or are you trying to do both simultaneously?'],
  ['user', 'Sell first, then buy. My house in Lake Nona is probably worth around $480k I think. Looking to buy something in the $450-550k range in Tampa.'],
  ['assistant', 'Smart move doing it in sequence — it keeps things much cleaner financially! Lake Nona has been very strong, so that $480k estimate sounds realistic. For the Tampa side, the St. Pete and South Tampa neighborhoods at your price point are excellent. What\'s your ideal timeline — are you hoping to be settled by summer?'],
  ['user', 'Summer would be ideal, maybe June or July. I\'m working on getting pre-approved now just in case.'],
  ['assistant', 'Perfect — summer gives us great runway for both transactions! Once your pre-approval comes through, Ayoub can give you a more precise valuation on your Lake Nona home and map out the whole game plan. Are there specific neighborhoods in Tampa/St. Pete you\'re drawn to, or is that still open?'],
];

jamesConvos.forEach(([role, message]) => {
  db.prepare('INSERT INTO conversations (lead_id, role, message) VALUES (?, ?, ?)').run(james.lastInsertRowid, role, message);
});

// Schedule a follow-up for James in 3 days
const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
db.prepare('INSERT INTO followups (lead_id, scheduled_date, message_template) VALUES (?, ?, ?)').run(
  james.lastInsertRowid, in3Days.toISOString(), 'day3'
);


// ── 3. Jennifer Chen — HOT buyer, relocation from NYC, Lake Nona ──────────────
const jennifer = db.prepare(`
  INSERT INTO leads (name, email, phone, source, intent, budget, timeline, area, pre_approval, status, urgency, escalation_ready, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'Jennifer Chen', 'jchen.nyc@proton.me', '(646) 555-0319', 'instagram',
  'buy', '$600k–$700k', '2–3 months', 'Lake Nona',
  'yes', 'escalated', 'hot', 1,
  'Relocating from NYC with family (2 kids). Pre-approved up to $700k. Loves Lake Nona for the schools and community. Wants 4BR with a pool. Very decisive — ready to move quickly once the right home comes up.'
);

const jenniferConvos = [
  ['user', 'Hello! I found Ayoub on Instagram. My family is moving from NYC to Orlando and we\'re very interested in Lake Nona. Can you help?'],
  ['assistant', 'Hello Jennifer! Welcome — you have excellent taste! Lake Nona is honestly one of the best family communities in all of central Florida. Incredible schools, the Medical City, beautiful parks, and amazing community feel. Are you looking to buy?'],
  ['user', 'Yes, buying. We have two kids so schools are huge for us. We\'re pre-approved up to $700k and ideally want 4 bedrooms with a pool. Moving in 2-3 months.'],
  ['assistant', 'Oh this is exciting! Lake Nona checks every box for your family — top-rated schools, safe neighborhoods, and gorgeous 4BR homes with pools absolutely exist in your budget range. You\'re well-positioned, Jennifer! I\'m flagging this for Ayoub right away — he specializes in family relocations to Lake Nona and knows all the best streets. Can I have him call you this week?'],
  ['user', 'Yes please! I\'m available Thursday or Friday afternoon.'],
  ['assistant', 'Wonderful — I\'ve noted Thursday or Friday afternoon for Ayoub to call you. He\'ll come prepared with current listings that tick all your boxes: 4BR, pool, great schools, Lake Nona. He\'s helped dozens of families relocate from the northeast and makes the whole process smooth from a distance. You\'re going to love it here! 🌴'],
];

jenniferConvos.forEach(([role, message]) => {
  db.prepare('INSERT INTO conversations (lead_id, role, message) VALUES (?, ?, ?)').run(jennifer.lastInsertRowid, role, message);
});

// Appointment for Jennifer
const nextFri = getNextWeekday(5); // Friday
db.prepare('INSERT INTO appointments (lead_id, date, time, type, notes) VALUES (?, ?, ?, ?, ?)').run(
  jennifer.lastInsertRowid, nextFri, '14:00', 'consultation',
  'NYC relocation. Family of 4. Pre-approved $700k. 4BR + pool. Lake Nona schools critical. Ready to move in 2-3 months.'
);


// ── 4. David Martinez — COLD, investment property browser ────────────────────
const david = db.prepare(`
  INSERT INTO leads (name, email, phone, source, intent, budget, timeline, area, pre_approval, status, urgency, escalation_ready, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'David Martinez', 'dmartinez.invest@gmail.com', '(305) 555-0776', 'google',
  'invest', '$250k–$400k', 'No rush — 6–12 months', 'Gulf Coast / Clearwater',
  'unknown', 'active', 'cold', 0,
  'Early-stage investor exploring vacation rental opportunities. No clear timeline. Needs education on ROI and the rental market before committing. Good prospect for nurture sequence.'
);

const davidConvos = [
  ['user', 'Hi, I\'m thinking about buying an investment property in Florida for Airbnb. Is the Gulf Coast a good market?'],
  ['assistant', 'Hey David! Great question — and yes, the Gulf Coast is one of the hottest short-term rental markets in the country, especially around Clearwater Beach and the St. Pete area. Average occupancy rates are fantastic, and Ayoub has helped investors build solid vacation rental portfolios there. Are you looking at this as a pure investment, or would you use it personally too?'],
  ['user', 'Mostly investment but maybe use it a few weeks a year. No real timeline yet, just exploring. What kind of budget would I need?'],
  ['assistant', 'Totally understand — smart to explore before committing! For a quality Clearwater Beach condo that performs well on Airbnb, you\'re generally looking at $250k–$450k depending on size and how close to the water. The key is finding units in buildings that allow short-term rentals (not all do!). Would it help to have Ayoub put together a quick investment overview for your budget range?'],
];

davidConvos.forEach(([role, message]) => {
  db.prepare('INSERT INTO conversations (lead_id, role, message) VALUES (?, ?, ?)').run(david.lastInsertRowid, role, message);
});

// Schedule a day-7 follow-up for David
const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
db.prepare('INSERT INTO followups (lead_id, scheduled_date, message_template) VALUES (?, ?, ?)').run(
  david.lastInsertRowid, in7Days.toISOString(), 'day7'
);


// ── 5. Amanda Taylor — WARM renter, Clearwater, near-term ────────────────────
const amanda = db.prepare(`
  INSERT INTO leads (name, email, phone, source, intent, budget, timeline, area, pre_approval, status, urgency, escalation_ready, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'Amanda Taylor', 'ataylor@outlook.com', '(813) 555-0563', 'chat',
  'rent', '$2,500–$3,500/mo', 'Next 30 days', 'Clearwater Beach area',
  'unknown', 'active', 'warm', 0,
  'Looking to rent near Clearwater Beach for 6 months (possible longer). Moving with a dog. Flexible on exact location but wants walkability to the beach. Timeline is soon — next 30 days.'
);

const amandaConvos = [
  ['user', 'Hey! Looking for a rental near Clearwater Beach. Do you handle rentals too?'],
  ['assistant', 'Hi Amanda! Yes, Ayoub works with rentals too, especially in the Clearwater and Gulf Coast area 🏖️ Are you looking for something long-term, or more of a short-term/seasonal rental?'],
  ['user', 'Probably 6 months to start, maybe longer. I\'m moving with my dog and want to be walkable to the beach. Budget around $2,500-3,500/mo. Need to move in the next 30 days.'],
  ['assistant', 'A 6-month beach walkable rental with a dog-friendly policy — love it! That\'s totally findable in your budget around Clearwater Beach, especially if we include North Redington Beach and Sand Key which are a bit less in demand but equally gorgeous. The 30-day timeline is tight but definitely doable if we move fast. Want me to flag this for Ayoub so he can send you some current options today?'],
  ['user', 'Yes please! That would be amazing.'],
  ['assistant', 'On it! I\'ve flagged your details for Ayoub — he\'ll be in touch soon with pet-friendly rentals near the beach in your budget. Just to confirm: it\'s one dog, right? Some buildings have weight limits and I want to make sure we filter correctly for you 🐾'],
];

amandaConvos.forEach(([role, message]) => {
  db.prepare('INSERT INTO conversations (lead_id, role, message) VALUES (?, ?, ?)').run(amanda.lastInsertRowid, role, message);
});

// Schedule a day-1 follow-up for Amanda (yesterday, so it shows as "due")
const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
db.prepare('INSERT INTO followups (lead_id, scheduled_date, message_template) VALUES (?, ?, ?)').run(
  amanda.lastInsertRowid, yesterday.toISOString(), 'day1'
);


// ── Helper functions ─────────────────────────────────────────────────────────

/**
 * Get the next occurrence of a given weekday.
 * @param {number} dayOfWeek - 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
 * @returns {string} YYYY-MM-DD
 */
function getNextWeekday(dayOfWeek) {
  const today = new Date();
  const current = today.getDay(); // 0=Sun, 1=Mon...
  let daysUntil = dayOfWeek - current;
  if (daysUntil <= 0) daysUntil += 7;
  const next = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000);
  return next.toISOString().split('T')[0];
}


// ── Summary ──────────────────────────────────────────────────────────────────
const leadCount = db.prepare('SELECT COUNT(*) as n FROM leads').get().n;
const convCount = db.prepare('SELECT COUNT(*) as n FROM conversations').get().n;
const apptCount = db.prepare('SELECT COUNT(*) as n FROM appointments').get().n;
const fupCount  = db.prepare('SELECT COUNT(*) as n FROM followups').get().n;

console.log(`✅ Seed complete!`);
console.log(`   📋 ${leadCount} leads`);
console.log(`   💬 ${convCount} messages`);
console.log(`   📅 ${apptCount} appointments`);
console.log(`   🔔 ${fupCount} follow-ups\n`);
console.log(`Leads created:`);
console.log(`  🔥 Maria Santos    — HOT buyer, Clearwater Beach, pre-approved, escalated`);
console.log(`  🔥 Jennifer Chen   — HOT buyer, Lake Nona, $700k, NYC relocation, escalated`);
console.log(`  🌡️  James Wilson    — WARM seller+buyer combo, Lake Nona → Tampa`);
console.log(`  🌡️  Amanda Taylor   — WARM renter, Clearwater Beach, 30-day timeline`);
console.log(`  ❄️  David Martinez  — COLD investor, Gulf Coast Airbnb, exploring\n`);
