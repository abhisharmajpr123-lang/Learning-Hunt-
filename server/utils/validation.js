export function validateSignup({ name, email, password } = {}) {
  const errors = [];
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const cleanPassword = typeof password === 'string' ? password : '';

  if (cleanName.length < 2 || cleanName.length > 60) errors.push('Name must be 2–60 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) errors.push('Enter a valid email address.');
  if (cleanPassword.length < 8 || !/[a-z]/.test(cleanPassword) || !/[A-Z]/.test(cleanPassword) || !/\d/.test(cleanPassword)) {
    errors.push('Password must be at least 8 characters and include uppercase, lowercase and a number.');
  }
  return { errors, cleanName, cleanEmail };
}
