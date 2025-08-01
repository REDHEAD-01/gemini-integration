import fetch from "node-fetch";
import { db } from "./utils/firestore.js";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openai/gpt-3.5-turbo";

export async function matchUserAndRooms(currentUser, allUsers, availableRooms) {
  const filteredUsers = allUsers.filter(u => u.uid !== currentUser.uid);

  const prompt = `You are a roommate matchmaker. Your job is to analyze the preferences of the current user and match them with the most compatible roommates and rooms.

Current User:
${JSON.stringify(currentUser, null, 2)}

Available Users to Match:
${JSON.stringify(filteredUsers, null, 2)}

Available Rooms in the selected city:
${JSON.stringify(availableRooms, null, 2)}

Rules:
- Suggest 1 best roommate from users.
- Suggest 1 best room from the list.
- Be brief. Only respond with a JSON object in this format:
{
  "matchedRoommateUid": "UID_HERE",
  "matchedRoomId": "ROOM_ID_HERE"
}`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://my-room-match.com", // Optional
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error("Match Error: " + error);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error("No response from OpenRouter");

  return JSON.parse(content);
}
