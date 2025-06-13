const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const db = require('./db');

let client = null;

function setClient(botClient) {
  client = botClient;
}

// Nama bulan lokal
const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// 🔁 Backup setiap month
cron.schedule('0 0 1 * *', () => {
  if (!client) return console.warn('[BACKUP] Client belum di-set.');
  doMinuteBackup(client);
});

function doMinuteBackup(client) {
  db.all('SELECT * FROM users', [], async (err, rows) => {
    if (err) {
      console.error('[BACKUP] Gagal mengambil data:', err);
      return;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '-').slice(0, 16); // Format: 2025-06-13T00-01
    const day = String(now.getDate()).padStart(2, '0');
    const monthName = monthNames[now.getMonth()];
    const year = now.getFullYear();

    const folderName = `${monthName}-${year}`;
    const backupDir = path.join(__dirname, 'backup');
    const archiveDir = path.join(backupDir, 'archive', folderName);
    const fileName = `month_backup_${timestamp}.json`;
    const filePath = path.join(archiveDir, fileName);

    // Simpan file (opsional, bisa juga dihapus jika tidak ingin simpan file lokal)
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
    console.log(`[BACKUP] Disimpan secara lokal: ${filePath}`);

    const CHANNEL_ID = '1381904053599993947'; // ID channel kamu
    const targetChannel = client.channels.cache.get(CHANNEL_ID);

    if (!targetChannel) {
      console.warn(`[BACKUP] Channel dengan ID ${CHANNEL_ID} tidak ditemukan.`);
      return;
    }

    try {
      await targetChannel.send(`✅ **Backup berhasil disimpan** (${timestamp})`);
      console.log('[BACKUP] Pesan status backup terkirim.');
    } catch (err) {
      console.error('[BACKUP] Gagal mengirim pesan ke channel:', err);
    }
  });
}

module.exports = { setClient };
