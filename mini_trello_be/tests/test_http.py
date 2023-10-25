from .support import DynamoTestCase


class GraphQLEndpointTests(DynamoTestCase):
    def post(self, query, **headers):
        return self.client.post("/graphql", {"query": query}, content_type="application/json", **headers)

    def test_posts_queries_without_a_csrf_token(self):
        response = self.post("{ allCards { id } }")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"data": {"allCards": []}})

    def test_cors_allows_only_the_configured_frontend(self):
        allowed = self.post("{ allCards { id } }", HTTP_ORIGIN="http://localhost:3000")
        self.assertEqual(allowed["Access-Control-Allow-Origin"], "http://localhost:3000")
        other = self.post("{ allCards { id } }", HTTP_ORIGIN="https://evil.example")
        self.assertNotIn("Access-Control-Allow-Origin", other)

    def test_validation_errors_come_back_as_graphql_errors(self):
        with self.settings(DEBUG=False):
            response = self.post('mutation { createCard(title: " ") { card { id } } }')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["errors"][0]["message"], "A card needs a title")
