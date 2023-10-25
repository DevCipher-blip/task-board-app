import boto3
from botocore.client import Config
import uuid
from datetime import datetime

# Setup boto3 to use DynamoDB local
boto3.setup_default_session(
    aws_access_key_id='dummy',
    aws_secret_access_key='dummy',
    region_name='us-west-2'
)
dynamodb = boto3.resource('dynamodb', endpoint_url='http://dynamodb:8000', config=Config(signature_version='s3v4'))

card_table = dynamodb.Table('Card')

class Card:
    @staticmethod
    def create(title, description, status = 'todo'):
        card_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        card_table.put_item(
            Item={
                'id': card_id,
                'title': title,
                'description': description,
                'status': status,
                'created_at': created_at
            }
        )
        return card_id

    @staticmethod
    def get(card_id):
        try:
            response = card_table.get_item(Key={'id': card_id})
            return response.get('Item')
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
    
    @staticmethod
    def get_all():
        try:
            response = card_table.scan()
            return response.get('Items', [])
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    @staticmethod
    def update(card_id, title=None, description=None, status=None):
        update_expression = 'SET '
        expression_attribute_values = {}
        expression_attribute_names = {}
        update_expression_elements = []

        if title:
            update_expression_elements.append('#t = :t')
            expression_attribute_values[':t'] = title
            expression_attribute_names['#t'] = 'title'
        if description:
            update_expression_elements.append('#d = :d')
            expression_attribute_values[':d'] = description
            expression_attribute_names['#d'] = 'description'
        if status:
            update_expression_elements.append('#s = :s')
            expression_attribute_values[':s'] = status
            expression_attribute_names['#s'] = 'status'  # Use a placeholder for reserved keyword

        update_expression += ', '.join(update_expression_elements)
        
        try:
            response = card_table.update_item(
                Key={'id': card_id},
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_attribute_values,
                ExpressionAttributeNames=expression_attribute_names,  # Add this line
                ReturnValues='UPDATED_NEW'
            )
            response = card_table.get_item(Key={'id': card_id})
            return response.get('Item')
        except Exception as e:
            print(f"An error occurred: {e}")
            return None

    @staticmethod
    def delete(card_id):
        try:
            response = card_table.delete_item(Key={'id': card_id})
            return response
        except Exception as e:
            print(f"An error occurred: {e}")
            return None
