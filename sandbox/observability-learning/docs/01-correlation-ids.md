# 01 - Correlation IDs

## The Problem
Imagine a user clicks "Checkout". The request hits the `Order` service, which calls `Product` to check stock, then `Payment` to process the card, and finally `Notification` to send an email.

If the checkout fails, you check the logs. But how do you find the *exact* logs for that specific checkout attempt across 4 different services?

## The Solution: Correlation IDs (or Request IDs)
A Correlation ID is a unique string (usually a UUID) generated at the first entry point of a request. This ID is passed along to every downstream service.

### How it works:
1.  **Frontend/Gateway** generates `X-Correlation-ID: 123-abc`.
2.  **Order Service** receives it, logs it: `[123-abc] Creating order...`.
3.  **Order Service** calls **Product Service** and includes `X-Correlation-ID: 123-abc` in the headers.
4.  **Product Service** receives it, logs it: `[123-abc] Checking stock...`.

## Implementation Patterns

### 1. Generation
If the incoming request doesn't have a correlation ID, the middleware should generate one.

### 2. Propagation
You must ensure the ID is passed in every outgoing HTTP call, gRPC call, or message queue event.

### 3. Context Storage
In Node.js, we use `AsyncLocalStorage` to store the ID for the duration of the request so we don't have to manually pass it to every function.

## What you'll build in this module:
A small Express.js setup with:
- A middleware to extract/generate correlation IDs.
- A logger that automatically includes the ID.
- An example of passing the ID to another service.

