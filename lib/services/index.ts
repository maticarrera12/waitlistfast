/**
 * Referral & Gamification System Services
 * 
 * This module exports all services for the referral and gamification system.
 * 
 * Architecture:
 * - referral-flow: Core referral processing when subscribers join
 * - scoring: Flexible, rules-based point system
 * - leaderboard: Real-time ranking and snapshot management
 * - reward-resolution: Reward evaluation and assignment engine
 * 
 * All services are designed to be:
 * - Transactional (safe under concurrency)
 * - Idempotent (safe to retry)
 * - Decoupled (no UI logic, pure business logic)
 * - Extensible (data-driven configuration)
 */

export * from './referral-flow'
export * from './scoring'
export * from './leaderboard'
export * from './reward-resolution'

