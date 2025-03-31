const { S3Client } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
	endpoint: process.env.MINIO_ENDPOINT,
	region: "us-east-1",
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.MINIO_ACCESS_KEY,
		secretAccessKey: process.env.MINIO_SECRET_KEY,
	},
});

module.exports = s3;
