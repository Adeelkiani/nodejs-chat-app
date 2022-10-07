const express = require('express')
const path = require('path')

const app = express()

const publicDirectoryPath = path.join(__dirname, '../public')

//Automatically parse incoming JSON
app.use(express.json())

// Registering routes
app.use(express.static(publicDirectoryPath))

module.exports = app