const router = require("express").Router();
const { requireToken } = require("../middleware/token");
const bucket = require("../storage/bucket");
const crypto = require("crypto");
const s3 = require("../storage/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 * @openapi
 * '/api/media/upload':
 *  post:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Media Controller
 *     summary: Upload File
 *     requestBody:
 *      required: true
 *      content:
 *       multipart/form-data:
 *          schema:
 *           type: object
 *           properties:
 *            image:
 *              type: string
 *              format: binary
 *     responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                uri:
 *                  type: string
 *      400:
 *        description: No file uploaded
 *      500:
 *        description: Server Error
 */
const uploadFile = async (req, res, next) => {
	try {
		const uuid = crypto.randomUUID();

		if (!req.files || !req.files.image) {
			return res.status(400).json({
				responseTime: new Date().toISOString(),
				responseMessage: "No file uploaded",
				data: null,
			});
		}

		const file = req.files.image;

		const params = {
			Bucket: process.env.MINIO_BUCKET,
			Key: uuid,
			Body: file.data,
			ContentType: file.mimetype,
			ACL: "public-read",
		};

		await s3.send(new PutObjectCommand(params));

		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "success",
			data: {
				url: `${process.env.PUBLIC_STORAGE_URL}/${uuid}`,
			},
		});
	} catch (err) {
		console.error(err);
		next(err);
	}
};


router.post("/upload", requireToken, uploadFile);

module.exports = router;
