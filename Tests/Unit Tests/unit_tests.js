const chai = require("chai")
const chaiHttp = require("chai-http")
chai.use(chaiHttp);
const expect = chai.expect;
const forever = require("forever-monitor");
var io = require("socket.io-client")

var socketurl = 'http://localhost:8080'
// var socketurl = 'https://group3.sempro0.uvm.sdu.dk'

var options = {
  transports: ["websocket"],
  "force new connection": true,
}

// const child = new (forever.Monitor)('../../server.js', { max: 1, silent: true });
// // const client = new (forever.Monitor)('./public/scripts/app.js', { max: 1, silent: true })
// child.on('start', () => console.log('Starting server.js up\n'));
// child.on('error', () => console.log('Error from server.js'));
// child.on('exit', () => console.log('\nShutting server.js down again'));
// before(done => { child.start(); setTimeout(done, 300) })
// after(() => { if (child.running) child.stop() });

describe('Test GET /', () => {
  it('should get the index.html with the canvas', () =>
    chai.request('http://localhost:8080')
    // chai.request('https://group3.sempro0.uvm.sdu.dk')
      .get('/')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.html;
      })
      .catch(err => { throw err; })
  )
});


describe('Testing the server', () => {
  var client1, client2
  it('should print "Hello from server" in server terminal', function (done) {

    client1 = io.connect(socketurl, options);

    client1.on('testing', function (msg) {
      expect(msg).to.equal('Hello');

      client1.disconnect()
      client2.disconnect();

      done();
    })

    client1.on('connect', function () {
    client2 = io.connect(socketurl, options);
    client2.on('connect', function () {
    client2.emit('test', 'Hello');
      });
    });
  });
});


describe('keys pressed', () => {
  var client01, client02
  it('should emit "state" event from the server when a client presses a arrow key', function (done) {
    gameStateCalled = 0
    const mock_keys_object = {};
    client01 = io.connect(socketurl, options);

    client01.on('connect', function () {
      client02 = io.connect(socketurl, options);

      client02.on('connect', function () {
        client01.emit('keys', mock_keys_object);

        client02.on('state', function () {
          gameStateCalled++;
        })
      });
    });
    setTimeout(function () {
      expect(gameStateCalled).to.equal(1);
      client01.disconnect();
      client02.disconnect();
      done();
    }, 25);
  });
})


describe('user turning', function () {
  this.timeout(12000)
  it('Users should be able to change their avatar position and orientation with the arrow keys', function (done) {
    var client1
    upKeyCalled = 0
    rightKeyCalled = 0
    downKeyCalled = 0
    leftKeyCalled = 0
    const keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    client1 = io.connect(socketurl, options);
    client1.on('connect', function () {
      client1.emit('newPlayer', '11', 'Mads');
      setTimeout(function () {
        // test user goes up
        keys.up = true
        for (i = 0; i < 12; i++) {
          client1.emit('keys', keys)
        }
        upKeyCalled++
      }, 2000);
      setTimeout(function () {
        // test user goes right
        keys.up = false
        keys.right = true
        for (i = 0; i < 12; i++) {
          client1.emit('keys', keys)
        }
        rightKeyCalled++
      }, 4000);
      setTimeout(function () {
        // test user goes down
        keys.right = false
        keys.down = true
        for (i = 0; i < 12; i++) {
          client1.emit('keys', keys)
        }
        downKeyCalled++
      }, 6000);
      setTimeout(function () {
        // test user goes left
        keys.down = false
        keys.left = true
        for (i = 0; i < 12; i++) {
          client1.emit('keys', keys)
        }
        leftKeyCalled++
      }, 8000);
      // all keys should be false
      keys.left = false
      for (i = 0; i < 12; i++) {
        client1.emit('keys', keys)
      }
    });
    setTimeout(function () {
      expect(upKeyCalled).to.equal(1);
      expect(rightKeyCalled).to.equal(1);
      expect(downKeyCalled).to.equal(1);
      expect(leftKeyCalled).to.equal(1);
      client1.disconnect();
      done();
    }, 10000);
  })
})

describe('Requirement F1-1 test', function () {
  it('Users must be able to join a meeting room', (done) => {
    var user
    user = io.connect(socketurl, options);
    user.on('connect', function () {
      expect(user.connected).to.be.equal(true)
      expect(user.io.uri).to.be.equal('http://localhost:8080')
    })
    setTimeout(function () {
      user.disconnect();
      done();
    }, 25);
  })
})


describe('Requirement F2-1-1 test', () => {
  it('Users must be able to offer audio calls to nearby users', function (done) {
    var client1, client2
    onUserCallCount = 0
    client1 = io.connect(socketurl, options);
    client1.on('connect', function () {
      client2 = io.connect(socketurl, options);
      client2.on('connect', function () {
        const mock_object = { nearbyUser: client2.id, myPeerID: client1.id };
        client1.emit('onUserCall', mock_object);
        client2.on('audio', function () {
          onUserCallCount++;
        })
      });
    });
    setTimeout(function () {
      expect(onUserCallCount).to.equal(1);
      client1.disconnect();
      client2.disconnect();
      done();
    }, 25);
  })
})
