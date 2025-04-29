# Stage 1: Build the Go binary
FROM golang:1.22.1 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy go.mod and go.sum for dependency caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod tidy

# Copy the Go source files
COPY . .

# Build the Go application
RUN go build -o /app/review/cmd/main /app/cmd/main.go

# Stage 2: Create a minimal image to run the application
FROM golang:1.22.1

# Set the working directory inside the container
WORKDIR /app

# Copy the built binary from the builder stage
COPY --from=builder /app/review/cmd/main /app/review/cmd/main

# Expose port 4000
EXPOSE 4000

# Set the command to run the app
CMD ["/app/review/cmd/main"]
