import json
import boto3
import base64
import os

kms = boto3.client('kms')

SECRETS = json.loads(kms.decrypt(
    CiphertextBlob=base64.b64decode(os.environ['SECRETS'])
)['Plaintext'].decode("utf-8"))


def hello(event, context):
    body = {
        "message": "Go Serverless v1.0! Your function executed successfully!",
        "input": event,
        "secrets": SECRETS

    }

    response = {
        "statusCode": 200,
        "body": json.dumps(body)
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
