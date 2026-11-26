import {
  BookOpen,
  ChartNoAxesCombined,
  ClipboardCheck,
  LayoutDashboard,
  Search,
  Users
} from 'lucide-react';

export const PORTALS = {
  student: [
    ['overview', 'Overview', LayoutDashboard],
    ['subjects', 'My subjects', BookOpen],
    ['discover', 'Explore subjects', Search],
    ['progress', 'My progress', ChartNoAxesCombined]
  ],
  teacher: [
    ['overview', 'Overview', LayoutDashboard],
    ['subjects', 'My subjects', BookOpen],
    ['assessments', 'Assessments', ClipboardCheck],
    ['students', 'Students', Users]
  ],
  developer: [
    ['overview', 'Overview', LayoutDashboard],
    ['subjects', 'Subject catalogue', BookOpen],
    ['users', 'User management', Users],
    ['reports', 'Platform reports', ChartNoAxesCombined]
  ]
};

export function portalFor(role) {
  return PORTALS[role] || PORTALS.student;
}

// Full-screen screens opened from another page, so they are routable but not in the sidebar.
const HIDDEN_PAGES = {
  student: [
    { id: 'classes', label: 'Browse courses' },
    { id: 'learning', label: 'My learning' }
  ]
};

export function isPortalPage(role, page) {
  return (
    portalFor(role).some(([id]) => id === page) ||
    (HIDDEN_PAGES[role] || []).some(item => item.id === page)
  );
}

export function pageTitle(role, page) {
  const nav = portalFor(role);
  const hidden = (HIDDEN_PAGES[role] || []).find(item => item.id === page);
  if (hidden) return hidden.label;
  return (nav.find(([id]) => id === page) || nav[0])[1];
}
