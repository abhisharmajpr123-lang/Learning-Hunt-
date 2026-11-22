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
