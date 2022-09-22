#!/bin/bash

# Exit if any of the intermediate steps fail
set -e

# Extract "filepath" from the input JSON into FILEPATH shell variable.
eval "$(jq -r '@sh "FILEPATH=\(.filepath)"')"

# Run mimetype on filepath to get the correct mime type.
MIME=$(mimetype --brief $FILEPATH)

# Safely produce a JSON object containing the result value.
jq -n --arg mime "$MIME" '{"mime":$mime}'