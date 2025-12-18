class Player {

  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    this.width = 30;
    this.height = 30;
  }

  movePlayer(dir, speed) {
    if (dir === 'up') this.y -= speed;
    if (dir === 'down') this.y += speed;
    if (dir === 'left') this.x -= speed;
    if (dir === 'right') this.x += speed;
  }

  collision(item) {
    const itemWidth = 20;
    const itemHeight = 20;
    if (
      this.x < item.x + itemWidth &&
      this.x + this.width > item.x &&
      this.y < item.y + itemHeight &&
      this.y + this.height > item.y
    ) {
      return true;
    }
    return false;
  }

  calculateRank(arr) {

    if (!arr || arr.length === 0) {
      return `Rank: 1/1`;
    }
    
    const totalPlayers = arr.length;
    const sorted = [...arr].sort((a, b) => b.score - a.score);
    const currentRanking = sorted.findIndex(p => p.id === this.id) + 1;
    return `Rank: ${currentRanking}/${totalPlayers}`;
  }
}

export default Player;
