import json
import datetime
import boto3
from decimal import Decimal

def lambda_handler(event, context):
    """
    Fetches real AWS cost data from Cost Explorer API.
    Returns cost breakdown by service for the last 7 days.
    """
    
    ce_client = boto3.client('ce', region_name='us-east-1')
    
    # Calculate date range (last 7 days)
    end = datetime.date.today()
    start = end - datetime.timedelta(days=7)
    
    # Calculate previous period for trend calculation
    prev_end = start - datetime.timedelta(days=1)
    prev_start = prev_end - datetime.timedelta(days=7)
    
    try:
        # Fetch current period cost data
        response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': start.strftime('%Y-%m-%d'),
                'End': end.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'SERVICE'
                }
            ]
        )
        
        # Fetch previous period cost data for trend calculation
        prev_response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': prev_start.strftime('%Y-%m-%d'),
                'End': prev_end.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost']
        )
        
        # Aggregate costs by service
        service_costs = {}
        total_cost = 0.0
        
        for result in response['ResultsByTime']:
            for group in result['Groups']:
                service_name = group['Keys'][0]
                cost = float(group['Metrics']['UnblendedCost']['Amount'])
                
                if service_name in service_costs:
                    service_costs[service_name] += cost
                else:
                    service_costs[service_name] = cost
                
                total_cost += cost
        
        # Calculate previous period total cost for trend
        prev_total_cost = 0.0
        for result in prev_response['ResultsByTime']:
            prev_total_cost += float(result['Total']['UnblendedCost']['Amount'])
        
        # Calculate trend percentage
        if prev_total_cost > 0:
            trend_percent = ((total_cost - prev_total_cost) / prev_total_cost) * 100
            trend = f"{'+' if trend_percent >= 0 else ''}{trend_percent:.1f}%"
        else:
            trend = "N/A"
        
        # Format service costs for response
        by_service = []
        for service, cost in sorted(service_costs.items(), key=lambda x: x[1], reverse=True):
            # Only include services with meaningful costs (> $0.01)
            if cost > 0.01:
                by_service.append({
                    "service": service,
                    "cost": round(cost, 2)
                })
        
        response_body = {
            "periodStart": start.strftime("%Y-%m-%d"),
            "periodEnd": end.strftime("%Y-%m-%d"),
            "totalCost": round(total_cost, 2),
            "byService": by_service,
            "trend": trend
        }
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(response_body)
        }
        
    except Exception as e:
        print(f"Error fetching cost data: {str(e)}")
        
        # Return error response
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Failed to fetch cost data",
                "message": str(e)
            })
        }
