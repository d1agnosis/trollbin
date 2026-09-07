const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('trollbin');
    cachedDb = db;
    return db;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const nickname = req.body.nickname || req.body.username;
        const password = req.body.password;

        if (!nickname || !password) {
            return res.status(400).json({ message: 'Заполните все поля!' });
        }

        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        const existingUser = await usersCollection.findOne({ nickname });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь уже существует' });
        }

        const result = await usersCollection.insertOne({ 
            nickname, 
            password, 
            createdAt: new Date() 
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Регистрация успешна!', 
            userId: result.insertedId.toString() 
        });
    } catch (error) {
        console.error('Ошибка бэкенда:', error);
        // Возвращаем текст ошибки клиенту, чтобы увидеть её на экране
        return res.status(400).json({ message: 'Ошибка сервера: ' + error.message });
    }
};