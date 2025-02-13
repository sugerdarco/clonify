import express from "express";
import {generateSlug} from "random-word-slugs";

const app = express()
const port = 3000

app.use(express.json())

app.post('/project', async (req, res) => {
  const {gitURL, slug} = req.body
  const projectSlug = slug ? slug.toLowerCase() : generateSlug();

  // TODO: create container and spin it
})

app.listen(port, () => {
  console.log(`API Server listening on port ${port}`)
})