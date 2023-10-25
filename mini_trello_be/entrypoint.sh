#!/bin/sh
set -e

python -m boards.dynamodb_setup
exec "$@"
