import {
    shipFactory,
    gameBoardFactory,
    filterCoordinates,
    openDistance,
    aiMove,
    aiShoot
} from './gamelogic'


describe("ship tests", () => {
    let testShip;
    beforeEach(() => {
        testShip = shipFactory(5);
    });

    test('new ship has 0 hits', () => {
        expect(testShip.hits).toBe(0)
    });

    test('new ship have length specified', () => {
        expect(shipFactory(3).length).toBe(3)
    });

    test('hit increases hits by one', () => {
        testShip.hit();
        expect(testShip.hits).toBe(1)
    });

    test('4 hits dont sink length 5 ship', () => {
        testShip.hit();
        testShip.hit();
        testShip.hit();
        testShip.hit();
        expect(testShip.isSunk()).toBe(false)
    });

    test('5 hits sink length 5 ship', () => {
        testShip.hit();
        testShip.hit();
        testShip.hit();
        testShip.hit();
        testShip.hit();
        expect(testShip.isSunk()).toBe(true)
    });

    test('0 length ship is not allowed', () => {
        expect(() => {
            shipFactory(0)
        }).toThrow()
    });

    test('negative length ship is not allowed', () => {
        expect(() => {
            shipFactory(-3)
        }).toThrow()
    });

    test('ship length must be integer', () => {
        expect(() => {
            shipFactory(3.5)
        }).toThrow()
    });
});

describe("board tests", () => {
    let testBoard;
    let testShip1;
    let testShip2;

    beforeAll(() => {
        testBoard = gameBoardFactory(10, 10);
        testShip1 = shipFactory(2);
        testShip2 = shipFactory(5);
    });

    test('attack on empty board is a miss', () => {
        expect(testBoard.recieveAttack(5, 5)).toBe(false)
    });

    test('cant attack same spot twice', () => {
        expect(() => testBoard.recieveAttack(5, 5)).toThrow()
    });

    describe("placing and attacking ships", () => {

        test('can place ship in upper left corner horizontal', () => {
            expect(testBoard.placeShip(0, 0, false, testShip2)).toBe(true)
        });

        test('can place ship in lower right corner vertically', () => {
            expect(testBoard.placeShip(8, 9, true, testShip1)).toBe(true)
        });

        test('cant place outside board', () => {
            expect(testBoard.placeShip(-1, 9, true, testShip1)).toBe(false)
        });

        test('attack on ship locations are hits', () => {
            expect(testBoard.recieveAttack(0, 2) && testBoard.recieveAttack(9, 9)).toBe(true)
        });

        test('ships correctly recognised as not sunk before they are', () => {
            expect(testBoard.allSunk()).toBe(false)
        });

        test('hitting all ship locations sinks all ships', () => {
            testBoard.recieveAttack(0,0)
            testBoard.recieveAttack(0,1)
            testBoard.recieveAttack(0,3)
            testBoard.recieveAttack(0,4)
            testBoard.recieveAttack(8,9)
            expect(testBoard.allSunk()).toBe(true)
        });

        test('filters coordinates outside board and on sunk ship', () => {
            let possibleCoordinates = [
                {row: 1, column: 1},
                {row: -1, column: 9},
                {row: 0, column: 3},
                {row: 8, column: 9},
                {row: 9, column: 9},
                {row: 3, column: 2},
                {row: 3, column: 10},
            ];
            expect(filterCoordinates(testBoard, possibleCoordinates).length).toBe(2)
        });

        test('finds open distance to wall', () => {
            let testShip3 = shipFactory(3);
            testBoard.placeShip(4,4, false, testShip3);
            testBoard.recieveAttack(4,4);
            expect(openDistance(testBoard, {row: 4, column: 5}, false, 1)).toBe(5)
        });

        test('finds open distance to sunken ship next square', () => {
            let testShip4 = shipFactory(2);
            testBoard.placeShip(3,3, true, testShip4);
            testBoard.recieveAttack(3,3);
            testBoard.recieveAttack(4,3);
            expect(openDistance(testBoard, {row: 4, column: 3}, false, -1)).toBe(0)
        });

       test('correctly choses targetetMove and shoots correct location', () => {
            testBoard.recieveAttack(4,5);
            expect(aiMove(testBoard)).toMatchObject({row: 4, column: 6})
        });



    });

    describe("ai targeting tests", () => {
        let testBoard2 = gameBoardFactory(10, 10);
        let testShip22 = shipFactory(2);
        let testShip24 = shipFactory(4);
        let testShip25 = shipFactory(5);
        let testShip242 = shipFactory(4);

        testBoard2.placeShip(0, 0, false, testShip22)
        testBoard2.placeShip(2, 4, true, testShip24)
        testBoard2.placeShip(8, 5, false, testShip25)
        testBoard2.placeShip(9, 0, true, testShip25)

        test('can shoot on fresh board', () => {
            expect(() => {
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);
                aiShoot({playerName: "test"}, testBoard2);

            }).not.toThrow()
        });

        
    });

})



