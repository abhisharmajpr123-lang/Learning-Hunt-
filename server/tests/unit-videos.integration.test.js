import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { clearVideoCache } from '../lib/youtube.js';

process.env.JWT_SECRET = 'integration-test-secret-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';

const PASSWORD = 'StrongPass123';
const RESULT_PAGE_PREFIX = 'https://www.youtube.com/results';

let mongo;
let server;
let baseUrl;
let studentToken;
let realFetch;
let youtubeCalls = 0;
let youtubeStatus = 200;
const searchedQueries = [];

// A stable id per query: merging must not drop videos that differ only by chapter.
const queryId = query =>
  [...query].reduce((sum, char) => sum + char.charCodeAt(0), 0).toString(36);

const videoRenderer = (id, title) => ({
  videoRenderer: {
    videoId: id,
    title: { runs: [{ text: title }] },
    ownerText: { runs: [{ text: 'CBSE Academy' }] },
    lengthText: { simpleText: '11:20' },
    viewCountText: { simpleText: '12,345 views' }
  }
});

/** A minimal YouTube results page: the shape the parser reads. */
function resultsPage(query) {
  return `<!doctype html><html><body><script>var ytInitialData = ${JSON.stringify({
    contents: {
      twoColumnSearchResultsRenderer: {
        primaryContents: {
          sectionListRenderer: {
            contents: [
              {
                itemSectionRenderer: {
                  contents: [1, 2].map(index =>
                    videoRenderer(`video-${queryId(query)}-${index}`, `${query} · lesson ${index}`)
                  )
                }
              }
            ]
          }
        }
      }
    }
  })};</script></body></html>`;
}

async function call(method, path, { token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, body: json };
}

const unitPath = (trackId, subjectId, index) => `/api/curriculum/${trackId}/${subjectId}/units/${index}`;

before(async () => {
  // YouTube is the only outbound call the API makes; every other fetch is ours.
  realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (!url.startsWith(RESULT_PAGE_PREFIX)) return realFetch(input, init);
    youtubeCalls += 1;
    if (youtubeStatus !== 200) return new Response('unavailable', { status: youtubeStatus });
    const query = new URL(url).searchParams.get('search_query');
    searchedQueries.push(query);
    return new Response(resultsPage(query), {
      status: 200,
      headers: { 'content-type': 'text/html' }
    });
  };

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri('learnhunt_unit_videos_test'));
  const { default: app } = await import('../index.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const signup = await call('POST', '/api/auth/signup', {
    body: { name: 'Video Student', email: 'videos@example.com', password: PASSWORD }
  });
  assert.equal(signup.status, 201);
  const login = await call('POST', '/api/auth/login', {
    body: { email: 'videos@example.com', password: PASSWORD }
  });
  studentToken = login.body.token;
}, { timeout: 240000 });

after(async () => {
  globalThis.fetch = realFetch;
  clearVideoCache();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('the unit itself answers without waiting for YouTube', async () => {
  const before = youtubeCalls;
  const { status, body } = await call('GET', unitPath('class-9', 'science', 0), {
    token: studentToken
  });

  assert.equal(status, 200);
  assert.equal(body.unit.index, 0);
  assert.equal(body.unit.title, 'Unit I · Matter — Its Nature and Behaviour');
  assert.deepEqual(body.unit.chapters, [
    'Matter in Our Surroundings',
    'Is Matter Around Us Pure?',
    'Atoms and Molecules',
    'Structure of the Atom'
  ]);
  assert.equal(body.track.id, 'class-9');
  assert.equal(body.subject.name, 'Science');
  assert.equal(youtubeCalls, before, 'the unit header must not wait on YouTube');
});

test('a few chapter searches cover the unit', async () => {
  searchedQueries.length = 0;
  const { status, body } = await call('GET', `${unitPath('class-9', 'science', 0)}/videos`, {
    token: studentToken
  });

  assert.equal(status, 200);
  // Four chapters: first, middle and last are searched by name, not a vague title.
  assert.equal(searchedQueries.length, 3);
  assert.match(searchedQueries[0], /^Matter in Our Surroundings Science Class 9 CBSE$/);
  assert.match(searchedQueries[2], /^Structure of the Atom Science Class 9 CBSE$/);
  assert.match(body.searchUrl, /^https:\/\/www\.youtube\.com\/results\?search_query=/);
  // 3 chapters × 2 stubbed videos, interleaved and de-duplicated.
  assert.equal(body.videos.length, 6);
  assert.equal(new Set(body.videos.map(video => video.id)).size, 6);

  const [first, second] = body.videos;
  assert.notEqual(first.channel, undefined);
  assert.match(first.title, /Science Class 9 CBSE · lesson 1$/);
  assert.match(second.title, /Science Class 9 CBSE · lesson 1$/);
  const video = first;
  assert.match(video.id, /^video-/);
  assert.equal(video.channel, 'CBSE Academy');
  assert.equal(video.duration, '11:20');
  assert.match(video.thumbnail, /^https:\/\/i\.ytimg\.com\/vi\/[^/]+\/mqdefault\.jpg$/);
  assert.ok(video.embedUrl.startsWith('https://www.youtube.com/embed/'));
  assert.ok(video.watchUrl.startsWith('https://www.youtube.com/watch?v='));
});

test('a second visit is served from the cache', async () => {
  const before = youtubeCalls;
  const { status, body } = await call('GET', `${unitPath('class-9', 'science', 0)}/videos`, {
    token: studentToken
  });

  assert.equal(status, 200);
  assert.equal(body.videos.length, 6);
  assert.equal(youtubeCalls, before);
});

test('a YouTube failure still answers, and is not cached', async () => {
  youtubeStatus = 500;
  let failed;
  try {
    failed = await call('GET', `${unitPath('class-9', 'science', 1)}/videos`, {
      token: studentToken
    });
  } finally {
    youtubeStatus = 200;
  }

  assert.equal(failed.status, 200);
  assert.deepEqual(failed.body.videos, []);
  assert.match(failed.body.searchUrl, /^https:\/\/www\.youtube\.com\/results\?search_query=/);

  // The empty answer was not cached, so retrying really searches again.
  const retried = await call('GET', `${unitPath('class-9', 'science', 1)}/videos`, {
    token: studentToken
  });
  assert.equal(retried.status, 200);
  assert.equal(retried.body.videos.length, 4);
});

test('unknown units and subjects are rejected, and a token is required', async () => {
  assert.equal((await call('GET', unitPath('class-9', 'science', 99), { token: studentToken })).status, 404);
  assert.equal((await call('GET', unitPath('class-9', 'science', -1), { token: studentToken })).status, 404);
  assert.equal((await call('GET', unitPath('class-9', 'physics', 0), { token: studentToken })).status, 404);
  assert.equal(
    (await call('GET', `${unitPath('class-9', 'science', 99)}/videos`, { token: studentToken })).status,
    404
  );
  assert.equal((await call('GET', unitPath('class-9', 'science', 0))).status, 401);
  assert.equal(
    (await call('GET', `${unitPath('class-9', 'science', 0)}/videos`)).status,
    401
  );
});
