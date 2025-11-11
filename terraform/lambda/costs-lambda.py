import json
import datetime
import boto3
from decimal import Decimal

CACHE_DURATION_HOURS = 6
last_fetch_time = None
cached_response = None

def lambda_handler(event, context):
    global last_fetch_time, cached_response
    
    current_time = datetime.datetime.now()
    
    if (last_fetch_time and cached_response and 
        (current_time - last_fetch_time).total_seconds() < CACHE_DURATION_HOURS * 3600):
        print(f"Returning cached data (age: {(current_time - last_fetch_time).total_seconds() / 3600:.2f} hours)")
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "X-Cache-Status": "HIT",
                "X-Cache-Age": str(int((current_time - last_fetch_time).total_seconds())),
                "Cache-Control": f"max-age={CACHE_DURATION_HOURS * 3600}"
            },
            "body": json.dumps(cached_response)
        }
    
    print("Cache miss or expired - fetching fresh data from Cost Explorer API")
    
    ce_client = boto3.client('ce', region_name='us-east-1')
    
    end = datetime.date.today()
    start = end - datetime.timedelta(days=7)
    
    prev_end = start - datetime.timedelta(days=1)
    prev_start = prev_end - datetime.timedelta(days=7)
    
    try:
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
        
        prev_response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': prev_start.strftime('%Y-%m-%d'),
                'End': prev_end.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost']
        )
        
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
        
        prev_total_cost = 0.0
        for result in prev_response['ResultsByTime']:
            prev_total_cost += float(result['Total']['UnblendedCost']['Amount'])
        
        if prev_total_cost > 0:
            trend_percent = ((total_cost - prev_total_cost) / prev_total_cost) * 100
            trend = f"{'+' if trend_percent >= 0 else ''}{trend_percent:.1f}%"
        else:
            trend = "N/A"
        
        by_service = []
        for service, cost in sorted(service_costs.items(), key=lambda x: x[1], reverse=True):
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
            "trend": trend,
            "cachedAt": current_time.isoformat(),
            "cacheExpiresIn": CACHE_DURATION_HOURS * 3600
        }
        
        cached_response = response_body
        last_fetch_time = current_time
        
        print(f"Fresh data fetched and cached at {current_time.isoformat()}")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "X-Cache-Status": "MISS",
                "Cache-Control": f"max-age={CACHE_DURATION_HOURS * 3600}"
            },
            "body": json.dumps(response_body)
        }
        
    except Exception as e:
        print(f"Error fetching cost data: {str(e)}")
        
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
