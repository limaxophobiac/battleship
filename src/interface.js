import './style.css';

import {
    shipFactory,
    gameBoardFactory,
    aiShoot,
    aiPlace,
    aiSmartPlace
} from './gamelogic'

const p1BoardDisplay = document.getElementById("p1Board");
const p2BoardDisplay = document.getElementById("p2Board");



function boardFactory(boardDisplay, height, width){
    let gameBoard = gameBoardFactory(height, width);

    let displayGrid = [...Array(height)].map(row => Array(width).fill(false).map(elem =>  null));
    boardDisplay.style.gridTemplateColumns = "1fr ".repeat(width)
    boardDisplay.style.gridTemplateRows = "1fr ".repeat(height)
    for (let i = 0; i < height; i++){
        for (let j = 0; j < width; j++){
            displayGrid[i][j] = document.createElement('div');
            //teststuff
            displayGrid[i][j].style.backgroundColor = 'white';
            //
            boardDisplay.appendChild(displayGrid[i][j])
        }
    }

    boardDisplay.setAttribute("active", "inactive");
    return {
        displayGrid,
        gameBoard,
        height,
        width,
        displayUpdate(showShips){
            if (showShips == true){
                for (let i = 0; i < this.height; i++){
                    for (let j = 0; j < this.width; j++){
                        if (this.gameBoard.board[i][j].ship != null){
                            if (this.gameBoard.board[i][j].isAttacked && this.gameBoard.board[i][j].ship.isSunk())
                            this.displayGrid[i][j].style.backgroundColor = "red";
                            else if (this.gameBoard.board[i][j].isAttacked) this.displayGrid[i][j].style.backgroundColor = "orange";
                            else this.displayGrid[i][j].style.backgroundColor = "black";
                        } else if (this.gameBoard.board[i][j].isAttacked) this.displayGrid[i][j].style.backgroundColor = "darkgray";
                    }
                }
            } else {

            }
        },
    }
}



let p1Board = boardFactory(p1BoardDisplay, 10, 10);
let p2Board = boardFactory(p2BoardDisplay, 10, 10);


aiSmartPlace(p2Board.gameBoard, [
    shipFactory(5),
    shipFactory(4),
    shipFactory(3),
    shipFactory(3),
    shipFactory(2),
])

p2Board.displayUpdate(true);

aiSmartPlace(p1Board.gameBoard, [
    shipFactory(5),
    shipFactory(4),
    shipFactory(3),
    shipFactory(3),
    shipFactory(2),
])

p1Board.displayUpdate(true);

async function playtest(){
    await(new Promise(res => setTimeout(res, 1000))); 
    while (!p2Board.gameBoard.allSunk()){
        aiShoot({playerName: "test"}, p1Board.gameBoard)
        p1Board.displayUpdate(true);
        await(new Promise(res => setTimeout(res, 75)));
        if (p1Board.gameBoard.allSunk()) break;
        aiShoot({playerName: "test"}, p2Board.gameBoard)
        p2Board.displayUpdate(true);
        await(new Promise(res => setTimeout(res, 75))); 
    }
}