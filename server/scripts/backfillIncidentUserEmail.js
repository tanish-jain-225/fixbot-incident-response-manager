require("dotenv").config();
const mongoose = require("mongoose");
const Incident = require("../models/Incident");
const User = require("../models/User");

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const incidents = await Incident.find({
    $or: [{ userEmail: { $exists: false } }, { userEmail: "" }, { userEmail: null }],
  }).select("_id userId");

  let updatedCount = 0;

  for (const incident of incidents) {
    const user = await User.findById(incident.userId).select("email");
    if (!user?.email) {
      continue;
    }

    await Incident.updateOne(
      { _id: incident._id },
      { $set: { userEmail: user.email.toLowerCase().trim() } }
    );
    updatedCount += 1;
  }

  console.log(`Backfill complete. Updated incidents: ${updatedCount}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Backfill failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    console.error("Disconnect failed:", disconnectError.message);
  }
  process.exit(1);
});
