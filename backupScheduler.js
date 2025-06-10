const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const { AttachmentBuilder } = require('discord.js');
const now = new Date();
let client = null;

function setClient(botClient) {
  client = botClient;
}

// Konversi bulan ke nama lokal
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const day = String(now.getDate()).padStart(2, '0');         // 01
const monthName = monthNames[now.getMonth()];               // Juni
const year = now.getFullYear();                             // 2025

const formattedDate = `${day}-${monthName}-${year}`;        // 01-Juni-2025
const fileName = `backup_${formattedDate}.json`;



// Jadwal: Setiap tanggal 1 jam 00:00
cron.schedule('0 0 1 * *', () => {
  if (!client) return console.warn('[BACKUP] Client belum di-set.');
  doMonthlyBackup(client);
});

function doMonthlyBackup(client) {
  db.all('SELECT * FROM users', [], async (err, rows) => {
    if (err) {
      console.error('[BACKUP] Gagal mengambil data:', err);
      return;
    }

    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10); // 2025-06-01
    const monthFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // 2025-06

    const backupDir = path.join(__dirname, 'backup');
    const archiveDir = path.join(backupDir, 'archive', `${monthName}-${year}`); 
    const fileName = `monthly_backup_${timestamp}.json`;
    

 //  const archiveDir = path.join(backupDir, 'archive', `${monthName}-${year}`); 
 //  const filePath = path.join(archiveDir, fileName);




    // Buat folder arsip jika belum ada
    fs.mkdirSync(archiveDir, { recursive: true });

    const filePath = path.join(archiveDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));

    console.log(`[BACKUP] Disimpan & diarsip: ${filePath}`);

    const targetChannel = client.channels.cache.find(ch => ch.name === 'log-fb-admin');
    if (!targetChannel) {
      console.warn('[BACKUP] Channel "log-fb-admin" tidak ditemukan.');
      return;
    }



    const file = new AttachmentBuilder(filePath);

    try {
      await targetChannel.send({
        content: `📦 **Backup Bulanan** (${monthFolder})`,
        files: [file],
      });
      console.log('[BACKUP] File dikirim ke log-fb-admin.');
    } catch (err) {
      console.error('[BACKUP] Gagal mengirim file ke channel:', err);
    }
  });
}

module.exports = { setClient };
