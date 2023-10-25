#!/bin/bash
set -e

# Run your DynamoDB table setup script
python ./boards/dynamodb_setup.py

# Then execute the CMD from the Dockerfile (e.g., start the Django server)
exec "$@"
