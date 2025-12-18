import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let currPlayer;
let allPlayers = [];
let item;

// 1. Initialize the game when connecting to the server
socket.on('init', ({ id, players, item: serverItem }) => {
  // Create our player at a random spot
  const x = Math.floor(Math.random() * 600);
  const y = Math.floor(Math.random() * 400);
  
  // Create local instance of our player
  currPlayer = new Player({ x, y, score: 0, id });
  
  // Create local instance of the item
  item = new Collectible(serverItem);

  // Tell the server we have joined
  socket.emit('new-player', currPlayer);

  // Start the drawing loop
  window.requestAnimationFrame(draw);
});

// 2. The Animation Loop (Draws everything on the canvas)
function draw() {
  
  if (!currPlayer || !allPlayers) return window.requestAnimationFrame(draw);

  // Clear the canvas 
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the Item
  if (item) {
    context.fillStyle = 'gold';
    context.fillRect(item.x, item.y, 20, 20); 
  }

  // Draw All Players
  allPlayers.forEach(p => {
    // Current player is white, others are gray
    context.fillStyle = p.id === currPlayer.id ? 'white' : 'gray';
    context.fillRect(p.x, p.y, 30, 30);
  });

  // Draw the Rank and Score
  if (currPlayer) {
    context.fillStyle = 'white';
    context.font = '14px Arial';
    // Use the method from the Player class
    context.fillText(currPlayer.calculateRank(allPlayers), 500, 30);
  }

  window.requestAnimationFrame(draw);
}

// 3. Movement and Input
document.onkeydown = (e) => {
  const moveMap = {
    'w': 'up', 'ArrowUp': 'up',
    's': 'down', 'ArrowDown': 'down',
    'a': 'left', 'ArrowLeft': 'left',
    'd': 'right', 'ArrowRight': 'right'
  };

  const dir = moveMap[e.key];

  if (dir) {
    // Move the player locally
    currPlayer.movePlayer(dir, 10);
    
    // Check if we hit the item
    if (currPlayer.collision(item)) {
      // Increase score and tell server
      currPlayer.score += item.value;
      socket.emit('item-collected', item);
    }

    // Tell the server we moved so everyone else sees it
    socket.emit('update-player', currPlayer);
  }
};

// 4. Listen for Server Updates
socket.on('update', (playersFromServer) => {
  // IMPORTANT: Convert raw data back into Player objects 
  // so we can still use the .calculateRank() method.
  allPlayers = playersFromServer.map(p => new Player(p));
  
  // Update our local player state to stay in sync with server's score list
  const me = allPlayers.find(p => p.id === currPlayer.id);
  if (me) currPlayer.score = me.score;
});

socket.on('item-update', (newItem) => {
  // Update item to the new location sent by server
  item = new Collectible(newItem);
});