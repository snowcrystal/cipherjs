
function cipher_js_sym(){


//---START-AES-SETTINGS-------------------------------------------------
/**
 * "ocb2", "ccm", "cbc" and "gcm" are available. CCM is most widely used, but
 * OCB is often referred to as the best mode. It can now be used in 
 * non-military software freely and definetely used freely in open source
 * software.
 * */
this.aesMode = "ocb2";
/**
 * Keys are derived from passwords and improved using PBKDF2. SJCL uses
 * a cached PBKDF2, which is so fast you barely notice 1000 iterations
 * and can probably go to 2000 without a problem. 1000 is really fast
 * and the recommended minimum.
 * */
this.aesIter = 1000;
/**
 * 128, 192 and 256 are possible. 256 is extremely performant, so just
 * always use this.
 * */
this.aesKeysize = 256;
/**
 * Strength of authentication tags which make sure encrypted messages
 * aren't changed. 64, 96 and 128 are possible, 128 doesn't worsen
 * performance in ways a user would notice so default to that.
 * */
this.aesAuthStrength = 128;
//---END-AES-SETTINGS---------------------------------------------------

//---START-RIJNDAEL-SETTINGS--------------------------------------------
/**
 * Keysize for Rijndael encryption. 256 is default and recommended.
 * */
this.rijndaelKeysize = 256;
/**
 * Keys are derived from passwords and improved using PBKDF2. SJCL uses
 * a cached PBKDF2, which is so fast you barely notice 1000 iterations
 * and can probably go to 2000 without a problem. 1000 is really fast
 * and the recommended minimum.
 * */
this.rijndaelIter = 1000;
//---END-RIJNDAEL-SETTINGS----------------------------------------------

//---START-TWOFISH-SETTINGS---------------------------------------------
/**
 * Keysize for Twofish encryption. 256 is default and recommended.
 * */
this.twofishKeysize = 256;
/**
 * Keys are derived from passwords and improved using PBKDF2. SJCL uses
 * a cached PBKDF2, which is so fast you barely notice 1000 iterations
 * and can probably go to 2000 without a problem. 1000 is really fast
 * and the recommended minimum.
 * */
this.twofishIter = 1000;
//---END-TWOFISH-SETTINGS-----------------------------------------------

//---START-SERPENT-SETTINGS---------------------------------------------
/**
 * Keysize for Serpent encryption. 256 is default and recommended.
 * */
this.serpentKeysize = 256;
/**
 * Keys are derived from passwords and improved using PBKDF2. SJCL uses
 * a cached PBKDF2, which is so fast you barely notice 1000 iterations
 * and can probably go to 2000 without a problem. 1000 is really fast
 * and the recommended minimum.
 * */
this.serpentIter = 1000;
//---END-SERPENT-SETTINGS-----------------------------------------------


//---START-ENCRYPTION-DECRYPTION----------------------------------------
/**
 * Encrypt @data using @password. Use @algorithm as encryption algorithm.
 * ---------------------------------------------------------------------
 * @param   {String}   data         Data string to encrypt
 * @param   {String}   pass         Password to use for encryption
 * @param   {String}   algorithm    Algorithm to use for encryption.
 *                                  "aes", "rijndael", "twofish", "serpent",
 *                                  "aes-twofish" are possible.
 * @return  {String} 
 * */
this.encrypt = function(data, pass, algorithm){
	var enc; algorithm = algorithm.toLowerCase();
	if(algorithm == "aes"){
		enc = cipherJS.sym.aesEncrypt(data, pass);
	}else if(algorithm == "rijndael"){
		enc = cipherJS.sym.rijndaelEncrypt(data, pass);
	}else if(algorithm == "twofish"){
		enc = cipherJS.sym.twofishEncrypt(data, pass);
	}else if(algorithm == "serpent"){
		enc = cipherJS.sym.serpentEncrypt(data, pass);
	}else if(algorithm == "aes-twofish"){
		enc = cipherJS.sym.aesTwofishEncrypt(data, pass);
	}else{
		
	}
	return enc;
};

/**
 * Decrypt a string that was encrypted using cipherJS.sym.encrypt, 
 * recognize encryption algorithm and other params automatically.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Ciphertext to decrypt
 * @param   {String}   pass   Password to use for decryption
 * @return  {String}
 * */
this.decrypt = function(data, pass){
	var algorithm = (JSON.parse(data)).cipher; var dec;
	if(algorithm == "aes"){
		dec = cipherJS.sym.aesDecrypt(data, pass);
	}else if(algorithm == "rijndael"){
		dec = cipherJS.sym.rijndaelDecrypt(data, pass);
	}else if(algorithm == "twofish"){
		dec = cipherJS.sym.twofishDecrypt(data, pass);
	}else if(algorithm == "serpent"){
		dec = cipherJS.sym.serpentDecrypt(data, pass);
	}else if(algorithm == "aes-twofish"){
		dec = cipherJS.sym.aesTwofishDecrypt(data, pass);
	}else{

	}
	/*console.log(dec);*/
	return dec;
};
//---END-ENCRYPTION-DECRYPTION------------------------------------------

//---START-ASYNCHRONOUS-ENCRYPTION--------------------------------------

//---START-ENCRYPT-ASYNC------------------------------------------------
/**
 * Encrypt @data asynchronously using @pass. This makes sense for very
 * long @data strings.
 * Usually, symmetric encryption is best done synchronously, as 
 * encrypting strings even of a few thousand characters is pretty fast.
 * Asynchronous symmetrical encryption starts making sense when you 
 * encrypt very long strings, of for example 10 000 characters or more.
 * This is where asynchronous symmetrical encryption starts actually 
 * improving performance or prevent browsers from just breaking.
 * ---------------------------------------------------------------------
 * Split a string into chunks of up to 3000 characters and encrypt them
 * one at a time. Stringify the resulting array.
 * ---------------------------------------------------------------------
 * @param   {String}   data   
 * @param   {String}   pass
 * @param   {String}   algorithm   Algorithm to use for encryption.
 *                                 "aes", "rijndael", "twofish", "serpent",
 *                                 "aes-twofish" are possible.
 *                                 
 * @carries {Object}   carrier
 * @calls   {Function}             function(String enc, Object carrier)
 * */
this.encryptAsync = function(data, pass, algorithm, callback, carrier){
	data = data.chunk(3000);
	var res = new Array();
	var len = data.length;
	var i = 0;
	var c = {"callback": callback, "outercarrier": carrier, "algorithm": algorithm,  
			 "i": i, "len": len, "res": res, "data": data, "pass": pass };
	setTimeout(function(){
		cipherJS.sym.encryptAsyncLoop1(c);
	}, 2);
};
this.encryptAsyncLoop1 = function(c){
	var algorithm = c.algorithm;
	var pass = c.pass;
	var data = c.data;
	var len = c.len;
	var i = c.i;
	var res = c.res;
	var enc = cipherJS.sym.encrypt(data[i], pass, algorithm);
	/*if(c.i<(len-1)){
		res += encodeURIComponent(enc)+"#_#_#";
	}else{
		res += encodeURIComponent(enc);
	}*/
	res.push(encodeURIComponent(enc));
	c.res = res;
	c.i = c.i+1;
	if(c.i<len){
		setTimeout(function(){
			cipherJS.sym.encryptAsyncLoop1(c);
		}, 2);
	}else{
		var callback = c.callback;
		var carrier = c.outercarrier;
		setTimeout(function(){
			//console.log(res);
			//console.log(JSON.stringify(res));
			callback(JSON.stringify(res), carrier);
		}, 2);
	}
};
//---END-ENCRYPT-ASYNC--------------------------------------------------

//---START-DECRYPT-ASYNC------------------------------------------------
/**
 * Decrypt a string that was encrypted using cipherJS.sym.encryptAsync.
 * Recognizes algorithm and params automatically.
 * ---------------------------------------------------------------------
 * Convert @data to an array of strings up to 3000 characters long and
 * decrypt each of them. Join the resulting array to form the actual 
 * cleartext.
 * ---------------------------------------------------------------------
 * @param   {String}   data      Encrypted data to decrypt
 * @param   {String}   pass      Password to use for decryption
 * @carries {Object}   carrier  
 * @calls   {Function}           function(String dec, Object carrier)
 * */
this.decryptAsync = function(data, pass, callback, carrier){
	/*data = data.split("#_#_#");*/ data = JSON.parse(data);
	var len = data.length;
	var i = 0;
	var res = "";
	var c = {"callback": callback, "outercarrier": carrier, 
	         "data": data, "pass": pass, "len": len, "i": i, "res": res};
	setTimeout(function(){
		cipherJS.sym.decryptAsyncLoop1(c);
	}, 2);
};
this.decryptAsyncLoop1 = function(c){
	var len = c.len;
	var i = c.i;
	var res = c.res;
	var data = c.data;
	var pass = c.pass;
	var todec = decodeURIComponent(data[i]);
	var dec = cipherJS.sym.decrypt(todec, pass);
	res = res+dec;
	c.res = res;
	c.i = c.i+1;
	if(c.i<len){
		setTimeout(function(){
			cipherJS.sym.decryptAsyncLoop1(c);
		}, 2);
	}else{
		var callback = c.callback;
		var carrier = c.outercarrier;
		setTimeout(function(){
			callback(res, carrier);
		}, 2);
	}
};
//---END-DECRYPT-ASYNC--------------------------------------------------

//---END-ASYNCHRONOUS-ENCRYPTION----------------------------------------

//---START-AES-ENCRYPTION-----------------------------------------------
/**
 * Encrypt @data using a given @pass. Uses AES algorithm.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to encrypt
 * @param   {String}   pass   Password to use for key
 * @return  {String}    
 * */
this.aesEncrypt = function(data, pass){
	var enc = sjcl.encrypt(pass, data, {
		"ks": cipherJS.sym.aesKeysize,
		"ts": cipherJS.sym.aesAuthStrength,
		"iter": cipherJS.sym.aesIter,
		"mode": cipherJS.sym.aesMode
	});
	return enc;
};

/**
 * Decrypt a string which was encrypted using aesEncrypt.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to decrypt (encrypted text)
 * @param   {String}   pass   Password to use for decryption key
 * @return  {String}          cleartext
 * */
this.aesDecrypt = function(data, pass){
	var dec;
	try{
		dec = sjcl.decrypt(pass, data);
	}catch(e1){
		try{
			dec = sjcl.decrypt(pass, data);
		}catch(e2){
			try{
				dec = sjcl.decrypt(pass, data);
			}catch(e3){
				try{
					dec = sjcl.decrypt(pass, data);
				}catch(e4){
					throw new cipherJS.sym.decryptError("Error while decrypting (Algorithm: AES). Suspected reason: Wrong password.");
				}
			}
		}
	}
	if(dec.length<data.length){
		try{
		dec = sjcl.decrypt(pass, data);
		}catch(e1){
			try{
				dec = sjcl.decrypt(pass, data);
			}catch(e2){
				try{
					dec = sjcl.decrypt(pass, data);
				}catch(e3){
					dec = sjcl.decrypt(pass, data);
				}
			}
		}
	}
	return dec;
};
//---END-AES-ENCRYPTION-------------------------------------------------

//---START-RIJNDAEL-ENCRYPTION------------------------------------------
/**
 * Encrypt @data using a given @pass. Uses Rijndael algorithm.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to encrypt
 * @param   {String}   pass   Password to use for key
 * @return  {String}    
 * */
this.rijndaelEncrypt = function(data, pass){
	var ks = cipherJS.sym.rijndaelKeysize;
	var iter = cipherJS.sym.rijndaelIter;
	var tmp = sjcl.misc.cachedPbkdf2(pass, {"iter": iter});
	var key = tmp.key.slice(0, ks/32);
	var salt = tmp.salt;
	var b64key = sjcl.codec.base64.fromBits(key);
	var hexSalt = sjcl.codec.hex.fromBits(salt);
	
	var algorithm = cipherJS.sym.titaniumcoreAlgorithm.RIJNDAEL;
	var mode = cipherJS.sym.titaniumcoreBlockmode.CBC;
	var padding = cipherJS.sym.titaniumcorePaddings.PKCS7;
	var direction = "ENCRYPT";
	var cipher = cipherJS.sym.titaniumcoreCreateCipher(algorithm, mode, padding, direction);
	
	var cleartext = str2utf8(data);
	key = base64_decode( cipherJS.sym.pack(b64key) );
	var ciphertext = cipher.execute( key.concat(), cleartext.concat() );
	var result = cipherJS.sym.stringBreak( base64_encode( ciphertext ), 48 );
	
	//var hmac_key = cipherJS.hash.sha512(b64key, "hex");
	//hmac_key = cipherJS.hash.sha256(hmac_key, "none");
	var signature = cipherJS.sym.signHMAC(b64key, result);
	//console.log(signature);
	
	result = {"cipher": "rijndael", "salt": hexSalt, "iter": iter, "ks": ks, "ct": result, "signature": signature};
	result = JSON.stringify(result);
	
	return result;
};

/**
 * Decrypt a string which was encrypted using rijndaelEncrypt.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to decrypt (encrypted text)
 * @param   {String}   pass   Password to use for decryption key
 * @return  {String}          cleartext
 * */
this.rijndaelDecrypt = function(data, pass){
	data = JSON.parse(data);
	var hexSalt = data.salt;
	var salt = sjcl.codec.hex.toBits(hexSalt);
	var iter = data.iter;
	var ks = data.ks;
	var ciphertext = data.ct;
	
	var tmp = sjcl.misc.cachedPbkdf2(pass, {"iter": iter, "salt": salt});
	var key = tmp.key.slice(0, ks/32);
	var b64key = sjcl.codec.base64.fromBits(key);
	
	var algorithm = cipherJS.sym.titaniumcoreAlgorithm.RIJNDAEL;
	var mode = cipherJS.sym.titaniumcoreBlockmode.CBC;
	var padding = cipherJS.sym.titaniumcorePaddings.PKCS7;
	var direction = "DECRYPT";
	var cipher = cipherJS.sym.titaniumcoreCreateCipher(algorithm, mode, padding, direction);
	
	//var hmac_key = cipherJS.hash.sha512(b64key, "hex");
	//hmac_key = cipherJS.hash.sha256(hmac_key, "none");
	var signature = cipherJS.sym.signHMAC(b64key, ciphertext);
	//console.log(signature);
	if(signature!=data.signature){
		//console.log("not passed");
		throw new cipherJS.sym.decryptError("Error while decrypting (Algorithm: Rijndael). Suspected reason: Wrong password.");
	}
	
	ciphertext = base64_decode( cipherJS.sym.pack( ciphertext ) );
	key = base64_decode( cipherJS.sym.pack( b64key ) );
	var cleartext = cipher.execute( key.concat(), ciphertext.concat() );
	var result = utf82str( cleartext );
	return result;
};
//---END-RIJNDAEL-ENCRYPTION--------------------------------------------

//---START-TWOFISH-ENCRYPTION-------------------------------------------
/**
 * Encrypt @data using a given @pass. Uses Twofish algorithm.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to encrypt
 * @param   {String}   pass   Password to use for key
 * @return  {String}    
 * */
this.twofishEncrypt = function(data, pass){
	var ks = cipherJS.sym.twofishKeysize;
	var iter = cipherJS.sym.twofishIter;
	var tmp = sjcl.misc.cachedPbkdf2(pass, {"iter": iter});
	var key = tmp.key.slice(0, ks/32);
	var salt = tmp.salt;
	var b64key = sjcl.codec.base64.fromBits(key);
	var hexSalt = sjcl.codec.hex.fromBits(salt);
	
	var algorithm = cipherJS.sym.titaniumcoreAlgorithm.TWOFISH;
	var mode = cipherJS.sym.titaniumcoreBlockmode.CBC;
	var padding = cipherJS.sym.titaniumcorePaddings.PKCS7;
	var direction = "ENCRYPT";
	var cipher = cipherJS.sym.titaniumcoreCreateCipher(algorithm, mode, padding, direction);
	
	var cleartext = str2utf8(data);
	key = base64_decode( cipherJS.sym.pack(b64key) );
	var ciphertext = cipher.execute( key.concat(), cleartext.concat() );
	var result = cipherJS.sym.stringBreak( base64_encode( ciphertext ), 48 );
	
	//var hmac_key = cipherJS.hash.sha512(b64key, "hex");
	//hmac_key = cipherJS.hash.sha256(hmac_key, "none");
	var signature = cipherJS.sym.signHMAC(b64key, result);
	//console.log(signature);
	
	result = {"cipher": "twofish", "salt": hexSalt, "iter": iter, "ks": ks, "ct": result, "signature": signature};
	result = JSON.stringify(result);
	
	return result;
};
/**
 * Decrypt a string which was encrypted using twofishEncrypt.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to decrypt (encrypted text)
 * @param   {String}   pass   Password to use for decryption key
 * @return  {String}          cleartext
 * */
this.twofishDecrypt = function(data, pass){
	data = JSON.parse(data);
	var hexSalt = data.salt;
	var salt = sjcl.codec.hex.toBits(hexSalt);
	var iter = data.iter;
	var ks = data.ks;
	var ciphertext = data.ct;
	
	var tmp = sjcl.misc.cachedPbkdf2(pass, {"iter": iter, "salt": salt});
	var key = tmp.key.slice(0, ks/32);
	var b64key = sjcl.codec.base64.fromBits(key);
	
	var algorithm = cipherJS.sym.titaniumcoreAlgorithm.TWOFISH;
	var mode = cipherJS.sym.titaniumcoreBlockmode.CBC;
	var padding = cipherJS.sym.titaniumcorePaddings.PKCS7;
	var direction = "DECRYPT";
	var cipher = cipherJS.sym.titaniumcoreCreateCipher(algorithm, mode, padding, direction);
	
	//var hmac_key = cipherJS.hash.sha512(b64key, "hex");
	//hmac_key = cipherJS.hash.sha256(hmac_key, "none");
	var signature = cipherJS.sym.signHMAC(b64key, ciphertext);
	//console.log(signature);
	if(signature!=data.signature){
		//console.log("not passed");
		throw new cipherJS.sym.decryptError("Error while decrypting (Algorithm: Twofish). Suspected reason: Wrong password.");
	}
	
	ciphertext = base64_decode( cipherJS.sym.pack( ciphertext ) );
	key = base64_decode( cipherJS.sym.pack( b64key ) );
	var cleartext = cipher.execute( key.concat(), ciphertext.concat() );
	var result = utf82str( cleartext );
	return result;
};
//---END-TWOFISH-ENCRYPTION---------------------------------------------

//---START-SERPENT-ENCRYPTION-------------------------------------------
/**
 * Encrypt @data using a given @pass. Uses Serpent algorithm.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to encrypt
 * @param   {String}   pass   Password to use for key
 * @return  {String}    
 * */
this.serpentEncrypt = function(data, pass){
	var ks = cipherJS.sym.serpentKeysize;
	var iter = cipherJS.sym.serpentIter;
	var tmp = sjcl.misc.cachedPbkdf2(pass, {"iter": iter});
	var key = tmp.key.slice(0, ks/32);
	var salt = tmp.salt;
	var b64key = sjcl.codec.base64.fromBits(key);
	var hexSalt = sjcl.codec.hex.fromBits(salt);
	
	var algorithm = cipherJS.sym.titaniumcoreAlgorithm.SERPENT;
	var mode = cipherJS.sym.titaniumcoreBlockmode.CBC;
	var padding = cipherJS.sym.titaniumcorePaddings.PKCS7;
	var direction = "ENCRYPT";
	var cipher = cipherJS.sym.titaniumcoreCreateCipher(algorithm, mode, padding, direction);
	
	var cleartext = str2utf8(data);
	key = base64_decode( cipherJS.sym.pack(b64key) );
	var ciphertext = cipher.execute( key.concat(), cleartext.concat() );
	var result = cipherJS.sym.stringBreak( base64_encode( ciphertext ), 48 );
	
	//var hmac_key = cipherJS.hash.sha512(b64key, "hex");
	//hmac_key = cipherJS.hash.sha256(hmac_key, "none");
	var signature = cipherJS.sym.signHMAC(b64key, result);
	//console.log(signature);
	
	result = {"cipher": "serpent", "salt": hexSalt, "iter": iter, "ks": ks, "ct": result, "signature": signature};
	result = JSON.stringify(result);
	
	return result;
};
/**
 * Decrypt a string which was encrypted using serpentEncrypt.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to decrypt (encrypted text)
 * @param   {String}   pass   Password to use for decryption key
 * @return  {String}          cleartext
 * */
this.serpentDecrypt = function(data, pass){
	data = JSON.parse(data);
	var hexSalt = data.salt;
	var salt = sjcl.codec.hex.toBits(hexSalt);
	var iter = data.iter;
	var ks = data.ks;
	var ciphertext = data.ct;
	
	var tmp = sjcl.misc.cachedPbkdf2(pass, {"iter": iter, "salt": salt});
	var key = tmp.key.slice(0, ks/32);
	var b64key = sjcl.codec.base64.fromBits(key);
	
	var algorithm = cipherJS.sym.titaniumcoreAlgorithm.SERPENT;
	var mode = cipherJS.sym.titaniumcoreBlockmode.CBC;
	var padding = cipherJS.sym.titaniumcorePaddings.PKCS7;
	var direction = "DECRYPT";
	var cipher = cipherJS.sym.titaniumcoreCreateCipher(algorithm, mode, padding, direction);
	
	//var hmac_key = cipherJS.hash.sha512(b64key, "hex");
	//hmac_key = cipherJS.hash.sha256(hmac_key, "none");
	var signature = cipherJS.sym.signHMAC(b64key, ciphertext);
	//console.log(signature);
	if(signature!=data.signature){
		//console.log("not passed");
		throw new cipherJS.sym.decryptError("Error while decrypting (Algorithm: Serpent). Suspected reason: Wrong password.");
	}
	
	ciphertext = base64_decode( cipherJS.sym.pack( ciphertext ) );
	key = base64_decode( cipherJS.sym.pack( b64key ) );
	var cleartext = cipher.execute( key.concat(), ciphertext.concat() );
	var result = utf82str( cleartext );
	return result;
};
//---END-SERPENT-ENCRYPTION---------------------------------------------

//---START-AES-TWOFISH-ENCRYPTION---------------------------------------
/**
 * Encrypt @data using a given @pass. Data is encrypted using by 
 * deriving two keys from @pass, first encrypting via Twofish, then via 
 * AES. This combination seems to provide pretty high security while 
 * maintaining some performance.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to encrypt
 * @param   {String}   pass   Password to use for key
 * @return  {String}    
 * */
this.aesTwofishEncrypt = function(data, pass){
	var pass1 = sjcl.hash.sha512.hash(pass);
	var pass2 = sjcl.hash.sha512.hash(pass1);
	pass1 = sjcl.codec.base64.fromBits(pass1);
	pass2 = sjcl.codec.base64.fromBits(pass2);
	var enc = cipherJS.sym.twofishEncrypt(data, pass1);
	enc = encodeURIComponent(enc);
	enc = cipherJS.sym.aesEncrypt(enc, pass2);
	enc = encodeURIComponent(enc);
	enc = {"cipher": "aes-twofish", "ct": enc};
	enc = JSON.stringify(enc);
	return enc;
};
/**
 * Decrypt a string which was encrypted using aesTwofishEncrypt.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data to decrypt (encrypted text)
 * @param   {String}   pass   Password to use for decryption key
 * @return  {String}          cleartext
 * */
this.aesTwofishDecrypt = function(data, pass){
	data = JSON.parse(data); 
	data = data.ct; 
	data = decodeURIComponent(data);
	var pass1 = sjcl.hash.sha512.hash(pass);
	var pass2 = sjcl.hash.sha512.hash(pass1);
	pass1 = sjcl.codec.base64.fromBits(pass1);
	pass2 = sjcl.codec.base64.fromBits(pass2);
	var dec = cipherJS.sym.aesDecrypt(data, pass2);
	dec = decodeURIComponent(dec);
	dec = cipherJS.sym.twofishDecrypt(dec, pass1);
	return dec;
};
//---END-AES-TWOFISH-ENCRYPTION-----------------------------------------

//---START-INNER--------------------------------------------------------
this.titaniumcoreCipher = __import(window, "titaniumcore.crypto.Cipher" );
this.titaniumcoreAlgorithm = {"SERPENT": "SERPENT", "TWOFISH": "TWOFISH", "RIJNDAEL": "RIJNDAEL"};
this.titaniumcoreBlockmode = {"ECB": "ECB", "CBC": "CBC"};
this.titaniumcorePaddings = {"PKCS7": "PKCS7", "RFC1321": "RFC1321", "ANSIX923": "ANSIX923", "ISO10126": "ISO10126", "NO_PADDING": "NO_PADDING"};

this.titaniumcoreCreateCipher = function(algorithm, mode, padding, direction) {
	var Cipher = cipherJS.sym.titaniumcoreCipher;
	algorithm = Cipher[algorithm];
	mode  = Cipher[mode];
	padding  = Cipher[padding];
	direction = Cipher[direction];
	var cipher = Cipher.create(algorithm, direction, mode, padding);
	return cipher;
};

this.stringBreak = function(s, col) {
	var result = "";
	for ( var i=0; i<s.length; i++ ) {
		result += s.charAt( i );
		if ( ( (i+1) % col == 0 ) && ( 0<i )) {
		result += "\n";
		}
	}
	return result;
};

this.pack = function(s) {
	var result = "";
	for ( var i=0; i<s.length; i++ ) {
		var c = s.charAt( i );
		if ( c==" " || c=="\t" || c=="\r" || c=="\n" ) {
		} else {
			result += c;
		}
	}
	return result;
};

this.signHMAC = function(key, str){
	//key = sjcl.codec.base64.toBits(key);
	var hmac_key = cipherJS.hash.sha512(key, "hex");
	hmac_key = cipherJS.hash.sha256(hmac_key, "none");
	str = cipherJS.hash.sha256(str, "hex");
	var hmac = new sjcl.misc.hmac(hmac_key, sjcl.hash.sha256);
	var signature = hmac.encrypt(str);
	signature = sjcl.codec.base64.fromBits(signature);
	return signature;
};

this.decryptError = function(msg){
	this.name = "Symmetric Decryption Error";
	this.message = msg || "Error while decryption. Suspected reason: Wrong password.";
};
//---END-INNER----------------------------------------------------------
}
cipherJS.sym = new cipher_js_sym();
cipherJS.sym.decryptError.prototype = Error.prototype;
