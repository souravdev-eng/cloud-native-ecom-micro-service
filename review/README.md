## 📁 Project Structure

```text
my-rest-api/
│
├── cmd/                    # Main application entry point
│   └── main.go
│
├── internal/               # Private application code
│   ├── handler/            # HTTP handlers (controllers)
│   ├── service/            # Business logic layer
│   ├── repository/         # Data access layer (e.g., DB operations)
│   ├── model/              # Data models and request/response structs
│   ├── middleware/         # Custom middleware (auth, logging, etc.)
│   ├── config/             # App configuration and environment loading
│   └── router/             # Router and routes setup
│
├── pkg/                    # Shared packages/utilities (e.g., logger, helpers)
│
├── migrations/             # Database migration files
│
├── .env                    # Environment variables file
├── go.mod                  # Go module file
├── go.sum                  # Go dependencies checksum
└── README.md               # Project documentation
```

### 🔍 Folder Descriptions

-   **`cmd/main.go`**: Application entry point with `main.go` to start the server.
-   **`internal/handler`**: Contains route handlers that process HTTP requests and responses.
-   **`internal/service`**: Encapsulates core business logic, decoupled from HTTP and DB layers.
-   **`internal/repository`**: Handles database operations (CRUD), working with models.
-   **`internal/model`**: Defines database models and API data structures.
-   **`internal/middleware`**: Custom middleware functions for request/response processing.
-   **`internal/config`**: Loads and manages application configuration and environment variables.
-   **`internal/router`**: Sets up routes and attaches middleware.
-   **`pkg`**: Optional folder for shared utilities that can be reused across the project or others.
-   **`migrations`**: SQL or schema migration files for DB versioning.
-   **`.env`**: Environment-specific variables (e.g., DB URL, port).
-   **`go.mod/go.sum`**: Dependency management for Go modules.
