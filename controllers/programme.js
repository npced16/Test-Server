const express = require("express");
const router = express.Router();
const User = require("../models/user");
const programme = require("../models/programme");
const mongoose = require("mongoose");
const { requireToken } = require("../middleware/token");
const { exceptRoles } = require("../middleware/roles");
/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * '/api/progremma':
 *  post:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Progremma Controller
 *     summary: Get Progremma
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Post'
 *      401:
 *        description: Unauthorized
 *      500:
 *        description: Server Error
 */

const getProgremma = async (req, res, next) => {
	try {
		res.json({
			responseMessage: "Login successful",
			data: { token },
			responseTime: new Date().toISOString(),
		});
	} catch (err) {
		next(err);
	}
};

router.get("/", getProgremma);
router.post("/create", getProgremma);

module.exports = router;
