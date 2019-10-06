import json
import boto3
import base64
import os
import urllib.parse
import twilio.twiml
import time

from wordcount import WordCount

kms = boto3.client('kms')
dynamodb = boto3.client('dynamodb')

if 'SECRETS' in os.environ:
    SECRETS = json.loads(kms.decrypt(
        CiphertextBlob=base64.b64decode(os.environ['SECRETS'])
    )['Plaintext'].decode("utf-8"))

wc = WordCount()


def update_counter(word, n=1, book="DEFAULT"):
    response = dynamodb.update_item(
        TableName='words',
        Key={
            'Book': {'S': book},
            'BookWord': {'S': word}
        },
        UpdateExpression='SET wordCount = if_not_exists(wordCount, :init) + :inc',
        ExpressionAttributeValues={
            ':inc': {'N': str(n)},
            ':init': {'N': '0'},
        },
        ReturnValues="UPDATED_NEW"
    )
    print("INC word " + word + " in " + book)


def set_active_book(book, active='true'):
    resp_off = dynamodb.update_item(
        TableName='words',
        Key={
            'Book': {'S': 'books'},
            'BookWord': {'S': book}
        },
        UpdateExpression='SET active = :active',
        ExpressionAttributeValues={
            ':active': {'BOOL': active}
        },
        ReturnValues="UPDATED_NEW"
    )
    print("SET book " + book + " TO " + active)


def get_books():
    resp = dynamodb.query(
        TableName='words',
        KeyConditionExpression="Book = :book",
        ExpressionAttributeValues={
            ':book': {
                'S': 'books',
            },
        }
    )
    return [{'book':item['BookWord']['S'],'active':item['active']['BOOL']} for item in resp['Items']]


def words(event, context):
    print(json.dumps(event))
    book = 'DEFAULT'
    if 'pathParameters' in event:
        if 'book' in event['pathParameters']:
            book = event['pathParameters']['book']
    resp = dynamodb.query(
        TableName='words',
        KeyConditionExpression="Book = :book",
        ExpressionAttributeValues={
            ':book': {
                'S': book,
            },
        }
    )
    wc = [{'text':item['BookWord']['S'],'value':item['wordCount']['N']} for item in resp['Items']]
    return {
        "statusCode": 200,
        "headers": {
            'Access-Control-Allow-Origin': '*'
        },
        "body": json.dumps(wc)
    }


def process_sms(text, book='DEFAULT'):
    frequencies = wc.process_text(text)
    print(json.dumps({'book': book, 'sms': text, 'stats': frequencies, 'sent': time.time()}))
    for word, n in frequencies.items():
        update_counter(word, n=n)


def sms(event, context):
    print(json.dumps(event))
    # GET requests
    if event['queryStringParameters'] is not None:
        process_sms(event['queryStringParameters']['Body'])
    # POST requests
    elif 'Body' in urllib.parse.parse_qs(event['body']):
        for words in urllib.parse.parse_qs(event['body'])['Body']:
            process_sms(words)

    response = {
        "statusCode": 200,
        "headers": {
            "Content-Type":"text/xml"
        },
        "body": '<?xml version=\"1.0\" encoding=\"UTF-8\"?>'
                '<Response><Message>Hello world! -Lambda</Message></Response>'
    }

    return response
