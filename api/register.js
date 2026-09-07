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
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Гарантированно получаем тело запроса, даже если Vercel передал его строкой
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                body = {};
            }
        }

        const nickname = body && (body.nickname || body.username);
        const password = body && body.password;

        if (!nickname || !password) {
            return res.status(400).json({ message: 'Заполните все поля!' });
        }

        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Проверяем, существует ли пользователь
        const existingUser = await usersCollection.findOne({ nickname });
        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь уже существует' });
        }

        // Сохраняем пользователя
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
        console.error('Ошибка сервера:', error);
        return res.status(500).json({ message: 'Ошибка сервера: ' + error.message });
    }
};