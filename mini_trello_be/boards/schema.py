import graphene
from graphql import GraphQLError

from .models import STATUSES, Card

MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 2000


class CardType(graphene.ObjectType):
    id = graphene.String()
    title = graphene.String()
    description = graphene.String()
    status = graphene.String()
    position = graphene.Float()


def clean_title(title):
    title = title.strip()
    if not title:
        raise GraphQLError("A card needs a title")
    if len(title) > MAX_TITLE_LENGTH:
        raise GraphQLError(f"Titles are limited to {MAX_TITLE_LENGTH} characters")
    return title


def check_description(description):
    if description is not None and len(description) > MAX_DESCRIPTION_LENGTH:
        raise GraphQLError(f"Descriptions are limited to {MAX_DESCRIPTION_LENGTH} characters")
    return description


def check_status(status):
    if status not in STATUSES:
        raise GraphQLError(f"Status must be one of: {', '.join(STATUSES)}")
    return status


def to_card_type(item):
    return CardType(
        id=item["id"],
        title=item["title"],
        description=item.get("description", ""),
        status=item["status"],
        position=float(item.get("position", 0)),
    )


class Query(graphene.ObjectType):
    all_cards = graphene.List(graphene.NonNull(CardType), required=True)
    card = graphene.Field(CardType, id=graphene.ID(required=True))

    def resolve_all_cards(self, info):
        return [to_card_type(item) for item in Card.get_all()]

    def resolve_card(self, info, id):
        item = Card.get(id)
        return to_card_type(item) if item else None


class CreateCard(graphene.Mutation):
    class Arguments:
        title = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()

    card = graphene.Field(CardType)

    def mutate(self, info, title, description=None, status="todo"):
        item = Card.create(clean_title(title), check_description(description), check_status(status))
        return CreateCard(card=to_card_type(item))


class UpdateCard(graphene.Mutation):
    """Edit text fields. A new status appends the card to that lane; use
    moveCard to choose the slot."""

    class Arguments:
        card_id = graphene.String(required=True)
        title = graphene.String()
        description = graphene.String()
        status = graphene.String()

    card = graphene.Field(CardType)

    def mutate(self, info, card_id, title=None, description=None, status=None):
        fields = {}
        if title is not None:
            fields["title"] = clean_title(title)
        if description is not None:
            fields["description"] = check_description(description)
        if status is not None:
            check_status(status)
        elif not fields:
            raise GraphQLError("Provide a title, description or status to update")

        item = Card.get(card_id)
        if item is None:
            raise GraphQLError("Card not found")
        if status is not None and status != item["status"]:
            item = Card.move(card_id, status, len(Card.lane(status)))
        if fields:
            item = Card.update(card_id, **fields)
        if item is None:
            raise GraphQLError("Card not found")
        return UpdateCard(card=to_card_type(item))


class MoveCard(graphene.Mutation):
    """Move a card to a lane and a slot within it; index 0 is the top."""

    class Arguments:
        card_id = graphene.String(required=True)
        status = graphene.String(required=True)
        index = graphene.Int(required=True)

    card = graphene.Field(CardType)

    def mutate(self, info, card_id, status, index):
        if index < 0:
            raise GraphQLError("Index must not be negative")
        item = Card.move(card_id, check_status(status), index)
        if item is None:
            raise GraphQLError("Card not found")
        return MoveCard(card=to_card_type(item))


class DeleteCard(graphene.Mutation):
    class Arguments:
        card_id = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, card_id):
        return DeleteCard(success=Card.delete(card_id))


class Mutation(graphene.ObjectType):
    create_card = CreateCard.Field()
    update_card = UpdateCard.Field()
    move_card = MoveCard.Field()
    delete_card = DeleteCard.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
