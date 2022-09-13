const { ApolloServer } = require('apollo-server-express')
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core')
const { makeExecutableSchema } = require('@graphql-tools/schema')

const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')

const express = require('express')
const http = require('http')
const cors = require('cors')
const placeholderRouter = require('./controllers/placeholder')

const jwt = require('jsonwebtoken')

const typeDefs = require('./schema')
const resolvers = require('./resolvers')

const config = require('./utils/config')

const mongoose = require('mongoose')
const User = require('./models/user')
console.log('CONNECTING TO', config.MONGODB_URI)
mongoose
  .connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((e) => console.log('Error: ' + e.message))

const start = async () => {
  const app = express()
  app.use(cors())
  app.use('/', placeholderRouter)
  const httpServer = http.createServer(app)

  const schema = makeExecutableSchema({ typeDefs, resolvers })

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '',
  })

  const serverCleanup = useServer({ schema }, wsServer)

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null
      if (auth && auth.toLowerCase().startsWith('bearer')) {
        const decodedToken = jwt.verify(auth.substring(7), config.SECRET)
        const currentUser = await User.findById(decodedToken.id)
        return { currentUser }
      }
    },
  })
  const PORT = 4000
  httpServer.listen(PORT, () => {
    console.log(`Server is now running on PORT ${PORT}`)
  })
}

start()
