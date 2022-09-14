const { UserInputError, AuthenticationError } = require('apollo-server-core')

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('./utils/config')

const { PubSub } = require('graphql-subscriptions')

const pubSub = new PubSub()

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
    allGenres: async () => {
      const books = await Book.find({})
      return [...new Set(books.flatMap((book) => book.genres))]
    },
    me: (root, args, context) => context.currentUser,
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
      if (args.genres.length < 1) {
        throw new UserInputError('No genres added', {
          invalidArgs: args.genres,
        })
      }
      try {
        newBook = new Book({ ...args })
        const existingAuthor = await Author.findOne({ name: args.author })
        if (!existingAuthor) {
          const newAuthor = new Author({ name: args.author, bookCount: 1 })
          await newAuthor.save()
          newBook.author = newAuthor._id
        } else {
          existingAuthor.bookCount = existingAuthor.bookCount + 1
          await existingAuthor.save()
          newBook.author = existingAuthor._id
        }
        await newBook.save()
        await newBook.populate('author')
      } catch (e) {
        throw new UserInputError(e.message, {
          invalidArgs: args,
        })
      }
      pubSub.publish('BOOK_ADDED', { bookAdded: newBook })
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
  Subscription: {
    bookAdded: {
      subscribe: () => pubSub.asyncIterator(['BOOK_ADDED']),
    },
  },
  // Author: {
  //   bookCount: async (root, args) => {
  //     const bookCount = await Book.count({ author: root._id })
  //     return bookCount
  //
  //   },
  // },
}

module.exports = resolvers
