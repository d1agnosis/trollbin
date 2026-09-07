const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) return cachedClient;
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    return client;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { nickname, password } = req.body;
        const client = await connectToDatabase();
        const db = client.db('trollbin');
        const usersCollection = db.collection('users');

        const user = await usersCollection.findOne({ nickname, password });
        if (!user) {
            return res.status(400).json({ error: 'Неверный никнейм или пароль' });
        }

        return res.status(200).json({ success: true, userId: user.id });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};