const {
  ApolloServer,
  UserInputError,
  AuthenticationError,
  gql,
} = require('apollo-server')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('./utils/config')

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const user = require('./models/user')

console.log('CONNECTING TO', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((e) => console.log('Error: ' + e.message))

const typeDefs = gql`
  type User {
    username: String!
    favouriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Book {
    title: String!
    published: String!
    id: ID!
    genres: [String!]!
    author: Author!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      genres: [String!]!
      author: String!
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(
      username: String!
      password: String!
      favouriteGenre: String!
    ): User
    login(username: String!, password: String!): Token
  }
`

const getAuthor = async (args) => {
  const author = await Author.findOne({ name: args.author })
  if (!author) throw new UserInputError('Author does not exist')
  return author
}

const resolvers = {
  Query: {
    bookCount: async () => await Book.collection.countDocuments(),
    authorCount: async () => await Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (Object.keys(args).length === 2) {
        const existingAuthor = await getAuthor(args)
        return await Book.find({
          author: existingAuthor._id,
          genres: { $in: [args.genre] },
        }).populate('author')
      }
      if (args.author) {
        const existingAuthor = await getAuthor(args)
        return await Book.find({
          author: existingAuthor._id,
        }).populate('author')
      }
      if (args.genre) {
        return await Book.find({
          genres: { $in: [args.genre] },
        }).populate('author')
      }
      return await Book.find({}).populate('author')
    },
    allAuthors: async () => await Author.find({}),
  },
  Mutation: {
    createUser: async (root, args) => {
      passwordHash = await bcrypt.hash(args.password, 10)
      const user = new User({
        username: args.username,
        passwordHash,
        favouriteGenre: args.favouriteGenre,
      })
      return await user.save().catch((e) => {
        throw new UserInputError(e.message, {
          invalidArgs: args,
        })
      })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      const loginCorrect =
        user === null
          ? false
          : await bcrypt.compare(args.password, user.passwordHash)
      if (!loginCorrect) {
        throw new UserInputError('Incorrect credentials')
      }
      return {
        value: jwt.sign(
          {
            username: user.username,
            id: user._id,
          },
          config.SECRET,
          {
            expiresIn: 60 * 60,
          }
        ),
      }
    },
    addBook: async (root, args, context) => {
      const { currentUser } = context
      if (!currentUser) {
        throw new AuthenticationError('User not authenticated')
      }
      try {
        newBook = new Book({ ...args })
        const existingAuthor = await Author.findOne({ name: args.author })
        if (!existingAuthor) {
          const newAuthor = new Author({ name: args.author })
          await newAuthor.save()
          newBook.author = newAuthor._id
        } else {
          newBook.author = existingAuthor._id
        }
        await newBook.save()
        await newBook.populate('author')
      } catch (e) {
        throw new UserInputError(e.message, {
          invalidArgs: args,
        })
      }
      return newBook
    },
    editAuthor: async (root, args, context) => {
      const { currentUser } = context
      if (!currentUser) {
        return new AuthenticationError('User not authenticated')
      }
      const updatedAuthor = await Author.findOneAndUpdate(
        { name: args.name },
        { born: args.setBornTo },
        { new: true }
      )
      if (!updatedAuthor) {
        throw new UserInputError('Author not found')
      }
      return updatedAuthor
    },
  },
  Author: {
    bookCount: async (root, args) => {
      const bookCount = await Book.count({ author: root._id })
      return bookCount
    },
  },
}

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

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
