/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
const ftp = require("basic-ftp");

require("dotenv").config();

async function uploadFiles() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: process.env.FTP_ROUTER,
      user: process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false
    });
    console.log("Ensuring directories exist...");
    await client.ensureDir("/addons/xrayui/webapp");
    await client.ensureDir("/addons/xrayui/webapp/assets");
    await client.ensureDir("/addons/xrayui/webapp/cgi-bin");

    await client.uploadFrom("dist/index.html", "/addons/xrayui/webapp/index.html");
    await client.uploadFrom("dist/server.conf", "/addons/xrayui/webapp/server.conf");
    await client.uploadFromDir("dist/assets", "/addons/xrayui/webapp/assets");
    await client.uploadFromDir("dist/cgi-bin", "/addons/xrayui/webapp/cgi-bin");

    await client.send("SITE CHMOD 755 /scripts/xrayui");

    console.log("Files uploaded successfully");
  } catch (err) {
    console.error("Error uploading files:", err);
  } finally {
    client.close();
  }
}

uploadFiles();
