"""DynamoDB-backed card storage.

Cards are not Django models: they live in a single DynamoDB table keyed by
``id``. Each card carries a ``position`` number that orders it within its
lane, so drag-and-drop order survives a reload.
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal
from functools import lru_cache

import boto3
from botocore.exceptions import ClientError
from django.conf import settings

STATUSES = ("todo", "in-progress", "done")
POSITION_STEP = Decimal(1024)
# Below this gap two neighbours are too close to fit a midpoint, so the lane
# is renumbered instead.
MIN_POSITION_GAP = Decimal("0.000001")


@lru_cache(maxsize=1)
def card_table():
    resource = boto3.resource(
        "dynamodb",
        endpoint_url=settings.DYNAMODB_ENDPOINT_URL or None,
        region_name=settings.AWS_REGION,
    )
    return resource.Table(settings.DYNAMODB_TABLE)


def _position(item):
    # Cards saved before ordering existed have no position; they sort first.
    return item.get("position", Decimal(0))


def _sort_key(item):
    return (_position(item), item.get("created_at", ""))


class Card:
    @staticmethod
    def create(title, description, status="todo"):
        lane = Card.lane(status)
        position = (_position(lane[-1]) if lane else 0) + POSITION_STEP
        item = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description or "",
            "status": status,
            "position": position,
            "created_at": datetime.now(UTC).isoformat(),
        }
        card_table().put_item(Item=item)
        return item

    @staticmethod
    def get(card_id):
        return card_table().get_item(Key={"id": card_id}).get("Item")

    @staticmethod
    def get_all():
        """Every card, lane by lane, in board order.

        A scan returns at most 1 MB per call, so follow LastEvaluatedKey until
        the table is exhausted.
        """
        table = card_table()
        response = table.scan()
        items = response.get("Items", [])
        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
        lane_order = {status: index for index, status in enumerate(STATUSES)}
        return sorted(items, key=lambda item: (lane_order.get(item.get("status"), len(STATUSES)), *_sort_key(item)))

    @staticmethod
    def lane(status, exclude_id=None):
        return [card for card in Card.get_all() if card.get("status") == status and card["id"] != exclude_id]

    @staticmethod
    def update(card_id, **fields):
        """Set the given attributes on an existing card; None if it is missing."""
        names = {f"#{name}": name for name in fields}
        values = {f":{name}": value for name, value in fields.items()}
        try:
            response = card_table().update_item(
                Key={"id": card_id},
                UpdateExpression="SET " + ", ".join(f"#{name} = :{name}" for name in fields),
                # Without this condition DynamoDB would upsert a partial card.
                ConditionExpression="attribute_exists(id)",
                ExpressionAttributeNames=names,
                ExpressionAttributeValues=values,
                ReturnValues="ALL_NEW",
            )
        except ClientError as error:
            if error.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return None
            raise
        return response["Attributes"]

    @staticmethod
    def move(card_id, status, index):
        """Place a card at ``index`` in the ``status`` lane (clamped to the lane)."""
        if Card.get(card_id) is None:
            return None
        lane = Card.lane(status, exclude_id=card_id)
        index = max(0, min(index, len(lane)))
        before = _position(lane[index - 1]) if index > 0 else None
        after = _position(lane[index]) if index < len(lane) else None

        if before is None and after is None:
            position = POSITION_STEP
        elif before is None:
            position = after - POSITION_STEP
        elif after is None:
            position = before + POSITION_STEP
        elif after - before > MIN_POSITION_GAP:
            position = (before + after) / 2
        else:
            Card._renumber(lane)
            return Card.move(card_id, status, index)
        return Card.update(card_id, status=status, position=position)

    @staticmethod
    def _renumber(lane):
        for offset, card in enumerate(lane, start=1):
            Card.update(card["id"], position=POSITION_STEP * offset)

    @staticmethod
    def delete(card_id):
        """Delete a card; True if it existed."""
        response = card_table().delete_item(Key={"id": card_id}, ReturnValues="ALL_OLD")
        return "Attributes" in response
