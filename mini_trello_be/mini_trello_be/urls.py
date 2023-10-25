from django.conf import settings
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_django.views import GraphQLView

# The API has no cookie or session auth, so CSRF tokens would protect nothing;
# CORS_ALLOWED_ORIGINS decides which browser origins may read responses.
urlpatterns = [
    path("graphql", csrf_exempt(GraphQLView.as_view(graphiql=settings.DEBUG))),
]
