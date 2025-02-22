import express from "express";
import {generateSlug} from "random-word-slugs";
import {ECSClient, RunTaskCommand} from "@aws-sdk/client-ecs";
import Redis from "ioredis";
import {Server} from "socket.io";

const app = express()
const port = 3000
const subscriber = new Redis('')
const io = new Server({cors: '*'})

app.use(express.json())
io.on('connection', (socket) => {
  socket.on('subscribe', (channel) => {
    socket.join(channel)
    socket.emit('message', `Joined ${channel}`)
  })
})



app.post('/project', async (req, res) => {
  const {gitURL, slug} = req.body
  const projectSlug = slug ? slug.toLowerCase() : generateSlug();

  const config = {CLUSTER: '', TASK: ''}
  const ecsClient = new ECSClient({
    region: process.env.ECS_REGION,
    credentials: {
      accessKeyId: process.env.ECS_ACCESS_KEY_ID,
      secretAccessKey: process.env.ECS_SECRET_ACCESS_KEY,
    }
  })

  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: 'FARGATE',
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: 'ENABLED',
        subnets: ['', ''],
        securityGroups: ['']
      }
    },
    overrides: {
      containerOverrides: [
        {
          name: 'builder-image',
          environment: [
            {name: 'GIT_REPOSITORY_URL', value: gitURL},
            {name: 'PROJECT_ID', value: projectSlug}
          ]
        }
      ]
    }
  });
  await ecsClient.send(command);

  return res.status(200).json({status: 'queued', data: {projectSlug, url:` http://${projectSlug}.localhost:8000`}})
});

async function initRedisSubscribe() {
  console.log('Subscribe to logs...')
  subscriber.psubscribe('logs:*')
  subscriber.on('pmessage', (pattern, channel, message) => {
    io.to(channel).emit('message', message)
  })
}
initRedisSubscribe();

app.listen(port, () => {
  console.log(`API Server listening on port ${port}`)
})