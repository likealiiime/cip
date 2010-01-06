/*
	File: constants.js
	Foundational constants
*/

/*
	Constant: kAlphabet
	The English alphabet as an Array of lowercase letters (a-z).
*/
kAlphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

/*
	Constant: kAlphabetIndexHash
	A Hash mapping each lowercase letter (a-z) with its position in the alphabet (0-26)
*/
kAlphabetIndexHash = new Hash();
kAlphabet.map(function(letter, index) {
	kAlphabetIndexHash.set(letter, index);
});