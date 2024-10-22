const ftp = require('basic-ftp');
require('dotenv').config();

async function uploadFiles() {
    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        await client.access({
            host: '192.168.1.1',
            port: 21,
            user: 'webaddons',
            password: process.env.FTP_PASSWORD,
            secure: false
        });

        await client.uploadFrom('dist/xray-ui.asp', '/jffs/addons/xray-ui/xray-ui.asp');
        await client.uploadFrom('dist/app.js', '/jffs/addons/xray-ui/app.js');
        await client.uploadFrom('dist/xrayui', '/jffs/scripts/xrayui');

        console.log('Files uploaded successfully');
    } catch (err) {
        console.error('Error uploading files:', err);
    } finally {
        client.close();
    }
}

uploadFiles();