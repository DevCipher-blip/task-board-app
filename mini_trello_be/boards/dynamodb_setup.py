"""Create the local demo table when missing; leave existing cards intact."""
import boto3

def ensure_card_table(resource=None):
    if resource is None:
        resource = boto3.resource('dynamodb', endpoint_url='http://dynamodb:8000', region_name='us-west-2', aws_access_key_id='dummy', aws_secret_access_key='dummy')
    table = resource.Table('Card')
    try:
        table.load()
        return table
    except resource.meta.client.exceptions.ResourceNotFoundException:
        table = resource.create_table(TableName='Card', KeySchema=[{'AttributeName':'id','KeyType':'HASH'}], AttributeDefinitions=[{'AttributeName':'id','AttributeType':'S'}], ProvisionedThroughput={'ReadCapacityUnits':10,'WriteCapacityUnits':10})
        table.wait_until_exists()
        return table

if __name__ == '__main__':
    ensure_card_table()
    print('Local Card table is ready.')
