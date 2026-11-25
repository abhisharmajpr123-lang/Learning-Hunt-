// The API stores a free-text category, so the UI derives a look from the subject.
const CATEGORY_STYLES = {
  science: 'violet',
  technology: 'green',
  languages: 'pink',
  business: 'orange',
  mathematics: 'blue',
  arts: 'cyan',
  humanities: 'orange'
};

const COLOURS = ['blue', 'violet', 'green', 'cyan', 'orange', 'pink'];

const ICONS = [
  [/math|algebra|calculus|arithmetic|statistic/i, 'math'],
  [/physic/i, 'physics'],
  [/chem/i, 'chem'],
  [/english|language|literature|writing/i, 'book']
];

const CATEGORY_ICONS = {
  science: 'physics',
  technology: 'code',
  languages: 'book',
  business: 'math',
  mathematics: 'math'
};

function hash(text) {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) % 997;
  }
  return value;
}

/** Stable icon and colour for a subject, whatever its category text. */
export function styleFor(subject = {}) {
  const name = subject.name || '';
  const category = (subject.category || '').toLowerCase();
  const icon = ICONS.find(([pattern]) => pattern.test(name))?.[1] || CATEGORY_ICONS[category] || 'code';
  const color = CATEGORY_STYLES[category] || COLOURS[hash(name || category || 'learnhunt') % COLOURS.length];
  return { icon, color };
}

export function levelLabel(level) {
  if (!level) return 'Beginner';
  return level.charAt(0).toUpperCase() + level.slice(1);
}
