const unique = values => [...new Set(values)];

/**
 * Does this browser hold progress the account copy does not? Used to decide
 * whether a load must merge instead of replacing the local state.
 */
export function hasLocalProgressBeyond(serverStudy, localPayload) {
  const saved = serverStudy || {};
  const local = localPayload || {};
  const localProgress = local.progress || {};
  const savedRewards = saved.rewards || {};

  return (
    (localProgress.rewards?.xp || 0) > (savedRewards.xp || 0) ||
    (localProgress.completed || []).length > (saved.completed || []).length ||
    (localProgress.activities || []).length > (saved.activities || []).length
  );
}

/**
 * Combine the account's saved study with progress that only exists in this
 * browser. Used when a load succeeds after saving was paused: replacing the
 * local state with the server copy would throw that work away, so keep both —
 * the newer counters win and nothing is dropped.
 */
export function mergeStudy(serverStudy, localPayload) {
  const saved = serverStudy || {};
  const local = localPayload || {};
  const savedProgress = {
    completed: saved.completed || [],
    activities: saved.activities || [],
    rewards: saved.rewards || {}
  };
  const localProgress = local.progress || {};
  const localRewards = localProgress.rewards || {};
  const savedRewards = savedProgress.rewards;
  const localDaily = localRewards.daily || {};
  const savedDaily = savedRewards.daily || {};

  const seen = new Set();
  const activities = [];
  for (const activity of [...(localProgress.activities || []), ...savedProgress.activities]) {
    if (!activity || seen.has(activity.id)) continue;
    seen.add(activity.id);
    activities.push(activity);
  }

  return {
    selected: unique([...(saved.selected || []), ...(local.selected || [])]),
    classes: { ...(saved.classes || {}), ...(local.classes || {}) },
    completed: unique([...(savedProgress.completed || []), ...(localProgress.completed || [])]),
    activities: activities.slice(0, 100),
    rewards: {
      xp: Math.max(savedRewards.xp || 0, localRewards.xp || 0),
      streak: Math.max(savedRewards.streak || 0, localRewards.streak || 0),
      lastActive:
        [savedRewards.lastActive, localRewards.lastActive].filter(Boolean).sort().pop() || null,
      // The daily mission counters belong to one day; the later day is the live one.
      daily: String(localDaily.date || '') >= String(savedDaily.date || '') ? localDaily : savedDaily
    }
  };
}
