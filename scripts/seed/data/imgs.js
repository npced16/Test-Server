// const images = [
// 	"https://storage.googleapis.com/only_plans_images_bucket_28294075-1f2d-4568-9c93-66035260a389/1080x566.jpg",
// 	"https://storage.googleapis.com/only_plans_images_bucket_28294075-1f2d-4568-9c93-66035260a389/1080x1350.jpg",
// 	"https://storage.googleapis.com/only_plans_images_bucket_28294075-1f2d-4568-9c93-66035260a389/1080x1080.jpg",
// 	"https://storage.googleapis.com/only_plans_images_bucket_28294075-1f2d-4568-9c93-66035260a389/14-days-clean-eating-meal-plan-1200-lede-601736337d914519bb5bf8eb83540da1.jpg",
// ];
const fs = require("fs");
const path = require("path");

let images = [];
try {
	const file = path.resolve(__dirname, "../images.json");
	images = JSON.parse(fs.readFileSync(file, "utf-8"));
} catch (e) {
	console.error("⚠️ Could not load image list:", e.message);
}

module.exports = {
	images,
	getRandomImage: () => {
		if (!images.length) return "https://placehold.co/600x400?text=No+Image";
		return images[Math.floor(Math.random() * images.length)];
	},
};
