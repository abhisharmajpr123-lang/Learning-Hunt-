import test from 'node:test';
import assert from 'node:assert/strict';
import { hasLocalProgressBeyond, mergeStudy } from '../../src/lib/studyMerge.js';

const savedStudy = {
  selected: ['6b088185e7fa72ef842e06e7'],
  classes: { '6b088185e7fa72ef842e06e7': { trackId: 'class-10', label: 'Class 10' } },
  completed: ['v1', 'v2'],
  activities: [{ id: 1, type: 'quiz', title: 'Saved quiz', date: 'Yesterday' }],
  rewards: {
    xp: 40,
    streak: 2,
    lastActive: '2026-11-27',
    daily: { date: '2026-11-27', video: 1, quiz: 0, assignment: 0, test: 0, total: 1 }
  }
};

const localPayload = {
  selected: ['6b088185e7fa72ef842e0743'],
  classes: { '6b088185e7fa72ef842e0743': { trackId: 'class-9', label: 'Class 9' } },
  progress: {
    completed: ['v2', 'v3'],
    activities: [
      { id: 2, type: 'video', title: 'Offline video', date: 'Today' },
      { id: 1, type: 'quiz', title: 'Saved quiz', date: 'Yesterday' }
    ],
    rewards: {
      xp: 60,
      streak: 1,
      lastActive: '2026-11-28',
      daily: { date: '2026-11-28', video: 1, quiz: 0, assignment: 0, test: 0, total: 1 }
    }
  }
};

test('merging keeps the union of the account and local-only progress', () => {
  const merged = mergeStudy(savedStudy, localPayload);

  assert.deepEqual(merged.selected, [
    '6b088185e7fa72ef842e06e7',
    '6b088185e7fa72ef842e0743'
  ]);
  assert.deepEqual(merged.classes, {
    '6b088185e7fa72ef842e06e7': { trackId: 'class-10', label: 'Class 10' },
    '6b088185e7fa72ef842e0743': { trackId: 'class-9', label: 'Class 9' }
  });
  assert.deepEqual(merged.completed, ['v1', 'v2', 'v3']);
});

test('activities are de-duplicated with the newer local row first', () => {
  const merged = mergeStudy(savedStudy, localPayload);

  assert.deepEqual(merged.activities.map(activity => activity.id), [2, 1]);
  assert.equal(merged.activities[0].title, 'Offline video');
});

test('the higher counters and the later day win', () => {
  const merged = mergeStudy(savedStudy, localPayload);

  assert.equal(merged.rewards.xp, 60);
  assert.equal(merged.rewards.streak, 2);
  assert.equal(merged.rewards.lastActive, '2026-11-28');
  assert.equal(merged.rewards.daily.date, '2026-11-28');
});

test('an empty account copy keeps everything local', () => {
  const empty = {
    selected: [],
    classes: {},
    completed: [],
    activities: [],
    rewards: { xp: 0, streak: 0, lastActive: null, daily: { date: null } }
  };
  const merged = mergeStudy(empty, localPayload);

  assert.deepEqual(merged.selected, ['6b088185e7fa72ef842e0743']);
  assert.deepEqual(merged.completed, ['v2', 'v3']);
  assert.equal(merged.activities.length, 2);
  assert.equal(merged.rewards.xp, 60);
});

test('a cache that is ahead of the account is detected', () => {
  assert.equal(hasLocalProgressBeyond(savedStudy, localPayload), true);
  // Same values: nothing local-only, so a normal login can replace it.
  const same = {
    selected: [],
    classes: {},
    progress: {
      completed: savedStudy.completed,
      activities: savedStudy.activities,
      rewards: savedStudy.rewards
    }
  };
  assert.equal(hasLocalProgressBeyond(savedStudy, same), false);
  // A cache behind the account is not newer either.
  assert.equal(hasLocalProgressBeyond(savedStudy, { progress: { rewards: { xp: 10 } } }), false);
  assert.equal(hasLocalProgressBeyond(null, {}), false);
});

test('missing pieces on either side do not throw', () => {
  const merged = mergeStudy(null, {});
  assert.deepEqual(merged.selected, []);
  assert.deepEqual(merged.completed, []);
  assert.deepEqual(merged.activities, []);
  assert.equal(merged.rewards.xp, 0);
  assert.equal(merged.rewards.lastActive, null);
});
