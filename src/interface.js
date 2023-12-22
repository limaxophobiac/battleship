import './style.css';

import {
    shipFactory,
    gameBoardFactory,
    aiShoot,
    aiPlace,
    aiSmartPlace
} from './gamelogic'


const placementBoard = document.getElementById("placementBoard");
const p1BoardDisplay = document.getElementById("p1Board");
const p2BoardDisplay = document.getElementById("p2Board");
const selectSpace = document.getElementById("shipSelect");



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
            displayGrid[i][j].row = i;
            displayGrid[i][j].column = j;
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




function newGameStart(){
    selectSpace.innerHTML= "";
    let p1Board = boardFactory(placementBoard, 10, 10);
    let hCarrier = {logical: shipFactory(5), visual: document.createElement('div')};
    let hBattleship = {logical: shipFactory(4), visual: document.createElement('div')};
    let hDestroyer = {logical: shipFactory(3), visual: document.createElement('div')};
    let hSubmarine = {logical: shipFactory(3), visual: document.createElement('div')};
    let hPatrolBoat = {logical: shipFactory(2), visual: document.createElement('div')};
    let playerShips = [
        hCarrier,
        hBattleship,
        hDestroyer,
        hSubmarine,
        hPatrolBoat
    ]
    
    for (let i =0; i < playerShips.length; i++){
        playerShips[i].visual.classList.add("ship");
        selectSpace.appendChild(playerShips[i].visual);
        playerShips[i].visual.style.display = "none"
        playerShips[i].visual.style.minHeight="30px"
        playerShips[i].visual.style.height="min(5vw, 10%)"
        playerShips[i].visual.style.aspectRatio=`${playerShips[i].logical.length}/1`;
        playerShips[i].horizontal=true;
        playerShips[i].visual.addEventListener("click", function(){
            console.log("rotating")
            if (playerShips[i].horizontal){
                console.log("tovertical")
                playerShips[i].horizontal=false;
                playerShips[i].visual.style.minHeigth=`${30*playerShips[i].logical.length}px`;
                playerShips[i].visual.style.height=`min(${5*playerShips[i].logical.length}vw, ${10*playerShips[i].logical.length}%)`;
                playerShips[i].visual.style.aspectRatio=`1/${playerShips[i].logical.length}`;
            } else {
                console.log("tohorizontal");
                playerShips[i].horizontal=true;
                playerShips[i].visual.style.minHeight="30px"
                playerShips[i].visual.style.height="min(5vw, 10%)"
                playerShips[i].visual.style.aspectRatio=`${playerShips[i].logical.length}/1`;
            }
        })

    }
    let currentShip = 0;

    for (let i = 0; i < p1Board.height; i++){
        for (let j = 0; j < p1Board.width; j++){
            p1Board.displayGrid[i][j].addEventListener("mouseover", function(){
                console.log(i + " " + j)
                if (playerShips[currentShip].horizontal){
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + j < p1Board.width; k++)
                        p1Board.displayGrid[i][j+k].style.backgroundColor = "grey";
                } else {
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + i < p1Board.height; k++)
                        p1Board.displayGrid[i+k][j].style.backgroundColor = "grey";
                }
            });

            p1Board.displayGrid[i][j].addEventListener("mouseleave", function(){
                console.log(i + " " + j)
                if (playerShips[currentShip].horizontal){
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + j < p1Board.width; k++)
                        p1Board.displayGrid[i][j+k].style.backgroundColor = "white";
                } else {
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + i < p1Board.height; k++)
                        p1Board.displayGrid[i+k][j].style.backgroundColor = "white";
                }
            });

            p1Board.displayGrid[i][j].addEventListener("click", function(){
                console.log(i + " " + j)
                if (playerShips[currentShip].horizontal){
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + j < p1Board.width; k++){
                        p1Board.displayGrid[i][j+k].style.backgroundColor = "black";
                    }
                } else {
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + i < p1Board.height; k++){
                        p1Board.displayGrid[i+k][j].style.backgroundColor = "black";
                    }
                }
                playerShips[currentShip].visual.style.display="none"
                currentShip++;
                playerShips[currentShip].visual.style.display="grid"
            });

        }

    }

    playerShips[0].visual.style.display="grid";


}

newGameStart();