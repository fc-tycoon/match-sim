# EventScheduler - Headless Mode

## Overview

Headless mode provides instant-result simulation that runs as fast as possible without timers, animation frames, or pause controls. Implemented as a lightweight `HeadlessScheduler` wrapper around `EventScheduler`, it processes all queued events from start to finish in a single execution.

**Key Characteristics:**
- **No pause/resume** - Once started, runs until completion
- **No timers** - Tight execution loop with no delays
- **CPU intensive** - Recommended for Web Workers (browser) or Worker Threads (Node.js)
- **Fire-and-forget** - Cannot be stopped or paused once running
- **Maximum performance** - Processes events as fast as CPU allows

## Purpose

Headless mode is designed for:
- **Instant match results** - Skip real-time simulation, get final result immediately
- **Background processing** - Run simulations in Web Workers without blocking UI
- **Batch simulations** - Process multiple matches for AI training or testing
- **Continue from real-time** - User clicks "Instant Results" during live match

## Basic Usage

```javascript
import { EventScheduler } from './core/EventScheduler'
import { HeadlessScheduler } from './core/HeadlessScheduler'

// Create scheduler and populate with events
const scheduler = new EventScheduler()

// Schedule match events (offset-based)
for (let offset = 0; offset < 5_400_000; offset += 100) {
	scheduler.schedule(offset, EventType.BALL_PHYSICS, (event) => {
		ball.update(event.tick)
	})
}

// Run headless to completion
const headless = new HeadlessScheduler(scheduler)
await headless.run()  // Drains entire queue

console.log('Match completed at tick:', scheduler.currentTick)
```

## API

### Constructor

```typescript
new HeadlessScheduler(scheduler?: EventScheduler)
```

**Parameters:**
- `scheduler` (optional) - Existing `EventScheduler` instance to control
  - If omitted, creates a fresh `EventScheduler` instance
  - Pass an existing scheduler to continue from current state (e.g., switch from real-time to instant results)

**Example:**
```javascript
// Create fresh scheduler
const headless1 = new HeadlessScheduler()

// Continue from existing scheduler
const headless2 = new HeadlessScheduler(existingScheduler)
```

### Methods

#### `run()`

Drains the entire event queue until no events remain.

```typescript
async run(): Promise<void>
```

**Behavior:**
- Calls `scheduler.runUntilEnd()` internally
- Processes all events as fast as possible
- Cannot be paused or stopped once started
- Throws if already running (prevents re-entrant execution)

**Returns:** Promise that resolves when queue is empty

**Throws:** `Error` if headless scheduler is already running

**Example:**
```javascript
const headless = new HeadlessScheduler(scheduler)
await headless.run()
// All events processed
```

### Properties

#### `scheduler` (getter)

Returns the `EventScheduler` instance controlled by this headless runner.

```typescript
get scheduler(): EventScheduler
```

**Example:**
```javascript
const headless = new HeadlessScheduler()
console.log('Current tick:', headless.scheduler.currentTick)
```

#### `running` (getter)

Returns `true` if headless execution is currently in progress.

```typescript
get running(): boolean
```

**Example:**
```javascript
if (!headless.running) {
	await headless.run()
}
```

## Usage Patterns

### Instant Match Results

Process entire match immediately without real-time simulation:

```javascript
const scheduler = new EventScheduler()
const headless = new HeadlessScheduler(scheduler)

// Schedule all match events
setupMatchEvents(scheduler)

// Run to completion
await headless.run()

// Extract final results
const result = {
	homeGoals: match.homeScore,
	awayGoals: match.awayScore,
	finalTick: scheduler.currentTick,
}
```

### Continue From Real-Time

User switches from real-time to instant results mid-match:

```javascript
// Real-time scheduler running
const realTime = new RealTimeScheduler(scheduler)
realTime.start()

// User clicks "Instant Results"
await realTime.stop()

// Continue with headless
const headless = new HeadlessScheduler(scheduler)
await headless.run()
```

### Web Worker Implementation (Recommended)

Run headless simulation in background thread to avoid blocking UI:

```javascript
// main-thread.js
const worker = new Worker('simulation-worker.js')

worker.postMessage({
	type: 'RUN_MATCH',
	matchData: { teams, formations, seed },
})

worker.onmessage = (event) => {
	if (event.data.type === 'MATCH_COMPLETE') {
		displayResults(event.data.result)
	}
}

// simulation-worker.js
import { EventScheduler } from './core/EventScheduler'
import { HeadlessScheduler } from './core/HeadlessScheduler'

self.onmessage = async (event) => {
	if (event.data.type === 'RUN_MATCH') {
		const scheduler = new EventScheduler()
		const headless = new HeadlessScheduler(scheduler)
		
		// Setup match
		setupMatchSimulation(scheduler, event.data.matchData)
		
		// Run to completion
		await headless.run()
		
		// Send results back
		self.postMessage({
			type: 'MATCH_COMPLETE',
			result: extractMatchResult(scheduler),
		})
	}
}
```

