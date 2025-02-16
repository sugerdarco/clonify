import Redis from "ioredis";
import path from "path";
import { exec } from "child_process";
import fs from "fs";
import mime from "mime-types";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";

const redis = new Redis('');

const s3Client = new S3Client({
  region: '',
  credentials: {
    accessKeyId: '',
    secretAccessKey: ''
  }
})

const Project_id = process.env.PROJECT_ID;

function publishLog(log) {
  redis.publish(`logs:${Project_id}`, JSON.stringify({log}))

}

async function init() {
  console.log("Initializing...");
  publishLog("Build Started....")
  const outDirPath = path.join(__dirname, 'output');

  // create a process
  const proc = exec(`cd ${outDirPath} && num install && npm run build`);
  proc.stdout.on('data', data => {
    console.log(data.toString());
    publishLog(data.toString());
  })
  proc.stderr.on('data', data => {
    console.log("Error", data.toString());
    publishLog("error: ", data.toString());
  })
  proc.on('close', code => {
    console.log('Build Finished');
    publishLog("Build Finished");
    const distFolderPath = path.join(__dirname, 'output', 'dist');
    const distFolderContents = fs.readFileSync(distFolderPath, {
      recursive: true, encoding: 'utf8'
    });

    publishLog("Upload started");
    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file)
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log('uploading file: ' + filePath);
      publishLog("Uploading", file);

      const command = new PutObjectCommand({
        Bucket: 'build-project-outputs',
        key: `__output/${Project_id}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath)
      });

      s3Client.send(command)
      console.log("uploaded", file)
      publishLog("uploaded", file)
    }

    console.log("Build Finished Completed");
    publishLog("Build Finished Completed");
  })
}
init();