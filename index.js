import express from "express";
import cors from "cors";
import { db } from "./utils/firestore.js";
import { matchUserAndRooms } from "./matcher.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/match", async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "Missing UID in request body" });
    }

    // ✅ Fetch current user
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    const currentUser = { uid: userDoc.id, ...userDoc.data() };

    // ✅ Fetch all other users
    const usersSnap = await db.collection("users").get();
    const allUsers = usersSnap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    // ✅ Fetch available rooms in same city
    const roomsSnap = await db.collection("availableRooms")
      .where("city", "==", currentUser.city)
      .get();

    const availableRooms = roomsSnap.docs.map(doc => ({
      roomId: doc.id,
      ...doc.data()
    }));

    // ✅ AI Matching
    const match = await matchUserAndRooms(currentUser, allUsers, availableRooms);

    // ✅ Save to Firestore under matches/{uid}
    await db.collection("matches").doc(uid).set(match);

    // ✅ Return result
    return res.json({ success: true, match });

  } catch (err) {
    console.error("Match Error:", err.message);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
