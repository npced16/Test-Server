const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
require("dotenv").config();

const loginAndGetToken = async () => {
	try {
		const response = await axios.post("http://localhost:8080/api/login", {
			email: process.env.TEST_USER_EMAIL,
			password: process.env.TEST_USER_PASSWORD,
		});
		return response.data.data.token;
	} catch (err) {
		console.error("Login failed:", err.response?.data || err.message);
		process.exit(1);
	}
};


const API_ENDPOINT = "http://localhost:8080/api/media/upload";

const urls = [];

const uploadImage = async (filePath, AUTH_TOKEN) => {
	const fileName = path.basename(filePath);
	const imageData = fs.createReadStream(filePath);
	const form = new FormData();
	form.append("image", imageData, fileName);

	try {
		const response = await axios.post(API_ENDPOINT, form, {
			headers: {
				...form.getHeaders(),
				Authorization: `Bearer ${AUTH_TOKEN}`,
			},
		});
		const url = response.data.data.url;
		urls.push(url);
		console.log(`Uploaded: ${fileName}`);
		console.log(`URL: ${url}\n`);
	} catch (err) {
		console.error(`Failed: ${fileName}`, err.response?.data || err.message);
	}
};

const main = async () => {
	const imageDir = path.resolve(__dirname, "../seed/images");
	const outputFile = path.resolve(__dirname, "../seed/images.json");
	const files = fs.readdirSync(imageDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));

	const AUTH_TOKEN = await loginAndGetToken();

	if (!files.length) {
		console.log("No images found.");
		return;
	}

	for (const file of files) {
		await uploadImage(path.join(imageDir, file), AUTH_TOKEN);
	}

	fs.writeFileSync(outputFile, JSON.stringify(urls, null, 2));
	console.log(`📁 Saved ${urls.length} image URLs to seed/images.json`);

};

main();
