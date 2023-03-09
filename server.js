const { WebSocketServer } = require('ws')
const express = require('express')
const http = require('http')
const uuid = require('uuid')
const cors = require('cors')

const port = 8000
const clients = []
const app = express()
app.use(express.json())
app.use(cors())

app.post('/login', (req, res) => {
  const username = req.body.username
  if(isNameAvailable(username)){
    const id = uuid.v4()
    clients.push({
      userId: id,
      username,
      token: id
    })
    res.json({ userId: id, token: id, message: 'ok' })
  } else {
    res.json({ message: 'Username already exists.' })
  }
})

app.post('/logout', (req, res) => {
  const userId = req.body.userId
  const token = req.body.token
  for(let i = 0; i < clients.length; i++){
    let cl = clients[i]
    if(cl.userId === userId && cl.token === token){
      clients.splice(i, 1)
      res.json({message: 'ok'})
      return;
    }
  }

  res.json({message: 'user not found!'})
})

app.post('/verify-token', (req, res) => {
  const token = req.body.previousToken

  for(let cl of clients) {
    if(cl.token === token){
      console.log('token verified');
      res.json({ userId: cl.userId, username: cl.username, message: 'verified' })
      return;
    }
  }

  console.log('token not verified');
  res.json({message: 'not verified'})
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
  const user = msg.user
  if(msg.type === 'initialize'){
    initializeConnection(connection, msg)
  } else {
    const otherClients = clients.filter(cl => user.userId !== cl.userId)
      if(otherClients.length > 0){
        otherClients.forEach(client => {
          msg.username = client.username
          console.log(user.userId, user.username);
          client.connection.send(JSON.stringify({
            message: msg.message,
            username: user.username
          }))
        })
      } else {
        connection.send(JSON.stringify({
          message: msg.message,
          username: user.username
        }))
      }
  }
}

const initializeConnection = (connection, msg) => {
  clients.forEach(cl => {
    if(cl.userId === msg.userId && cl.token === msg.token){
      cl.connection = connection
    }
  })
}

const isNameAvailable = username => {
  let availble = true
  clients.forEach(cl => {
    if(cl.username.toLowerCase() === username.toLowerCase()) availble = false;
  })
  return availble
}

server.listen(port, () => console.log('Listening on port 8000...'))