import json
import datetime
import random

def lambda_handler(event, context):
    """
    Temporary mock version of Cost Explorer Lambda.
    Simulates real AWS billing data with random values,
    formatted exactly like a real ce:GetCostAndUsage() response.
    """

    # Simulate time range (last 7 days)
    end = datetime.date.today()
    start = end - datetime.timedelta(days=7)

    # Example AWS services
    services = ["Amazon EC2", "Amazon S3", "AWS Lambda", "Amazon RDS", "Amazon CloudWatch"]

    # Generate random cost data (like real CE output)
    data = []
    total_cost = 0.0
    for svc in services:
        cost = round(random.uniform(2.5, 25.0), 2)
        total_cost += cost
        data.append({
            "service": svc,
            "cost": cost
        })

    # Response (mimics real Cost Explorer data format)
    response_body = {
        "periodStart": start.strftime("%Y-%m-%d"),
        "periodEnd": end.strftime("%Y-%m-%d"),
        "totalCost": round(total_cost, 2),
        "byService": data,
        "trend": "+5.3% since last week (mock data)"
    }

    # Return HTTP-style response for API Gateway
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"  # For frontend calls
        },
        "body": json.dumps(response_body)
    }
