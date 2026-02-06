# Referral & Gamification System Architecture

## Overview

This document explains the design and implementation of the referral and gamification system for the waitlist SaaS. The system is designed to be flexible, scalable, and production-ready, inspired by enterprise tools like KickoffLabs, ViralLoops, and Prefinery.

## Core Principles

1. **Data-Driven Configuration**: Campaign behavior, scoring rules, and rewards are stored in the database, not hardcoded
2. **Transactional Safety**: All operations are atomic and safe under concurrency
3. **Idempotent Operations**: All operations can be safely retried
4. **Decoupled Architecture**: Business logic is separated from UI logic
5. **Scalability**: Designed to handle hundreds of thousands of subscribers

## Database Schema

### PointLedger (CRITICAL - Audit Trail)

**This is the source of truth for all point transactions.** Every point awarded or deducted is recorded here.

**Key Fields**:
- `campaignId`: Points are tied to campaigns, not just waitlists (allows multiple campaigns with different rules)
- `event`: The event that triggered the point award (`SIGNUP`, `REFERRAL_CONFIRMED`, etc.)
- `points`: Points awarded (can be negative for penalties)
- `referenceId`: Optional reference to related record (referralId, etc.)
- `metadata`: Additional context for debugging/analytics

**Why this is critical**:
- **Audit trail**: Can see exactly when and why points were awarded
- **Recalculation**: If rules change, can recalculate points from ledger
- **Debugging**: Can trace point discrepancies
- **Analytics**: Can analyze point distribution patterns

### ReferralCampaign

One active campaign per waitlist. Campaign settings are stored as JSON for maximum flexibility:

```typescript
{
  referralsEnabled: boolean
  leaderboardEnabled: boolean
  maxWinners: number
  scoringMode: "POINTS" | "REFERRALS_ONLY"
  snapshotLeaderboard: boolean
  allowSelfReferrals: boolean
  requireEmailVerification: boolean
  tieBreaker: "EARLIEST_SIGNUP"
}
```

**Design Decision**: JSON settings allow adding new features without schema migrations, similar to how Stripe stores metadata.

### PointRule

Flexible scoring system where each rule defines: "When event X happens, award Y points"

**Supported Events**:
- `SIGNUP`: When subscriber joins waitlist
- `REFERRAL_CONFIRMED`: When a referral joins
- `EMAIL_VERIFIED`: When subscriber verifies email
- `MILESTONE`: Milestone bonus (triggered by conditions, not as separate event)
- `MANUAL`: Admin manual adjustments

**Important**: Milestones are **conditions**, not events. The event is still `REFERRAL_CONFIRMED`, but the condition checks if it's the 5th referral, etc.

**Example PointRule for milestone**:
```json
{
  "event": "REFERRAL_CONFIRMED",
  "points": 50,
  "conditions": {
    "referralCount": { "equals": 5 }
  }
}
```

**Conditional Rules**: Rules can have conditions:
- `referralCount: { equals: 5 }` - Exactly 5 referrals (milestone)
- `referralCount: { gte: 10 }` - 10 or more referrals
- `firstReferralOnly: true` - Shorthand for first referral
- `minScore: 100` - Minimum score required

**Design Decision**: This matches ViralLoops' approach of configurable point values per action.

### Reward

Rewards belong to a campaign and support multiple distribution rules:

- **TOP_N**: First N subscribers by rank
- **MIN_SCORE**: All subscribers with score >= threshold
- **MIN_REFERRALS**: All subscribers with referral count >= threshold
- **MANUAL**: Admin manually assigns

**Reward Types**:
- `FEATURE`: Feature flags, access levels
- `ACCESS`: Premium access, early access
- `DIGITAL`: Coupon codes, discounts
- `CUSTOM`: Custom rewards with description

**Design Decision**: Flexible payload (JSON) allows any reward type without schema changes.

### SubscriberReward

Join table tracking which subscribers have earned/claimed which rewards. Status lifecycle: `LOCKED` → `EARNED` → `DELIVERED`.

## Service Architecture

### 1. Referral Flow Service (`lib/services/referral-flow.ts`)

**Responsibilities**:
- Validates referral codes
- Prevents self-referrals and duplicate referrals
- Assigns `referredBy` relationships
- Triggers scoring rules
- Updates leaderboard positions
- Checks reward unlocks

**Key Functions**:
- `processReferral()`: Main function that processes a referral when subscriber joins
- `validateReferralCode()`: Validates referral code without processing

**Design Decisions**:
- All operations wrapped in transaction for atomicity
- Idempotent: duplicate referrals are detected and ignored
- Prevents self-referrals at database level
- Validates referrer belongs to same waitlist (security)

### 2. Scoring System Service (`lib/services/scoring.ts`)

**Responsibilities**:
- Evaluates active PointRules for events
- Awards points and records in PointLedger
- Updates subscriber's total score
- Supports conditional rules (milestones, first-referral bonuses)

**Key Functions**:
- `evaluatePointRules()`: Evaluates and applies point rules for an event
- `manualPointAdjustment()`: Admin manual point adjustments
- `getSubscriberPointHistory()`: Get point history for a subscriber

**Design Decisions**:
- Rules are evaluated in priority order (lower priority = evaluated first)
- Conditions are evaluated against subscriber's current stats
- Points are recorded in PointLedger for audit trail
- Score is updated atomically with ledger entry

### 3. Leaderboard Service (`lib/services/leaderboard.ts`)

