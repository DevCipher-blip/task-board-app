import unittest
import boto3
from botocore.stub import Stubber
from boards.dynamodb_setup import ensure_card_table
class TableSetupTests(unittest.TestCase):
    def resource(self):return boto3.resource('dynamodb',endpoint_url='http://localhost:8000',region_name='us-west-2',aws_access_key_id='dummy',aws_secret_access_key='dummy')
    def test_existing_table_is_not_recreated(self):
        resource=self.resource()
        with Stubber(resource.meta.client) as stub:
            stub.add_response('describe_table',{'Table':{'TableName':'Card','TableStatus':'ACTIVE'}},{'TableName':'Card'})
            self.assertEqual(ensure_card_table(resource).name,'Card');stub.assert_no_pending_responses()
    def test_missing_table_is_created_then_waited_for(self):
        resource=self.resource()
        with Stubber(resource.meta.client) as stub:
            stub.add_client_error('describe_table',service_error_code='ResourceNotFoundException',expected_params={'TableName':'Card'})
            stub.add_response('create_table',{'TableDescription':{'TableName':'Card','TableStatus':'CREATING'}},{'TableName':'Card','KeySchema':[{'AttributeName':'id','KeyType':'HASH'}],'AttributeDefinitions':[{'AttributeName':'id','AttributeType':'S'}],'ProvisionedThroughput':{'ReadCapacityUnits':10,'WriteCapacityUnits':10}})
            stub.add_response('describe_table',{'Table':{'TableName':'Card','TableStatus':'ACTIVE'}},{'TableName':'Card'})
            self.assertEqual(ensure_card_table(resource).name,'Card');stub.assert_no_pending_responses()
