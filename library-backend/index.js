const { ApolloServer, UserInputError, gql } = require('apollo-server')
const mongoose = require('mongoose')
const config = require('./utils/config')

const Author = require('./models/author')
const Book = require('./models/book')
const author = require('./models/author')

console.log('CONNECTING TO ', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((e) => console.log('Error: ' + e.message))

const typeDefs = gql`
  type Author {
    name: String!
    id: String!
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
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      genres: [String!]!
      author: String
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
  }
`
const getAuthor = async (args) => {
  const author = await Author.findOne({ name: args.author })
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
    addBook: async (root, args) => {
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
      return newBook
    },
    editAuthor: async (root, args) => {
      try {
        const updatedAuthor = await Author.findOneAndUpdate(
          { name: args.name },
          { born: args.setBornTo },
          { new: true }
        )
        return updatedAuthor
      } catch (e) {
        return UserInputError(e.message, {
          invalidArgs: args,
        })
      }
    },
  },
  // Book: {
  //   genres: (root, args) => root.genres,
  // },
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
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
