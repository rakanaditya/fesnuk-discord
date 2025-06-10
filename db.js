const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database.');
    }
});

db.serialize(() => {
    // Tabel Users
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            login TEXT DEFAULT 'tidak',
            bio TEXT DEFAULT '',
            profile_picture TEXT DEFAULT ''
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating users table:', err.message);
        } else {
            console.log('✅ Users table is ready.');
        }
    });

    // Tabel Friends
    db.run(`
        CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            friend_name TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating friends table:', err.message);
        } else {
            console.log('✅ Friends table is ready.');
        }
    });

    // Tabel Posts
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT DEFAULT '',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating posts table:', err.message);
        } else {
            console.log('✅ Posts table is ready.');
        }
    });

    // Tabel Notifications
    db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating notifications table:', err.message);
        } else {
            console.log('✅ Notifications table is ready.');
        }
    });

    // Tabel Comments
    db.run(`
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating comments table:', err.message);
        } else {
            console.log('✅ Comments table is ready.');
        }
    });

    // 🔹 Tabel Events
    db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            date TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating events table:', err.message);
        } else {
            console.log('✅ Events table is ready.');
        }
    });
});

// 🔄 **Hapus notifikasi lebih dari seminggu**
cron.schedule('0 0 * * 0', () => { // Setiap minggu (Minggu jam 00:00)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    db.run(`DELETE FROM notifications WHERE timestamp < ?`, [oneWeekAgo.toISOString()], (err) => {
        if (err) {
            console.error('❌ Gagal menghapus notifikasi lama:', err.message);
        } else {
            console.log('✅ Notifikasi lebih dari seminggu telah dihapus.');
        }
    });
});

// 🚀 **Tutup database dengan aman saat bot berhenti**
process.on('exit', () => {
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database connection closed.');
        }
    });
});

module.exports = db;
