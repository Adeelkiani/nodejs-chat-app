const app = require('./app')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const { generateMessage } = require('./utils/messages')

const port = process.env.PORT || 3000

const server = http.createServer(app)
const io = socketio(server)


//socket.emit is used to send events to particular connection
//socket.broadcast.emit send events to other in connection
//io.emit send events to everyone
io.on('connection', (socket) => {
    console.log("new websocket connection")

    // socket.emit, io.emit, socket.broadcast.emit
    // io.to.emit, socket.broadcast.to.emit

    socket.on('join', (options, callback) => {

        const { error, user } = addUser({
            id: socket.id,
            ...options
        })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

    })


    socket.on('sendMessage', (message, callback) => {

        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocationEvent', (location, callback) => {

        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback('Location shared!')
    })

    //Emit event when connection is disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })

        }
    })

})



server.listen(port, () => {
    console.log('Server is up on port ' + port)
})