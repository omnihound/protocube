const LETTER_TO_NAME = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green' }
const NAME_TO_LETTER = { White: 'W', Blue: 'U', Black: 'B', Red: 'R', Green: 'G' }

export const letterToColor = (letter) => LETTER_TO_NAME[letter]
export const colorToLetter = (color) => NAME_TO_LETTER[color]
