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
        shipList: [],
        placeShip(row, column, vertical, ship){
            if (row >= this.height || column >= this.width || column < 0 || row < 0) return false;
            if (!vertical && column + ship.length > this.width) return false;
            if (vertical && row + ship.length > this.height) return false;
            for (let i = 0; i < ship.length; i++){
                if (!vertical && this.board[row][column+i].ship != null) return false;
                if (vertical && this.board[row+i][column].ship != null) return false;
            }
            for (let i = 0; i < ship.length; i++){
                if (!vertical) this.board[row][column+i].ship = ship;
                else this.board[row+i][column].ship = ship;
            }
            this.shipList.push(ship)
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
            return this.shipList.every(ship => ship.isSunk())
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
    while (shipList.length > 0){
        let randRow = Math.floor(Math.random() * gameBoard.height);
        let randColumn = Math.floor(Math.random() * gameBoard.width);
        let isVertical = Math.random() > 0.5;
        if (gameBoard.placeShip(randRow, randColumn, isVertical, shipList[shipList.length-1]))
            shipList.pop();
    }
}

function aiShoot(player, gameBoard){
    let target = aiMove(gameBoard);
    console.log("tries to shoot row:"  + target.row + "col: " + target.column)
    if (gameBoard.recieveAttack(target.row, target.column)){
        console.log("its a hit");
    };
    if (target.row == undefined) throw new Error(player.playerName + " didn't find a target");
    return true;
}

//Only uses information on where hits/misses have been scored and which ships are sunk
function aiMove(gameBoard){
    if (gameBoard.allSunk()) throw new Error("Can't find move when all ships sunk");

    //first check for first hits on ship that hasn't been sunk
    let targetList = [];
    for (let i = 0; i < gameBoard.height; i++){
        for (let j = 0; j < gameBoard.width; j++){
            if (gameBoard.board[i][j].isAttacked && (gameBoard.board[i][j].ship != null) && !gameBoard.board[i][j].ship.isSunk())
                targetList.push({row: i, column: j});
        }
    }
    console.log("targets: " + targetList.length)

    if (targetList.length > 0) return aiTargetMove(gameBoard, targetList[Math.floor(Math.random()*targetList.length)]);
    console.log("going to searchmove")
    return aiSearchMove(gameBoard);
}

//searches for new boats
function aiSearchMove(gameBoard){
    //find length of shortest unsunk ship
    let shortShip = gameBoard.shipList.reduce((shortest, ship) => !ship.isSunk() && ship.length < shortest ? ship.length : shortest, 1000000);
    let goodShots = [];
    for (let row = 0; row < gameBoard.height; row++){
        for (let column = 0; column < gameBoard.width; column++){
            if ((row + column) % shortShip != 0) continue;
            if (gameBoard.board[row][column].isAttacked) continue;
            goodShots.push({row, column});
        }
    }

    //filter goodshots for the ones where the most open distance around them
    goodShots.forEach(element => element.openSum = sumOpenDistance(gameBoard, element));
    let greatestOpen = goodShots.reduce((greatest, element) => element.openSum > greatest ? element.openSum : greatest, 0);
    goodShots = goodShots.filter(element => element.openSum == greatestOpen);
    //filter for the ones with the highest shortest open distance around them
    goodShots.forEach(element => element.shortestOpen = shortestOpenDistance(gameBoard, element));
    let greatestShortest = goodShots.reduce((greatest, element) => element.shortestOpen > greatest ? element.shortestOpen : greatest, 0);
    goodShots = goodShots.filter(element => element.shortestOpen == greatestShortest);
    console.log(goodShots)
    //chose one at random
    return goodShots[Math.floor(Math.random()*goodShots.length)];
}

