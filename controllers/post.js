const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Post = require("../models/post");
const mongoose = require("mongoose");
const { requireToken } = require("../middleware/token");
const Like = require("../models/like");
const Comment = require("../models/comment");
const { exceptRoles } = require("../middleware/roles");

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 * @openapi
 * '/api/posts/':
 *  post:
 *    security:
 *     - Authorization: []
 *    tags:
 *    - Post Controller
 *    summary: Create a new post
 *    parameters:
 *      - in: query
 *        name: title
 *        required: true
 *        schema:
 *          type: string
 *      - in: query
 *        name: description
 *        schema:
 *          type: string
 *      - in: query
 *        name: tier
 *        required: false
 *        schema:
 *          type: string
 *          nullable: true
 *      - in: query
 *        name: media
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *      - in: query
 *        name: documents
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *      - in: query
 *        name: type
 *        required: false
 *        schema:
 *          type: string
 *          enum: ["Normal", "Meal", "MealPlan", "Workout", "Recipe", "Programme"]
 *          default: "Normal"
 *      - in: query
 *        name: meal
 *        required: false
 *        schema:
 *          type: string
 *          nullable: true
 *      - in: query
 *        name: ingredients
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *      - in: query
 *        name: publishingOptions
 *        required: false
 *        schema:
 *          type: string
 *      - in: query
 *        name: allowComments
 *        required: false
 *        schema:
 *          type: boolean
 *          default: true
 *      - in: query
 *        name: dietaryOptions
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *      - in: query
 *        name: timeToMake
 *        required: false
 *        schema:
 *          type: string
 *      - in: query
 *        name: calories
 *        required: false
 *        schema:
 *          type: string
 *      - in: query
 *        name: servingSize
 *        required: false
 *        schema:
 *          type: string
 *      - in: query
 *        name: stepByStep
 *        required: false
 *        schema:
 *          type: array
 *          items:
 *            type: string
 *      - in: query
 *        name: nutritionalFacts
 *        required: false
 *        schema:
 *          type: array
 *    responses:
 *      200:
 *        description: Post created successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                responseTime:
 *                  type: string
 *                  format: date-time
 *                responseMessage:
 *                  type: string
 *                data:
 *                  type: object
 *                  properties:
 *                    post:
 *                      $ref: '#/components/schemas/Post'
 *      500:
 *        description: Server Error
 */
