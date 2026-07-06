export type FighterId = "A" | "B";
export type Direction = "up" | "down" | "left" | "right";
export type SpellId = "firebolt" | "blink" | "shield" | "snare" | "heal";
export type Phase = "tick-start" | "movement" | "defence" | "utility" | "offence" | "damage" | "defeat";

export type Position = Readonly<{ x: number; y: number }>;
export type PlannedAction = Readonly<{
  tick: number;
  action: "move" | "dash" | "attack" | "block" | "duck" | "cast" | "idle";
  direction?: Direction;
  spell?: SpellId;
}>;

export type PlanV1 = Readonly<{
  schema: 1;
  fighter_name: string;
  strategy?: string;
  actions: readonly PlannedAction[];
}>;

export type FighterState = {
  hp: number;
  position: Position;
  cooldowns: Partial<Record<SpellId, number>>;
  effects: Record<string, number>;
  usedHeal: boolean;
};

export type MatchStateV1 = {
  schema: 1;
  round: number;
  gridSize: number;
  fighters: Record<FighterId, FighterState>;
};

export type CombatEvent = Readonly<{
  tick: number;
  phase: Phase;
  type: string;
  actor?: FighterId;
  target?: FighterId;
  data?: Readonly<Record<string, unknown>>;
}>;

export type ReplayFrame = Readonly<{
  tick: number;
  fighters: Readonly<Record<FighterId, FighterState>>;
  events: readonly CombatEvent[];
}>;

export type ValidationIssue = Readonly<{ severity: "error" | "warning"; path: string; message: string }>;

export type MatchResult = Readonly<{
  ok: boolean;
  issues: readonly ValidationIssue[];
  names?: Readonly<Record<FighterId, string>>;
  frames?: readonly ReplayFrame[];
  events?: readonly CombatEvent[];
  finalState?: MatchStateV1;
  outcome?: "A" | "B" | "draw" | "A_leading" | "B_leading" | "even";
}>;

export type MatchBundleV1 = Readonly<{
  schema: 1;
  engineVersion: string;
  ruleset: Readonly<{ id: string; version: number }>;
  createdAt?: string;
  plans: Readonly<Record<FighterId, PlanV1>>;
  initialState: MatchStateV1;
  result: MatchResult;
  replayHash: string;
}>;

export type AgentContext = Readonly<{ side: FighterId; state: MatchStateV1; prompt: string }>;
export interface FighterAgent { readonly id: string; createPlan(context: AgentContext, signal?: AbortSignal): Promise<PlanV1>; }
