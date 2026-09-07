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
    try {
        const client = await connectToDatabase();
        const db = client.db('trollbin');
        const usersCollection = db.collection('users');

        const users = await usersCollection.find({}, { projection: { password: 0, _id: 0 } }).toArray();

        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};