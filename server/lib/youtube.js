// YouTube video search without an API key: read the public results page and pull
// the videoRenderer blocks out of its ytInitialData payload.
const SEARCH_URL = 'https://www.youtube.com/results';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
// A chapter's video list barely changes within a day, so cache successful lookups hard.
const HIT_TTL = 6 * 60 * 60 * 1000;
const RETRY_DELAY = 500;
const REQUEST_TIMEOUT = 6000;
// YouTube throttles a burst of searches; queue them instead of firing them all.
const MAX_CONCURRENT = 4;
// Only the syllabus chapters can be searched, so this never gets large; the cap
// just keeps an unexpected variety of queries from growing memory forever.
const MAX_ENTRIES = 500;

const cache = new Map();
const inFlight = new Map();
let active = 0;
const waiting = [];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Keep at most MAX_CONCURRENT searches on the wire; the rest wait their turn. */
async function withSlot(task) {
  if (active >= MAX_CONCURRENT) await new Promise(resolve => waiting.push(resolve));
  active += 1;
  try {
    return await task();
  } finally {
    active -= 1;
    const next = waiting.shift();
    if (next) next();
  }
}

/** The JSON object that starts at `start`, scanning strings and nested braces. */
function sliceObject(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return null;
}

function readInitialData(html) {
  const marker = html.indexOf('ytInitialData');
  if (marker === -1) return null;
  const start = html.indexOf('{', marker);
  if (start === -1) return null;
  const json = sliceObject(html, start);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function collectRenderers(node, found) {
  if (!node || typeof node !== 'object' || found.length >= 40) return;
  if (node.videoRenderer) {
    found.push(node.videoRenderer);
    return;
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') collectRenderers(value, found);
  }
}

function toVideo(renderer) {
  const id = renderer?.videoId;
  if (!id) return null;
  const text = value => value?.simpleText || value?.runs?.map(run => run.text).join('') || '';
  return {
    id,
    title: text(renderer.title) || 'YouTube video',
    channel: text(renderer.ownerText) || text(renderer.longBylineText),
    duration: renderer.lengthText?.simpleText || '',
    views: text(renderer.viewCountText),
    // mqdefault is 16:9, like the cards; the page's own thumbnail URLs are signed
    // and expire, so they are deliberately not used.
    thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${id}`,
    watchUrl: `https://www.youtube.com/watch?v=${id}`
  };
}

async function fetchVideos(query, limit) {
  return withSlot(async () => {
    try {
      const url = `${SEARCH_URL}?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D&hl=en`;
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT)
      });
      if (!response.ok) return [];
      const data = readInitialData(await response.text());
      const renderers = [];
      if (data) collectRenderers(data, renderers);
      const seen = new Set();
      return renderers
        .map(toVideo)
        .filter(video => video && !seen.has(video.id) && seen.add(video.id))
        .slice(0, limit);
    } catch {
      return [];
    }
  });
}

function remember(key, videos) {
  if (!cache.has(key) && cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), videos });
}

/**
 * Search YouTube for `query` and return up to `limit` unique videos.
 * A failed lookup answers an empty list so the page can fall back to a search link.
 */
export async function searchVideos(query, limit = 4) {
  const key = `${query.toLowerCase()}|${limit}`;
  const cached = cache.get(key);
  if (cached) {
    if (Date.now() - cached.at < HIT_TTL) return cached.videos;
    cache.delete(key);
  }

  // Two chapters of a unit can ask for the same query at once; share one request.
  const pending = inFlight.get(key);
  if (pending) return pending;

  const task = (async () => {
    let videos = await fetchVideos(query, limit);
    // Several chapter searches at once can get a throttled empty page back once.
    if (!videos.length) {
      await delay(RETRY_DELAY);
      videos = await fetchVideos(query, limit);
    }
    // Empty results are not cached, so the page's "Try again" really retries.
    if (videos.length) remember(key, videos);
    return videos;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, task);
  return task;
}

export function clearVideoCache() {
  cache.clear();
  inFlight.clear();
}
