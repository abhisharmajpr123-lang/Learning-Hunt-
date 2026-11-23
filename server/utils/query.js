export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

/** Escape user input before it is used inside a RegExp. */
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Read page/limit from the query string.
 * Defaults to page 1 and 10 per page, and rejects values outside 1–50.
 */
export function parsePagination({ page, limit } = {}) {
  const errors = [];
  const requestedPage = page === undefined ? 1 : Number(page);
  const requestedLimit = limit === undefined ? DEFAULT_PAGE_SIZE : Number(limit);

  if (!Number.isInteger(requestedPage) || requestedPage < 1) {
    errors.push('Page must be a whole number of 1 or more.');
  }
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_PAGE_SIZE) {
    errors.push(`Limit must be a whole number between 1 and ${MAX_PAGE_SIZE}.`);
  }

  const safePage = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1;
  const safeLimit = Number.isInteger(requestedLimit) && requestedLimit >= 1 && requestedLimit <= MAX_PAGE_SIZE
    ? requestedLimit
    : DEFAULT_PAGE_SIZE;

  return { errors, page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

/** Metadata returned with every paginated list so the UI can build page controls. */
export function paginationMeta({ page, limit, total }) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

/** Build a case-insensitive "contains" RegExp from untrusted text. */
export function searchPattern(text) {
  return new RegExp(escapeRegex(text), 'i');
}
