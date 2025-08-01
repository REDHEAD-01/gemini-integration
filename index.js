import express from "express";
import cors from "cors";
import { db } from "./utils/firestore.js";
import { matchUserAndRooms } from "./matcher.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/match", async (req, res) => {
  try {
    const { currentUser } = req.body;

    const allUsersSnap = await db.collection("users").get();
    const allUsers = allUsersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    const roomSnap = await db.collection("rooms").get();
    const allRooms = roomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const availableRooms = allRooms.filter(room =>
      room.status?.toLowerCase() === "available" &&
      room.location?.toLowerCase().includes(currentUser.city?.toLowerCase() || "")
    );

    const result = await matchUserAndRooms(currentUser, allUsers, availableRooms);

    res.json({ success: true, match: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/confirm", async (req, res) => {
  try {
    const { currentUserUid, matchedRoomId, matchedRoommateUid } = req.body;
    await db.collection("matches").doc(currentUserUid).set({
      matchedRoomId,
      matchedRoommateUid,
      timestamp: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
