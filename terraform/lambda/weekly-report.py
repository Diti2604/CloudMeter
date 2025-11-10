import json
import datetime
import boto3
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import base64
from io import BytesIO

def lambda_handler(event, context):
    """
    Generates weekly cost report with delta from previous week,
    creates a PDF, and sends it via SES email.
    """
    
    ce_client = boto3.client('ce', region_name='us-east-1')
    ses_client = boto3.client('ses', region_name='us-east-1')
    
    sender_email = os.environ.get('SENDER_EMAIL')
    recipient_email = os.environ.get('RECIPIENT_EMAIL', 'your-email@example.com')
    
    if not sender_email:
        raise ValueError("SENDER_EMAIL environment variable not set")
    
    today = datetime.date.today()
    
    current_week_end = today
    current_week_start = today - datetime.timedelta(days=7)
    
    previous_week_end = current_week_start - datetime.timedelta(days=1)
    previous_week_start = previous_week_end - datetime.timedelta(days=7)
    
    try:
        current_week_response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': current_week_start.strftime('%Y-%m-%d'),
                'End': current_week_end.strftime('%Y-%m-%d')
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
        
        previous_week_response = ce_client.get_cost_and_usage(
            TimePeriod={
                'Start': previous_week_start.strftime('%Y-%m-%d'),
                'End': previous_week_end.strftime('%Y-%m-%d')
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
        
        current_week_costs = process_cost_data(current_week_response)
        current_total = sum(current_week_costs.values())
        
        previous_week_costs = process_cost_data(previous_week_response)
        previous_total = sum(previous_week_costs.values())
        
        total_delta = current_total - previous_total
        total_delta_percent = ((current_total - previous_total) / previous_total * 100) if previous_total > 0 else 0
        
        service_deltas = calculate_service_deltas(current_week_costs, previous_week_costs)
        
        html_content = generate_html_report(
            current_week_start,
            current_week_end,
            previous_week_start,
            previous_week_end,
            service_deltas,
            current_total,
            previous_total,
            total_delta,
            total_delta_percent
        )
        
        send_email_with_report(
            ses_client,
            sender_email,
            recipient_email,
            current_week_start,
            current_week_end,
            html_content,
            current_total,
            previous_total,
            total_delta,
            total_delta_percent
        )
        
        print(f"Report sent successfully to {recipient_email}")
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Weekly report sent successfully",
                "recipient": recipient_email,
                "currentWeekCost": round(current_total, 2),
                "previousWeekCost": round(previous_total, 2),
                "delta": round(total_delta, 2),
                "deltaPercent": round(total_delta_percent, 1)
            })
        }
        
    except Exception as e:
        print(f"Error generating/sending report: {str(e)}")
        
        try:
            ses_client.send_email(
                Source=sender_email,
                Destination={'ToAddresses': [recipient_email]},
                Message={
                    'Subject': {'Data': 'ERROR: AWS Cost Report Generation Failed'},
                    'Body': {
                        'Text': {'Data': f'Failed to generate weekly cost report.\n\nError: {str(e)}'}
                    }
                }
            )
        except Exception as ses_error:
            print(f"Failed to send error notification: {str(ses_error)}")
        
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": "Failed to generate/send report",
                "message": str(e)
            })
        }


def process_cost_data(response):
    """
    Process Cost Explorer response and aggregate costs by service.
    """
    service_costs = {}
    
    for result in response['ResultsByTime']:
        for group in result['Groups']:
            service_name = group['Keys'][0]
            cost = float(group['Metrics']['UnblendedCost']['Amount'])
            
            if service_name in service_costs:
                service_costs[service_name] += cost
            else:
                service_costs[service_name] = cost
    
    return service_costs


def calculate_service_deltas(current_costs, previous_costs):
    """
    Calculate cost deltas for each service.
    """
    service_deltas = []
    
    all_services = set(list(current_costs.keys()) + list(previous_costs.keys()))
    
    for service in all_services:
        current = current_costs.get(service, 0)
        previous = previous_costs.get(service, 0)
        delta = current - previous
        delta_percent = ((current - previous) / previous * 100) if previous > 0 else 0
        
        if current > 0.01 or previous > 0.01: 
            service_deltas.append({
                'service': service,
                'current': current,
                'previous': previous,
                'delta': delta,
                'delta_percent': delta_percent
            })
    
    service_deltas.sort(key=lambda x: x['current'], reverse=True)
    
    return service_deltas


