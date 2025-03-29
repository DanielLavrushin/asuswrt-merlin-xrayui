/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const Client = require('ssh2-sftp-client');
require('dotenv').config();

async function uploadFiles() {
  const sftp = new Client();

  try {
    await sftp.connect({
      host: process.env.SFTP_ROUTER,
      port: 22,
      username: process.env.SFTP_USERNAME,
      password: process.env.SFTP_PASSWORD,
      readyTimeout: 3000
    });

    console.log('Connected via SFTP.');

    // Ensure directories exist
    await sftp.mkdir('/jffs/addons/xrayui', true);
    await sftp.mkdir('/jffs/scripts', true);

    // Upload files
    await sftp.fastPut('dist/index.asp', '/jffs/addons/xrayui/index.asp');
    await sftp.fastPut('dist/app.js', '/jffs/addons/xrayui/app.js');
    await sftp.fastPut('dist/xrayui', '/jffs/scripts/xrayui');
    await sftp.fastPut('tools/adsblock/adsblock.sh', '/jffs/addons/xrayui/adsblock');

    // Set executable permissions
    await sftp.chmod('/jffs/scripts/xrayui', '755');
    await sftp.chmod('/jffs/addons/xrayui/adsblock', '755');

    console.log('Files uploaded and permissions set successfully.');
  } catch (err) {
    console.error('Error uploading files via SFTP:', err);
  } finally {
    sftp.end();
  }
}

uploadFiles();
