/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/gamelogic.js":
/*!**************************!*\
  !*** ./src/gamelogic.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   aiMove: () => (/* binding */ aiMove),
/* harmony export */   aiPlace: () => (/* binding */ aiPlace),
/* harmony export */   aiSearchMove: () => (/* binding */ aiSearchMove),
/* harmony export */   aiShoot: () => (/* binding */ aiShoot),
/* harmony export */   aiTargetMove: () => (/* binding */ aiTargetMove),
/* harmony export */   filterCoordinates: () => (/* binding */ filterCoordinates),
/* harmony export */   findCoordinates: () => (/* binding */ findCoordinates),
/* harmony export */   gameBoardFactory: () => (/* binding */ gameBoardFactory),
/* harmony export */   openDistance: () => (/* binding */ openDistance),
/* harmony export */   playerFactory: () => (/* binding */ playerFactory),
/* harmony export */   shipFactory: () => (/* binding */ shipFactory)
/* harmony export */ });
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
    //console.log("tries to shoot row:"  + target.row + "col: " + target.column)
    if (gameBoard.recieveAttack(target.row, target.column)){
        //console.log("its a hit");
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
    //console.log("targets: " + targetList.length)

    if (targetList.length > 0) return aiTargetMove(gameBoard, targetList[Math.floor(Math.random()*targetList.length)]);
    //console.log("going to searchmove")
    return aiSearchMove(gameBoard);
}

//searches for new boats
function aiSearchMove(gameBoard){
    //find length of shortest unsunk ship
    let shortShip = gameBoard.shipList.reduce((shortest, ship) => !ship.isSunk() && ship.length < shortest ? ship.length : shortest, 1000000);
    let goodShots = [];
    let newShot;
    for (let row = 0; row < gameBoard.height; row++){
        for (let column = 0; column < gameBoard.width; column++){
            if ((row + column) % shortShip != 0) continue;
            if (gameBoard.board[row][column].isAttacked) continue;
            goodShots.push({row, column});
        }
    }
    //filter for target value

    //filter goodshots for the ones where the most open straigth distance around them
    goodShots.forEach(element => element.openSum = sumOpenDistance(gameBoard, element));
    let greatestOpen = goodShots.reduce((greatest, element) => element.openSum > greatest ? element.openSum : greatest, 0);
    goodShots = goodShots.filter(element => element.openSum == greatestOpen);
    //console.log(goodShots)
    //chose one at random
    return goodShots[Math.floor(Math.random()*goodShots.length)];
}

//tries to sink boat thats been found but not sunk
function aiTargetMove(gameBoard, target){
   // console.log("targeting row: " + target.row + " column: " + target.column)
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
            return possibleCoordinates.reduce((highestHorizontal, coordinate) => coordinate.column >= highestHorizontal.column ? coordinate : highestHorizontal);
        return possibleCoordinates.reduce((lowestHorizontal, coordinate) => coordinate.column <= lowestHorizontal.column ? coordinate : lowestHorizontal);
    } else if (attackedVerticalDistance > attackedHorizontalDistance){
        longest = Math.max(verticalPosDistance, verticalNegDistance);
        if (verticalPosDistance  == longest)
            return possibleCoordinates.reduce((highestVertical, coordinate) => coordinate.row >= highestVertical.row ? coordinate : highestVertical);
        return possibleCoordinates.reduce((lowestVertical, coordinate) => coordinate.row <= lowestVertical.row ? coordinate : lowestVertical);
    } else {
        longest = Math.max(horizontalPosDistance, horizontalNegDistance);
        if (horizontalPosDistance  == longest)
            return possibleCoordinates.reduce((highestHorizontal, coordinate) => coordinate.column >= highestHorizontal.column ? coordinate : highestHorizontal);
        return possibleCoordinates.reduce((lowestHorizontal, coordinate) => coordinate.column <= lowestHorizontal.column ? coordinate : lowestHorizontal);
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
    let vertPos = openDistance(gameBoard, start, true, 1);
    let vertNeg = openDistance(gameBoard, start, true, -1);
    let horPos = openDistance(gameBoard, start, false, 1);
    let horNeg = openDistance(gameBoard, start, false, -1);
    return vertPos + vertNeg + 2*(vertPos < vertNeg ? vertPos : vertNeg) + horPos + horNeg + 2*(horPos < horNeg ? horPos : horNeg);
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




/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**************************!*\
  !*** ./src/interface.js ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _gamelogic__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./gamelogic */ "./src/gamelogic.js");


const p1BoardDisplay = document.getElementById("p1Board");
const p2BoardDisplay = document.getElementById("p2Board");

