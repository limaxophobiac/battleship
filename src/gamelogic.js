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
            if (row >= this.height || column >= this.width || column < 0 || row < 0) throw new Error("Must place ship inside board");
            if (!vertical && column + ship.length >= this.width) throw new Error("Ship doesnt fit horizontoally");
            if (vertical && row + ship.length >= this.heigth) throw new Error("Ship doesnt fit vertically");
            for (let i = 0; i < ship.length; i++){
                if (!vertical) this.board[row][column+i].ship = ship;
                else this.board[row+i][column].ship = ship;
            }
            this.shiplist.push(ship)
        },
        recieveAttack(row, column){
            if (row >= this.height || column >= this.width || column < 0 || row < 0) throw new Error("Must shoot inside board");
            if (this.board[row][column].isAttacked) throw new Error("Position allready attacked");
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



export {shipFactory, gameBoardFactory}