const createPost = async (req, res) => {
	const {
		title,
		tier = null,
		// isVerified = true,
		description,
		media = [],
		documents = [],
		type = "Normal",
		meal = null,
		mealPlan = null,
		aspectRatio = "square",
		ingredients = [],
		publishingOptions,
		allowComments = true,
		dietaryOptions = [],
		timeToMake,
		calories,
		servingSize,
		stepByStep = [],
		nutritionalFacts = {},
	} = req.query;
	if (!title) {
		return res.status(400).json({
			responseTime: new Date().toISOString(),
			responseMessage: "Title is required.",
			data: null,
		});
	}
	const post = new Post({
		title,
		creator: req.user._id || null,
		tier,
		// isVerified,
		description,
		media: Array.isArray(media) ? media : [media],
		documents: Array.isArray(documents) ? documents : [documents],
		date: new Date(),
		type,
		meal,
		mealPlan,
		aspectRatio,
		ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
		publishingOptions,
		allowComments,
		dietaryOptions: Array.isArray(dietaryOptions)
			? dietaryOptions
			: [dietaryOptions],
		timeToMake,
		calories,
		servingSize,
		stepByStep: Array.isArray(stepByStep) ? stepByStep : [stepByStep],
		nutritionalFacts:
			typeof nutritionalFacts === "object" ? nutritionalFacts : {},
	});

	try {
		await post.save();
		const responsePost = post.toObject();
		delete responsePost.mealPlan;
		delete responsePost.aspectRatio;
		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "createPost successfully",
			data: { post: responsePost },
		});
	} catch (err) {
		res.status(500).json({
			responseTime: new Date().toISOString(),
			responseMessage: err.message || "Internal Server Error",
			data: null,
		});
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * '/api/posts/{id}':
 *  get:
 *     tags:
 *     - Post Controller
 *     summary: Get Post By ID !! The meal / meanPlan are populated, not referenced by id
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
 *       description: Server Error
 */

const getPostById = async (req, res, next) => {
	try {
		let post = await Post.findById(req.params.id)
			.populate("meal")
			.populate("mealPlan");

		if (post) {
			if (post.tier && !req.user) {
				meal = post.meal.toObject();
				meal = {
					...meal,
					ingredients: [],
					steps: [],
				};
				post = {
					...post.toObject(),
					meal,
				};
			}
			console.log("post", post);
			res.json({
				responseTime: new Date().toISOString(),
				responseMessage: "getPostById successfully",
				data: { post },
			});
		} else
			res.status(404).json({
				responseTime: new Date().toISOString(),
				responseMessage: "Post not found",
				data: {},
			});
	} catch (err) {
		res.status(401).json({
			responseTime: new Date().toISOString(),
			responseMessage: err,
			data: null,
		});
		console.log(err);
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * '/api/posts/{id}':
 *  put:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Post Controller
 *     summary: Update Post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *           $ref: '#/components/schemas/Post'
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
const updatePost = async (req, res, next) => {
	try {
		let body = req.body;
		let newPost = new Post(body).toObject();
		delete newPost.creator;
		delete newPost._id;
		delete newPost.date;
		// delete newPost.commentCount;
		// delete newPost.likedCount;
		let post = await Post.findOneAndUpdate(
			{ creator: req.user._id, _id: req.params.id },
			newPost,
			{ returnOriginal: false, runValidators: true }
		);
		if (!post)
			res.status(500).json({
				responseTime: new Date().toISOString(),
				responseMessage: "Post not found / Unauthorized",
				data: {},
			});
		else
			res.json({
				responseTime: new Date().toISOString(),
				responseMessage: "updatePost successfully",
				data: { post },
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
 * '/api/posts/{id}/like':
 *  post:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Post Controller
 *     summary: Like Post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *      200:
 *        description: Ok
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Post'
 *      401:
 *        description: Unauthorized
 *      500:
 *        description: Server Error
 */
const likePost = async (req, res, next) => {
	try {
		let post = await Post.findById(req.params.id);
		if (!post) {
			res.status(404).json({ err: "Post not found" });
			return;
		}
		let like = await Like.findOne({
			postId: req.params.id,
			likedBy: req.user._id,
		});
		if (!like) {
			like = new Like({ postId: req.params.id, likedBy: req.user._id });
			await like.save();
		}
		await post.save();
		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "likePost successfully",
			data: { post },
		});
	} catch (err) {
		res.status(401).json({
			responseTime: new Date().toISOString(),
			responseMessage: err,
			data: null,
		});
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * '/api/posts/{id}/unlike':
 *  post:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Post Controller
 *     summary: Unike Post
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

const unlikePost = async (req, res, next) => {
	try {
		let post = await Post.findById(req.params.id);
		if (!post) {
			res.status(404).json({ err: "Post not found" });
			return;
		}
		let like = await Like.findOne({
			postId: req.params.id,
			likedBy: req.user._id,
		});
		if (like) {
			await Like.deleteOne({ _id: like._id });
		}
		await post.save();
		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "unlikePost successfully",
			data: { post },
		});
	} catch (err) {
		res.status(401).json({
			responseTime: new Date().toISOString(),
			responseMessage: err,
			data: null,
		});
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @openapi
 * '/api/posts/{id}/comment':
 *   post:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Post Controller
 *     summary: Create Comment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: repliedTo
 *         required: false
 *         schema:
 *           type: string
 *     requestBody:
 *      required: true
 *      content:
 *       application/json:
 *          schema:
 *           $ref: '#/components/schemas/Comment'
 *     responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Comment'
 *      401:
 *        description: Unauthorized
 *      500:
 *        description: Server Error
 */
const createComment = async (req, res, next) => {
	try {
		let post = await Post.findById(req.params.id);
		if (!post) {
			res.status(401).json({
				responseTime: new Date().toISOString(),
				responseMessage: "Post not found",
				data: null,
			});
			return;
		}
		let repliedTo = req.query.repliedTo || undefined;
		let rplyComment = await Comment.findById(repliedTo);
		if (
			(repliedTo && !rplyComment) ||
			(repliedTo && rplyComment.postId.equals(req.params.id) === false)
		) {
			res.status(401).json({
				responseTime: new Date().toISOString(),
				responseMessage: "Comment not found",
				data: null,
			});
			return;
		}
		let comment = new Comment({
			...req.body,
			repliedTo: repliedTo,
			postId: req.params.id,
			userId: req.user._id,
			replyCount: 0,
		});

		await comment.save();
		await post.save();
		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "createComment successfully",
			data: { comment },
		});
		if (repliedTo) {
			rplyComment.replyCount++;
			await rplyComment.save();
		}
	} catch (err) {
		res.status(401).json({
			responseTime: new Date().toISOString(),
			responseMessage: err,
			data: null,
		});
		console.log(err);
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 * @openapi
 * '/api/posts/liked-posts':
 *  get:
 *     security:
 *     - Authorization: []
 *     tags:
 *     - Post Controller
 *     summary: Get Liked Posts
 *     responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: string
 *      401:
 *        description: Unauthorized
 *      500:
 *        description: Server Error
 */
const getLikedPosts = async (req, res, next) => {
	try {
		let likedPosts = (await Like.find({ likedBy: req.user._id })).map(
			(x) => x.postId
		);
		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "getLikedPosts successfully",
			data: { likedPosts },
		});
	} catch (err) {
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 * @openapi
 * '/api/posts/feed':
 *  get:
 *
 *    tags:
 *    - Post Controller
 *    summary: Get Feed
 *    parameters:
 *      - in: query
 *        name: limit
 *        required: false
 *        schema:
 *          type: number
 *          default: 25
 *      - in: query
 *        name: skip
 *        required: false
 *        schema:
 *          type: number
 *          default: 0
 *
 *    responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  post:
 *                    type: object
 *                    $ref: '#/components/schemas/Post'
 *                  locked:
 *                    type: boolean
 *                  userHandle:
 *                    type: string
 *                  userProfilePicture:
 *                    type: string
 *                  userRole:
 *                    type: string
 *
 *      500:
 *        description: Server Error
 */
const getFeed = async (req, res, next) => {
	try {
		let posts = [];
		let limit = req.query.limit || 25;
		let skip = req.query.skip || 0;
		if (!req.user) {
			posts = [
				...(await Post.find({ tier: null })
					.sort({ date: -1 })
					.limit(limit / 2 + (limit % 2))
					.skip(skip / 2 + (skip % 2))
					.populate("creator")),
				...(await Post.find({ tier: { $ne: null } })
					.sort({ date: -1 })
					.limit(limit / 2 + (limit % 2))
					.skip(skip / 2 + (skip % 2))
					.populate("creator")),
			];
			posts = posts
				.map((post) => post.toObject())
				.map((post) => {
					let ret = post;
					let user = post.creator;
					post.creator = user._id;
					console.log(user, post.creator);
					return {
						post: ret,
						locked: !!post.tier,
						userHandle: user.handle,
						userProfilePicture: user.profilePicture,
						userRole: user.role,
					};
				});
		} else {
			posts = [
				...(await Post.find({ tier: null })
					.sort({ date: -1 })
					.limit(limit / 2 + (limit % 2))
					.skip(skip / 2 + (skip % 2))
					.populate("creator")),
				...(await Post.find({ tier: { $ne: null } })
					.sort({ date: -1 })
					.limit(limit / 2 + (limit % 2))
					.skip(skip / 2 + (skip % 2))
					.populate("creator")),
			];
			posts = posts
				.map((post) => post.toObject())
				.map((post) => {
					let ret = post;
					let user = post.creator;
					post.creator = user._id;
					console.log(user, post.creator);
					return {
						post: ret,
						locked: !!post.tier,
						userHandle: user.handle,
						userProfilePicture: user.profilePicture,
						// userIsVerified: user.isVerified,
						userRole: user.role,
					};
				});
		}
		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "getFeed successfully",
			data: { posts },
		});
	} catch (err) {
		console.log(err);
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 * @openapi
 * '/api/posts/{id}/comments':
 *  get:
 *     tags:
 *     - Post Controller
 *     summary: Get Comments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in : query
 *         name: limit
 *         required: false
 *         schema:
 *           type: number
 *           default: 25
 *       - in : query
 *         name: skip
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  comment:
 *                    type: object
 *                    $ref: '#/components/schemas/Comment'
 *                  userHandle:
 *                    type: string
 *                  userProfilePicture:
 *                    type: string
 *                  userRole:
 *                    type: string
 */
const getComments = async (req, res, next) => {
	try {
		let skip = req.query.skip || 0;
		let limit = req.query.limit || 25;
		let comments = await Comment.find({
			postId: req.params.id,
			repliedTo: { $eq: null },
		})
			.limit(limit)
			.skip(skip)
			.populate("userId");
		comments = comments
			.map((comment) => comment.toObject())
			.map((comment) => {
				let ret = comment;
				let user = comment.userId;
				comment.userId = user._id;
				return {
					comment: ret,
					userHandle: user.handle,
					userProfilePicture: user.profilePicture,
					userRole: user.role,
				};
			});
		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "getComments successfully",
			data: { comments },
		});
	} catch (err) {
		console.log(err);
		next(err);
	}
};

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {*} next
 * @openapi
 * '/api/posts/{id}/comments/{commId}/replies':
 *  get:
 *     tags:
 *     - Post Controller
 *     summary: Get Replies
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commId
 *         required: true
 *         schema:
 *           type: string
 *       - in : query
 *         name: limit
 *         required: false
 *         schema:
 *           type: number
 *           default: 25
 *       - in : query
 *         name: skip
 *         required: false
 *         schema:
 *           type: number
 *     responses:
 *      200:
 *        description: Ok
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  comment:
 *                    type: object
 *                    $ref: '#/components/schemas/Comment'
 *                  userHandle:
 *                    type: string
 *                  userProfilePicture:
 *                    type: string
 *                  userRole:
 *                    type: string
 */
const getReplies = async (req, res, next) => {
	try {
		let skip = req.query.skip || 0;
		let limit = req.query.limit || 25;
		let comments = await Comment.find({ repliedTo: req.params.commId })
			.skip(skip)
			.limit(limit)
			.populate("userId");

		comments = comments
			.map((comment) => comment.toObject())
			.map((comment) => {
				let ret = comment;
				let user = comment.userId;
				comment.userId = user._id;
				return {
					comment: ret,
					userHandle: user.handle,
					userProfilePicture: user.profilePicture,
					userRole: user.role,
				};
			});
		res.json({
			responseTime: new Date().toISOString(),
			responseMessage: "getReplies successfully ",
			data: { comments },
		});
	} catch (err) {
		next(err);
	}
};

router.get("/feed", getFeed);
router.post("/", requireToken, exceptRoles(["Consumer"]), createPost);
router.get("/liked-posts", requireToken, getLikedPosts);
router.get("/:id", getPostById);
router.put("/:id", requireToken, updatePost);
router.post("/:id/like", requireToken, likePost);
router.post("/:id/unlike", requireToken, unlikePost);
router.post("/:id/comment", requireToken, createComment);
router.get("/:id/comments", getComments);
router.get("/:id/comments/:commId/replies", getReplies);

module.exports = router;
