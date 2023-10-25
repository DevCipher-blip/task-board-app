import boto3
from botocore.client import Config

# Setup boto3 to use DynamoDB local
boto3.setup_default_session(
    aws_access_key_id='dummy',
    aws_secret_access_key='dummy',
    region_name='us-west-2'
)
dynamodb = boto3.resource('dynamodb', endpoint_url='http://dynamodb:8000', config=Config(signature_version='s3v4'))

# Create the Card table
card_table = dynamodb.create_table(
    TableName='Card',
    KeySchema=[
        {
            'AttributeName': 'id',
            'KeyType': 'HASH'
        }
    ],
    AttributeDefinitions=[
        {
            'AttributeName': 'id',
            'AttributeType': 'S'
        },
    ],
    ProvisionedThroughput={
        'ReadCapacityUnits': 10,
        'WriteCapacityUnits': 10
    }
)

# Wait for the table to be created
card_table.meta.client.get_waiter('table_exists').wait(TableName='Card')

print("Card table has been created.")
