#!/bin/bash

# Development Services Management Script
# This script helps you manage individual microservices for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if Docker network exists
check_network() {
    if ! docker network ls | grep -q "cloud-native-ecom-micro-service_ecom-network"; then
        print_color $YELLOW "Docker network will be created automatically by infrastructure services..."
    fi
}

# Function to start infrastructure services
start_infra() {
    print_color $BLUE "Starting infrastructure services..."
    check_network
    docker-compose -f docker-compose.dev.yml up -d
    
    print_color $GREEN "Infrastructure services started!"
    print_color $YELLOW "Services available at:"
    echo "  - MongoDB: localhost:27017 (admin/password123)"
    echo "  - PostgreSQL: localhost:5432 (postgres/password123)"
    echo "  - Redis: localhost:6379 (password: password123)"
    echo "  - RabbitMQ: localhost:5672 (admin/password123)"
    echo "  - RabbitMQ Management: http://localhost:15672"
    echo "  - Elasticsearch: http://localhost:9200"
}

# Function to stop infrastructure services
stop_infra() {
    print_color $BLUE "Stopping infrastructure services..."
    docker-compose -f docker-compose.dev.yml down
    print_color $GREEN "Infrastructure services stopped!"
}

# Function to start a specific service
start_service() {
    local service=$1
    
    if [ ! -f "${service}/docker-compose.dev.yml" ]; then
        print_color $RED "Service '${service}' not found!"
        print_color $YELLOW "Available services: auth, product, cart, order, review, notification"
        exit 1
    fi
    
    print_color $BLUE "Starting ${service} service..."
    check_network
    
    # Ensure infrastructure is running
    if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_color $YELLOW "Infrastructure not running. Starting infrastructure first..."
        start_infra
        sleep 5
    fi
    
    cd "${service}"
    docker-compose -f docker-compose.dev.yml up
    cd ..
    
    # Get service port
    local port
    case $service in
        "auth") port="3001" ;;
        "product") port="3002" ;;
        "cart") port="3003" ;;
        "order") port="3004" ;;
        "review") port="3005" ;;
        "notification") port="3006" ;;
    esac
    
    print_color $GREEN "${service} service started!"
    print_color $YELLOW "Service available at: http://localhost:${port}"
}

# Function to start a specific service in detached mode
start_service_detached() {
    local service=$1
    
    if [ ! -f "${service}/docker-compose.dev.yml" ]; then
        print_color $RED "Service '${service}' not found!"
        print_color $YELLOW "Available services: auth, product, cart, order, review, notification"
        exit 1
    fi
    
    print_color $BLUE "Starting ${service} service in detached mode..."
    check_network
    
    # Ensure infrastructure is running
    if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_color $YELLOW "Infrastructure not running. Starting infrastructure first..."
        start_infra
        sleep 5
    fi
    
    cd "${service}"
    docker-compose -f docker-compose.dev.yml up -d
    cd ..
    
    # Get service port
    local port
    case $service in
        "auth") port="3001" ;;
        "product") port="3002" ;;
        "cart") port="3003" ;;
        "order") port="3004" ;;
        "review") port="3005" ;;
        "notification") port="3006" ;;
    esac
    
    print_color $GREEN "${service} service started in detached mode!"
    print_color $YELLOW "Service available at: http://localhost:${port}"
}

# Function to stop a specific service
stop_service() {
    local service=$1
    
    if [ ! -f "${service}/docker-compose.dev.yml" ]; then
        print_color $RED "Service '${service}' not found!"
        exit 1
    fi
    
    print_color $BLUE "Stopping ${service} service..."
    cd "${service}"
    docker-compose -f docker-compose.dev.yml down
    cd ..
    print_color $GREEN "${service} service stopped!"
}

# Function to show logs for a service
logs_service() {
    local service=$1
    
    if [ ! -f "${service}/docker-compose.dev.yml" ]; then
        print_color $RED "Service '${service}' not found!"
        exit 1
    fi
    
    print_color $BLUE "Showing logs for ${service} service..."
    cd "${service}"
    docker-compose -f docker-compose.dev.yml logs -f
    cd ..
}

# Function to show service status
status() {
    print_color $BLUE "Service Status:"
    echo
    
    # Infrastructure status
    print_color $YELLOW "Infrastructure Services:"
    docker-compose -f docker-compose.dev.yml ps
    echo
    
    # Individual services status
    print_color $YELLOW "Microservices:"
    for service in auth product cart order review notification; do
        if [ -f "${service}/docker-compose.dev.yml" ]; then
            echo "  ${service}:"
            cd "${service}"
            docker-compose -f docker-compose.dev.yml ps
            cd ..
        fi
    done
}

# Function to clean up everything
cleanup() {
    print_color $BLUE "Cleaning up all services..."
    
    for service in auth product cart order review notification; do
        if [ -f "${service}/docker-compose.dev.yml" ]; then
            cd "${service}"
            docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
            cd ..
        fi
    done
    
    docker-compose -f docker-compose.dev.yml down
    
    # Remove volumes (optional)
    read -p "Remove all volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f docker-compose.dev.yml down -v
        print_color $YELLOW "Volumes removed!"
    fi
    
    print_color $GREEN "Cleanup completed!"
}

# Function to show help
show_help() {
    print_color $BLUE "Development Services Management Script"
    echo
    print_color $YELLOW "Usage: $0 [COMMAND] [SERVICE]"
    echo
    print_color $GREEN "Commands:"
    echo "  infra start          Start infrastructure services (MongoDB, PostgreSQL, Redis, RabbitMQ)"
    echo "  infra stop           Stop infrastructure services"
    echo "  start <service>      Start a specific microservice (foreground with logs)"
    echo "  start-d <service>    Start a specific microservice (detached mode)"
    echo "  stop <service>       Stop a specific microservice"
    echo "  logs <service>       Show logs for a specific service"
    echo "  status               Show status of all services"
    echo "  cleanup              Stop all services and optionally remove volumes"
    echo "  help                 Show this help message"
    echo
    print_color $GREEN "Available Services:"
    echo "  auth                 Authentication service (port 3001)"
    echo "  product              Product service (port 3002)"
    echo "  cart                 Cart service (port 3003)"
    echo "  order                Order service (port 3004)"
    echo "  review               Review service (port 3005)"
    echo "  notification         Notification service (port 3006)"
    echo
    print_color $YELLOW "Examples:"
    echo "  $0 infra start       # Start infrastructure"
    echo "  $0 start auth        # Start auth service (foreground with logs)"
    echo "  $0 start-d product   # Start product service (detached mode)"
    echo "  $0 logs product      # Show product service logs"
    echo "  $0 status            # Show all services status"
}

# Main script logic
case "${1:-help}" in
    "infra")
        case "${2:-help}" in
            "start") start_infra ;;
            "stop") stop_infra ;;
            *) show_help ;;
        esac
        ;;
    "start")
        if [ -z "$2" ]; then
            print_color $RED "Please specify a service to start"
            show_help
            exit 1
        fi
        start_service "$2"
        ;;
    "start-d")
        if [ -z "$2" ]; then
            print_color $RED "Please specify a service to start in detached mode"
            show_help
            exit 1
        fi
        start_service_detached "$2"
        ;;
    "stop")
        if [ -z "$2" ]; then
            print_color $RED "Please specify a service to stop"
            show_help
            exit 1
        fi
        stop_service "$2"
        ;;
    "logs")
        if [ -z "$2" ]; then
            print_color $RED "Please specify a service for logs"
            show_help
            exit 1
        fi
        logs_service "$2"
        ;;
    "status")
        status
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        show_help
        ;;
esac
