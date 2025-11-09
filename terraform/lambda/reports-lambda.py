import json
import boto3

def lambda_handler(event, context):
    s3 = boto3.client('s3', region_name='us-east-1')
    bucket = "my-reports-bucket-ko01"
    prefix = "reports/"

    try:
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)

        if 'Contents' not in response or len(response['Contents']) == 0:
            return {
                "statusCode": 404,
                "body": json.dumps({"error": "No reports found."})
            }

        sorted_objs = sorted(response['Contents'], key=lambda x: x['LastModified'], reverse=True)
        latest_key = sorted_objs[0]['Key']

        obj = s3.get_object(Bucket=bucket, Key=latest_key)
        file_content = obj['Body'].read().decode('utf-8')

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": file_content  
        }

    except Exception as e:
        print("Error fetching report:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
