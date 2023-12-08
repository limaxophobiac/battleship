function shipFactory(length){
    if (!Number.isInteger(length)) throw new Error("ship length must be integer");
    if (length <= 0) throw new Error("Min ship length: 1");
    return {
        length,
        hits: 0,
        hit (){
            this.hits++
        },
        isSunk(){
            return this.hits >= this.length;
        }
    }
}

function gameBoardFactory(height, width){
    return {
        height,
        width,
        board: [...Array(height)].map(row => Array(width).fill(false).map(elem =>  {
            return {ship: null, isAttacked: false}
        })),
        shiplist: [],
        placeShip(row, column, vertical, ship){
            if (row >= this.height || column >= this.width || column < 0 || row < 0) return false;
            if (!vertical && column + ship.length > this.width) return false;
            if (vertical && row + ship.length > this.height) return false;
            for (let i = 0; i < ship.length; i++){
                if (!vertical && this.board[row][column+i].ship != null) return false;
                else if (this.board[row+i][column].ship != null) return false;
            }
            for (let i = 0; i < ship.length; i++){
                if (!vertical) this.board[row][column+i].ship = ship;
                else this.board[row+i][column].ship = ship;
            }
            this.shiplist.push(ship)
            return true
        },
        recieveAttack(row, column){
            if (row >= this.height || column >= this.width || column < 0 || row < 0) throw new Error("Must shoot inside board");
            if (this.board[row][column].isAttacked) throw new Error("Position already attacked");
            this.board[row][column].isAttacked = true;
            if (!this.board[row][column].ship) return false;
            this.board[row][column].ship.hit();
            return true;
        },
        allSunk(){
            return this.shiplist.every(ship => ship.isSunk())
        }
    }
}

function playerFactory(playerName, isAi, selfBoard, otherBoard){
    return {
        playerName,
        isAi,
        selfBoard,
        otherBoard,
        isTurn: false
    }

}

function aiPlace(gameBoard, shipList){
    while (shiplist.length > 0){
        let randRow = Math.floor(Math.random() * gameBoard.height);
        let randColumn = Math.floor(Math.random() * gameBoard.width);
        let isVertical = Math.random() > 0.5;
        if (gameBoard.placeShip(randRow, randColumn, isVertical, shipList[shipList.length-1]))
            shipList.pop();
    }
}

//Only use information on where hits/misses have been scored and which ships are sunk
function aiMove(gameBoard){
    
    //first check for first hits on ship that hasn't been sunk
    let target = null;
    for (let i = 0; i < gameBoard.height; i++){
        for (let j = 0; j < gameBoard.width; j++){
            if (gameBoard.board[i][j].isAttacked && gameBoard.board[i][j].ship != null && !gameBoard.board[i][j].ship.isSunk())
                target = {row: i, column: j};
        }
    }

    if (target != null) return aiTargetMove(gameBoard, target)
    return aiSearchMove(gameBoard);
}

function aiSearchMove(gameBoard){
    //find length of shortest unsunk ship
    let shortestLength = gameBoard.shipList.reduce((ship, shortest) => ship.isSunk() ? shortest : Math.min(ship.length, shortest), 1000000);
}

function aiTargetMove(gameBoard, target){

}

export {shipFactory, gameBoardFactory, playerFactory, aiPlace, aiMove}