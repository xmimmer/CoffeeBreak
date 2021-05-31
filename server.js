const express = require("express");
const http = require('http');
const path = require('path');
const app = express();
const server = http.createServer(app);
const { ExpressPeerServer } = require('peer');
const port = process.env.PORT || 8080;
app.use(express.static(__dirname + '/public/'));

/*
Gives: 502 Bad Gateway

const server = https.createServer({
    key: fs.readFileSync('certificates/server.key'),
    cert: fs.readFileSync('certificates/server.cert')
}, app);
*/

//=========SOCKET.IO=============
 const { Server } = require("socket.io");
 const io = new Server(server, {
     allowEIO3: true
 });
//===============================

//============PEERJS=============

 const { ExpressPeerServer } = require('peer');

 const peerServer = ExpressPeerServer(server, {
     path: '/myapp' });

 app.use(peerServer);

//===============================

var cors = require('cors')
app.use(cors())

const canvas = {
    width: 1080,
    height: 720
}

const avatarSize = {
    width: 50,
    height: 50
}

const gameState = {
    players: {}
}

io.on('connection', (socket) => {
    // socket.emit('connect')
    console.log('a user connected:', socket.id);

    socket.on('test', (data) => {
        console.log(data, ' From server.js')
        io.emit('testing', (data))
    })

    socket.on('newPlayer', (id, name) => {
        console.log('a peer-user connected:', id, " my name:", name);
        gameState.players[socket.id] = {
            username: name,
            x: Math.floor(Math.random() * (canvas.width - avatarSize.width)) + 1,
            y: Math.floor(Math.random() * (canvas.height - avatarSize.height)) + 1,
            width: avatarSize.width,
            height: avatarSize.height,
            x_speed: 15,
            y_speed: 15,
            sprite: null,
            peerID: id,
            socket_id: socket.id
        }
    })

    socket.on('keys', (keys) => {

        const player = gameState.players[socket.id]

        //Left movement
        if (keys.left && player.x > 0) {
            player.x -= player.x_speed
            player.sprite = "avatarLeft"
        }
        //Right movement
        if (keys.right && player.x < (canvas.width - player.width)) {
            player.x += player.x_speed
            player.sprite = "avatarRight"
        }
        //Upwards movement
        if (keys.up && player.y > 0) {
            player.y -= player.y_speed
            player.sprite = "avatarUp"
        }
        //Downwards movement
        if (keys.down && player.y < (canvas.height - player.height)) {
            player.y += player.y_speed
            player.sprite = "avatarDown"
        }
        io.sockets.emit('state', gameState);
    })

    socket.on("onUserCall", (nearbyUser) => {
        socket.to(nearbyUser.id).emit('audio', gameState.players[socket.id].peerID)
    })

    socket.on('disconnect', function () {
        console.log('user disconnected');
        delete gameState.players[socket.id]
    });
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/HTML/index.html')
});

server.listen(port, () => {
    console.log(`Server is listening on port: ${port}`)
})


