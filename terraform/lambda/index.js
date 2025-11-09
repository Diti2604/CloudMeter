const { S3Client, ListObjectsV2Command, GetObjectCommand } =  require("@aws-sdk/client-s3");
const { Readable }=  require("stream");

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
};

exports.handler = async () => {
  const s3 = new S3Client({ region: "us-east-1" });
  const bucket = "my-reports-bucket-ko01";
  const prefix = "reports/";

  try {
    const listCmd = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });
    const listResponse = await s3.send(listCmd);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No reports found." }),
      };
    }

    const sorted = listResponse.Contents.sort(
      (a, b) => new Date(b.LastModified) - new Date(a.LastModified)
    );
    const latestKey = sorted[0].Key;

    const getCmd = new GetObjectCommand({ Bucket: bucket, Key: latestKey });
    const getResponse = await s3.send(getCmd);
    const fileContent = await streamToString(getResponse.Body);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: fileContent,
    };

  } catch (error) {
    console.error("Error fetching report:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};


