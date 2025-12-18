require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// helmet security middleware
app.use(helmet({
  noSniff: true,
  xssFilter: true,
  noCache: true,
  hidePoweredBy: false
}));

// custom header mimic PHP
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

// server socket
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socket(server);

// game state variables
let allPlayers = [];
let currentItem = {
    x: Math.floor(Math.random() * 600),
    y: Math.floor(Math.random() * 400),
    value: 1,
    id: Date.now()
};

// socket
io.on('connection', function (socket) {
  
  console.log(`User connected: ${socket.id}`);

  socket.on('new-player', (obj) => {
    allPlayers.push(obj);
    // 1. Send initial state to the new player (Fixed 'socked' typo here)
    socket.emit('init', { id: socket.id, players: allPlayers, item: currentItem });
    // 2. Tell EVERYONE to update their player list
    io.emit('update', allPlayers); 
  });

  socket.on('update-player', (updatedObj) => {
    const index = allPlayers.findIndex(p => p.id === updatedObj.id);
    if (index !== -1) {
      allPlayers[index] = updatedObj;
      // 3. Send the full updated list to everyone so Rank stays synced
      io.emit('update', allPlayers);
    }
  });

  socket.on('item-collected', () => {
    // 4. Update the player's score on the server side if needed
    // Then generate new item
    currentItem = {
      x: Math.floor(Math.random() * 600),
      y: Math.floor(Math.random() * 400),
      value: 1,
      id: Date.now()
    };
    io.emit('item-update', currentItem);
  });

  socket.on('disconnect', () => {
    allPlayers = allPlayers.filter(p => p.id !== socket.id);
    // 5. Update everyone's list so the disconnected player disappears
    io.emit('update', allPlayers); 
  });

});

// start server
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (e) {
          console.log('Tests are not valid:');
          console.error(e);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
