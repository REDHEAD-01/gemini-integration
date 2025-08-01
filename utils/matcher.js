import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function matchUserAndRooms(allUsers, currentUser, availableRooms) {
    const prompt = `
You are RoomMatch AI. Help match the best roommate and room for a female user based on her survey and Omnidim call.
Current User:
${JSON.stringify(currentUser, null, 2)}

Available Users:
${JSON.stringify(allUsers, null, 2)}

Available Rooms:
${JSON.stringify(availableRooms, null, 2)}

Recommend:
- Best roommate match (with reasons)
- Best room (based on budget, location, needs)
- Match Score
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return { result: text };
}
