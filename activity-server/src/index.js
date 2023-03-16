const express = require('express')
const superagent = require('superagent')

const config = require('../../config.json')

const fs = require('fs')
const https = require('https')
const path = require('path')

//https certificates
const key = fs.readFileSync(path.join(__dirname, "../cert/localhost-key.pem"), "utf-8");
const cert = fs.readFileSync(path.join(__dirname, "../cert/localhost.pem"), "utf-8");

//express server

const app = express()
const port = 3000

const jwt = require('jwt-simple');

app.disable('x-powered-by')
app.disable('etag')
app.use(express.json())

//Static Content

// Built activity application
app.use('/', express.static(path.join(__dirname, "../../dist")))
// Static assets not embedded within the actual activity
app.use('/', express.static(path.join(__dirname, "../../activity-assets/static")))

//Authorization Route
app.get('/embedded/_a/:code', async function (req, res) {
  try {
    let auth = await superagent.post(`https://discord.com/api/v10/oauth2/token`)
      .type('form')
      .send({
        'client_id': config.application.id,
        'client_secret': config.application.secret,
        'grant_type': 'authorization_code',
        'code': req.params.code
      });
    let user = await superagent.get(`https://discord.com/api/v10/oauth2/@me`)
      .set('Authorization', `Bearer ${auth.body.access_token}`)
    // Create auth token
    const payload = {
      user: user.body.user,
      application: {
        id: config.application.id,
        name: config.activity.name
      },
      created_at: Date.now()
    };
    var token = jwt.encode(payload, config.backend.secret);
    return res.status(200).json({
      token: token,
      access_token: auth.body.access_token,
      scope: auth.body.scope
    })
  } catch (e) {
    console.log(e)
    return res.status(400).send('Authorization Failed')
  }
})

app.get('*', async function (req, res) {
  return res.status(404).send('Not Found')
})

https.createServer({ key, cert }, app).listen(port)
console.log(`Activity available at \x1b[36m\x1b[4mhttps://localhost:${port}\x1b[0m.`)