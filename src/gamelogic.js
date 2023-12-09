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
    return null;
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

    let highestRow = possibleCoordinates.reduce((highest, coordinate)  => coordinate.row > highest ? coordinate.row : highest, target.row+1);
    let lowestRow = possibleCoordinates.reduce((lowest, coordinate)  => coordinate.row < lowest ? coordinate.row : lowest, target.row-1);
    let highestColumn = possibleCoordinates.reduce((highest, coordinate)  => coordinate.column > highest ? coordinate.column : highest, target.column+1);
    let lowestColumn = possibleCoordinates.reduce((lowest, coordinate)  => coordinate.column < lowest ? coordinate.column : lowest, target.column-1);

    let verticalPosDistance = openDistance(gameBoard, {row: highestRow, column: target.column}, true, 1);
    let verticalNegDistance = openDistance(gameBoard, {row: lowestRow, column: target.column}, true, -1);
    let horizontalPosDistance = openDistance(gameBoard, {row: target.row, column: highestColumn}, false, 1);
    let horizontalNegDistance = openDistance(gameBoard, {row: target.row, column: lowestColumn}, false, -1);
    console.log("highestRow: " + highestRow + "\nlowestRow: " + lowestRow +"\nhighestColumn: " + highestColumn + "\nlowestColumn: " + lowestColumn);
    let longest;

    let attackedVerticalDistance = Math.max(attackedLength(gameBoard, {row: highestRow-1, column: target.column}, true, -1), attackedLength(gameBoard, {row: lowestRow+1, column: target.column}, true, 1));
    let attackedHorizontalDistance = Math.max(attackedLength(gameBoard, {row: target.row, column: highestColumn-1}, false, -1), attackedLength(gameBoard, {row: target.row, column: lowestColumn+1}, false, 1));
    //shoot in continous unsunk ship direction
    console.log("distance Vertical: " + attackedVerticalDistance + "\ndistance Horizontal: " + attackedHorizontalDistance)
    if (attackedVerticalDistance == attackedHorizontalDistance){
        longest = Math.max(verticalPosDistance, verticalNegDistance, horizontalPosDistance, horizontalNegDistance);
        if (verticalPosDistance  == longest)
            return possibleCoordinates.reduce((highestVertical, coordinate) => coordinate.row >= highestVertical.row ? coordinate : highestVertical, target);
        if (verticalNegDistance == longest)
            return possibleCoordinates.reduce((lowestVertical, coordinate) => coordinate.row <= lowestVertical.row ? coordinate : lowestVertical, target);
        if (horizontalPosDistance  == longest)
            return possibleCoordinates.reduce((highestHorizontal, coordinate) => coordinate.column >= highestHorizontal.row ? coordinate : highestHorizontal, target);
        return possibleCoordinates.reduce((lowestHorizontal, coordinate) => coordinate.column <= lowestHorizontal.row ? coordinate : lowestHorizontal, target);
    } else if (attackedVerticalDistance > attackedHorizontalDistance){
        longest = Math.max(verticalPosDistance, verticalNegDistance);
        if (verticalPosDistance  == longest)
            return possibleCoordinates.reduce((highestVertical, coordinate) => coordinate.row >= highestVertical.row ? coordinate : highestVertical, target);
        return possibleCoordinates.reduce((lowestVertical, coordinate) => coordinate.row <= lowestVertical.row ? coordinate : lowestVertical, target);
    } else {
        longest = Math.max(horizontalPosDistance, horizontalNegDistance);
        if (horizontalPosDistance  == longest)
            return possibleCoordinates.reduce((highestHorizontal, coordinate) => coordinate.column >= highestHorizontal.row ? coordinate : highestHorizontal, target);
        return possibleCoordinates.reduce((lowestHorizontal, coordinate) => coordinate.column <= lowestHorizontal.row ? coordinate : lowestHorizontal, target);
    }

    return {row: 0, column: 0};
}

function attackedLength(gameBoard, start, vertical, step){
    let attackedLength = 0;
    while (filterCoordinates(gameBoard, [start]).length > 0 && gameBoard.board[start.row][start.column].isAttacked){
        attackedLength++;
        if (vertical) start.row += step;
        else start.column += step;
    }

    return attackedLength;
}

function openDistance(gameBoard, start, vertical, step){
    let distance = 0;
    while (filterCoordinates(gameBoard, [start]).length > 0){
        distance++;
        if (vertical) start.row += step;
        else start.column += step;
    }

    return distance;
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


export {shipFactory, gameBoardFactory, playerFactory, aiPlace, aiMove, aiSearchMove, aiTargetMove, findCoordinates, filterCoordinates, openDistance}