//tries to sink boat thats been found but not sunk
function aiTargetMove(gameBoard, target){
    console.log("targeting row: " + target.row + " column: " + target.column)
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
    //console.log("highestRow: " + highestRow + "\nlowestRow: " + lowestRow +"\nhighestColumn: " + highestColumn + "\nlowestColumn: " + lowestColumn);
    let longest;

    let attackedVerticalDistance = Math.max(attackedLength(gameBoard, {row: highestRow-1, column: target.column}, true, -1), attackedLength(gameBoard, {row: lowestRow+1, column: target.column}, true, 1));
    let attackedHorizontalDistance = Math.max(attackedLength(gameBoard, {row: target.row, column: highestColumn-1}, false, -1), attackedLength(gameBoard, {row: target.row, column: lowestColumn+1}, false, 1));
    //shoot in continous unsunk ship direction
    //console.log("distance Vertical: " + attackedVerticalDistance + "\ndistance Horizontal: " + attackedHorizontalDistance)
    if (attackedVerticalDistance == attackedHorizontalDistance){
        longest = Math.max(verticalPosDistance, verticalNegDistance, horizontalPosDistance, horizontalNegDistance);
        if (verticalPosDistance  == longest)
            return possibleCoordinates.reduce((highestVertical, coordinate) => coordinate.row >= highestVertical.row ? coordinate : highestVertical);
        if (verticalNegDistance == longest)
            return possibleCoordinates.reduce((lowestVertical, coordinate) => coordinate.row <= lowestVertical.row ? coordinate : lowestVertical);
        if (horizontalPosDistance  == longest)
            return possibleCoordinates.reduce((highestHorizontal, coordinate) => coordinate.column >= highestHorizontal.row ? coordinate : highestHorizontal);
        return possibleCoordinates.reduce((lowestHorizontal, coordinate) => coordinate.column <= lowestHorizontal.row ? coordinate : lowestHorizontal);
    } else if (attackedVerticalDistance > attackedHorizontalDistance){
        longest = Math.max(verticalPosDistance, verticalNegDistance);
        if (verticalPosDistance  == longest)
            return possibleCoordinates.reduce((highestVertical, coordinate) => coordinate.row >= highestVertical.row ? coordinate : highestVertical);
        return possibleCoordinates.reduce((lowestVertical, coordinate) => coordinate.row <= lowestVertical.row ? coordinate : lowestVertical);
    } else {
        longest = Math.max(horizontalPosDistance, horizontalNegDistance);
        if (horizontalPosDistance  == longest)
            return possibleCoordinates.reduce((highestHorizontal, coordinate) => coordinate.column >= highestHorizontal.row ? coordinate : highestHorizontal);
        return possibleCoordinates.reduce((lowestHorizontal, coordinate) => coordinate.column <= lowestHorizontal.row ? coordinate : lowestHorizontal);
    }

    return {row: 0, column: 0};
}

function attackedLength(gameBoard, start, vertical, step){
    let startCopy = {row: start.row, column: start.column}
    let attackedLength = 0;
    while (filterCoordinates(gameBoard, [startCopy]).length > 0 && gameBoard.board[startCopy.row][startCopy.column].isAttacked){
        attackedLength++;
        if (vertical) startCopy.row += step;
        else startCopy.column += step;
    }

    return attackedLength;
}

function sumOpenDistance(gameBoard, start){
    let sum = openDistance(gameBoard, start, true, 1);
    sum += openDistance(gameBoard, start, true, -1);
    sum += openDistance(gameBoard, start, false, 1);
    return sum + openDistance(gameBoard, start, false, -1);
}

function shortestOpenDistance(gameBoard, start){
    return Math.min(...[
        openDistance(gameBoard, start, true, 1),
        openDistance(gameBoard, start, true, -1),
        openDistance(gameBoard, start, false, 1),
        openDistance(gameBoard, start, false, -1)
    ]);
}


function openDistance(gameBoard, start, vertical, step){
    let startCopy = {row: start.row, column: start.column}
    let distance = 0;
    while (filterCoordinates(gameBoard, [startCopy]).length > 0 && !gameBoard.board[startCopy.row][startCopy.column].isAttacked){
        distance++;
        if (vertical) startCopy.row += step;
        else startCopy.column += step;
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


export {shipFactory, gameBoardFactory, playerFactory, aiPlace, aiMove, aiSearchMove, aiTargetMove, findCoordinates, filterCoordinates, openDistance, aiShoot}