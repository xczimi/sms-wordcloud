import json
import boto3
import os
import urllib.parse
import time
from lambda_decorators import json_http_resp, cors_headers
import dateutil.parser
from datetime import datetime
import csv

from wordcount import WordCount

app_stage = os.environ['APP_STAGE']
dynamodb_table_name = os.environ['DYNAMODB_TABLENAME']

ssm = boto3.client('ssm')
dynamodb = boto3.client('dynamodb')
logs = boto3.client('logs')

wc = WordCount()


def get_secret(secret_key):
    resp = ssm.get_parameter(
        Name=f"{os.environ['SECRET_KEY_PREFIX']}/{secret_key}",
        WithDecryption=True
    )
    return resp['Parameter']['Value']


def update_counter(word, book, n=1):
    response = dynamodb.update_item(
        TableName=dynamodb_table_name,
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
    print(f"INC word {word} in {book} of {app_stage}")


def set_active_book(book, active=True):
    if active:
        ts_field = 'started'
    else:
        ts_field = 'stopped'
    now = datetime.now().replace(microsecond=0).isoformat()
    response = dynamodb.update_item(
        TableName=dynamodb_table_name,
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
    print(f"SET book {book} TO {active}")


def book_from_item(item):
    book = {'book': item['BookWord']['S'], 'active': item['active']['BOOL'], 'started': None, 'stopped': None}
    if 'started' in item:
        book['started'] = item['started']['S']
    if 'stopped' in item:
        book['stopped'] = item['stopped']['S']
    return book


def get_books():
    resp = dynamodb.query(
        TableName=dynamodb_table_name,
        KeyConditionExpression="Book = :book",
        ExpressionAttributeValues={
            ':book': {
                'S': 'books',
            },
        }
    )
    return [book_from_item(item) for item in resp['Items']]


def get_words(book_id):
    resp = dynamodb.query(
        TableName=dynamodb_table_name,
        KeyConditionExpression="Book = :book",
        ExpressionAttributeValues={
            ':book': {
                'S': book_id,
            },
        }
    )
    stats = {}
    for item in resp['Items']:
        word = item['BookWord']['S']
        size = item['wordCount']['N']
        if word.lower() in stats:
            stats[word.lower()] = stats[word.lower()] + size
        else:
            stats[word.lower()] = size
    return [{'text': word, 'value': size} for word, size in stats.items()]


@cors_headers(credentials=True)
@json_http_resp
def words(event, context):
    book_id = 'cloud8'
    if 'pathParameters' in event:
        if 'book' in event['pathParameters']:
            book_id = event['pathParameters']['book']
    return get_words(book_id)


def get_book(book):
    return next(item for item in get_books() if item['book'] == book)


def get_active_book(books):
    for book in books:
        if book['active']:
            return book['book']
    # no active book, so setting one
    book = "cloud" + str(len(books))
    set_active_book(book)
    return book


@cors_headers(credentials=True)
def book_csv(event, context):
    book_id = 'cloud8'
    if 'pathParameters' in event:
        if 'book' in event['pathParameters']:
            book_id = event['pathParameters']['book']
    book = get_book(book_id)
    paginator = logs.get_paginator('filter_log_events')
    stopped = datetime.now()
    if 'stopped' in book and book['stopped'] is not None:
        stopped = datetime.fromisoformat(book['stopped'])
    started = dateutil.parser.parse(book['started'])
    response_iterator = paginator.paginate(
        logGroupName=f"/aws/lambda/txt-cloud-{app_stage}-sms",
        logStreamNamePrefix='{}/'.format(started.year),
        endTime=int(stopped.timestamp() * 1000),
        filterPattern='{ ($.stage = "' + app_stage + '") && ($.book = "' + book['book'] + '") }'
    )
    csv_fn = '/tmp/{}.csv'.format(book_id)
    with open(csv_fn, 'w') as csv_file_w:
        spamwriter = csv.writer(csv_file_w)
        spamwriter.writerow(['sent', 'book', 'sms'])
        for page in response_iterator:
            for log_event in page['events']:
                message = json.loads(log_event['message'])
                spamwriter.writerow([str(datetime.fromtimestamp(message['sent'])), message['book'], message['sms']])
    with open(csv_fn, 'r') as csv_file_r:
        return {'headers': {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'inline; filename="{}_messages.csv"'.format(book_id)
        }, 'body': csv_file_r.read()}


@cors_headers(credentials=True)
def words_csv(event, context):
    book_id = 'cloud8'
    if 'pathParameters' in event:
        if 'book' in event['pathParameters']:
            book_id = event['pathParameters']['book']
    csv_fn = '/tmp/{}_stats.csv'.format(book_id)
    with open(csv_fn, 'w') as csv_file_w:
        spamwriter = csv.writer(csv_file_w)
        spamwriter.writerow(['word', 'count'])
        for stat in sorted(get_words(book_id), key=lambda x: int(x['value']), reverse=True):
            spamwriter.writerow([stat['text'], stat['value']])
    with open(csv_fn, 'r') as csv_file_r:
        return {'headers': {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'inline; filename="{}_stats.csv"'.format(book_id)
        }, 'body': csv_file_r.read()}


@cors_headers(credentials=True)
@json_http_resp
def books(event, context):
    return get_books()


def process_sms(text, books):
    book = get_active_book(books)

    frequencies = wc.process_text(text)
    print(json.dumps({'stage': app_stage, 'book': book, 'sms': text, 'stats': frequencies, 'sent': time.time()}))
    for word, n in frequencies.items():
        update_counter(word, book, n=n)
    return 'Thank you for you message. Word cloud updated. (' + book + ')'


admin_senders = ["+17789914507", "+17789979236"]


def process_cmd(text, books):
    book = get_active_book(books)
    if text.lower().strip() == "reset":
        set_active_book(book, False)
        new_book = "cloud" + str(len(books))
        set_active_book(new_book)
        return 'Old cloud closed (' + book + '). New cloud started (' + new_book + ')'
    return "Invalid command {}".format(text)


def sms(event, context):
    books = get_books()
    message = None
    # GET requests
    if event['queryStringParameters'] is not None:
        if event['queryStringParameters']['From'] in admin_senders:
            message = process_cmd(event['queryStringParameters']['Body'], books)
        else:
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
