import express from "express";
import cors from "cors";
import { db } from "./utils/firestore.js";
import { matchUserAndRooms } from "./matcher.js";

const app = express();
app.use(cors({
  origin: "*", // Allow all origins — for dev only
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.post("/match", async (req, res) => {
  try {
    const { currentUser, allUsers, availableRooms } = req.body;

    if (!currentUser || !currentUser.uid) {
      return res.status(400).json({ error: "Missing currentUser.uid" });
    }

    const match = await matchUserAndRooms(currentUser, allUsers, availableRooms);

    await db.collection("matches").doc(currentUser.uid).set(match);

    return res.json({ success: true, ...match });
  } catch (err) {
    console.error("Match Error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});



const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
