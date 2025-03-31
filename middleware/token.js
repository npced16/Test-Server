const User = require("../models/user");
const jwt = require("jsonwebtoken");
const parseToken = async (req, res, next) => {
	let token =
		req.headers.authorization &&
		req.headers.authorization.match(/^Bearer (.*)$/);
	if (token && token[1]) {
		token = token[1];
		try {
			let payload = jwt.verify(token, process.env.JWT_SECRET);
			req.user = await User.findById(payload.userId);
			next();
		} catch (err) {
			if (err instanceof jwt.TokenExpiredError) {
				res.status(401).json({
					data: null,
					responseTime: new Date().toISOString(),
					responseMessage: "Token expired",
				});
			} else {
				res.status(401).json({
					data: null,
					responseTime: new Date().toISOString(),
					responseMessage: "Unauthorized",
				});
			}
		}
	} else {
		next();
	}
};

const requireToken = (req, res, next) => {
	if (!req.user) {
		res.status(401).json({
			data: null,
			responseTime: new Date().toISOString(),
			responseMessage: "Unauthorized",
		});
	} else {
		next();
	}
};

module.exports = {
	requireToken,
	parseToken,
};
