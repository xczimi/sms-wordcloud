import json
import boto3
import base64
import os
import urllib.parse
import twilio.twiml

kms = boto3.client('kms')
dynamodb = boto3.client('dynamodb')

SECRETS = json.loads(kms.decrypt(
    CiphertextBlob=base64.b64decode(os.environ['SECRETS'])
)['Plaintext'].decode("utf-8"))


def update_counter(word, book="DEFAULT"):
    response = dynamodb.update_item(
        TableName='words',
        Key={
            'Book': {'S': book},
            'BookWord': {'S': word}
        },
        UpdateExpression='SET wordCount = if_not_exists(wordCount, :init) + :inc',
        ExpressionAttributeValues={
            ':inc': {'N': '1'},
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
    # with open('words.json', 'r') as myfile:
    #     words = json.load(myfile)
    #     for word in words:
    #         wc.append(word)
    return {
        "statusCode": 200,
        "headers": {
            'Access-Control-Allow-Origin': '*'
        },
        "body": json.dumps(wc)
    }


def sms(event, context):
    print(json.dumps(event))
    # GET requests
    if event['queryStringParameters'] is not None:
        for word in event['queryStringParameters']['Body'].split():
            if len(word) > 1:
                update_counter(word)
    # POST requests
    if 'Body' in urllib.parse.parse_qs(event['body']):
        for words in urllib.parse.parse_qs(event['body'])['Body']:
            for word in words.split():
                if len(word) > 1:
                    update_counter(word)

    response = {
        "statusCode": 200,
        "headers": {
            "Content-Type":"text/xml"
        },
        "body": '<?xml version=\"1.0\" encoding=\"UTF-8\"?>'
                '<Response><Message>Hello world! -Lambda</Message></Response>'
    }

    return response

    # Use this code if you don't use the http event with the LAMBDA-PROXY
    # integration
    """
    return {
        "message": "Go Serverless v1.0! Your function executed successfully!",
        "event": event
    }
    """
