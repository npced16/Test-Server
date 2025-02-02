const express = require("express");
const { ObjectId } = require("mongoose").Types;
const router = express.Router();
const User = require("../models/user");
const Tier = require("../models/tier");
const mongoose = require("mongoose");
const { requireToken } = require("../middleware/token");
const { requireRoles, exceptRoles } = require("../middleware/roles");

const getCurrentTime = () => {
	return new Date().toISOString();
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * '/api/tiers':
 *  post:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Tier Controller
 *     summary: Create Tier
 *     description: User must not be a Consumer
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *           $ref: '#/components/schemas/Tier'
 *     responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Tier'
 *      401:
 *        description: Unauthorized
 *      500:
 *        description: Server Error
 *
 */
const createTier = async (req, res) => {
	const {
		title,
		description,
		price,
		currency = "EUR",
		goal,
		level = 1,
		coverPhoto,
	} = req.body;

	if (!title) {
		return res.status(400).json({
			responseTime: getCurrentTime(),
			responseMessage: "Title is required",
		});
	}
	if (!description) {
		return res.status(400).json({
			responseTime: getCurrentTime(),
			responseMessage: "Description is required",
		});
	}
	if (!price || price <= 0) {
		return res.status(400).json({
			responseTime: getCurrentTime(),
			responseMessage: "Price must be greater than 0",
			data: null,
		});
	}

	try {
		const tier = new Tier({
			title,
			description,
			price,
			currency,
			goal,
			level,
			coverPhoto,
			creator: req.user._id,
		});

		await tier.save();

		res.json({
			data: tier,
			responseTime: getCurrentTime(),
			responseMessage: "Tier created successfully",
		});
	} catch (err) {
		res.status(500).json({
			data: null,
			responseTime: getCurrentTime(),
			responseMessage: err,
		});
	}
};

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * /api/tiers/own:
 *   get:
 *     security:
 *     - Authorization: []
 *     summary: Get the user's own tiers
 *     tags:
 *     - Tier Controller
 *     responses:
 *       200:
 *         description: Tiers fetched successfully
 *       404:
 *         description: Tiers not found
 */
const getUserOwnTiers = async (req, res, next) => {
	try {
		const tiers = await Tier.find({ creator: req.user._id });

		if (tiers.length === 0) {
			return res.status(404).json({
				data: null,
				responseTime: getCurrentTime(),
				responseMessage: "Tiers not found",
			});
		}
		const tiersWithSubscribers = await Promise.all(
			tiers.map(async (tier) => {
				const subscriberCount = await User.countDocuments({
					subscribed: tier._id,
				});
				return { ...tier.toObject(), subscriberCount };
			})
		);

		res.json({
			data: tiersWithSubscribers,
			responseTime: getCurrentTime(),
			responseMessage: "Tiers fetched successfully",
		});
	} catch (err) {
		next(err);
	}
};

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * /api/tiers/subscribed:
 *   get:
 *     security:
 *     - Authorization: []
 *     summary: Get the tiers the user is subscribed to, excluding the number of subscribers
 *     tags:
 *     - Tier Controller
 *     responses:
 *       200:
 *         description: Tiers fetched successfully
 *       404:
 *         description: Tiers not found
 */
const getUserSubscribedTiers = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id).populate("subscribed");
		const subscribedTiers = user.subscribed;

		if (subscribedTiers.length === 0) {
			return res.status(404).json({
				data: null,
				responseTime: getCurrentTime(),
				responseMessage: "Subscribed tiers not found",
			});
		}

		res.json({
			data: subscribedTiers,
			responseTime: getCurrentTime(),
			responseMessage: "Subscribed tiers fetched successfully",
		});
	} catch (err) {
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * '/api/tiers':
 *  put:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Tier Controller
 *     summary: Update Tier
 *     description: User must not be a Consumer
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *           $ref: '#/components/schemas/Tier'
 *     responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Tier'
 *
 *      401:
 *        description: Unauthorized
 *      500:
 *        description: Server Error
 *
 */
const updateTier = async (req, res, next) => {
	try {
		let body = req.body;
		let newTier = new Tier(body).toObject();
		delete newTier.creator;
		delete newTier._id;
		let tier = await Tier.findOneAndUpdate(
			{ creator: req.user._id, _id: req.params.id },
			newTier,
			{ returnOriginal: false, runValidators: true }
		);
		if (!tier) {
			res.status(500).json({
				data: null,
				responseTime: getCurrentTime(),
				responseMessage: "Tier not found / Unauthorized",
			});
		} else {
			res.json({
				data: tier,
				responseTime: getCurrentTime(),
				responseMessage: "Tier updated successfully",
			});
		}
	} catch (err) {
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 * @openapi
 * '/api/tiers/{id}/subscribe':
 *  post:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Tier Controller
 *     summary: Subscribe To Tier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *      200:
 *        description: Ok, responds with the updated user
 *      content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *
 *      401:
 *        description: Unauthorized
 *      404:
 *        description: Not Found
 *     500:
 *        description: Server Error
 */
const subscribeToTier = async (req, res, next) => {
	try {
		let tierId = req.params.id;
		const newUser = await User.findByIdAndUpdate(
			req.user._id,
			{ $addToSet: { subscribed: tierId } },
			{ returnOriginal: false, runValidators: true }
		);
		if (!(await Tier.exists({ _id: tierId }))) {
			res.status(404).json({
				data: null,
				responseTime: getCurrentTime(),
				responseMessage: "Tier not found",
			});
			return;
		}
		res.json({
			data: newUser,
			responseTime: getCurrentTime(),
			responseMessage: "User subscribed to tier successfully",
		});
	} catch (err) {
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * '/api/tiers/{id}/unsubscribe':
 *  post:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Tier Controller
 *     summary: Unsubscribe From Tier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *      200:
 *        description: Ok, responds with the updated user
 *      401:
 *        description: Unauthorized
 *      404:
 *        description: Not Found
 *     500:
 *        description: Server Error
 */
const unsubscribeFromTier = async (req, res, next) => {
	try {
		let tierId = req.params.id;
		const newUser = await User.findByIdAndUpdate(
			req.user._id,
			{ $pull: { subscribed: tierId } },
			{ returnOriginal: false, runValidators: true }
		);
		res.json({
			data: newUser,
			responseTime: getCurrentTime(),
			responseMessage: "User unsubscribed from tier successfully",
		});
	} catch (err) {
		next(err);
	}
};

/**
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * /api/tiers/{creatorId}:
 *
 *   get:
 *     summary: Get another user's tiers, excluding the number of subscribers
 *     tags:
 *     - Tier Controller
 *     parameters:
 *       - in: path
 *         name: creatorId
 *         required: true
 *         description: The ID of the creator of the tiers
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tiers fetched successfully
 *       404:
 *         description: Tiers not found
 */
const getTiersByCreator = async (req, res, next) => {
	try {
		if (!ObjectId.isValid(req.params.creatorId)) {
			return res.status(400).json({
				data: null,
				responseTime: getCurrentTime(),
				responseMessage: "Invalid creator ID format",
			});
		}

		const tiers = await Tier.find({ creator: req.params.creatorId });

		if (tiers.length === 0) {
			return res.status(404).json({
				data: null,
				responseTime: getCurrentTime(),
				responseMessage: "Tiers not found",
			});
		}

		res.json({
			data: tiers,
			responseTime: getCurrentTime(),
			responseMessage: "Tiers fetched successfully",
		});
	} catch (err) {
		next(err);
	}
};

router.post("/:id/subscribe", requireToken, subscribeToTier);
router.post("/:id/unsubscribe", requireToken, unsubscribeFromTier);
router.post("/", requireToken, exceptRoles(["Consumer"]), createTier);
//
router.put("/:id", requireToken, exceptRoles(["Consumer"]), updateTier);

router.get("/subscribed", requireToken, getUserSubscribedTiers);
router.get("/own", requireToken, getUserOwnTiers);
router.get("/:creatorId", getTiersByCreator);

module.exports = router;
