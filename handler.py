import json
import boto3
import base64
import os
import urllib.parse
import twilio.twiml

kms = boto3.client('kms')

SECRETS = json.loads(kms.decrypt(
    CiphertextBlob=base64.b64decode(os.environ['SECRETS'])
)['Plaintext'].decode("utf-8"))

def hello(event, context):
    body = {
        "message": "Go Serverless v1.0! Your function executed successfully!",
        "input": event
    }
    print(json.dumps(event))
    print(json.dumps(urllib.parse.parse_qs(event['body'])))

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
