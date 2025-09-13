const path = require("path");
const mongoose = require("mongoose");
const md5 = require("md5"); // if your passwords are hashed with md5
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../../models/user");

async function insertTestUser() {
  await mongoose.connect(process.env.DATABASE_URI);

  const testUser = {
    email: "test.user@example.com",
    firstName: "Test",
    lastName: "User",
    password: md5("test"),
    verified: true,
    role: "Creator",
    handle: "testuser",
    bio: "I am a test user created by script.",
    profilePicture: "",
  };

  // Upsert so it doesn't create duplicates if run multiple times
  const user = await User.findOneAndUpdate(
    { email: testUser.email },
    testUser,
    { new: true, upsert: true }
  );

  console.log("✅ Inserted/Updated test user:", user.email);
  process.exit();
}

insertTestUser().catch((err) => {
  console.error(err);
  process.exit(1);
});
