#!/bin/bash
# Docker full cleanup — reclaims max disk space
# Usage: ./scripts/docker-cleanup.sh

set -e

echo "=== Docker Disk Usage (before) ==="
docker system df

echo ""
echo "=== Cleaning up... ==="

# Stop & remove all stopped containers
docker container prune -f

# Remove all unused images (not just dangling)
docker image prune -a -f

# Remove all unused volumes
docker volume prune -a -f

# Remove all unused networks
docker network prune -f

# Remove all build cache
docker builder prune -a -f

echo ""
echo "=== Docker Disk Usage (after) ==="
docker system df

echo ""
echo "Done! Run 'docker system df -v' for detailed breakdown."
