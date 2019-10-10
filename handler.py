import json
import boto3
import base64
import os
import urllib.parse
import twilio.twiml
import time
import datetime
from lambda_decorators import json_http_resp, cors_headers

from wordcount import WordCount

kms = boto3.client('kms')
dynamodb = boto3.client('dynamodb')

if 'SECRETS' in os.environ:
    SECRETS = json.loads(kms.decrypt(
        CiphertextBlob=base64.b64decode(os.environ['SECRETS'])
    )['Plaintext'].decode("utf-8"))

wc = WordCount()


def update_counter(word, book, n=1):
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


def set_active_book(book, active=True):
    if active:
        ts_field = 'started'
    else:
        ts_field = 'stopped'
    now = datetime.datetime.now().replace(microsecond=0).isoformat()
    resp_off = dynamodb.update_item(
        TableName='words',
        Key={
            'Book': {'S': 'books'},
            'BookWord': {'S': book}
        },
        UpdateExpression='SET active = :active, ' + ts_field + ' = :now',
        ExpressionAttributeValues={
            ':active': {'BOOL': active},
            ':now': {'S': now}
        },
        ReturnValues="UPDATED_NEW"
    )
    print("SET book " + book + " TO " + str(active))
    print(resp_off)


def book_from_item(item):
    book = {'book': item['BookWord']['S'], 'active': item['active']['BOOL'], 'started': None, 'stopped': None}
    if 'started' in item:
        book['started'] = item['started']['S']
    if 'stopped' in item:
        book['stopped'] = item['stopped']['S']
    return book


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
    return [book_from_item(item) for item in resp['Items']]


@cors_headers(credentials=True)
@json_http_resp
def words(event, context):
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
    return [{'text': item['BookWord']['S'], 'value': item['wordCount']['N']} for item in resp['Items']]


def get_active_book(books):
    for book in books:
        if book['active']:
            return book['book']
    book = "book" + str(len(books))
    set_active_book(book)
    return book


def process_sms(text, books):
    book = get_active_book(books)
    if text == "reset":
        set_active_book(book, False)
        new_book = "cloud" + str(len(books))
        set_active_book(new_book)
        return 'Old cloud closed (' + book + '). New cloud started (' + new_book + ')'

    frequencies = wc.process_text(text)
    print(json.dumps({'book': book, 'sms': text, 'stats': frequencies, 'sent': time.time()}))
    for word, n in frequencies.items():
        update_counter(word, book, n=n)
    return 'Thank you for you message. Word cloud updated. (' + book + ')'


def sms(event, context):
    books = get_books()
    message = None
    # GET requests
    if event['queryStringParameters'] is not None:
        message = process_sms(event['queryStringParameters']['Body'], books)
    # POST requests
    elif 'Body' in urllib.parse.parse_qs(event['body']):
        for words in urllib.parse.parse_qs(event['body'])['Body']:
            message = process_sms(words, books)
    if message is None:
        message = 'Thank you for you message. Word cloud updated.'
    response = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/xml",
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True
        },
        "body": '<?xml version=\"1.0\" encoding=\"UTF-8\"?>'
                '<Response><Message>' + message + '</Message></Response>'
    }

    return response


@cors_headers(credentials=True)
@json_http_resp
def books(event, context):
    return get_books()
