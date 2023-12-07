import {
    shipFactory
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
        expect((() => {
            testShip.hit();
            return testShip.hits
        })()).toBe(1)
    });

    test('4 hits dont sink length 5 ship', () => {
        expect((() => {
            testShip.hit();
            testShip.hit();
            testShip.hit();
            testShip.hit();
            return testShip.isSunk()
        })()).toBe(false)
    });

    test('5 hits sink length 5 ship', () => {
        expect((() => {
            testShip.hit();
            testShip.hit();
            testShip.hit();
            testShip.hit();
            testShip.hit();
            return testShip.isSunk()
        })()).toBe(true)
    });
})

