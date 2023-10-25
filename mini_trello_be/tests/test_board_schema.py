import unittest
from unittest.mock import patch
from boards.schema import schema
class SchemaTests(unittest.TestCase):
    def test_missing_card_is_null_instead_of_a_server_error(self):
        with patch("boards.schema.Card.get",return_value=None):
            result=schema.execute('{ card(id:"synthetic") { id title } }')
        self.assertIsNone(result.errors);self.assertIsNone(result.data["card"])
    def test_invalid_status_never_reaches_storage(self):
        with patch("boards.schema.Card.create") as create:
            result=schema.execute('mutation { createCard(title:"Synthetic",status:"hidden") { card { id } } }')
        self.assertTrue(result.errors);create.assert_not_called()
    def test_update_can_clear_a_description(self):
        card={"id":"synthetic","title":"Example","description":"","status":"todo"}
        with patch("boards.schema.Card.update",return_value=card) as update:
            result=schema.execute('mutation { updateCard(cardId:"synthetic",description:"") { card { description } } }')
        self.assertIsNone(result.errors);self.assertEqual(result.data["updateCard"]["card"]["description"],"")
        self.assertEqual(update.call_args.args,("synthetic",None,"",None))
