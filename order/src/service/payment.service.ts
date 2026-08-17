/* ============================================================================
 * SERVICE — Stripe payments
 * ============================================================================
 * The only file that talks to Stripe. Routes never import `stripe` directly,
 * so swapping the provider (or stubbing it in tests) touches one file.
 * ========================================================================== */

import Stripe from "stripe";
import { config } from "../config";
import { OrderWithItems } from "./order.service";

// Lazily constructed so the service still boots without Stripe keys (tests,
// read-only deployments). Throws only when a payment is actually attempted.
let client: Stripe | null = null;

export const stripe = (): Stripe => {
  if (!config.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY must be defined to take payments");
  }
  if (!client) {
    client = new Stripe(config.STRIPE_SECRET_KEY);
  }
  return client;
};

/**
 * Creates (or reuses) the PaymentIntent for an order and returns the
 * client_secret the frontend needs to confirm the card.
 * Amount comes from order.totalAmount — NEVER from the request body.
 */
export const createPaymentIntent = async (
  order: OrderWithItems,
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
  // TODO: if order.stripePaymentIntentId exists, retrieve and reuse it instead
  //       of creating a second intent for the same order
  // TODO: stripe().paymentIntents.create({ amount, currency, metadata: { orderId, userId } })
  // TODO: persist the intent id + set status "awaiting_payment" on the order
  throw new Error("createPaymentIntent not implemented");
};

/**
 * Verifies the Stripe signature against the RAW body and returns the parsed
 * event. Rejecting unverified payloads is what stops anyone from POSTing a
 * fake "payment succeeded" to the webhook.
 */
export const verifyWebhook = (rawBody: Buffer, signature: string): Stripe.Event => {
  // TODO: stripe().webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET)
  throw new Error("verifyWebhook not implemented");
};
