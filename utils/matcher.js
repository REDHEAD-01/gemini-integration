import fetch from "node-fetch";
import { db } from "./utils/firestore.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openai/gpt-3.5-turbo";

import fetch from "node-fetch";
import { db } from "./utils/firestore.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openai/gpt-3.5-turbo";

export async function matchUserAndRooms(currentUserRaw, allUsersRaw, availableRoomsRaw) {
  // ✅ Only send essential fields
  const currentUser = {
    uid: currentUserRaw.uid,
    name: currentUserRaw.name,
    preferences: currentUserRaw.preferences || {},
    city: currentUserRaw.city
  };

  const filteredUsers = allUsersRaw
    .filter(u => u.uid !== currentUserRaw.uid)
    .map(u => ({
      uid: u.uid,
      name: u.name,
      preferences: u.preferences || {},
      city: u.city
    }));

  const availableRooms = availableRoomsRaw.map(room => ({
  roomId: room.id || room.roomId,
  type: room.type,
  price: room.price,
  city: room.location || room.city
}));


  const prompt = `You are a roommate matchmaker. Match the current user to:
- One best roommate from the list of users.
- One best room from the list of rooms in user's city.
Return only a JSON like this:

{
  "matchedRoommateUid": "UID_HERE",
  "matchedRoomId": "ROOM_ID_HERE"
}

Current User:
${JSON.stringify(currentUser, null, 2)}

Available Users:
${JSON.stringify(filteredUsers, null, 2)}

Available Rooms:
${JSON.stringify(availableRooms, null, 2)}
`;

  console.log("Prompt Length:", prompt.length); // 👈 debug length

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25 sec timeout

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://my-room-match.com",
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: prompt }
      ]
    })
  }).catch(err => {
    throw new Error("OpenRouter Fetch Error: " + err.message);
  });

  clearTimeout(timeout);

  if (!response.ok) {
    const error = await response.text();
    throw new Error("Match Error: " + error);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("No content in OpenRouter response");

  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error("Failed to parse OpenRouter response: " + content);
  }
}
