const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const md5 = require("md5");
const validateEmail = (email) => {
	const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	return re.test(email);
};
// Note: all mongoose schemas have _id by default
//TODO: Add meal Plans and OfferedTiers, And Change Subscribed

const ProgrammeSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
		},
		publishingOptions: {
			type: String,
			default: 0, /// basic: public (0) private ( 100 )
		},
		creater: {
			type: String,
			required: true,
		},
		contents: {
			type: Array,
			default: [],
		},
	},
	{
		versionKey: false,
		toJSON: {
			transform: function (doc, ret, options) {
				return ret;
			},
		},
	}
);

const Programme = mongoose.model("Programme", ProgrammeSchema);

module.exports = Programme;
