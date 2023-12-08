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

//Only uses information on where hits/misses have been scored and which ships are sunk
function aiMove(gameBoard){
    if (gameBoard.allSunk()) throw new Error("Can't find move when all ships sunk");

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

//searches for new boats
function aiSearchMove(gameBoard){
    //find length of shortest unsunk ship
    let shortestLength = gameBoard.shipList.reduce((ship, shortest) => ship.isSunk() ? shortest : Math.min(ship.length, shortest), 1000000);
}

//tries to sink boat thats been found but not sunk
function aiTargetMove(gameBoard, target){
    let surrounding = [
        {row: target.row+1, column: target.column},
        {row: target.row-1, column: target.column},
        {row: target.row, column: target.column+1},
        {row: target.row, column: target.column-1},
    ];
    
    //find best directions
    let possibleCoordinates = findCoordinates(gameBoard, surrounding, target);
    let horizontalDistance = possibleCoordinates.reduce((coordinate,highest)  => coordinate.row > highest ? coordinate.row : highest, 0);
    let verticalDistance = 0; 

    return possibleCoordinates[0];
}
//finds first possible attack locations in both x and y directions
function findCoordinates(gameBoard, possibleCoordinates, target){
    possibleCoordinates = filterCoordinates(gameBoard, possibleCoordinates);
    //find any squares around target that are hits, search for first open square in those directions
    while (possibleCoordinates.some(coordinate => gameBoard.board[coordinate.row][coordinate.column].isAttacked)){
        for (let i = 0; i < possibleCoordinates.length; i++){
            let coordinate = possibleCoordinates[i];
            if (gameBoard.board[coordinate.row][coordinate.column].isAttacked){
                if (coordinate.row > target.row) possibleCoordinates[i].row += 1;
                else if (coordinate.row < target.row) possibleCoordinates[i].row -= 1;
                else if (coordinate.column > target.column) possibleCoordinates[i].column += 1;
                else possibleCoordinates[i].column -= 1;
            }
        }
        possibleCoordinates = filterCoordinates(gameBoard, possibleCoordinates);
    }
    return possibleCoordinates;
}

//filter coordinates for board edges, misses, and sunk ships
function filterCoordinates(gameBoard, possibleCoordinates){
        possibleCoordinates = possibleCoordinates.filter(coordinate => {
            if (coordinate.row >= gameBoard.height || coordinate.row < 0 || coordinate.column < 0 || coordinate.column >= gameBoard.width) return false;
            if (gameBoard.board[coordinate.row][coordinate.column].isAttacked){
                if (gameBoard.board[coordinate.row][coordinate.column].ship == null || gameBoard.board[coordinate.row][coordinate.column].ship.isSunk()) return false;
            }
            return true;
        });

        return possibleCoordinates;
}


export {shipFactory, gameBoardFactory, playerFactory, aiPlace, aiMove, aiSearchMove, aiTargetMove, findCoordinates, filterCoordinates}