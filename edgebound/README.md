# EDGEBOUND — PatternRuntime Objectives

## Playable vertical slice

The repository now includes a browser-playable **MOVING_PLATFORM + WIND** slice.
It uses the existing `SituationRuntime` and deterministic data model to provide a
single-button timing challenge with a live wind indicator, perfect-landing zone,
reward feedback, particles, slow motion, screen shake, and retry flow.

```bash
npx tsc -p tsconfig.json
python3 -m http.server 4173
```

Open <http://localhost:4173>. Use **tap/click** or **Space / Up Arrow** to jump.
After a failed landing, retry recreates the same authored situation.

This slice adds a unified `PatternRuntime` contract where each gameplay pattern owns its objective lifecycle.

## Unified contract

Every runtime implements:

- `update(dt, elapsed)` — pattern simulation
- `getPlatforms()` — collision/render geometry
- `getTargetPlatform()` — current steering target
- `getObjective()` — UI/gameplay objective snapshot
- `onPlayerLanded(platformId, elapsed)` — gameplay event input
- `isComplete()` / `isFailed()` — objective state
- `snapshot()` — serializable runtime state

## Pattern objectives

| Pattern | Objective |
|---|---|
| STATIC_STEP | LAND_ON_TARGET |
| MOVING_PLATFORM | LAND_ON_TARGET / timing |
| NARROW_GATE | LAND_ON_TARGET / precision |
| DOUBLE_STEP | LAND_SEQUENCE |
| RISK_SPLIT | CHOOSE_AND_LAND |
| FALLING_PLATFORM | LAND_AND_SURVIVE |
| WIND_CORRIDOR | LAND_ON_TARGET / cross wind |
| GUARDIAN_SEQUENCE | REACH_GUARDIAN_SEQUENCE |

## Important runtime rule

`SituationRuntime` does not decide what constitutes completion. The active pattern does. `SituationRuntime` only forwards player landings and resolves the situation when `PatternRuntime.isComplete()` becomes true.

This makes adding a new pattern possible without modifying the core situation state machine.

## Build

```bash
npx tsc --noEmit
```

The project is strict TypeScript and compiles without errors.
