# Standard ruleset v2

The simulator is deterministic. A round has at most 12 ticks. Both fighters submit all actions before simulation, and damage in a tick is applied simultaneously.

## Tick phases

1. Decrement existing cooldown and effect counters.
2. Collect and resolve movement/dash intents. Snare blocks movement.
3. Establish block and duck for this tick.
4. Resolve shield, heal, and simultaneous blink intents.
5. Resolve melee, firebolt, and snare intents.
6. Apply accumulated damage simultaneously.
7. Check defeat and capture the replay frame.

An effect duration includes the tick on which it is applied. Therefore shield and snare use duration 2 to remain active through the following tick-start decrement.

## Movement and collision

Movement outside the grid fails. If both movement destinations are the same, or fighters swap positions, both movements fail. Blink destinations are computed from one phase snapshot; a destination outside the arena, occupied at phase start, or shared by simultaneous blink intents fails and consumes cooldown.

## Defence and rounding

Block halves melee only. Shield halves all damage. Reductions stack and each reduction rounds upward, so an 18-damage melee hit against block plus shield deals 5 damage.

## Compatibility changes from prototype rules

- Snare now actually blocks movement on the next tick.
- Simultaneous blinks are resolved as intents rather than in fighter A/B iteration order.
- Engine output uses structured events; prose logs are presentation output.

These changes are why the extracted ruleset starts at version 2.