### Batch Processing

Process multiple scenarios for AI training or testing:

```javascript
const results = []

for (const scenario of testScenarios) {
	const scheduler = new EventScheduler()
	const headless = new HeadlessScheduler(scheduler)
	
	setupScenario(scheduler, scenario)
	await headless.run()
	
	results.push({
		scenario: scenario.name,
		outcome: extractOutcome(scheduler),
	})
}

console.log('Processed', results.length, 'scenarios')
```

## Performance

Headless mode runs as fast as the CPU allows with no artificial delays:

**Typical Performance** (approximate, varies by CPU):
- Small simulation (1,000 events): ~2-5 ms
- Full match (540,000 events @ 100ms intervals): ~100-200 ms
- Large simulation (1,000,000 events): ~200-400 ms

**Performance Characteristics:**
- No timer overhead (no `setTimeout`/`setInterval`)
- Single-threaded tight loop
- CPU-bound (will use 100% of one core)
- Faster than real-time by 10,000× - 100,000× depending on event density

## Thread Recommendations

### Web Workers (Browser)

**Recommended** for headless simulation in browsers:

```javascript
// ✅ Run in Web Worker - keeps UI responsive
const worker = new Worker('simulation-worker.js')
```

**Benefits:**
- UI remains responsive during simulation
- No main thread blocking
- Can run multiple simulations in parallel (multiple workers)

### Worker Threads (Node.js)

**Recommended** for Node.js environments:

```javascript
// ✅ Run in Worker Thread - keeps event loop responsive
const { Worker } = require('worker_threads')
const worker = new Worker('./simulation-worker.js')
```

**Benefits:**
- Non-blocking for server applications
- Parallel simulation processing
- Better CPU utilization

### Main Thread (Not Recommended)

**Avoid** running headless on main thread for large simulations:

```javascript
// ❌ Blocks UI/event loop for entire duration
await headless.run()  // Can freeze UI for 100-500ms
```

**Only acceptable for:**
- Small simulations (<10,000 events)
- CLI tools / scripts
- Testing / debugging

## Comparison with RealTimeScheduler

| Feature | HeadlessScheduler | RealTimeScheduler |
|---------|-------------------|-------------------|
| **Speed** | Maximum (CPU-bound) | Real-time paced (1× - 100×) |
| **Pause** | ❌ Cannot pause | ❌ No pause/resume |
| **Stop** | ❌ Cannot stop | ✅ Stop support |
| **Speed Control** | ❌ No speed control | ✅ Adjustable (0.1× - 100×) |
| **Use Case** | Instant results | Live simulation |
| **Thread** | Web Worker recommended | Main thread |
| **UI Blocking** | ⚠️ Blocks if on main thread | ✅ Non-blocking |
| **Timers** | ❌ None | ✅ Uses setTimeout |

## Error Handling

### Re-entrant Execution

Headless scheduler prevents concurrent execution:

```javascript
const headless = new HeadlessScheduler(scheduler)

await headless.run()  // First run - OK

// Second run while first is still running
await headless.run()  // ❌ Throws: "HeadlessScheduler is already running"
```

### Guard Against Re-entrant Calls

```javascript
const headless = new HeadlessScheduler(scheduler)

if (!headless.running) {
	await headless.run()
} else {
	console.warn('Headless simulation already in progress')
}
```

## Implementation Details

The `HeadlessScheduler` is a minimal wrapper:

```typescript
async run(): Promise<void> {
	if (this.#running) {
		throw new Error('HeadlessScheduler is already running')
	}
	
	this.#running = true
	try {
		await this.#scheduler.runUntilEnd()  // Drain entire queue
	} finally {
		this.#running = false
	}
}
```

**Key Points:**
- Calls `EventScheduler.runUntilEnd()` which drains queue completely
- Sets `running` flag to prevent re-entrant execution
- No chunking, no yielding, no pause checks
- Pure pass-through to scheduler's drain logic

## See Also

- [EventScheduler](./EVENT_SCHEDULER.md) - Core scheduler implementation
- [EVENT_SCHEDULER_REQUIREMENTS.md](./EVENT_SCHEDULER_REQUIREMENTS.md) - Complete specification
- [RealTimeScheduler](./EVENT_SCHEDULER.md#realtimescheduler-wrapper) - Real-time execution wrapper
