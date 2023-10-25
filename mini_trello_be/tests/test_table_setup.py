from unittest import TestCase, mock

import boto3
from botocore.exceptions import EndpointConnectionError
from botocore.stub import Stubber

from boards.dynamodb_setup import ensure_card_table, wait_for_table


def stubbed_table():
    resource = boto3.resource(
        "dynamodb",
        endpoint_url="http://localhost:8000",
        region_name="us-west-2",
        aws_access_key_id="dummy",
        aws_secret_access_key="dummy",
    )
    return resource.Table("Card")


class TableSetupTests(TestCase):
    def test_existing_table_is_not_recreated(self):
        table = stubbed_table()
        with Stubber(table.meta.client) as stub:
            stub.add_response(
                "describe_table", {"Table": {"TableName": "Card", "TableStatus": "ACTIVE"}}, {"TableName": "Card"}
            )
            self.assertEqual(ensure_card_table(table).name, "Card")
            stub.assert_no_pending_responses()

    def test_missing_table_is_created_then_waited_for(self):
        table = stubbed_table()
        with Stubber(table.meta.client) as stub:
            stub.add_client_error(
                "describe_table", service_error_code="ResourceNotFoundException", expected_params={"TableName": "Card"}
            )
            stub.add_response("create_table", {"TableDescription": {"TableName": "Card", "TableStatus": "CREATING"}})
            stub.add_response(
                "describe_table", {"Table": {"TableName": "Card", "TableStatus": "ACTIVE"}}, {"TableName": "Card"}
            )
            self.assertEqual(ensure_card_table(table).name, "Card")
            stub.assert_no_pending_responses()

    def test_waits_for_dynamodb_to_accept_connections(self):
        table = mock.Mock()
        offline = EndpointConnectionError(endpoint_url="http://dynamodb:8000")
        with mock.patch("boards.dynamodb_setup.ensure_card_table", side_effect=[offline, offline, table]) as ensure:
            self.assertIs(wait_for_table(table, delay=0), table)
        self.assertEqual(ensure.call_count, 3)

    def test_gives_up_after_the_last_attempt(self):
        offline = EndpointConnectionError(endpoint_url="http://dynamodb:8000")
        with mock.patch("boards.dynamodb_setup.ensure_card_table", side_effect=offline):
            with self.assertRaises(EndpointConnectionError):
                wait_for_table(mock.Mock(), attempts=2, delay=0)