p2BoardDisplay.innerHTML = "test";
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Ozs7Ozs7Ozs7OztBQ0RvQjs7QUFFcEI7QUFDQTs7QUFFQSxrQyIsInNvdXJjZXMiOlsid2VicGFjazovL3dlYnBhY2stZGVtby8uL3NyYy9nYW1lbG9naWMuanMiLCJ3ZWJwYWNrOi8vd2VicGFjay1kZW1vL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3dlYnBhY2stZGVtby93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vd2VicGFjay1kZW1vL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vd2VicGFjay1kZW1vL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vd2VicGFjay1kZW1vLy4vc3JjL2ludGVyZmFjZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBzaGlwRmFjdG9yeShsZW5ndGgpe1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihsZW5ndGgpKSB0aHJvdyBuZXcgRXJyb3IoXCJzaGlwIGxlbmd0aCBtdXN0IGJlIGludGVnZXJcIik7XG4gICAgaWYgKGxlbmd0aCA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJNaW4gc2hpcCBsZW5ndGg6IDFcIik7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGVuZ3RoLFxuICAgICAgICBoaXRzOiAwLFxuICAgICAgICBoaXQgKCl7XG4gICAgICAgICAgICB0aGlzLmhpdHMrK1xuICAgICAgICB9LFxuICAgICAgICBpc1N1bmsoKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhpdHMgPj0gdGhpcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdhbWVCb2FyZEZhY3RvcnkoaGVpZ2h0LCB3aWR0aCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaGVpZ2h0LFxuICAgICAgICB3aWR0aCxcbiAgICAgICAgYm9hcmQ6IFsuLi5BcnJheShoZWlnaHQpXS5tYXAocm93ID0+IEFycmF5KHdpZHRoKS5maWxsKGZhbHNlKS5tYXAoZWxlbSA9PiAge1xuICAgICAgICAgICAgcmV0dXJuIHtzaGlwOiBudWxsLCBpc0F0dGFja2VkOiBmYWxzZX1cbiAgICAgICAgfSkpLFxuICAgICAgICBzaGlwTGlzdDogW10sXG4gICAgICAgIHBsYWNlU2hpcChyb3csIGNvbHVtbiwgdmVydGljYWwsIHNoaXApe1xuICAgICAgICAgICAgaWYgKHJvdyA+PSB0aGlzLmhlaWdodCB8fCBjb2x1bW4gPj0gdGhpcy53aWR0aCB8fCBjb2x1bW4gPCAwIHx8IHJvdyA8IDApIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGlmICghdmVydGljYWwgJiYgY29sdW1uICsgc2hpcC5sZW5ndGggPiB0aGlzLndpZHRoKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAodmVydGljYWwgJiYgcm93ICsgc2hpcC5sZW5ndGggPiB0aGlzLmhlaWdodCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaGlwLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICBpZiAoIXZlcnRpY2FsICYmIHRoaXMuYm9hcmRbcm93XVtjb2x1bW4raV0uc2hpcCAhPSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHZlcnRpY2FsICYmIHRoaXMuYm9hcmRbcm93K2ldW2NvbHVtbl0uc2hpcCAhPSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNoaXAubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIGlmICghdmVydGljYWwpIHRoaXMuYm9hcmRbcm93XVtjb2x1bW4raV0uc2hpcCA9IHNoaXA7XG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzLmJvYXJkW3JvdytpXVtjb2x1bW5dLnNoaXAgPSBzaGlwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaGlwTGlzdC5wdXNoKHNoaXApXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICByZWNpZXZlQXR0YWNrKHJvdywgY29sdW1uKXtcbiAgICAgICAgICAgIGlmIChyb3cgPj0gdGhpcy5oZWlnaHQgfHwgY29sdW1uID49IHRoaXMud2lkdGggfHwgY29sdW1uIDwgMCB8fCByb3cgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJNdXN0IHNob290IGluc2lkZSBib2FyZFwiKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmJvYXJkW3Jvd11bY29sdW1uXS5pc0F0dGFja2VkKSB0aHJvdyBuZXcgRXJyb3IoXCJQb3NpdGlvbiBhbHJlYWR5IGF0dGFja2VkXCIpO1xuICAgICAgICAgICAgdGhpcy5ib2FyZFtyb3ddW2NvbHVtbl0uaXNBdHRhY2tlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIXRoaXMuYm9hcmRbcm93XVtjb2x1bW5dLnNoaXApIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuYm9hcmRbcm93XVtjb2x1bW5dLnNoaXAuaGl0KCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgYWxsU3Vuaygpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2hpcExpc3QuZXZlcnkoc2hpcCA9PiBzaGlwLmlzU3VuaygpKVxuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBwbGF5ZXJGYWN0b3J5KHBsYXllck5hbWUsIGlzQWksIHNlbGZCb2FyZCwgb3RoZXJCb2FyZCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGxheWVyTmFtZSxcbiAgICAgICAgaXNBaSxcbiAgICAgICAgc2VsZkJvYXJkLFxuICAgICAgICBvdGhlckJvYXJkLFxuICAgICAgICBpc1R1cm46IGZhbHNlXG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIGFpUGxhY2UoZ2FtZUJvYXJkLCBzaGlwTGlzdCl7XG4gICAgd2hpbGUgKHNoaXBMaXN0Lmxlbmd0aCA+IDApe1xuICAgICAgICBsZXQgcmFuZFJvdyA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGdhbWVCb2FyZC5oZWlnaHQpO1xuICAgICAgICBsZXQgcmFuZENvbHVtbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGdhbWVCb2FyZC53aWR0aCk7XG4gICAgICAgIGxldCBpc1ZlcnRpY2FsID0gTWF0aC5yYW5kb20oKSA+IDAuNTtcbiAgICAgICAgaWYgKGdhbWVCb2FyZC5wbGFjZVNoaXAocmFuZFJvdywgcmFuZENvbHVtbiwgaXNWZXJ0aWNhbCwgc2hpcExpc3Rbc2hpcExpc3QubGVuZ3RoLTFdKSlcbiAgICAgICAgICAgIHNoaXBMaXN0LnBvcCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYWlTaG9vdChwbGF5ZXIsIGdhbWVCb2FyZCl7XG4gICAgbGV0IHRhcmdldCA9IGFpTW92ZShnYW1lQm9hcmQpO1xuICAgIC8vY29uc29sZS5sb2coXCJ0cmllcyB0byBzaG9vdCByb3c6XCIgICsgdGFyZ2V0LnJvdyArIFwiY29sOiBcIiArIHRhcmdldC5jb2x1bW4pXG4gICAgaWYgKGdhbWVCb2FyZC5yZWNpZXZlQXR0YWNrKHRhcmdldC5yb3csIHRhcmdldC5jb2x1bW4pKXtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIml0cyBhIGhpdFwiKTtcbiAgICB9O1xuICAgIGlmICh0YXJnZXQucm93ID09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKHBsYXllci5wbGF5ZXJOYW1lICsgXCIgZGlkbid0IGZpbmQgYSB0YXJnZXRcIik7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbi8vT25seSB1c2VzIGluZm9ybWF0aW9uIG9uIHdoZXJlIGhpdHMvbWlzc2VzIGhhdmUgYmVlbiBzY29yZWQgYW5kIHdoaWNoIHNoaXBzIGFyZSBzdW5rXG5mdW5jdGlvbiBhaU1vdmUoZ2FtZUJvYXJkKXtcbiAgICBpZiAoZ2FtZUJvYXJkLmFsbFN1bmsoKSkgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgZmluZCBtb3ZlIHdoZW4gYWxsIHNoaXBzIHN1bmtcIik7XG5cbiAgICAvL2ZpcnN0IGNoZWNrIGZvciBmaXJzdCBoaXRzIG9uIHNoaXAgdGhhdCBoYXNuJ3QgYmVlbiBzdW5rXG4gICAgbGV0IHRhcmdldExpc3QgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdhbWVCb2FyZC5oZWlnaHQ7IGkrKyl7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZ2FtZUJvYXJkLndpZHRoOyBqKyspe1xuICAgICAgICAgICAgaWYgKGdhbWVCb2FyZC5ib2FyZFtpXVtqXS5pc0F0dGFja2VkICYmIChnYW1lQm9hcmQuYm9hcmRbaV1bal0uc2hpcCAhPSBudWxsKSAmJiAhZ2FtZUJvYXJkLmJvYXJkW2ldW2pdLnNoaXAuaXNTdW5rKCkpXG4gICAgICAgICAgICAgICAgdGFyZ2V0TGlzdC5wdXNoKHtyb3c6IGksIGNvbHVtbjogan0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vY29uc29sZS5sb2coXCJ0YXJnZXRzOiBcIiArIHRhcmdldExpc3QubGVuZ3RoKVxuXG4gICAgaWYgKHRhcmdldExpc3QubGVuZ3RoID4gMCkgcmV0dXJuIGFpVGFyZ2V0TW92ZShnYW1lQm9hcmQsIHRhcmdldExpc3RbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKnRhcmdldExpc3QubGVuZ3RoKV0pO1xuICAgIC8vY29uc29sZS5sb2coXCJnb2luZyB0byBzZWFyY2htb3ZlXCIpXG4gICAgcmV0dXJuIGFpU2VhcmNoTW92ZShnYW1lQm9hcmQpO1xufVxuXG4vL3NlYXJjaGVzIGZvciBuZXcgYm9hdHNcbmZ1bmN0aW9uIGFpU2VhcmNoTW92ZShnYW1lQm9hcmQpe1xuICAgIC8vZmluZCBsZW5ndGggb2Ygc2hvcnRlc3QgdW5zdW5rIHNoaXBcbiAgICBsZXQgc2hvcnRTaGlwID0gZ2FtZUJvYXJkLnNoaXBMaXN0LnJlZHVjZSgoc2hvcnRlc3QsIHNoaXApID0+ICFzaGlwLmlzU3VuaygpICYmIHNoaXAubGVuZ3RoIDwgc2hvcnRlc3QgPyBzaGlwLmxlbmd0aCA6IHNob3J0ZXN0LCAxMDAwMDAwKTtcbiAgICBsZXQgZ29vZFNob3RzID0gW107XG4gICAgbGV0IG5ld1Nob3Q7XG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgZ2FtZUJvYXJkLmhlaWdodDsgcm93Kyspe1xuICAgICAgICBmb3IgKGxldCBjb2x1bW4gPSAwOyBjb2x1bW4gPCBnYW1lQm9hcmQud2lkdGg7IGNvbHVtbisrKXtcbiAgICAgICAgICAgIGlmICgocm93ICsgY29sdW1uKSAlIHNob3J0U2hpcCAhPSAwKSBjb250aW51ZTtcbiAgICAgICAgICAgIGlmIChnYW1lQm9hcmQuYm9hcmRbcm93XVtjb2x1bW5dLmlzQXR0YWNrZWQpIGNvbnRpbnVlO1xuICAgICAgICAgICAgZ29vZFNob3RzLnB1c2goe3JvdywgY29sdW1ufSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy9maWx0ZXIgZm9yIHRhcmdldCB2YWx1ZVxuXG4gICAgLy9maWx0ZXIgZ29vZHNob3RzIGZvciB0aGUgb25lcyB3aGVyZSB0aGUgbW9zdCBvcGVuIHN0cmFpZ3RoIGRpc3RhbmNlIGFyb3VuZCB0aGVtXG4gICAgZ29vZFNob3RzLmZvckVhY2goZWxlbWVudCA9PiBlbGVtZW50Lm9wZW5TdW0gPSBzdW1PcGVuRGlzdGFuY2UoZ2FtZUJvYXJkLCBlbGVtZW50KSk7XG4gICAgbGV0IGdyZWF0ZXN0T3BlbiA9IGdvb2RTaG90cy5yZWR1Y2UoKGdyZWF0ZXN0LCBlbGVtZW50KSA9PiBlbGVtZW50Lm9wZW5TdW0gPiBncmVhdGVzdCA/IGVsZW1lbnQub3BlblN1bSA6IGdyZWF0ZXN0LCAwKTtcbiAgICBnb29kU2hvdHMgPSBnb29kU2hvdHMuZmlsdGVyKGVsZW1lbnQgPT4gZWxlbWVudC5vcGVuU3VtID09IGdyZWF0ZXN0T3Blbik7XG4gICAgLy9jb25zb2xlLmxvZyhnb29kU2hvdHMpXG4gICAgLy9jaG9zZSBvbmUgYXQgcmFuZG9tXG4gICAgcmV0dXJuIGdvb2RTaG90c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqZ29vZFNob3RzLmxlbmd0aCldO1xufVxuXG4vL3RyaWVzIHRvIHNpbmsgYm9hdCB0aGF0cyBiZWVuIGZvdW5kIGJ1dCBub3Qgc3Vua1xuZnVuY3Rpb24gYWlUYXJnZXRNb3ZlKGdhbWVCb2FyZCwgdGFyZ2V0KXtcbiAgIC8vIGNvbnNvbGUubG9nKFwidGFyZ2V0aW5nIHJvdzogXCIgKyB0YXJnZXQucm93ICsgXCIgY29sdW1uOiBcIiArIHRhcmdldC5jb2x1bW4pXG4gICAgbGV0IHN1cnJvdW5kaW5nID0gW1xuICAgICAgICB7cm93OiB0YXJnZXQucm93KzEsIGNvbHVtbjogdGFyZ2V0LmNvbHVtbn0sXG4gICAgICAgIHtyb3c6IHRhcmdldC5yb3ctMSwgY29sdW1uOiB0YXJnZXQuY29sdW1ufSxcbiAgICAgICAge3JvdzogdGFyZ2V0LnJvdywgY29sdW1uOiB0YXJnZXQuY29sdW1uKzF9LFxuICAgICAgICB7cm93OiB0YXJnZXQucm93LCBjb2x1bW46IHRhcmdldC5jb2x1bW4tMX0sXG4gICAgXTtcbiAgICBcbiAgICAvL2ZpbmQgYmVzdCBkaXJlY3Rpb25zXG5cbiAgICBsZXQgcG9zc2libGVDb29yZGluYXRlcyA9IGZpbmRDb29yZGluYXRlcyhnYW1lQm9hcmQsIHN1cnJvdW5kaW5nLCB0YXJnZXQpO1xuXG4gICAgbGV0IGhpZ2hlc3RSb3cgPSBwb3NzaWJsZUNvb3JkaW5hdGVzLnJlZHVjZSgoaGlnaGVzdCwgY29vcmRpbmF0ZSkgID0+IGNvb3JkaW5hdGUucm93ID4gaGlnaGVzdCA/IGNvb3JkaW5hdGUucm93IDogaGlnaGVzdCwgdGFyZ2V0LnJvdysxKTtcbiAgICBsZXQgbG93ZXN0Um93ID0gcG9zc2libGVDb29yZGluYXRlcy5yZWR1Y2UoKGxvd2VzdCwgY29vcmRpbmF0ZSkgID0+IGNvb3JkaW5hdGUucm93IDwgbG93ZXN0ID8gY29vcmRpbmF0ZS5yb3cgOiBsb3dlc3QsIHRhcmdldC5yb3ctMSk7XG4gICAgbGV0IGhpZ2hlc3RDb2x1bW4gPSBwb3NzaWJsZUNvb3JkaW5hdGVzLnJlZHVjZSgoaGlnaGVzdCwgY29vcmRpbmF0ZSkgID0+IGNvb3JkaW5hdGUuY29sdW1uID4gaGlnaGVzdCA/IGNvb3JkaW5hdGUuY29sdW1uIDogaGlnaGVzdCwgdGFyZ2V0LmNvbHVtbisxKTtcbiAgICBsZXQgbG93ZXN0Q29sdW1uID0gcG9zc2libGVDb29yZGluYXRlcy5yZWR1Y2UoKGxvd2VzdCwgY29vcmRpbmF0ZSkgID0+IGNvb3JkaW5hdGUuY29sdW1uIDwgbG93ZXN0ID8gY29vcmRpbmF0ZS5jb2x1bW4gOiBsb3dlc3QsIHRhcmdldC5jb2x1bW4tMSk7XG5cbiAgICBsZXQgdmVydGljYWxQb3NEaXN0YW5jZSA9IG9wZW5EaXN0YW5jZShnYW1lQm9hcmQsIHtyb3c6IGhpZ2hlc3RSb3csIGNvbHVtbjogdGFyZ2V0LmNvbHVtbn0sIHRydWUsIDEpO1xuICAgIGxldCB2ZXJ0aWNhbE5lZ0Rpc3RhbmNlID0gb3BlbkRpc3RhbmNlKGdhbWVCb2FyZCwge3JvdzogbG93ZXN0Um93LCBjb2x1bW46IHRhcmdldC5jb2x1bW59LCB0cnVlLCAtMSk7XG4gICAgbGV0IGhvcml6b250YWxQb3NEaXN0YW5jZSA9IG9wZW5EaXN0YW5jZShnYW1lQm9hcmQsIHtyb3c6IHRhcmdldC5yb3csIGNvbHVtbjogaGlnaGVzdENvbHVtbn0sIGZhbHNlLCAxKTtcbiAgICBsZXQgaG9yaXpvbnRhbE5lZ0Rpc3RhbmNlID0gb3BlbkRpc3RhbmNlKGdhbWVCb2FyZCwge3JvdzogdGFyZ2V0LnJvdywgY29sdW1uOiBsb3dlc3RDb2x1bW59LCBmYWxzZSwgLTEpO1xuICAgIC8vY29uc29sZS5sb2coXCJoaWdoZXN0Um93OiBcIiArIGhpZ2hlc3RSb3cgKyBcIlxcbmxvd2VzdFJvdzogXCIgKyBsb3dlc3RSb3cgK1wiXFxuaGlnaGVzdENvbHVtbjogXCIgKyBoaWdoZXN0Q29sdW1uICsgXCJcXG5sb3dlc3RDb2x1bW46IFwiICsgbG93ZXN0Q29sdW1uKTtcbiAgICBsZXQgbG9uZ2VzdDtcblxuICAgIGxldCBhdHRhY2tlZFZlcnRpY2FsRGlzdGFuY2UgPSBNYXRoLm1heChhdHRhY2tlZExlbmd0aChnYW1lQm9hcmQsIHtyb3c6IGhpZ2hlc3RSb3ctMSwgY29sdW1uOiB0YXJnZXQuY29sdW1ufSwgdHJ1ZSwgLTEpLCBhdHRhY2tlZExlbmd0aChnYW1lQm9hcmQsIHtyb3c6IGxvd2VzdFJvdysxLCBjb2x1bW46IHRhcmdldC5jb2x1bW59LCB0cnVlLCAxKSk7XG4gICAgbGV0IGF0dGFja2VkSG9yaXpvbnRhbERpc3RhbmNlID0gTWF0aC5tYXgoYXR0YWNrZWRMZW5ndGgoZ2FtZUJvYXJkLCB7cm93OiB0YXJnZXQucm93LCBjb2x1bW46IGhpZ2hlc3RDb2x1bW4tMX0sIGZhbHNlLCAtMSksIGF0dGFja2VkTGVuZ3RoKGdhbWVCb2FyZCwge3JvdzogdGFyZ2V0LnJvdywgY29sdW1uOiBsb3dlc3RDb2x1bW4rMX0sIGZhbHNlLCAxKSk7XG4gICAgLy9zaG9vdCBpbiBjb250aW5vdXMgdW5zdW5rIHNoaXAgZGlyZWN0aW9uXG4gICAgLy9jb25zb2xlLmxvZyhcImRpc3RhbmNlIFZlcnRpY2FsOiBcIiArIGF0dGFja2VkVmVydGljYWxEaXN0YW5jZSArIFwiXFxuZGlzdGFuY2UgSG9yaXpvbnRhbDogXCIgKyBhdHRhY2tlZEhvcml6b250YWxEaXN0YW5jZSlcbiAgICBpZiAoYXR0YWNrZWRWZXJ0aWNhbERpc3RhbmNlID09IGF0dGFja2VkSG9yaXpvbnRhbERpc3RhbmNlKXtcbiAgICAgICAgbG9uZ2VzdCA9IE1hdGgubWF4KHZlcnRpY2FsUG9zRGlzdGFuY2UsIHZlcnRpY2FsTmVnRGlzdGFuY2UsIGhvcml6b250YWxQb3NEaXN0YW5jZSwgaG9yaXpvbnRhbE5lZ0Rpc3RhbmNlKTtcbiAgICAgICAgaWYgKHZlcnRpY2FsUG9zRGlzdGFuY2UgID09IGxvbmdlc3QpXG4gICAgICAgICAgICByZXR1cm4gcG9zc2libGVDb29yZGluYXRlcy5yZWR1Y2UoKGhpZ2hlc3RWZXJ0aWNhbCwgY29vcmRpbmF0ZSkgPT4gY29vcmRpbmF0ZS5yb3cgPj0gaGlnaGVzdFZlcnRpY2FsLnJvdyA/IGNvb3JkaW5hdGUgOiBoaWdoZXN0VmVydGljYWwpO1xuICAgICAgICBpZiAodmVydGljYWxOZWdEaXN0YW5jZSA9PSBsb25nZXN0KVxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlQ29vcmRpbmF0ZXMucmVkdWNlKChsb3dlc3RWZXJ0aWNhbCwgY29vcmRpbmF0ZSkgPT4gY29vcmRpbmF0ZS5yb3cgPD0gbG93ZXN0VmVydGljYWwucm93ID8gY29vcmRpbmF0ZSA6IGxvd2VzdFZlcnRpY2FsKTtcbiAgICAgICAgaWYgKGhvcml6b250YWxQb3NEaXN0YW5jZSAgPT0gbG9uZ2VzdClcbiAgICAgICAgICAgIHJldHVybiBwb3NzaWJsZUNvb3JkaW5hdGVzLnJlZHVjZSgoaGlnaGVzdEhvcml6b250YWwsIGNvb3JkaW5hdGUpID0+IGNvb3JkaW5hdGUuY29sdW1uID49IGhpZ2hlc3RIb3Jpem9udGFsLmNvbHVtbiA/IGNvb3JkaW5hdGUgOiBoaWdoZXN0SG9yaXpvbnRhbCk7XG4gICAgICAgIHJldHVybiBwb3NzaWJsZUNvb3JkaW5hdGVzLnJlZHVjZSgobG93ZXN0SG9yaXpvbnRhbCwgY29vcmRpbmF0ZSkgPT4gY29vcmRpbmF0ZS5jb2x1bW4gPD0gbG93ZXN0SG9yaXpvbnRhbC5jb2x1bW4gPyBjb29yZGluYXRlIDogbG93ZXN0SG9yaXpvbnRhbCk7XG4gICAgfSBlbHNlIGlmIChhdHRhY2tlZFZlcnRpY2FsRGlzdGFuY2UgPiBhdHRhY2tlZEhvcml6b250YWxEaXN0YW5jZSl7XG4gICAgICAgIGxvbmdlc3QgPSBNYXRoLm1heCh2ZXJ0aWNhbFBvc0Rpc3RhbmNlLCB2ZXJ0aWNhbE5lZ0Rpc3RhbmNlKTtcbiAgICAgICAgaWYgKHZlcnRpY2FsUG9zRGlzdGFuY2UgID09IGxvbmdlc3QpXG4gICAgICAgICAgICByZXR1cm4gcG9zc2libGVDb29yZGluYXRlcy5yZWR1Y2UoKGhpZ2hlc3RWZXJ0aWNhbCwgY29vcmRpbmF0ZSkgPT4gY29vcmRpbmF0ZS5yb3cgPj0gaGlnaGVzdFZlcnRpY2FsLnJvdyA/IGNvb3JkaW5hdGUgOiBoaWdoZXN0VmVydGljYWwpO1xuICAgICAgICByZXR1cm4gcG9zc2libGVDb29yZGluYXRlcy5yZWR1Y2UoKGxvd2VzdFZlcnRpY2FsLCBjb29yZGluYXRlKSA9PiBjb29yZGluYXRlLnJvdyA8PSBsb3dlc3RWZXJ0aWNhbC5yb3cgPyBjb29yZGluYXRlIDogbG93ZXN0VmVydGljYWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGxvbmdlc3QgPSBNYXRoLm1heChob3Jpem9udGFsUG9zRGlzdGFuY2UsIGhvcml6b250YWxOZWdEaXN0YW5jZSk7XG4gICAgICAgIGlmIChob3Jpem9udGFsUG9zRGlzdGFuY2UgID09IGxvbmdlc3QpXG4gICAgICAgICAgICByZXR1cm4gcG9zc2libGVDb29yZGluYXRlcy5yZWR1Y2UoKGhpZ2hlc3RIb3Jpem9udGFsLCBjb29yZGluYXRlKSA9PiBjb29yZGluYXRlLmNvbHVtbiA+PSBoaWdoZXN0SG9yaXpvbnRhbC5jb2x1bW4gPyBjb29yZGluYXRlIDogaGlnaGVzdEhvcml6b250YWwpO1xuICAgICAgICByZXR1cm4gcG9zc2libGVDb29yZGluYXRlcy5yZWR1Y2UoKGxvd2VzdEhvcml6b250YWwsIGNvb3JkaW5hdGUpID0+IGNvb3JkaW5hdGUuY29sdW1uIDw9IGxvd2VzdEhvcml6b250YWwuY29sdW1uID8gY29vcmRpbmF0ZSA6IGxvd2VzdEhvcml6b250YWwpO1xuICAgIH1cblxuICAgIHJldHVybiB7cm93OiAwLCBjb2x1bW46IDB9O1xufVxuXG5mdW5jdGlvbiBhdHRhY2tlZExlbmd0aChnYW1lQm9hcmQsIHN0YXJ0LCB2ZXJ0aWNhbCwgc3RlcCl7XG4gICAgbGV0IHN0YXJ0Q29weSA9IHtyb3c6IHN0YXJ0LnJvdywgY29sdW1uOiBzdGFydC5jb2x1bW59XG4gICAgbGV0IGF0dGFja2VkTGVuZ3RoID0gMDtcbiAgICB3aGlsZSAoZmlsdGVyQ29vcmRpbmF0ZXMoZ2FtZUJvYXJkLCBbc3RhcnRDb3B5XSkubGVuZ3RoID4gMCAmJiBnYW1lQm9hcmQuYm9hcmRbc3RhcnRDb3B5LnJvd11bc3RhcnRDb3B5LmNvbHVtbl0uaXNBdHRhY2tlZCl7XG4gICAgICAgIGF0dGFja2VkTGVuZ3RoKys7XG4gICAgICAgIGlmICh2ZXJ0aWNhbCkgc3RhcnRDb3B5LnJvdyArPSBzdGVwO1xuICAgICAgICBlbHNlIHN0YXJ0Q29weS5jb2x1bW4gKz0gc3RlcDtcbiAgICB9XG4gICAgcmV0dXJuIGF0dGFja2VkTGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBzdW1PcGVuRGlzdGFuY2UoZ2FtZUJvYXJkLCBzdGFydCl7XG4gICAgbGV0IHZlcnRQb3MgPSBvcGVuRGlzdGFuY2UoZ2FtZUJvYXJkLCBzdGFydCwgdHJ1ZSwgMSk7XG4gICAgbGV0IHZlcnROZWcgPSBvcGVuRGlzdGFuY2UoZ2FtZUJvYXJkLCBzdGFydCwgdHJ1ZSwgLTEpO1xuICAgIGxldCBob3JQb3MgPSBvcGVuRGlzdGFuY2UoZ2FtZUJvYXJkLCBzdGFydCwgZmFsc2UsIDEpO1xuICAgIGxldCBob3JOZWcgPSBvcGVuRGlzdGFuY2UoZ2FtZUJvYXJkLCBzdGFydCwgZmFsc2UsIC0xKTtcbiAgICByZXR1cm4gdmVydFBvcyArIHZlcnROZWcgKyAyKih2ZXJ0UG9zIDwgdmVydE5lZyA/IHZlcnRQb3MgOiB2ZXJ0TmVnKSArIGhvclBvcyArIGhvck5lZyArIDIqKGhvclBvcyA8IGhvck5lZyA/IGhvclBvcyA6IGhvck5lZyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5EaXN0YW5jZShnYW1lQm9hcmQsIHN0YXJ0LCB2ZXJ0aWNhbCwgc3RlcCl7XG4gICAgbGV0IHN0YXJ0Q29weSA9IHtyb3c6IHN0YXJ0LnJvdywgY29sdW1uOiBzdGFydC5jb2x1bW59XG4gICAgbGV0IGRpc3RhbmNlID0gMDtcbiAgICB3aGlsZSAoZmlsdGVyQ29vcmRpbmF0ZXMoZ2FtZUJvYXJkLCBbc3RhcnRDb3B5XSkubGVuZ3RoID4gMCAmJiAhZ2FtZUJvYXJkLmJvYXJkW3N0YXJ0Q29weS5yb3ddW3N0YXJ0Q29weS5jb2x1bW5dLmlzQXR0YWNrZWQpe1xuICAgICAgICBkaXN0YW5jZSsrO1xuICAgICAgICBpZiAodmVydGljYWwpIHN0YXJ0Q29weS5yb3cgKz0gc3RlcDtcbiAgICAgICAgZWxzZSBzdGFydENvcHkuY29sdW1uICs9IHN0ZXA7XG4gICAgfVxuICAgIHJldHVybiBkaXN0YW5jZTtcbn1cblxuLy9maW5kcyBmaXJzdCBwb3NzaWJsZSBhdHRhY2sgbG9jYXRpb25zIGluIGJvdGggeCBhbmQgeSBkaXJlY3Rpb25zXG5mdW5jdGlvbiBmaW5kQ29vcmRpbmF0ZXMoZ2FtZUJvYXJkLCBwb3NzaWJsZUNvb3JkaW5hdGVzLCB0YXJnZXQpe1xuICAgIHBvc3NpYmxlQ29vcmRpbmF0ZXMgPSBmaWx0ZXJDb29yZGluYXRlcyhnYW1lQm9hcmQsIHBvc3NpYmxlQ29vcmRpbmF0ZXMpO1xuXG4gICAgLy9maW5kIGFueSBzcXVhcmVzIGFyb3VuZCB0YXJnZXQgdGhhdCBhcmUgaGl0cywgc2VhcmNoIGZvciBmaXJzdCBvcGVuIHNxdWFyZSBpbiB0aG9zZSBkaXJlY3Rpb25zXG4gICAgd2hpbGUgKHBvc3NpYmxlQ29vcmRpbmF0ZXMuc29tZShjb29yZGluYXRlID0+IGdhbWVCb2FyZC5ib2FyZFtjb29yZGluYXRlLnJvd11bY29vcmRpbmF0ZS5jb2x1bW5dLmlzQXR0YWNrZWQpKXtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3NzaWJsZUNvb3JkaW5hdGVzLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgIGxldCBjb29yZGluYXRlID0gcG9zc2libGVDb29yZGluYXRlc1tpXTtcbiAgICAgICAgICAgIGlmIChnYW1lQm9hcmQuYm9hcmRbY29vcmRpbmF0ZS5yb3ddW2Nvb3JkaW5hdGUuY29sdW1uXS5pc0F0dGFja2VkKXtcbiAgICAgICAgICAgICAgICBpZiAoY29vcmRpbmF0ZS5yb3cgPiB0YXJnZXQucm93KSBwb3NzaWJsZUNvb3JkaW5hdGVzW2ldLnJvdyArPSAxO1xuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvb3JkaW5hdGUucm93IDwgdGFyZ2V0LnJvdykgcG9zc2libGVDb29yZGluYXRlc1tpXS5yb3cgLT0gMTtcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjb29yZGluYXRlLmNvbHVtbiA+IHRhcmdldC5jb2x1bW4pIHBvc3NpYmxlQ29vcmRpbmF0ZXNbaV0uY29sdW1uICs9IDE7XG4gICAgICAgICAgICAgICAgZWxzZSBwb3NzaWJsZUNvb3JkaW5hdGVzW2ldLmNvbHVtbiAtPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcG9zc2libGVDb29yZGluYXRlcyA9IGZpbHRlckNvb3JkaW5hdGVzKGdhbWVCb2FyZCwgcG9zc2libGVDb29yZGluYXRlcyk7XG4gICAgfVxuICAgIHJldHVybiBwb3NzaWJsZUNvb3JkaW5hdGVzO1xufVxuXG4vL2ZpbHRlciBjb29yZGluYXRlcyBmb3IgYm9hcmQgZWRnZXMsIG1pc3NlcywgYW5kIHN1bmsgc2hpcHNcbmZ1bmN0aW9uIGZpbHRlckNvb3JkaW5hdGVzKGdhbWVCb2FyZCwgcG9zc2libGVDb29yZGluYXRlcyl7XG4gICAgICAgIHBvc3NpYmxlQ29vcmRpbmF0ZXMgPSBwb3NzaWJsZUNvb3JkaW5hdGVzLmZpbHRlcihjb29yZGluYXRlID0+IHtcbiAgICAgICAgICAgIGlmIChjb29yZGluYXRlLnJvdyA+PSBnYW1lQm9hcmQuaGVpZ2h0IHx8IGNvb3JkaW5hdGUucm93IDwgMCB8fCBjb29yZGluYXRlLmNvbHVtbiA8IDAgfHwgY29vcmRpbmF0ZS5jb2x1bW4gPj0gZ2FtZUJvYXJkLndpZHRoKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBpZiAoZ2FtZUJvYXJkLmJvYXJkW2Nvb3JkaW5hdGUucm93XVtjb29yZGluYXRlLmNvbHVtbl0uaXNBdHRhY2tlZCl7XG4gICAgICAgICAgICAgICAgaWYgKGdhbWVCb2FyZC5ib2FyZFtjb29yZGluYXRlLnJvd11bY29vcmRpbmF0ZS5jb2x1bW5dLnNoaXAgPT0gbnVsbCB8fCBnYW1lQm9hcmQuYm9hcmRbY29vcmRpbmF0ZS5yb3ddW2Nvb3JkaW5hdGUuY29sdW1uXS5zaGlwLmlzU3VuaygpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHBvc3NpYmxlQ29vcmRpbmF0ZXM7XG59XG5cblxuZXhwb3J0IHtzaGlwRmFjdG9yeSwgZ2FtZUJvYXJkRmFjdG9yeSwgcGxheWVyRmFjdG9yeSwgYWlQbGFjZSwgYWlNb3ZlLCBhaVNlYXJjaE1vdmUsIGFpVGFyZ2V0TW92ZSwgZmluZENvb3JkaW5hdGVzLCBmaWx0ZXJDb29yZGluYXRlcywgb3BlbkRpc3RhbmNlLCBhaVNob290fSIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHtcbiAgICBzaGlwRmFjdG9yeSxcbiAgICBnYW1lQm9hcmRGYWN0b3J5LFxuICAgIGFpU2hvb3QsXG4gICAgYWlQbGFjZVxufSBmcm9tICcuL2dhbWVsb2dpYydcblxuY29uc3QgcDFCb2FyZERpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInAxQm9hcmRcIik7XG5jb25zdCBwMkJvYXJkRGlzcGxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicDJCb2FyZFwiKTtcblxucDJCb2FyZERpc3BsYXkuaW5uZXJIVE1MID0gXCJ0ZXN0XCI7Il0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9