function cipher_js_hash(){

/**
 * SHA1-hash a given string and receive output in Hex, Base64 or as an
 * array.
 * ---------------------------------------------------------------------
 * @param   {String}   str   String to hash
 * @param   {String}   enc   Encoding of the hash, "hex", "base64" or "none".
 *                           Output will be a bit array (array of integer)
 *                           for "none", and a string for the other 
 *                           options.
 * @return {String | Array<Integer>}
 * */
this.sha1 = function(data, enc){
	var hasher = function(data, enc){
		var hash;
		try{
			hash = cipherJS.hash.sha("sha1", data, enc);
		}catch(e1){
			try{
				hash = cipherJS.hash.sha("sha1", data, enc);
			}catch(e2){
				try{
					hash = cipherJS.hash.sha("sha1", data, enc);
				}catch(e3){
					hash = cipherJS.hash.sha("sha1", data, enc);
				}
			}
		}
		return hash;
	};
	if(enc!="none"){
		var hash1 = hasher(data, enc);
		var hash2 = hasher(data, enc);
		if(hash1==hash2){
			return hash1;
		}else{
			hash1 = hasher(data, enc);
			hash2 = hasher(data, enc);
			if(hash1==hash2){
				return hash1;
			}else{
				return null;
			}
		}
	}else{
		var hash1 = hasher(data, enc);
		var hash2 = hasher(data, enc);
		var equal = true;
		var len = hash1.length; var i=0;
		for(i=0; i<len; i++){
			if(hash1[i]!==hash2[i]) equal = false;
		}
		if(equal){
			return hash1;
		}else{
			hash1 = hasher(data, enc);
			hash2 = hasher(data, enc);
			equal = true;
			len = hash1.length; i=0;
			for(i=0; i<len; i++){
				if(hash1[i]!==hash2[i]) equal = false;
			}
			if(equal){
				return hash1;
			}else{
				return null;
			}
		}
	}
};

/**
 * SHA256-hash a given string and receive output in Hex, Base64 or as an
 * array.
 * ---------------------------------------------------------------------
 * @param   {String}   str   String to hash
 * @param   {String}   enc   Encoding of the hash, "hex", "base64" or "none".
 *                           Output will be a bit array (array of integer)
 *                           for "none", and a string for the other 
 *                           options.
 * @return {String | Array<Integer>}
 * */
this.sha256 = function(data, enc){
	var hasher = function(data, enc){
		var hash;
		try{
			hash = cipherJS.hash.sha("sha256", data, enc);
		}catch(e1){
			try{
				hash = cipherJS.hash.sha("sha256", data, enc);
			}catch(e2){
				try{
					hash = cipherJS.hash.sha("sha256", data, enc);
				}catch(e3){
					hash = cipherJS.hash.sha("sha256", data, enc);
				}
			}
		}
		return hash;
	};
	if(enc!="none"){
		var hash1 = hasher(data, enc);
		var hash2 = hasher(data, enc);
		if(hash1==hash2){
			return hash1;
		}else{
			hash1 = hasher(data, enc);
			hash2 = hasher(data, enc);
			if(hash1==hash2){
				return hash1;
			}else{
				return null;
			}
		}
	}else{
		var hash1 = hasher(data, enc);
		var hash2 = hasher(data, enc);
		var equal = true;
		var len = hash1.length; var i=0;
		for(i=0; i<len; i++){
			if(hash1[i]!==hash2[i]) equal = false;
		}
		if(equal){
			return hash1;
		}else{
			hash1 = hasher(data, enc);
			hash2 = hasher(data, enc);
			equal = true;
			len = hash1.length; i=0;
			for(i=0; i<len; i++){
				if(hash1[i]!==hash2[i]) equal = false;
			}
			if(equal){
				return hash1;
			}else{
				return null;
			}
		}
	}
};

/**
 * SHA512-hash a given string and receive output in Hex, Base64 or as an
 * array.
 * ---------------------------------------------------------------------
 * @param   {String}   str   String to hash
 * @param   {String}   enc   Encoding of the hash, "hex", "base64" or "none".
 *                           Output will be a bit array (array of integer)
 *                           for "none", and a string for the other 
 *                           options.
 * @return {String | Array<Integer>}
 * */
this.sha512 = function(data, enc){
	var hasher = function(data, enc){
		var hash;
		try{
			hash = cipherJS.hash.sha("sha512", data, enc);
		}catch(e1){
			try{
				hash = cipherJS.hash.sha("sha512", data, enc);
			}catch(e2){
				try{
					hash = cipherJS.hash.sha("sha512", data, enc);
				}catch(e3){
					hash = cipherJS.hash.sha("sha512", data, enc);
				}
			}
		}
		return hash;
	};
	if(enc!="none"){
		var hash1 = hasher(data, enc);
		var hash2 = hasher(data, enc);
		if(hash1==hash2){
			return hash1;
		}else{
			hash1 = hasher(data, enc);
			hash2 = hasher(data, enc);
			if(hash1==hash2){
				return hash1;
			}else{
				return null;
			}
		}
	}else{
		var hash1 = hasher(data, enc);
		var hash2 = hasher(data, enc);
		var equal = true;
		var len = hash1.length; var i=0;
		for(i=0; i<len; i++){
			if(hash1[i]!==hash2[i]) equal = false;
		}
		if(equal){
			return hash1;
		}else{
			hash1 = hasher(data, enc);
			hash2 = hasher(data, enc);
			equal = true;
			len = hash1.length; i=0;
			for(i=0; i<len; i++){
				if(hash1[i]!==hash2[i]) equal = false;
			}
			if(equal){
				return hash1;
			}else{
				return null;
			}
		}
	}
};

//---START-INNER--------------------------------------------------------
this.sha = function(sha, data, enc){
	var hash;
	if(sha=="sha1"){
		hash = sjcl.hash.sha1.hash(data);
	}else if(sha=="sha256"){
		hash = sjcl.hash.sha256.hash(data);
	}else if(sha=="sha512"){
		hash = sjcl.hash.sha512.hash(data);
	}else{
	}
	if(enc=="hex"){
		hash = sjcl.codec.hex.fromBits(hash);
		return hash;
	}else if(enc=="base64"){
		hash = sjcl.codec.base64.fromBits(hash);
		return hash;
	}else if(enc=="none"){
		//console.log(hash);
		return hash;
	}
	else{
		return null;
	}
};
//---END-INNER----------------------------------------------------------

}
cipherJS.hash = new cipher_js_hash();
