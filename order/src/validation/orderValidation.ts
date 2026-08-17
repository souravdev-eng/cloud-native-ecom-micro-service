/* ============================================================================
 * VALIDATION CHAINS (express-validator)
 * ============================================================================
 * Each export is an array of middleware that only COLLECTS errors on req.
 * `requestValidation` (from @ecom-micro/common) is what actually throws a 400,
 * so always mount it right after the chain: router.post(path, chain, requestValidation, handler).
 * ========================================================================== */

import { body, param } from "express-validator";

export const createOrderValidation = [
  // The client sends the lines it wants to buy; price/title are NOT trusted
  // from the body — we re-read them from the local products replica.
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("items.*.productId").notEmpty().withMessage("productId is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("quantity must be a positive integer"),
];

export const orderIdValidation = [
  // Orders use uuid PKs, so reject anything that isn't a uuid before hitting Postgres.
  param("id").isUUID().withMessage("A valid order id is required"),
];

export const createPaymentValidation = [
  param("id").isUUID().withMessage("A valid order id is required"),
];
