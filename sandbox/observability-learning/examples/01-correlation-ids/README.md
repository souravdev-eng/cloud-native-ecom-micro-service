# Module 01: Correlation IDs

This module demonstrates how to track requests across service boundaries using Correlation IDs and Node.js `AsyncLocalStorage`.

## Concepts Covered
- **Correlation ID (Request ID)**: A unique identifier for a single request.
- **AsyncLocalStorage**: A Node.js API to store data that persists across asynchronous calls within a single execution context.
- **Middleware**: Automatically extracting or generating the ID for every incoming request.
- **Propagation**: Passing the ID to downstream services.

## How to Run

1.  **Install dependencies**:
    ```bash
    cd sandbox/observability-learning/examples
    npm install
    ```

2.  **Start the server**:
    ```bash
    npm run 01
    ```

3.  **Test with CURL**:
    Open a new terminal and run:
    ```bash
    # Without custom ID (one will be generated)
    curl -i http://localhost:4000/order

    # With a custom ID
    curl -i -H "x-correlation-id: my-trace-123" http://localhost:4000/order
    ```

## Expected Output
In the server logs, you will see the `correlationId` field automatically included in every log message, even though we didn't manually pass it to the `logger.info()` calls.

```text
[2026-01-07 10:00:00] INFO: Creating a new order...
    correlationId: "my-trace-123"
[2026-01-07 10:00:00] INFO: Calling payment service...
    correlationId: "my-trace-123"
[2026-01-07 10:00:01] INFO: Payment processed successfully
    correlationId: "my-trace-123"
```