def generate_html_report(current_start, current_end, previous_start, previous_end,
                        service_deltas, current_total, previous_total, total_delta, total_delta_percent):
    """
    Generate clean, user-friendly HTML content for the report.
    """
    
    delta_color = '#e74c3c' if total_delta > 0 else '#27ae60'
    delta_icon = '↑' if total_delta > 0 else '↓'
    delta_sign = '+' if total_delta >= 0 else ''
    
    top_services = service_deltas[:10]
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
                background-color: #f5f7fa;
            }}
            .container {{
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 600;
            }}
            .header p {{
                margin: 0;
                font-size: 16px;
                opacity: 0.9;
            }}
            .content {{
                padding: 30px;
            }}
            .summary-grid {{
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }}
            .summary-card {{
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                border: 2px solid #e9ecef;
            }}
            .summary-value {{
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 5px;
                color: #2c3e50;
            }}
            .summary-value.delta {{
                color: {delta_color};
            }}
            .summary-label {{
                font-size: 13px;
                color: #6c757d;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 500;
            }}
            .section {{
                margin-bottom: 30px;
            }}
            .section-title {{
                font-size: 20px;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 3px solid #667eea;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }}
            th {{
                background: #f8f9fa;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                font-size: 13px;
                color: #495057;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 2px solid #dee2e6;
            }}
            td {{
                padding: 12px;
                border-bottom: 1px solid #e9ecef;
                font-size: 14px;
            }}
            tr:hover {{
                background-color: #f8f9fa;
            }}
            .service-name {{
                font-weight: 500;
                color: #2c3e50;
            }}
            .cost-amount {{
                font-family: 'Courier New', monospace;
                font-weight: 500;
            }}
            .change-positive {{
                color: #27ae60;
                font-weight: 600;
            }}
            .change-negative {{
                color: #e74c3c;
                font-weight: 600;
            }}
            .footer {{
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                font-size: 12px;
                color: #6c757d;
                border-top: 1px solid #e9ecef;
            }}
            .insight-box {{
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 15px 20px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .insight-box p {{
                margin: 0;
                color: #1565c0;
                font-size: 14px;
            }}
            @media print {{
                body {{ background: white; padding: 0; }}
                .container {{ box-shadow: none; }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>☁️ AWS Cost Report</h1>
                <p>{current_start.strftime('%B %d')} - {current_end.strftime('%B %d, %Y')}</p>
            </div>
            
            <div class="content">
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-value">${current_total:.2f}</div>
                        <div class="summary-label">Current Week</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${previous_total:.2f}</div>
                        <div class="summary-label">Previous Week</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value delta">{delta_icon} {delta_sign}${abs(total_delta):.2f}</div>
                        <div class="summary-label">{delta_sign}{total_delta_percent:.1f}% Change</div>
                    </div>
                </div>
                
                <div class="insight-box">
                    <p>
                        💡 <strong>Quick Insight:</strong> 
                        Your AWS spending has {'increased' if total_delta > 0 else 'decreased'} by 
                        ${abs(total_delta):.2f} ({abs(total_delta_percent):.1f}%) compared to last week.
                    </p>
                </div>
                
                <div class="section">
                    <h2 class="section-title">📊 Cost Breakdown by Service</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th style="text-align: right;">Current Week</th>
                                <th style="text-align: right;">Previous Week</th>
                                <th style="text-align: right;">Change</th>
                            </tr>
                        </thead>
                        <tbody>
    """
    
    for item in top_services:
        change_class = 'change-negative' if item['delta'] > 0 else 'change-positive'
        change_sign = '+' if item['delta'] >= 0 else ''
        
        html += f"""
                            <tr>
                                <td class="service-name">{item['service']}</td>
                                <td class="cost-amount" style="text-align: right;">${item['current']:.2f}</td>
                                <td class="cost-amount" style="text-align: right;">${item['previous']:.2f}</td>
                                <td class="{change_class}" style="text-align: right;">
                                    {change_sign}${item['delta']:.2f} ({change_sign}{item['delta_percent']:.1f}%)
                                </td>
                            </tr>
        """
    
    recommendations = generate_recommendations(service_deltas, total_delta, total_delta_percent)
    
    html += """
                        </tbody>
                    </table>
                </div>
    """
    
    if recommendations:
        html += """
                <div class="section">
                    <h2 class="section-title">💡 Recommendations</h2>
                    <ul style="padding-left: 20px; line-height: 2;">
        """
        for rec in recommendations:
            html += f"<li style='margin-bottom: 10px; color: #495057;'>{rec}</li>"
        
        html += """
                    </ul>
                </div>
        """
    
    html += f"""
            </div>
            
            <div class="footer">
                <p><strong>AWS Cost Optimizer</strong> - Automated Weekly Report</p>
                <p>Generated on {datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p UTC')}</p>
                <p style="margin-top: 10px; font-size: 11px;">
                    Previous Period: {previous_start.strftime('%B %d')} - {previous_end.strftime('%B %d, %Y')}
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html


def generate_recommendations(service_deltas, total_delta, total_delta_percent):
    """
    Generate cost optimization recommendations based on actual usage patterns.
    """
    recommendations = []
    
    if total_delta > 0 and total_delta_percent > 20:
        recommendations.append(
            f"⚠️ Your spending increased by {total_delta_percent:.1f}% this week. "
            "Review your usage patterns to identify unexpected costs."
        )
    
    increased_services = [s for s in service_deltas if s['delta'] > 5 and s['delta_percent'] > 20]
    
    if increased_services:
        for service in increased_services[:3]:
            service_name = service['service']
            
            if 'EC2' in service_name:
                recommendations.append(
                    f"💰 EC2 costs increased by ${service['delta']:.2f}. "
                    "Consider using Reserved Instances or Spot Instances for predictable workloads."
                )
            elif 'S3' in service_name or 'Simple Storage Service' in service_name:
                recommendations.append(
                    f"💰 S3 costs increased by ${service['delta']:.2f}. "
                    "Enable Intelligent-Tiering and implement lifecycle policies."
                )
            elif 'RDS' in service_name:
                recommendations.append(
                    f"💰 RDS costs increased by ${service['delta']:.2f}. "
                    "Review instance sizes and consider Aurora Serverless for variable workloads."
                )
            elif 'Lambda' in service_name:
                recommendations.append(
                    f"💰 Lambda costs increased by ${service['delta']:.2f}. "
                    "Optimize function memory allocation and execution time."
                )
    
    return recommendations[:5]


def send_email_with_report(ses_client, sender, recipient, start_date, end_date, 
                          html_content, current_total, previous_total, delta, delta_percent):
    """
    Send email with HTML report via SES.
    """
    
    subject = f"AWS Cost Report: ${current_total:.2f} ({'+' if delta >= 0 else ''}{delta_percent:.1f}%)"
    
    delta_sign = '+' if delta >= 0 else ''
    plain_text = f"""
AWS Cost Report
{start_date.strftime('%B %d')} - {end_date.strftime('%B %d, %Y')}

SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Week:  ${current_total:.2f}
Previous Week: ${previous_total:.2f}
Change:        {delta_sign}${delta:.2f} ({delta_sign}{delta_percent:.1f}%)

View the full HTML report for detailed breakdown and recommendations.

Report generated on {datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p UTC')}
    """
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = recipient
    
    part1 = MIMEText(plain_text, 'plain', 'utf-8')
    part2 = MIMEText(html_content, 'html', 'utf-8')
    
    msg.attach(part1)
    msg.attach(part2)
    
    response = ses_client.send_raw_email(
        Source=sender,
        Destinations=[recipient],
        RawMessage={'Data': msg.as_string()}
    )
    
    return response


def scheduled_handler(event, context):
    """
    Wrapper for scheduled EventBridge execution.
    """
    return lambda_handler(event, context)