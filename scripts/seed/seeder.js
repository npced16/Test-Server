const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Models
const User = require("../../models/user");
const Post = require("../../models/post");
const Meal = require("../../models/meal");
const Comment = require("../../models/comment");
const Like = require("../../models/like");
const Tier = require("../../models/tier");
const imagesMap = require("./images.json");

function getImage(name) {
  return imagesMap[name] || null;
}
async function loadJSON(filename) {
  const filePath = path.resolve(__dirname, "data", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function seed() {
  await mongoose.connect(process.env.DATABASE_URI);

  console.log("🗑 Clearing old data...");
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Meal.deleteMany({}),
    Comment.deleteMany({}),
    Like.deleteMany({}),
    Tier.deleteMany({}),
  ]);

  // --- USERS ---
  const usersData = await loadJSON("users.json");
  const users = await User.insertMany(
    usersData.map((u, idx) => ({
      ...u,
      handle:
        u.handle ||
        `${u.firstName.toLowerCase()}${u.lastName.toLowerCase()}${idx}`,
    }))
  );
  const usersMap = Object.fromEntries(users.map((u) => [u.email, u]));

  console.log(`👤 Inserted ${users.length} users`);

  // --- TIERS ---
  const tiersData = await loadJSON("tiers.json");
  // Assign all tiers to the *first creator* (Jane Doe, Mark Green, Lucy Brown)
  const creator = users.find((u) => ["Creator", "Specialist"].includes(u.role));
  const tiers = await Tier.insertMany(
    tiersData.map((t) => ({ ...t, creator: creator._id }))
  );
  const tiersMap = Object.fromEntries(tiers.map((t) => [t.title, t]));

  console.log(`Inserted ${tiers.length} tiers`);

  // --- POSTS + MEALS ---
  const postsData = await loadJSON("posts.json");
  const posts = [];
  for (const post of postsData) {
    let meal = null;
    if (post.type === "Meal" && post.meal) {
      meal = await new Meal({
        ...post.meal,
        creator: creator._id,
        media: (post.meal.media || []).map((name) => {
          const url = getImage(name);
          if (!url) {
            throw new Error(`Image not found in images.json: ${name}`);
          }
          return url;
        }),
        steps: (post.meal.steps || []).map((step) => ({
          ...step,
          media: (step.media || []).map(getImage).filter(Boolean),
        })),
      }).save();
    }
    const newPost = await new Post({
      title: post.title,
      description: post.description,
      type: post.type,
      meal: meal?._id,
      creator: creator._id,
      media: (post.media || []).map(getImage).filter(Boolean),
    }).save();

    posts.push(newPost);
  }
  const postsMap = Object.fromEntries(posts.map((p) => [p.title, p]));

  console.log(`📝 Inserted ${posts.length} posts (with meals)`);

  // --- LIKES ---
  const likesData = await loadJSON("likes.json");
  for (const like of likesData) {
    if (!postsMap[like.postTitle] || !usersMap[like.userEmail]) continue;
    await new Like({
      postId: postsMap[like.postTitle]._id,
      likedBy: usersMap[like.userEmail]._id,
    }).save();
  }
  console.log(`👍 Inserted ${likesData.length} likes`);

  // --- COMMENTS ---
  const commentsData = await loadJSON("comments.json");
  for (const c of commentsData) {
    if (!postsMap[c.postTitle] || !usersMap[c.userEmail]) continue;
    await new Comment({
      postId: postsMap[c.postTitle]._id,
      userId: usersMap[c.userEmail]._id,
      message: c.message,
    }).save();
  }
  console.log(`💬 Inserted ${commentsData.length} comments`);

  // --- SUBSCRIPTIONS ---
  const subscriptionsData = await loadJSON("subscriptions.json");
  for (const sub of subscriptionsData) {
    const user = usersMap[sub.userEmail];
    if (!user) continue;

    const subscribedTo = [];
    for (const tierTitle of sub.tiers) {
      if (tiersMap[tierTitle]) {
        subscribedTo.push(tiersMap[tierTitle]._id);
      }
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { subscribed: subscribedTo } }
    );
  }
  console.log(`🔔 Applied ${subscriptionsData.length} subscriptions`);

  console.log("✅ Database seeded successfully from JSON");
  process.exit();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
