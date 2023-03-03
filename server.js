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
      username
    })
    res.json({ userId: id, message: 'ok' })
  } else {
    res.json({ message: 'Username already exists.' })
  }
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
    initializeConnection(connection, msg.userId)
  } else {
    const otherClients = clients.filter(cl => msg.userId !== cl.userId)
      if(otherClients.length > 0){
        otherClients.forEach(client => {
          console.log(client.userId, client.username, typeof(client.connection));
          client.connection.send(JSON.stringify(msg))
        })
      } else {
        connection.send(JSON.stringify(msg))
      }
  }
}

const initializeConnection = (connection, userId) => {
  clients.forEach(cl => {
    if(cl.userId === userId){
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