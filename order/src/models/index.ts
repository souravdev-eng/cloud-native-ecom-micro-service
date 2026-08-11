/* ============================================================================
 * MODELS BARREL — the aggregated schema
 * ============================================================================
 * Re-exports every table/enum/type from the split model files as ONE module.
 * Drizzle reads this two ways:
 *   1. drizzle-kit  → `schema: "./src/models/index.ts"` in drizzle.config.ts,
 *                     diffs it against the last snapshot to GENERATE migrations.
 *   2. drizzle-orm  → `import * as schema from "../models"` for typed queries
 *                     and to feed defineRelations() (see models/relations.ts).
 * Add a new model file, then export it here so both pick it up.
 * ========================================================================== */

export * from "./product";
export * from "./order";
export * from "./orderItem";
