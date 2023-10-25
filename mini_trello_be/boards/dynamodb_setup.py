"""Create the card table when it is missing; leave existing cards intact.

Run before the API starts. DynamoDB Local can take a few seconds to accept
connections, so the first call is retried.
"""

import os
import time

import django
from botocore.exceptions import EndpointConnectionError

TABLE_SPEC = {
    "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
    "AttributeDefinitions": [{"AttributeName": "id", "AttributeType": "S"}],
    "BillingMode": "PAY_PER_REQUEST",
}


def ensure_card_table(table):
    try:
        table.load()
    except table.meta.client.exceptions.ResourceNotFoundException:
        table.meta.client.create_table(TableName=table.name, **TABLE_SPEC)
        table.wait_until_exists()
    return table


def wait_for_table(table, attempts=30, delay=1.0):
    for attempt in range(1, attempts + 1):
        try:
            return ensure_card_table(table)
        except EndpointConnectionError:
            if attempt == attempts:
                raise
            time.sleep(delay)


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mini_trello_be.settings")
    django.setup()
    from boards.models import card_table

    print(f"Card table '{wait_for_table(card_table()).name}' is ready.")
