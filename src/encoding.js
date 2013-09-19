
function cipher_js_encoding(){

/**
 * Hex-encodes an Utf8- or Base64-String.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Utf8- or Base64-String
 * @param   {String}   enc    "utf8" or "base64", current encoding 
 *                            of @data
 * @return  {String}          hex-encoded string
 * */
this.toHex = function(data, enc){
	var converter = function(data, enc){
		enc = enc.toLowerCase();
		var bits; var hex;
		if(enc=="base64"){
			bits = sjcl.codec.base64.toBits(data);
			hex = sjcl.codec.hex.fromBits(bits);
			return hex;
		}else if(enc=="utf8"){
			bits = sjcl.codec.utf8String.toBits(data);
			hex = sjcl.codec.hex.fromBits(bits);
			return hex;
		}else{
			return null;
		}
	};
	var ret;
	try{
		ret = converter(data, enc);
	}catch(e1){
		try{
			ret = converter(data, enc);
		}catch(e2){
			try{
				ret = converter(data, enc);
			}catch(e3){
				ret = converter(data, enc);
			}
		}
	}
	return ret;
};

/**
 * Base64-encodes a Hex- or Utf8-String.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Hex- or Utf8-String
 * @param   {String}   enc    "hex" or "utf8", current encoding 
 *                            of @data
 * @return  {String}          base64-encoded string
 * */
this.toBase64 = function(data, enc){
	var converter = function(data, enc){
		enc = enc.toLowerCase();
		var bits; var b64;
		if(enc=="hex"){
			bits = sjcl.codec.hex.toBits(data);
			b64 = sjcl.codec.base64.fromBits(bits);
			return b64;
		}else if(enc=="utf8"){
			bits = sjcl.codec.utf8String.toBits(data);
			b64 = sjcl.codec.base64.fromBits(bits);
			return b64;
		}else{
			return null;
		}
	};
	var ret;
	try{
		ret = converter(data, enc);
	}catch(e1){
		try{
			ret = converter(data, enc);
		}catch(e2){
			try{
				ret = converter(data, enc);
			}catch(e3){
				ret = converter(data, enc);
			}
		}
	}
	return ret;
};

/**
 * Utf8-encodes a Hex- or Utf8-String.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Hex- or Base64-String
 * @param   {String}   enc    "hex" or "base64", current encoding 
 *                            of @data
 * @return  {String}          utf8-encoded string
 * */
this.toUtf8 = function(data, enc){
	var converter = function(data, enc){
			enc = enc.toLowerCase();
		var bits; var utf8;
		if(enc=="hex"){
			bits = sjcl.codec.hex.toBits(data);
			utf8 = sjcl.codec.utf8String.fromBits(bits);
			return utf8;
		}else if(enc=="base64"){
			bits = sjcl.codec.base64.toBits(data);
			utf8 = sjcl.codec.utf8String.fromBits(bits);
			return utf8;
		}else{
			return null;
		}
	};
	var ret;
	try{
		ret = converter(data, enc);
	}catch(e1){
		try{
			ret = converter(data, enc);
		}catch(e2){
			try{
				ret = converter(data, enc);
			}catch(e3){
				ret = converter(data, enc);
			}
		}
	}
	return ret;
};

/**
 * Transforms a string of a given encoding to a bit array.
 * ---------------------------------------------------------------------
 * @param   {String}   data  Data string to encode
 * @param   {String}   enc   Current encoding of data ("utf8", "hex", "base64")
 * @return  {Array<Integer>}
 * */
this.toBits = function(data, enc){
	var converter = function(data, enc){
		enc = enc.toLowerCase();
		var bits;
		if(enc=="hex"){
			bits = sjcl.codec.hex.toBits(data);
			return bits;
		}else if(enc=="base64"){
			bits = sjcl.codec.base64.toBits(data);
			return bits;
		}else if(enc=="utf8"){
			bits = sjcl.codec.utf8String.toBits(data);
			return bits;
		}else{
			return null;
		}
	};
	var ret;
	try{
		ret = converter(data, enc);
	}catch(e1){
		try{
			ret = converter(data, enc);
		}catch(e2){
			try{
				ret = converter(data, enc);
			}catch(e3){
				ret = converter(data, enc);
			}
		}
	}
	return ret;
};

/**
 * Transforms a bit array to a string of a certain encoding.
 * ---------------------------------------------------------------------
 * @param   {Array<Integer>}   data   bitArray to transform to a string
 * @param   {String}           enc    "utf8", "base64", "hex"
 * @return  {String}
 * */
this.fromBits = function(data, enc){
	var converter = function(data, enc){
		enc = enc.toLowerCase();
		var str;
		if(enc=="hex"){
			str = sjcl.codec.hex.fromBits(data);
			return str;
		}else if(enc=="base64"){
			str = sjcl.codec.base64.fromBits(data);
			return str;
		}else if(enc=="utf8"){
			str = sjcl.codec.utf8String.fromBits(data);
			return str;
		}else{
			return null;
		}
	};
	var ret;
	try{
		ret = converter(data, enc);
	}catch(e1){
		try{
			ret = converter(data, enc);
		}catch(e2){
			try{
				ret = converter(data, enc);
			}catch(e3){
				ret = converter(data, enc);
			}
		}
	}
	return ret;
};


}
cipherJS.enc = new cipher_js_encoding();
