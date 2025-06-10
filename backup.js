const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./users.db');

db.all(`SELECT * FROM users`, [], (err, rows) => {
  if (err) {
    return console.error('❌ Gagal membaca database:', err);
  }

  fs.writeFileSync('./backup/users_backup.json', JSON.stringify(rows, null, 2));
  console.log('✅ Backup berhasil disimpan ke backup/users_backup.json');
});
