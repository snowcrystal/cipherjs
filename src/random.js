function cipher_js_random(){
/**
 * Returns a usually large random integer.
 * ---------------------------------------------------------------------
 * @return {Integer}
 * */
this.randomNumber = function(){
	var rand = sjcl.random.randomWords(1, 10);
	rand = rand[0];
	return rand;
};

/**
 * Returns random values in the way Math.random does, just 
 * cryptographically secure.
 * ---------------------------------------------------------------------
 * @return {Float}
 * */
this.mathRandom = function(){
	var rand = sjcl.random.randomWords(1, 10);
	rand = rand[0];
	if(rand < 0){
		rand = rand * (-1);
	}
	rand = "0."+rand;
	rand = parseFloat(rand);
	return rand;
};

/**
 * Returns a random float between min and max.
 * ---------------------------------------------------------------------
 * @return {Float}
 * */
this.randomFloat = function(min, max){
	var rand = sjcl.random.randomWords(1, 10);
	rand = rand[0];
	if(rand < 0){
		rand = rand * (-1);
	}
	rand = "0."+rand;
	rand = parseFloat(rand);
	rand = rand * (max - min) + min;
	return rand;
};

/**
 * Return an integer in a specific range. (Including min, excluding max,
 * so min=1 and max=4 will output possible results of 1, 2 or 3).
 * ---------------------------------------------------------------------
 * @return {Integer}
 * */
this.randomInteger = function(min, max){
	var rand = sjcl.random.randomWords(1, 10);
	rand = rand[0];
	if(rand < 0){
		rand = rand * (-1);
	}
	rand = "0."+rand;
	rand = parseFloat(rand);
	rand = rand * (max - min) + min;
	rand = Math.floor(rand);
	return rand;
};

/**
 * Create a long random alphanumeric string. Good for hard to crack,
 * easy to use passphrases.
 * ---------------------------------------------------------------------
 * @param  {Integer}  len   Length of the random key string (chars)
 * @param  {String}   enc   (Optional) can be set to "hex" for a 
 *                          hex string.
 * @return {String}
 * */
this.randomString = function(len, enc) {
	if(len === undefined || len == "undefined"){
		len = 64;
	}
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if(typeof enc != "undefined"){
		if(enc=="hex"){
			chars = '012345678abcdef';
		}
	}
	var length = len;
	var result = '';
	for (var i = length; i > 0; --i){ 
		var rand = sjcl.random.randomWords(1, 10);
		rand = rand[0];
		if(rand < 0){
			rand = rand * (-1);
		}
		rand = "0."+rand;
		rand = parseFloat(rand);
		result += chars[Math.round(rand * (chars.length - 1))];
	}
	return result;
};

}
cipherJS.random = new cipher_js_random();
