import graphene
from .models import Card

# Define the GraphQL type for Card
class CardType(graphene.ObjectType):
    id = graphene.String()
    title = graphene.String()
    description = graphene.String()
    status = graphene.String()

# Query
class Query(graphene.ObjectType):
    all_cards = graphene.List(CardType)
    card = graphene.Field(CardType, id=graphene.ID(required=True))

    def resolve_all_cards(self, info):
        items = Card.get_all()
        cards = [CardType(id=item['id'], title=item['title'], description=item['description'], status=item['status']) for item in items]
        return cards
      
    def resolve_card(self, info, id):
        item = Card.get(id)
        return CardType(id=item['id'], title=item['title'], description=item['description'], status=item['status'])

# Mutations
class CreateCard(graphene.Mutation):
    class Arguments:
        title = graphene.String(required=True)
        description = graphene.String()
        status = graphene.String()

    card = graphene.Field(CardType)

    def mutate(self, info, title, description=None, status='todo'):
        card_id = Card.create(title, description, status)
        card = Card.get(card_id)
        return CreateCard(card=card)

class UpdateCard(graphene.Mutation):
    class Arguments:
        card_id = graphene.String(required=True)
        title = graphene.String()
        description = graphene.String()
        status = graphene.String()

    card = graphene.Field(CardType)

    def mutate(self, info, card_id, title=None, description=None, status=None):
        updated_attributes = Card.update(card_id, title, description, status)
        # Convert the updated attributes to a CardType instance
        card = CardType(id=updated_attributes['id'], title=updated_attributes['title'], description=updated_attributes['description'], status=updated_attributes['status'])
        return UpdateCard(card=card)

class DeleteCard(graphene.Mutation):
    class Arguments:
        card_id = graphene.String(required=True)

    success = graphene.Boolean()

    def mutate(self, info, card_id):
        Card.delete(card_id)
        return DeleteCard(success=True)

# The Mutation class will hold all our mutations
class Mutation(graphene.ObjectType):
    create_card = CreateCard.Field()
    update_card = UpdateCard.Field()
    delete_card = DeleteCard.Field()

# Finally, we create the schema
schema = graphene.Schema(query=Query, mutation=Mutation)
