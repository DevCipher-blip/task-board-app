import os

from django.test import SimpleTestCase, override_settings
from moto import mock_aws

from boards.dynamodb_setup import ensure_card_table
from boards.models import card_table


class DynamoTestCase(SimpleTestCase):
    """Runs each test against an empty in-memory DynamoDB provided by moto."""

    def setUp(self):
        os.environ.update(AWS_ACCESS_KEY_ID="testing", AWS_SECRET_ACCESS_KEY="testing")
        dynamo_settings = override_settings(DYNAMODB_ENDPOINT_URL="", DYNAMODB_TABLE="CardTest", AWS_REGION="us-west-2")
        dynamo_settings.enable()
        self.addCleanup(dynamo_settings.disable)
        aws = mock_aws()
        aws.start()
        self.addCleanup(aws.stop)
        card_table.cache_clear()
        self.addCleanup(card_table.cache_clear)
        self.table = ensure_card_table(card_table())
