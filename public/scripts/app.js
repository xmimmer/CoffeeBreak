//app.js

const canvas = document.getElementById('canvas')

/*Handling the Socket.IO connection
const socket = io('https://group3.sempro0.uvm.sdu.dk/', { autoConnect: true })
Or simpler: 
*/
const socket = io.connect({ autoConnect: false })

//UI elements
const username = document.getElementById('usernameField')
const connectionLabel = document.getElementById('connectionLabel')
const connectButton = document.getElementById('connectButton')
const disconnectButton = document.getElementById('disconnectButton')
const audioContainer = document.getElementById('audiostream-container')
const nearbyLabel = document.getElementById('nearbyLabel')
const callUserButton = document.getElementById('callUserButton')
const leaveCallButton = document.getElementById('leaveCallButton')
const myAudio = document.createElement('audio')
myAudio.muted = true

var clientUsername
var peerId

var myPos = {}
var listenerPos = {}
const peers = {}
var myCall

ctx = canvas.getContext("2d")

loadImages()

//CLUSTER SETUP
var myPeer = new Peer(undefined, {
    host: location.hostname,
    port: 443,
    path: '/myapp'
})

//LOCAL SETUP
/*
var myPeer = new Peer(undefined, {
    host: 'localhost',
    port: 9000,
    path: '/myapp'
})
*/

myPeer.on('open', function (id) {
    console.log('My peer ID: ' + id);
    peerId = id
});

//Connect button
connectButton.onclick = function () {

    if (username.value != "") {
        socket.connect()
        clientUsername = username.value
        socket.emit('newPlayer', myPeer.id, clientUsername)

        //Change UI to connected status
        username.style.display = "none"
        connectionLabel.innerHTML = "Connected"
        connectionLabel.style.color = "green"
        connectButton.style.visibility = "hidden"
        nearbyLabel.style.visibility = "visible"
        disconnectButton.style.visibility = "visible"

    } else {
        alert("Please enter a username");
    }
}

//Disconnect button
disconnectButton.onclick = function () {
    socket.disconnect()

    //Change UI to disconnected status
    connectionLabel.innerHTML = "Disconnected"
    connectionLabel.style.color = "red"
    username.style.display = "block"
    connectButton.style.visibility = "visible"
    leaveCallButton.style.visibility = "hidden"
    nearbyLabel.style.visibility = "hidden"
    disconnectButton.style.visibility = "hidden"

    if (callUserButton.style.visibility == "visible") {
        callUserButton.style.visibility = "hidden"
    }

    //Clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true
}).then(stream => {
    addAudioStream(myAudio, stream)

    //Receive calls
    myPeer.on('call', call => {
        console.log(call.peer, 'is calling me', myPeer.id)
        myCall = call
        //Answering the audio call
        call.answer(stream)
        const audio = document.createElement('audio')
        //Respond to incoming audio streams
        call.on('stream', userAudioStream => {
            addAudioStream(audio, userAudioStream)
        })
    })
    socket.on('audio', userId => {
        connectToNewUser(userId, stream)
        //leaveCallButton.style.visibility = "visible"
    })
})

//Make calls, when a new user connects
function connectToNewUser(userId, stream) {
    const audio = document.createElement('audio')

    //Call a new user, and pass our personal audio stream
    const call = myPeer.call(userId, stream)
    console.log(call)
    console.log(myPeer.id, 'im calling', userId)

    //Receiving the new user audio stream, and add it to our audio tag
    call.on('stream', userAudioStream => {
        addAudioStream(audio, userAudioStream)
    })
    call.on('close', () => {
        audio.remove()
    })
    //peers[userId] = call
}

function addAudioStream(audio, stream) {
    audio.srcObject = stream
    audio.addEventListener('loadedmetadata', () => {
        audio.play()
    })
    audioContainer.appendChild(audio)
}

