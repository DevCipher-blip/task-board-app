from boards.schema import schema

from .support import DynamoTestCase


def run(query, **variables):
    return schema.execute(query, variable_values=variables)


CREATE = "mutation($title: String!, $status: String) { createCard(title: $title, status: $status) { card { id title status } } }"


class SchemaTests(DynamoTestCase):
    def create(self, title, status="todo"):
        result = run(CREATE, title=title, status=status)
        self.assertIsNone(result.errors)
        return result.data["createCard"]["card"]

    def test_missing_card_is_null_instead_of_a_server_error(self):
        result = run('{ card(id: "missing") { id } }')
        self.assertIsNone(result.errors)
        self.assertIsNone(result.data["card"])

    def test_create_trims_the_title(self):
        self.assertEqual(self.create("  Write release notes  ")["title"], "Write release notes")

    def test_invalid_input_never_reaches_storage(self):
        for title, status in (("   ", "todo"), ("Valid", "hidden"), ("x" * 201, "todo")):
            with self.subTest(title=title[:10], status=status):
                self.assertTrue(run(CREATE, title=title, status=status).errors)
        self.assertEqual(run("{ allCards { id } }").data["allCards"], [])

    def test_update_can_clear_a_description(self):
        card = self.create("Example")
        run('mutation($id: String!) { updateCard(cardId: $id, description: "Draft") { card { id } } }', id=card["id"])
        result = run(
            'mutation($id: String!) { updateCard(cardId: $id, description: "") { card { description title } } }',
            id=card["id"],
        )
        self.assertIsNone(result.errors)
        self.assertEqual(result.data["updateCard"]["card"], {"description": "", "title": "Example"})

    def test_update_rejects_blank_titles_and_unknown_cards(self):
        card = self.create("Example")
        blank = run('mutation($id: String!) { updateCard(cardId: $id, title: " ") { card { id } } }', id=card["id"])
        self.assertIn("title", blank.errors[0].message)
        missing = run('mutation { updateCard(cardId: "missing", title: "Ghost") { card { id } } }')
        self.assertEqual(missing.errors[0].message, "Card not found")

    def test_update_with_a_new_status_appends_to_that_lane(self):
        first = self.create("Already done", "done")
        card = self.create("Example")
        result = run(
            'mutation($id: String!) { updateCard(cardId: $id, status: "done") { card { status position } } }',
            id=card["id"],
        )
        self.assertIsNone(result.errors)
        board = run("{ allCards { id } }").data["allCards"]
        self.assertEqual([c["id"] for c in board], [first["id"], card["id"]])

    def test_move_card_reorders_the_board(self):
        first = self.create("First")
        second = self.create("Second")
        result = run(
            'mutation($id: String!) { moveCard(cardId: $id, status: "in-progress", index: 0) { card { status } } }',
            id=second["id"],
        )
        self.assertEqual(result.data["moveCard"]["card"]["status"], "in-progress")
        board = run("{ allCards { id status } }").data["allCards"]
        self.assertEqual(board, [{"id": first["id"], "status": "todo"}, {"id": second["id"], "status": "in-progress"}])

    def test_move_validates_status_index_and_card(self):
        card = self.create("Example")
        for status, index, card_id in (("hidden", 0, card["id"]), ("done", -1, card["id"]), ("done", 0, "missing")):
            with self.subTest(status=status, index=index, card_id=card_id):
                result = run(
                    "mutation($id: String!, $status: String!, $index: Int!) { moveCard(cardId: $id, status: $status, index: $index) { card { id } } }",
                    id=card_id,
                    status=status,
                    index=index,
                )
                self.assertTrue(result.errors)

    def test_delete_reports_unknown_cards(self):
        card = self.create("Example")
        query = "mutation($id: String!) { deleteCard(cardId: $id) { success } }"
        self.assertTrue(run(query, id=card["id"]).data["deleteCard"]["success"])
        self.assertFalse(run(query, id=card["id"]).data["deleteCard"]["success"])
