import { Atom, BookOpen, Calculator, Code2, FlaskConical } from 'lucide-react';

export function SubjectIcon({ name, size = 22 }) {
  const props = { size, strokeWidth: 1.8 };
  if (name === 'math') return <Calculator {...props} />;
  if (name === 'physics') return <Atom {...props} />;
  if (name === 'chem') return <FlaskConical {...props} />;
  if (name === 'book') return <BookOpen {...props} />;
  return <Code2 {...props} />;
}
