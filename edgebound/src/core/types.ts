export type DifficultyTier = 0 | 1 | 2 | 3 | 4 | 5;

export type PatternType =
  | 'STATIC_STEP'
  | 'MOVING_PLATFORM'
  | 'NARROW_GATE'
  | 'DOUBLE_STEP'
  | 'RISK_SPLIT'
  | 'FALLING_PLATFORM'
  | 'WIND_CORRIDOR'
  | 'GUARDIAN_SEQUENCE';

export type ModifierType =
  | 'WIND'
  | 'SPEED_UP'
  | 'SHRINK_WINDOW'
  | 'FALLING_DEBRIS'
  | 'BREAKABLE';

export interface Difficulty {
  tier: DifficultyTier;
  timingWindow: number;
  reactionTime: number;
  precisionRequired: number;
  dangerLevel: 0 | 1 | 2 | 3 | 4;
  recoveryAvailable: boolean;
}

export interface Reward {
  baseCoins: number;
  baseXp: number;
  perfectBonus: number;
  streakScaling: number;
  cashOutEligible: boolean;
}

export interface PatternData {
  type: PatternType;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  platformWidth: number;
  platformHeight: number;
  distance: number;
  speed: number;
  perfectWidth: number;
  variant: number;
  stepCount: number;
  gapBetweenSteps: number;
  riskRewardRatio: number;
}

export interface ModifierData {
  type: ModifierType;
  strength: number;
  direction?: -1 | 1;
  telegraphTime: number;
}

export interface SituationData {
  id: string;
  version: number;
  pattern: PatternData;
  modifiers: ModifierData[];
  difficulty: Difficulty;
  reward: Reward;
}


export type SituationState = 'INTRO' | 'RUNNING' | 'SUCCESS' | 'FAILED';
export type LandingQuality = 'NONE' | 'GOOD' | 'PERFECT';

export interface PlayerState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  width: number;
  height: number;
  grounded: boolean;
}

export interface SituationResult {
  state: 'SUCCESS' | 'FAILED';
  landingQuality: LandingQuality;
  accuracy: number;
  coins: number;
  xp: number;
  streak: number;
}
