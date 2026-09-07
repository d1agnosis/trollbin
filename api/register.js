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
        const { nickname, password, avatar } = req.body;
        if (!nickname || !password) {
            return res.status(400).json({ error: 'Заполните никнейм и пароль' });
        }

        const client = await connectToDatabase();
        const db = client.db('trollbin');
        const usersCollection = db.collection('users');

        const existing = await usersCollection.findOne({ nickname });
        if (existing) {
            return res.status(400).json({ error: 'Такой никнейм уже занят' });
        }

        const newUser = {
            id: Date.now().toString(),
            nickname,
            password,
            avatar: avatar || '',
            joined: new Date().toISOString().split('T')[0]
        };

        await usersCollection.insertOne(newUser);
        return res.status(200).json({ success: true, user: newUser });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};