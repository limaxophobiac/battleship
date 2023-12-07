import {
    capitilize
} from './gamelogic'


test('capitalize single letter', () => {
    expect(capitilize("a")).toBe("A")
});

test('capitalize empty string', () => {
    expect(capitilize("")).toBe("")
});

test('capitilize sentence with whitespace', () => {
    expect(capitilize("test number\n three")).toBe("Test number\n three")
});

test('capitalize doesnt alter numerical characters', () => {
    expect(capitilize("555")).toBe("555")
});