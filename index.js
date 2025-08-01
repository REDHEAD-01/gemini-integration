import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { matchUserAndRooms } from './utils/matcher.js';
import { addMatchToFirestore } from './utils/firestore.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post('/match', async (req, res) => {
    try {
        const { allUsers, currentUser, availableRooms } = req.body;
        const result = await matchUserAndRooms(allUsers, currentUser, availableRooms);
        res.json(result);
    } catch (error) {
        console.error('Match Error:', error);
        res.status(500).json({ error: 'AI Match failed' });
    }
});

app.post('/confirm', async (req, res) => {
    try {
        const { matchData } = req.body;
        await addMatchToFirestore(matchData);
        res.json({ message: 'Match confirmed and stored successfully' });
    } catch (error) {
        console.error('Firestore Error:', error);
        res.status(500).json({ error: 'Failed to store match data' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
