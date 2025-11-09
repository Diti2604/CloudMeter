import json
import random

def lambda_handler(event, context):
    """
    Mock audit Lambda — simulates findings from common AWS services.
    Later you'll replace each section with real boto3 describe_* calls.
    """
    services = [
        "Amazon EC2", "Amazon EBS", "Amazon S3", "AWS Lambda",
        "Amazon RDS", "Amazon CloudWatch", "Amazon ECR",
        "Elastic Load Balancer", "Elastic IP"
    ]

    sample_recos = [
        "Stopped instance; consider terminating.",
        "Unattached volume; delete to save cost.",
        "No lifecycle policy; enable Intelligent-Tiering.",
        "Large memory allocation; reduce if possible.",
        "Idle database; scale down.",
        "Too many custom metrics; review monitoring.",
        "Old image tags; clean repository.",
        "Unused load balancer; consider deletion.",
        "Unassociated Elastic IP; release to save cost."
    ]

    findings = []
    for svc in services:
        if random.random() < 0.6:  # random 60% chance to show an issue
            findings.append({
                "service": svc,
                "id": f"{svc.split()[1][:3].upper()}-{random.randint(1000,9999)}",
                "recommendation": random.choice(sample_recos)
            })

    summary = {
        "totalFindings": len(findings),
        "potentialSavingsEstimate": f"${len(findings) * random.randint(2,8)}.00/month (mock)",
    }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"summary": summary, "findings": findings})
    }
