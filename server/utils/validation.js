function cleanEmailInput(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function validateLogin({ email, password } = {}) {
  const errors = [];
  const cleanEmail = cleanEmailInput(email);
  const cleanPassword = typeof password === 'string' ? password : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.push('Enter a valid email address.');
  if (!cleanPassword) errors.push('Enter your password.');
  return { errors, cleanEmail };
}

export function validateSubject({ name, category, description, published } = {}, { partial = false } = {}) {
  const errors = [];
  const clean = {};

  if (name !== undefined || !partial) {
    const cleanName = typeof name === 'string' ? name.trim() : '';
    if (cleanName.length < 2 || cleanName.length > 80) errors.push('Subject name must be 2–80 characters.');
    clean.name = cleanName;
  }

  if (category !== undefined || !partial) {
    const cleanCategory = typeof category === 'string' ? category.trim() : '';
    if (cleanCategory.length < 2 || cleanCategory.length > 40) errors.push('Category must be 2–40 characters.');
    clean.category = cleanCategory;
  }

  if (description !== undefined) {
    const cleanDescription = typeof description === 'string' ? description.trim() : null;
    if (cleanDescription === null || cleanDescription.length > 500) errors.push('Description must be 500 characters or fewer.');
    else clean.description = cleanDescription;
  }

  if (published !== undefined) {
    if (typeof published !== 'boolean') errors.push('Published must be true or false.');
    else clean.published = published;
  }

  return { errors, clean };
}

export const COURSE_LEVELS = ['beginner', 'intermediate', 'advanced'];

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateSectionInput({ title } = {}) {
  const errors = [];
  const cleanTitle = cleanText(title);

  if (cleanTitle.length < 2 || cleanTitle.length > 100) errors.push('Section title must be 2–100 characters.');
  return { errors, clean: { title: cleanTitle } };
}

export function validateLesson({ title, content, durationMinutes } = {}) {
  const errors = [];
  const clean = {};

  const cleanTitle = cleanText(title);
  if (cleanTitle.length < 2 || cleanTitle.length > 140) errors.push('Lesson title must be 2–140 characters.');
  clean.title = cleanTitle;

  if (content !== undefined) {
    const cleanContent = cleanText(content);
    if (cleanContent.length > 2000) errors.push('Lesson content must be 2000 characters or fewer.');
    else clean.content = cleanContent;
  }

  if (durationMinutes !== undefined) {
    const minutes = Number(durationMinutes);
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 600) {
      errors.push('Lesson duration must be a whole number of minutes between 0 and 600.');
    } else {
      clean.durationMinutes = minutes;
    }
  }

  return { errors, clean };
}

export function validateCourse({ title, description, level, published, sections } = {}, { partial = false } = {}) {
  const errors = [];
  const clean = {};

  if (title !== undefined || !partial) {
    const cleanTitle = cleanText(title);
    if (cleanTitle.length < 2 || cleanTitle.length > 120) errors.push('Course title must be 2–120 characters.');
    clean.title = cleanTitle;
  }

  if (description !== undefined) {
    const cleanDescription = typeof description === 'string' ? description.trim() : null;
    if (cleanDescription === null || cleanDescription.length > 500) errors.push('Course description must be 500 characters or fewer.');
    else clean.description = cleanDescription;
  }

  if (level !== undefined || !partial) {
    const cleanLevel = level === undefined ? 'beginner' : String(level).trim().toLowerCase();
    if (!COURSE_LEVELS.includes(cleanLevel)) errors.push(`Level must be one of: ${COURSE_LEVELS.join(', ')}.`);
    else clean.level = cleanLevel;
  }

  if (published !== undefined) {
    if (typeof published !== 'boolean') errors.push('Published must be true or false.');
    else clean.published = published;
  }

  if (sections !== undefined) {
    if (!Array.isArray(sections)) {
      errors.push('Sections must be an array.');
    } else if (sections.length > 20) {
      errors.push('A course can have at most 20 sections.');
    } else {
      clean.sections = sections.map((section, sectionIndex) => {
        const { errors: sectionErrors, clean: cleanSection } = validateSectionInput(section);
        for (const error of sectionErrors) errors.push(`Section ${sectionIndex + 1}: ${error}`);

        const rawLessons = Array.isArray(section?.lessons) ? section.lessons : [];
        if (rawLessons.length > 50) errors.push(`Section ${sectionIndex + 1}: a section can have at most 50 lessons.`);

        const lessons = rawLessons.map((lesson, lessonIndex) => {
          const { errors: lessonErrors, clean: cleanLesson } = validateLesson(lesson);
          for (const error of lessonErrors) errors.push(`Section ${sectionIndex + 1}, lesson ${lessonIndex + 1}: ${error}`);
          return cleanLesson;
        });

        return { title: cleanSection.title, lessons };
      });
    }
  }

  return { errors, clean };
}

export function validateSignup({ name, email, password } = {}) {
  const errors = [];
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = cleanEmailInput(email);
  const cleanPassword = typeof password === 'string' ? password : '';

  if (cleanName.length < 2 || cleanName.length > 60) errors.push('Name must be 2–60 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.push('Enter a valid email address.');
  if (cleanPassword.length < 8 || !/[a-z]/.test(cleanPassword) || !/[A-Z]/.test(cleanPassword) || !/\d/.test(cleanPassword)) {
    errors.push('Password must be at least 8 characters and include uppercase, lowercase and a number.');
  }
  return { errors, cleanName, cleanEmail };
}
