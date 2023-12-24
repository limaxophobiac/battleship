import './style.css';

import {
    shipFactory,
    gameBoardFactory,
    aiShoot,
    aiSmartPlace,
    playerFactory
} from './gamelogic'


let allPlaced;
let newBoard;

const placementBoard = document.getElementById("placementBoard");
const p1BoardDisplay = document.getElementById("p1Board");
const p2BoardDisplay = document.getElementById("p2Board");
const selectSpace = document.getElementById("shipSelect");
const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startGameScreen");
const playScreen = document.getElementById("playGameScreen");

let currentGame = null;




function boardFactory(boardDisplay, height, width){
    boardDisplay.innerHTML = "";
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
                for (let i = 0; i < this.height; i++){
                    for (let j = 0; j < this.width; j++){
                        if (this.gameBoard.board[i][j].ship != null){
                            if (this.gameBoard.board[i][j].isAttacked && this.gameBoard.board[i][j].ship.isSunk())
                            this.displayGrid[i][j].style.backgroundColor = "red";
                            else if (this.gameBoard.board[i][j].isAttacked) this.displayGrid[i][j].style.backgroundColor = "orange";
                            else if (showShips) this.displayGrid[i][j].style.backgroundColor = "black";
                        } else if (this.gameBoard.board[i][j].isAttacked) this.displayGrid[i][j].style.backgroundColor = "darkgray";
                    }
                }
        },
    }
}








function playtest(p1Board, p2Board){
    while (!p2Board.gameBoard.allSunk()){
        aiShoot({playerName: "test", aiDifficulty: 2}, p1Board.gameBoard)
        p1Board.displayUpdate(true);
        if (p1Board.gameBoard.allSunk()){
            console.log("p2 won")
            return;
        }
        aiShoot({playerName: "test", aiDifficulty: 2}, p2Board.gameBoard)
        p2Board.displayUpdate(false);
    }
    console.log("p1 won)");
}




function newGameSetup(){
    startScreen.style.display = "grid";
    playScreen.style.display = "none";
    allPlaced = false;
    selectSpace.innerHTML= "";
    newBoard = boardFactory(placementBoard, 10, 10);
    newBoard.displayUpdate(true);
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

    for (let i = 0; i < newBoard.height; i++){
        for (let j = 0; j < newBoard.width; j++){
            newBoard.displayGrid[i][j].addEventListener("mouseover", function(){
                if (currentShip >= playerShips.length) return;
                if (playerShips[currentShip].horizontal){
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + j < newBoard.width; k++){
                        if (newBoard.gameBoard.board[i][j+k].ship == null) newBoard.displayGrid[i][j+k].style.backgroundColor = "grey";
                    }
                } else {
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + i < newBoard.height; k++){
                        if (newBoard.gameBoard.board[i+k][j].ship == null) newBoard.displayGrid[i+k][j].style.backgroundColor = "grey";
                    }
                }
            });

            newBoard.displayGrid[i][j].addEventListener("mouseleave", function(){
                if (currentShip >= playerShips.length) return;
                if (playerShips[currentShip].horizontal){
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + j < newBoard.width; k++){
                        if (newBoard.gameBoard.board[i][j+k].ship == null) newBoard.displayGrid[i][j+k].style.backgroundColor = "white";
                    }
                } else {
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + i < newBoard.height; k++){
                        if (newBoard.gameBoard.board[i+k][j].ship == null) newBoard.displayGrid[i+k][j].style.backgroundColor = "white";
                    }
                }
            });

            newBoard.displayGrid[i][j].addEventListener("click", function(){
                console.log(i + " " + j)
                if (currentShip >= playerShips.length) return;
                if (playerShips[currentShip].horizontal){
                    if (!newBoard.gameBoard.placeShip(i, j, false, playerShips[currentShip].logical)) return;
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + j < newBoard.width; k++){
                        newBoard.displayGrid[i][j+k].style.backgroundColor = "black";
                    }
                } else {
                    if (!newBoard.gameBoard.placeShip(i, j, true, playerShips[currentShip].logical)) return;
                    for (let k = 0; k < playerShips[currentShip].logical.length && k + i < newBoard.height; k++){
                        newBoard.displayGrid[i+k][j].style.backgroundColor = "black";
                    }
                }
                playerShips[currentShip].visual.style.display="none"
                currentShip++;
                if (currentShip == playerShips.length){
                    allPlaced = true;
                    return;
                    
                }
                playerShips[currentShip].visual.style.display="grid"
            });

        }

    }

    startButton.addEventListener("click", function(){
        if (!allPlaced) return;
        let difficulty = document.querySelector('input[name="difficulty"]:checked').value

        let computerBoard = gameBoardFactory(10, 10);
        let player1 = playerFactory("Human", false, null, newBoard.gameBoard, computerBoard);
        let player2 = playerFactory("Computer", true, difficulty, computerBoard, newBoard.gameBoard);
        console.log("starting");
        currentGame = gameFactory([player1, player2]);
        currentGame.playRound(0);
    });

    playerShips[0].visual.style.display="grid";



}

function gameFactory(players){
    let activePlayer = -1;
    let currentRound = 0;

    p1BoardDisplay.innerHTML = "";
    p2BoardDisplay.innerHTML = "";
    let boards = [boardFactory(p1BoardDisplay, 10, 10), boardFactory(p2BoardDisplay, 10, 10)];
    startScreen.style.display = "none";
    playScreen.style.display = "grid";

    for (let i = 0; i < 2; i++){
        boards[i].gameBoard = players[i].selfBoard
        if (players[i].isAi){
            aiSmartPlace(players[i].selfBoard, [
                shipFactory(5),
                shipFactory(4),
                shipFactory(3),
                shipFactory(3),
                shipFactory(2),
            ]);
            
            boards[i].displayUpdate(false);
        } else {
            for (let row = 0; row < boards[i].height; row++){
                for (let col = 0; col < boards[i].width; col++)
                    boards[((i+1)%2)].displayGrid[row][col].addEventListener("click", function (){
                        console.log(row + " " + col + " shooting");
                        if (activePlayer != i) return;
                        if (boards[((i+1)%2)].gameBoard.board[row][col].isAttacked) return;
                        activePlayer = (activePlayer + 1)%2;
                        boards[((i+1)%2)].gameBoard.recieveAttack(row, col)
                        endRound(i);
                    });
            }
            boards[i].displayUpdate(true)
        };
    }

    

    function playRound(playerNr){
        if (players[playerNr].isAi){
            console.log("AI Round:" + currentRound);
            aiShoot(players[playerNr], players[playerNr].otherBoard);
            currentRound++;
            
            endRound(playerNr);
        } else{
            console.log("Human Round:" + currentRound);
            activePlayer = playerNr;
        }
    }

    function endRound(playerNr){
        if (players[playerNr].isAi)boards[((playerNr+1)%2)].displayUpdate(true);
        else boards[((playerNr+1)%2)].displayUpdate(false);

        if (boards[((playerNr+1)%2)].gameBoard.allSunk()){
            console.log(players[playerNr].playerName + " won on round " + currentRound);
            endGame();
            return;
        }
        playRound((playerNr + 1)%2);
    }

    function endGame(){
        
    }
    return {
        playRound
    }
}

newGameSetup();