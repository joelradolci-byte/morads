export const FEEDBACK_MIN_DAYS = Math.max(
  1,
  Number(process.env.MORA_FEEDBACK_MIN_DAYS ?? 7) || 7
);

export const FEEDBACK_COOLDOWN_DAYS = Math.max(
  1,
  Number(process.env.MORA_FEEDBACK_COOLDOWN_DAYS ?? 90) || 90
);

export const FEEDBACK_COMMENT_MAX = 2000;
