const { WebSocketServer } = require('ws')
const {User, db} = require('./DB/User')
const express = require('express')
const http = require('http')
const uuid = require('uuid')
const cors = require('cors')
const { Connection, default: mongoose } = require('mongoose')

const port = 8000
const clients = []
const app = express()
app.use(express.json())
app.use(cors())

app.post('/login', (req, res) => {
  const username = req.body.username
  User.findOne({username}).exec()
    .then(user => {
      if(user){
        res.json({ message: 'Username already exists.' })
      } else {
        const token = uuid.v4()
        User.create({
          username,
          token
        }).then(user => {
          res.json(user)
        }).catch(err => res.json(err))
      }
    })
})

app.post('/friends-list', (req, res) => {
  const id = req.body._id
  const token = req.body.token
  User.find({_id: {$ne: id}}).then(users => {
    const friends = users.map(user => ({name: user.username, id: user._id.toString()}))
    res.json(friends)
  })
})

app.post('/logout', (req, res) => {
  const userId = req.body.userId
  const token = req.body.token
  console.log(userId, token);
  User.findOneAndDelete({ _id: userId, token })
    .then(user => {
      wsServer.clients.forEach(client => {
        if(client.locales.userId == userId){
          client.close();
        }
      })
      res.json({message: 'ok'})
    }).catch(err => res.json(err))
})

app.post('/verify-token', (req, res) => {
  const token = req.body.previousToken
  User.findOne({token}).exec()
    .then(user => {
      if(user){
        console.log('token verified');
        res.json(user)
      } else {
        console.log('token not verified');
        res.json({message: 'not verified'})
      }
    })
})

const server = http.createServer(app)

const wsServer = new WebSocketServer({ server })

wsServer.on('connection', (connection) => {
  connection.on('message', (message) => {
    handleMassage(connection, message)
  })
})

const handleMassage = (connection, message) => {
  const msg = JSON.parse(message)
  if(msg.type === 'initialize'){
    initializeConnection(connection, msg)
  } else {
    if(wsServer.clients.size > 1){
      wsServer.clients.forEach(client => {
        if(client.locales.userId != msg.user.userId){
          console.log(client.locales.userId, client.locales.username);
          client.send(JSON.stringify(msg))
        }
      })
    }else {
      connection.send(JSON.stringify(msg))
    }
  }
}

const initializeConnection = (connection, msg) => {
  User.findOne({_id: msg.userId, token: msg.token}).exec()
    .then(user => {
    if(user){
      connection.locales = { userId: user._id, username: user.username }
    }
  })
}

server.listen(port, () => console.log('Listening on port 8000...'))