function drawPlayer(player) {

    if (player.sprite == "avatarLeft") {
        currentSprite.src = "images/avatarLeft.png"
    }
    if (player.sprite == "avatarRight") {
        currentSprite.src = "images/avatarRight.png"
    }
    if (player.sprite == "avatarUp") {
        currentSprite.src = "images/avatarUp.png"
    }
    if (player.sprite == "avatarDown") {
        currentSprite.src = "images/avatarDown.png"
    }

    //Drawing the players
    ctx.drawImage(currentSprite, player.x, player.y, player.width, player.height)

    //Drawing the names
    ctx.font = "15px Verdana";
    ctx.fillStyle = "green"
    ctx.fillText(player.username, player.x, player.y - 3);
};

socket.on('state', (gameState) => {
    //Clearing the screen before drawing new player locations
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    listenerPos = {}

    //Get your own player position
    if (gameState.players[socket.id] != undefined) {
        myPos = { x: gameState.players[socket.id].x, y: gameState.players[socket.id].y }
    }

    for (let player in gameState.players) {
        drawPlayer(gameState.players[player])

        //Get other player positions, and add them to listenerPos object
        if (gameState.players[player] != gameState.players[socket.id]) {
            listenerPos[player] = { x: gameState.players[player].x, y: gameState.players[player].y, id: gameState.players[player].socket_id }
        }
    }
    nearbyCheck()
})

var peerConnected = false

function nearbyCheck() {

    var inRange = false
    const connection_threshold = 200

    for (let pos in listenerPos) {

        x_distance = Math.max(myPos.x, listenerPos[pos].x) - Math.min(myPos.x, listenerPos[pos].x)
        y_distance = Math.max(myPos.y, listenerPos[pos].y) - Math.min(myPos.y, listenerPos[pos].y)

        if ((x_distance <= connection_threshold) && (y_distance <= connection_threshold)) {

            inRange = true

            if (peerConnected == false) {
                callUserButton.style.visibility = "visible"

                callUserButton.onclick = function () {
                    socket.emit("onUserCall", { nearbyUser: listenerPos[pos].id, myPeerID: peerId })
                    callUserButton.style.visibility = "hidden"
                    peerConnected = true
                }
            }
        }

        if (inRange == true) {
            //Handle UI
            nearbyLabel.innerHTML = "User nearby"
            nearbyLabel.style.color = "green"
        } else {
            //Handle UI 
            nearbyLabel.innerHTML = "No users nearby"
            nearbyLabel.style.color = "red"
            callUserButton.style.visibility = "hidden"
        }
    }

    if (peerConnected == true) {
        leaveCallButton.style.visibility = "visible"

        leaveCallButton.onclick = function () {
            myCall.close()
            peerConnected = false
            leaveCallButton.style.visibility = "hidden"
        }
    }
}

const keys = {
    up: false,
    down: false,
    left: false,
    right: false
};

const keyDownHandler = (e) => {

    //socket.emit('keys', keys);   Results in laggy experience

    if (e.keyCode == 39) {
        keys.right = true;
    } else if (e.keyCode == 37) {
        keys.left = true;
    } else if (e.keyCode == 38) {
        keys.up = true;
    } else if (e.keyCode == 40) {
        keys.down = true;

    }
};
const keyUpHandler = (e) => {
    if (e.keyCode == 39) {
        keys.right = false;
    } else if (e.keyCode == 37) {
        keys.left = false;
    } else if (e.keyCode == 38) {
        keys.up = false;
    } else if (e.keyCode == 40) {
        keys.down = false;
    }
};

function loadImages() {
    avatarLeft = new Image
    avatarLeft.src = "images/avatarLeft.png"

    avatarRight = new Image
    avatarRight.src = "images/avatarRight.png"

    avatarDown = new Image
    avatarDown.src = "images/avatarDown.png"

    avatarUp = new Image
    avatarUp.src = "images/avatarUp.png"

    currentSprite = new Image
    currentSprite.src = "images/avatarRight.png"
}

//Let the server know which keys you are pressing

setInterval(() => {
    if (socket.connected) {
        socket.emit('keys', keys);
    }
}, 1000 / 45);

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

//============ Used for testing =============
//Used for testing
//socket.emit('test', 'HEJSA')
//
//socket.on('testing', (data) => {
//   console.log(data, ' From app.js')
// socket.emit('testing', data)
//})
//===========================================
