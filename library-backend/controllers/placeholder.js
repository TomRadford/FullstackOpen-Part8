const placeholderRouter = require('express').Router()

placeholderRouter.get('/', (req, res) => {
  res.json({
    message: 'GraphQL served at graphql endpoint',
  })
})

module.exports = placeholderRouter
