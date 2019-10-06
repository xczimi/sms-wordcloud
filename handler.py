import json
import boto3
import base64
import os
import urllib.parse
import twilio.twiml

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
    print(response)


def words_static(event, context):
    with open('words.json', 'r') as myfile:
        words = json.load(myfile)
    return {
        "statusCode": 200,
        "headers": {
            'Access-Control-Allow-Origin': '*'
        },
        "body": json.dumps(words)
    }


def words(event, context):
    resp = dynamodb.query(
        TableName='words',
        KeyConditionExpression="Book = :book",
        ExpressionAttributeValues={
            ':book': {
                'S': 'DEFAULT',
            },
        }
    )
    print(resp)
    wc = [{'text':item['BookWord']['S'],'value':item['wordCount']['N']} for item in resp['Items']]
    return {
        "statusCode": 200,
        "headers": {
            'Access-Control-Allow-Origin': '*'
        },
        "body": json.dumps(wc)
    }


def process_text(text):
    for word, n in wc.process_text(text).items():
        print(word,n)
        update_counter(word, n=n)
    # for word in text.split():
    #     if len(word) > 1:
    #         update_counter(word)


def sms(event, context):
    print(json.dumps(event))
    # GET requests
    if event['queryStringParameters'] is not None:
        process_text(event['queryStringParameters']['Body'])
    # POST requests
    if 'Body' in urllib.parse.parse_qs(event['body']):
        for words in urllib.parse.parse_qs(event['body'])['Body']:
            process_text(words)

    response = {
        "statusCode": 200,
        "headers": {
            "Content-Type":"text/xml"
        },
        "body": '<?xml version=\"1.0\" encoding=\"UTF-8\"?>'
                '<Response><Message>Hello world! -Lambda</Message></Response>'
    }

    return response