**Responsibilities**:
- Calculates real-time positions based on score
- Supports tie-breaking (earlier signup wins)
- Creates snapshots for final rankings
- Optimizes queries with indexed lookups

**Key Functions**:
- `updateLeaderboardPosition()`: Updates a subscriber's position
- `getLeaderboard()`: Gets ranked list of subscribers
- `createLeaderboardSnapshot()`: Creates materialized snapshot
- `getTopSubscribers()`: Optimized query for top N

**Design Decisions**:
- **Score is source of truth**: Position is calculated from score
- **Position is best-effort cache**: Cached in `Subscriber.position` field, updated when score changes
- **Eventually consistent**: Position may be slightly stale during high concurrency
- Tie-breaker: earlier signup wins (matches KickoffLabs)
- Snapshots are materialized and immutable
- Uses indexed queries (`waitlistId + score`) for performance

**Position Caching Strategy**:
- Position is recalculated and cached when:
  - Score changes (via `updateLeaderboardPosition()`)
  - Manual recalculation requested
- Position is read from cache when available (fast)
- Can be recalculated in batch jobs for accuracy
- For very large waitlists, consider periodic background jobs to recalculate all positions

**Performance Considerations**:
- For 100k+ subscribers:
  - Position caching allows fast reads without recalculating every time
  - Periodic background jobs can recalculate all positions for accuracy
  - Redis caching for top N positions (optional)
  - Materialized views for historical snapshots

### 4. Reward Resolution Engine (`lib/services/reward-resolution.ts`)

**Responsibilities**:
- Evaluates reward distribution rules
- Assigns rewards to eligible subscribers
- Prevents duplicate rewards
- Supports idempotent re-runs

**Key Functions**:
- `evaluateRewardUnlocks()`: Evaluates if subscriber unlocked rewards
- `resolveAllRewards()`: Resolves all rewards for a campaign
- `getSubscriberRewards()`: Get all rewards for a subscriber
- `markRewardDelivered()`: Mark reward as delivered/claimed

**Design Decisions**:
- Rewards are evaluated after each scoring event
- Idempotent: re-running won't create duplicates
- Supports max recipients per reward
- Status tracking for reward lifecycle

## Integration Points

### Join Waitlist Flow

The `join-waitlist.ts` action integrates with the referral system:

1. Creates subscriber
2. Processes referral (if referral code exists)
3. Evaluates signup points (if rules configured)
4. Calculates position

**Design Decision**: Referral processing failures don't fail the join (graceful degradation).

## Scalability Considerations

### Database Indexes

Critical indexes for performance:
- `Subscriber(waitlistId, score)`: For leaderboard queries
- `ReferralCampaign(waitlistId, status)`: For finding active campaign
- `PointRule(waitlistId, event, isActive)`: For rule evaluation
- `SubscriberReward(subscriberId, rewardId)`: Unique constraint prevents duplicates

### Query Optimization

- Leaderboard queries use indexed `score` field
- Position calculation uses `count()` with indexed fields
- Snapshots materialize rankings for historical queries

### Concurrency Safety

- All operations use Prisma transactions
- Unique constraints prevent duplicate referrals
- Idempotent operations safe to retry

## Tradeoffs & Decisions

1. **Position Caching**: Position is cached in `Subscriber.position` field and updated when score changes. This is best-effort and eventually consistent (tradeoff: faster reads, may be slightly stale during high concurrency). Can be recalculated in batch jobs for accuracy.

2. **PointLedger with campaignId**: Points are tied to campaigns, not just waitlists. This allows multiple campaigns with different rules and proper audit trail per campaign (tradeoff: requires campaignId in all point operations, but enables proper tracking).

3. **Milestones as Conditions**: Milestones are conditions on `REFERRAL_CONFIRMED` events, not separate events. This keeps the event model clean and allows flexible milestone definitions (tradeoff: requires condition evaluation, but more flexible than separate events).

4. **JSON Settings**: Campaign settings stored as JSON for flexibility. Tradeoff: No type safety, but allows rapid feature iteration without migrations.

5. **Real-time vs Snapshot**: Real-time leaderboard for active campaigns, snapshots for final rankings. Tradeoff: Real-time is more accurate but slower, snapshots are faster but static.

6. **Point Rule Evaluation**: Rules evaluated synchronously during referral processing. For high-volume, consider background job queue (tradeoff: immediate vs eventual consistency).

## Future Enhancements

1. **Background Jobs**: Move point evaluation and reward resolution to background jobs for high-volume scenarios
2. **Redis Caching**: Cache leaderboard positions for very large waitlists
3. **Materialized Views**: Pre-compute leaderboard for faster queries
4. **Analytics**: Track referral sources, conversion rates, etc.
5. **A/B Testing**: Support multiple campaigns with different rules

## Testing Recommendations

1. **Unit Tests**: Test each service function in isolation
2. **Integration Tests**: Test referral flow end-to-end
3. **Concurrency Tests**: Test race conditions (duplicate referrals, concurrent score updates)
4. **Performance Tests**: Test leaderboard queries with large datasets

## Migration Guide

When deploying this system:

1. Run Prisma migrations to add new models
2. Create default PointRules for common events (e.g., +10 for referral)
3. Create ReferralCampaign for existing waitlists (optional, referrals disabled by default)
4. Backfill scores for existing subscribers if needed

## References

- **KickoffLabs**: Flexible campaign configuration, real-time + snapshot leaderboards
- **ViralLoops**: Rules-based scoring, tier-based rewards
- **Prefinery**: Referral tracking, reward distribution
- **Stripe**: JSON metadata for extensibility

