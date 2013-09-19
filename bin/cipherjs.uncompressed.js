
/**
 * Replaces all occurences of @find with @replace.
 * ---------------------------------------------------------------------
 * @param   {String}   find      String to replace
 * @param   {String}   replace   String to replace @find with
 * @return  {String}
 * */
String.prototype.replaceAll = function(find, replace){
	var str = this;
	return str.replace(new RegExp(find, 'g'), replace);
};

/**
 * Checks if a string starts with another.
 * ---------------------------------------------------------------------
 * @param  {String} str
 * @return {String}
 * */
String.prototype.startsWith = function (str){
	return this.indexOf(str) == 0;
};

/**
 * Trim a given String, i.e. remove whitespaces at the beginning and end.
 * ---------------------------------------------------------------------
 * @return {String}
 * */
String.prototype.trim = function (){
	var	str = this.replace(/^\s\s*/, ''),
	ws = /\s/,
	i = str.length;
	while (ws.test(str.charAt(--i)));
	str = str.slice(0, i + 1);
	str = str.replace(/^\s+|\s+$/g, '');
	return str;
};

/**
 * Trim and remove multiple whitespaces from a string.
 * ---------------------------------------------------------------------
 * @return {String}
 * */
String.prototype.allTrim = function(){
	var str = this.replace(/\s+/g,' ');
	str = str.replace(/^\s+|\s+$/,'');
    str = str.replace(/^\s+|\s+$/g, '');
	return str;
};

/**
 * Remove whitespace characters from string.
 * ---------------------------------------------------------------------
 * @return {String}
 * */
String.prototype.removeWhitespace = function(){
	return this.replace(/\s+/g, '');
};
/**
 * Remove linebreak characters from string.
 * ---------------------------------------------------------------------
 * @return {String}
 * */
String.prototype.removeLinebreaks = function(){
	return this.replace(/(\r\n|\n|\r)/gm,"");
};
/**
 * Remove whitespace and linebreak characters from string.
 * ---------------------------------------------------------------------
 * @return {String}
 * */
String.prototype.removeWhitespaceAndLinebreaks = function(){
	var str = this.replace(/\s+/g, ' ');
	str = str.replace(/(\r\n|\n|\r)/gm,"");
	return str;
};

/**
 * Returns a string between two strings. Checks for the first 
 * occurence of @param start an the next occurence of @param end
 * after this.
 * ---------------------------------------------------------------------
 * @param   {String} start
 * @param   {String} end
 * @return  {String}
 * */
String.prototype.between = function(start, end){
	var pos1 = this.indexOf(start);
	var used = this.substr(pos1);
	var pos2 = used.indexOf(end);
	pos2 = pos1+pos2;
	if(pos1!=-1 && pos2!=-1){
		pos1 = pos1 + start.length;
		var pos3 = this.length - (this.length-pos2) - pos1;
		return this.substr(pos1, pos3);
	}
	return null;
}

/**
 * Chunk a string in pieces of the specified length.
 * ---------------------------------------------------------------------
 * @param  {Integer}        length   (Max.) length of the chunks 
 * @return {Array<String>}
 * */
String.prototype.chunk = function(len) {
	var str = this;
	var start = 0; 
	var end = len;
	var toceil = str.length/len;
	var upto = Math.ceil(toceil);
	var res = new Array();
	for(var i=0; i<upto; i++){
		var cur_str = str.slice(start, end);
		res.push(cur_str);
		start = start+len;
		end = end+len;
	}
	return res;
};

/**
 * Make Math.random cryptographically random if 
 * crypto.getRandomValues is available.
 * ---------------------------------------------------------------------
 * @return {Integer} rand
 * */
if (typeof crypto.getRandomValues == 'function'){
	Math.random = function(){
		var array = new Uint32Array(1);
		crypto.getRandomValues(array);
		var randint = array[0];
		var rand = "0."+randint;
		rand = parseFloat(rand);
		return rand;
	};
}
var cipherJS = new Object();

cipherJS.init = new Object();
cipherJS.init.entropyId = null; 
cipherJS.init.entropyInfoId = null; 
cipherJS.init.doneDOMObj = null;
cipherJS.init.doneInfoDOMObj = null;

/**
* Initiate SJCL's PRNG by collecting random values from mouse/ touchpad,
* window.crypto.getRandomValues and Math.random (yes, it is not secure
* in all browsers - that's what getRandomValues and the mouse thing are for).
* events.
* ----------------------------------------------------------------------
* @param   {String}    entropyId        ID of the element where the progress
*                                       of collection will be shown and where
*                                       the doneDOMObj will be displayed when 
*                                       enough values have been collected.
* @param   {DOMObject} doneDOMObj       DOM object to display when values
*                                       have been collected.
* @param   {String}    entropyInfoId    (Optional) ID of the element where you
*                                       provide some info like "Move your 
*                                       mouse or use your fingers on your 
*                                       touchpad/ touchscreen as randomly 
*                                       as possible until you see a 100% and the
*                                       proceed button below".
*                                       This message will disappear and @doneInfoDOMObj
*                                       will be shown when entropy is collected (i.e.
*                                       if window.crypto.getRandomValues is available, so
*                                       users won't see this message at all, or when 
*                                       they've moved long enough for entropy to be 
*                                       collected).
* @param   {DOMObject} doneInfoDOMObj   (Optional) Can be something empty or whatever you wish to
*                                       additionally tell the user (such as "Click on the
*                                       proceed button below to go to our page") after
*                                       entropy has been collected.
* */
cipherJS.init.init = function(entropyId, doneDOMObj, entropyInfoId, doneInfoDOMObj){
	windowonerrorBackup = window.onerror;
	window.onerror = function(){
	  return true;
	};
	cipherJS.init.entropyId = entropyId;
	cipherJS.init.doneDOMObj = doneDOMObj;
	if(entropyInfoId!="undefined") cipherJS.init.entropyInfoId = entropyInfoId;
	if(doneInfoDOMObj!="undefined") cipherJS.init.doneInfoDOMObj = doneInfoDOMObj;
	document.addEventListener("touchmove", cipherJS.init.touchMoveMapper, true);
	document.addEventListener("mousemove", cipherJS.init.update, true);
    sjcl.random.startCollectors();
    window.setTimeout(cipherJS.init.update, 0);
};

/**
 * Updates the random value elements. Do not call this manually.
 * */
cipherJS.init.update = function(){
	var elem = document.getElementById(cipherJS.init.entropyId);
	var domobj = cipherJS.init.doneDOMObj;
	var progress = sjcl.random.getProgress(10);
	if(progress === undefined || progress==1) {
		elem.innerHTML = "";
		elem.appendChild(cipherJS.init.doneDOMObj);
		if(cipherJS.init.entropyInfoId!=null){
			var infoElem = document.getElementById(cipherJS.init.entropyInfoId);
			infoElem.innerHTML = "";
			infoElem.appendChild(cipherJS.init.doneInfoDOMObj);
		}
		sjcl.random.stopCollectors();
		document.removeEventListener("touchmove", cipherJS.init.touchMoveMapper);
		document.removeEventListener("mousemove", cipherJS.init.update);
		window.onerror = windowonerrorBackup;
	} else {
		var prg = Math.round((progress.toFixed(2)*100));
		prg = prg + "%";
		elem.innerHTML = prg;
	}
};

cipherJS.init.touchMoveMapper = function(event)
{
    var touches = event.changedTouches,
        first = touches[0],
        type = "";
    switch(event.type)
    {
        case "touchmove":  type="mousemove"; break;        
        default: return;
    }
    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                              first.screenX, first.screenY, 
                              first.clientX, first.clientY, false, 
                              false, false, false, 0, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
};

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

function cipher_js_mask(){

/**
 * Mask a string so that after masking, it only contains alphanumeric
 * characters and %. 
 * ---------------------------------------------------------------------
 * To mask a string, it is base64-encoded and then encoded using 
 * encodeURIComponent. As a result, only alphanumeric and % are present
 * in the masked string, which will not give any trouble when transferred
 * over the network or passed to asymmetric encryption functions as 
 * a cleartext (they are not supposed to take XML or JSON cleartexts,
 * and users could any time include text or JSON data in their messages).
 * ---------------------------------------------------------------------
 * @param   {String}   str   String to mask
 * @return  {String}         Masked string
 * */
this.mask = function(str){
	var masked = cipherJS.enc.toBase64(str, "utf8");
	masked = encodeURIComponent(masked);
	/*var masked = encodeURIComponent(str);
	masked = masked.replaceAll("~", "%7E");
	masked = masked.replaceAll("!", "%21");
	masked = masked.replaceAll("*", "%2A");
	masked = masked.replaceAll("(", "%28");
	masked = masked.replaceAll(")", "%29");
	masked = masked.replaceAll("'", "%27");*/
	return masked;
};

/**
 * Unmask a string that was masked using cipherJS.mask.mask. 
 * ---------------------------------------------------------------------
 * @str is first decoded using decodeURIComponent, and then the 
 * resulting base64 string is utf8-encoded, resulting in the original
 * string.
 * ---------------------------------------------------------------------
 * @param   {String}   str   Masked text
 * @return  {String}         Original text, unmasked
 * */
this.unmask = function(str){
	var unmasked = decodeURIComponent(str);
	unmasked = cipherJS.enc.toUtf8(unmasked, "base64");
	/*var unmasked = str;
	unmasked = unmasked.replaceAll("%7E", "~");
	unmasked = unmasked.replaceAll("%21", "!");
	unmasked = unmasked.replaceAll("%2A", "*");
	unmasked = unmasked.replaceAll("%28", "(");
	unmasked = unmasked.replaceAll("%29", ")");
	unmasked = unmasked.replaceAll("%27", "'");
	unmasked = decodeURIComponent(unmasked);*/
	return unmasked;
};

}
cipherJS.mask = new cipher_js_mask();
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
function cipher_js_asym(){

/**
 * The symmetric algorithm setting defines the symmetric algorithm to be
 * used by symEncrypt in this application. This is an application wide
 * setting.
 * "aes", "rijndael", "twofish", "serpent", "aes-twofish" are currently
 * supported. They'll use the settings of cipherJS.sym, i.e. if you
 * specify 256 bit keysize there it will be that, and if you specify
 * only 128 bit keysize, that'll be that as well.
 * cipherJS.asym.symDecrypt can decrypt data encrypted using
 * cipherJS.asym.symEncrypt using another setting for @symmetricAlgorithm,
 * as it recognized the algorithm automatically.
 * DEFAULT: "aes-twofish".
 * */
this.symmetricAlgorithm = "aes-twofish";

this.asyncTimeout = 10;

//---START-GENERATE-KEYS------------------------------------------------
/**
 * Generate a set of keys for encryption and signing. Choose a keysize
 * of 521 or 256 bit if trying implement cross browsers compatibility,
 * only these keys behave stable in most browsers.
 * ---------------------------------------------------------------------
 * ECC works somewhat different compared to RSA. It is best, most secure,
 * not to have one keypair (2 keys) but two keypairs (4 keys) for a user.
 * One keypair (cipherJS uses elGamal keys here) is used exclusively for
 * encryption and decryption, the other keypair (ECDSA) is only used for
 * signing and verification.
 * cipherJS generates the two keypairs of a certain bitlength, and 
 * encrypts each of the two secret keys symmetrically using @pass. All
 * keys are serialized. This makes them pretty portable.
 * All keystrings are UTF8-encoded, so choose yourself how you would
 * encode them to store them or send them over the network. (Always be
 * careful when storing anything but public keys on a server, and research
 * possible security threats *carefully*).
 * Key generation does happen asynchronously, so it should not hit
 * browser limits.
 * ---------------------------------------------------------------------
 * @param   {Integer}   bits       Bitlength of the keys. 192, 224, 256, 
 *                                 384 and 521 are possible. Only 256
 *                                 and 521 are stable in less stable
 *                                 webkit browsers such as several mobile
 *                                 browsers or lightweight desktop 
 *                                 browsers. So if you target all devices,
 *                                 choose 256 and/ or 521 bit. If you only
 *                                 target Firefox and Chrome, 192, 224 
 *                                 and 384 are fine as well. However,
 *                                 please consider 192 and 224 are somewhat
 *                                 too weak for real world usage (just
 *                                 an opinion). 
 *                                 A small comparison of key strength:
 *                                 ECC     |   RSA     |   AES
 *                                 192     |   1024    |    -
 *                                 224     |   2048    |    -
 *                                 256     |   3072    |   128
 *                                 384     |   7680    |   192
 *                                 521     |   15360   |   256
 *                                 In fact, you're at "top secret" level
 *                                 with 384 and 521 bit, while a 256 bit
 *                                 keyset is considered appropriate for
 *                                 "secret" (not "top secret") data. 
 *                                 521 bit is recommended as it is really,
 *                                 really performant still, and most secure.
 *                                 More information: http://www.keylength.com/
 * 
 * @param   {String}    pass       Password to symmetrically encrypt secret
 *                                 key strings with.
 * 
 * @carries {Object}    carry  
 * 
 * @calls   {Function}  callback   function(Object keys, Object carrier)
 *                                          keys:   Object encryption 
 *                                                     encryption:   String pub
 *                                                                   String sec
 *                                                  Object signing
 *                                                     signing:   String pub
 *                                                                String sec
 * 												  keys is null on error (i.e. if
 *                                                generated keys are not valid, but
 *                                                no exception occured). 
 * */
this.generateKeys = function(bits, pass, callback, carry){
	cipherJS.asym.generateKeysF(bits, pass, function(keys, carry){
		if(keys==null){
			cipherJS.asym.generateKeysF(bits, pass, function(keys, carry){
				if(keys==null){
					cipherJS.asym.generateKeysF(bits, pass, function(keys, carry){
						callback(keys, carry);
					}, carry);
				}else{
					callback(keys, carry);
				}
			}, carry);
		}else{
			callback(keys, carry);
		}
	}, carry);
};
this.generateKeysF = function(bits, pass, callback, carry){
		var carrier = {"callback": callback, "outercarrier": carry};
	carrier.bits = bits; carrier.pass = pass;
	if(bits!=192 && bits!=224 && bits!=256 && bits!=384 && bits!=521){
		bits = 521;
	}
	if(bits==384){
		sjcl.ecc.elGamal.generateKeysAsync(192, 10, function(keys, carrier){
			/**
			 * When some browsers are told to generate a 384 bit key, it
			 * is not valid. There's no "reason" for it - it even works when 
			 * activated debugging mode slows Javascript execution down. When
			 * another key (this one is not actually used, so as small as
			 * possible, i.e. 192) is generated before, it works. Don't ask 
			 * cipherJS about this, as the responsible Javascript engine.
			 * */
			sjcl.ecc.elGamal.generateKeysAsync(384, 10, function(keys, carrier){
				setTimeout(function(){
					cipherJS.asym.processElGamalKeys(keys, carrier);
				}, cipherJS.asym.asyncTimeout);
			}, carrier);
		}, carrier);
	}else{
		sjcl.ecc.elGamal.generateKeysAsync(bits, 10, function(keys, carrier){
			setTimeout(function(){
				cipherJS.asym.processElGamalKeys(keys, carrier);
			}, cipherJS.asym.asyncTimeout);
		}, carrier);
	}
};
this.processElGamalKeys = function(keys, carrier){
	var sec = cipherJS.asym.serializeSecretKey(keys.sec, "elGamal");
	var pub = cipherJS.asym.serializePublicKey(keys.pub, "elGamal");
	var val = cipherJS.asym.checkKeypair(keys.pub, sec, "elGamal");
	if(! val){
		var cb = carrier.callback;
		carrier = carrier.outercarrier;
		setTimeout(function(){
			cb(null, carrier);
		}, cipherJS.asym.asyncTimeout);
		return;
	}
	carrier.pubElGamal = pub;
	carrier.secElGamal = sec;
	setTimeout(function(){
		cipherJS.asym.generateECDSAKeys(carrier);
	}, cipherJS.asym.asyncTimeout);
};
this.generateECDSAKeys = function(carrier){
	var bits = carrier.bits; 
	if(bits!=192 && bits!=224 && bits!=256 && bits!=384 && bits!=521){
		bits = 521;
	}
	/**
	 * *ask JS engine* ^
	 * */
	if(bits==384){
		sjcl.ecc.ecdsa.generateKeysAsync(192, 10, function(keys, carrier){
			sjcl.ecc.ecdsa.generateKeysAsync(384, 10, function(keys, carrier){
				setTimeout(function(){
					cipherJS.asym.processECDSAKeys(keys, carrier);
				}, cipherJS.asym.asyncTimeout);
			}, carrier);
		}, carrier);
	}else if(bits==224){
		sjcl.ecc.ecdsa.generateKeysAsync(192, 10, function(keys, carrier){
			sjcl.ecc.ecdsa.generateKeysAsync(224, 10, function(keys, carrier){
				setTimeout(function(){
					cipherJS.asym.processECDSAKeys(keys, carrier);
				}, cipherJS.asym.asyncTimeout);
			}, carrier);
		}, carrier);
	}
	else{
		sjcl.ecc.ecdsa.generateKeysAsync(bits, 10, function(keys, carrier){
				setTimeout(function(){
					cipherJS.asym.processECDSAKeys(keys, carrier);
				}, cipherJS.asym.asyncTimeout);
		}, carrier);
	}
};
this.processECDSAKeys = function(keys, carrier){
	var sec = cipherJS.asym.serializeSecretKey(keys.sec, "ecdsa");
	var pub = cipherJS.asym.serializePublicKey(keys.pub, "ecdsa");
	var val = cipherJS.asym.checkKeypair(keys.pub, sec, "ecdsa");
	if(! val){
		var cb = carrier.callback;
		carrier = carrier.outercarrier;
		setTimeout(function(){
			cb(null, carrier);
		}, cipherJS.asym.asyncTimeout);
		return;
	}
	carrier.pubECDSA = pub;
	carrier.secECDSA = sec;
	setTimeout(function(){
		cipherJS.asym.processKeys(carrier);
	}, cipherJS.asym.asyncTimeout);
};
this.processKeys = function(carrier){
	var pass = carrier.pass;
	var pub_elgamal = carrier.pubElGamal;
	var sec_elgamal = cipherJS.asym.symEncrypt(carrier.secElGamal, pass);
	var pub_ecdsa = carrier.pubECDSA;
	var sec_ecdsa = cipherJS.asym.symEncrypt(carrier.secECDSA, pass);
	var keys = {"encryption": {"pub": pub_elgamal, "sec": sec_elgamal}, 
					"signing": {"pub": pub_ecdsa, "sec": sec_ecdsa} };
	var cb = carrier.callback;
	carrier = carrier.outercarrier;
	setTimeout(function(){
		cb(keys, carrier);
	}, cipherJS.asym.asyncTimeout);
};
//---END-GENERATE-KEYS--------------------------------------------------

//---START-ENCRYPT-STRING-----------------------------------------------
/**
 * Encrypt a cleartext with the receivers' public keys.
 * ---------------------------------------------------------------------
 * A random key is generated, and the cleartext is symmetrically 
 * encrypted using this random key. (If @symkey is provided, @symkey is
 * used instead of a random key. The resulting @ciphertext can be 
 * asymmetrically decrypted by receivers not knowing @symkey using their
 * secret key, but who ever already knows @symkey can decrypt the
 * ciphertext calling 
 * cipherJS.asym.symDecryptAsync(ciphertext, symkey, callback, carrier) 
 * which is much faster than decrypting using a private key.)
 * 
 * For each receiver, a random symmetric key is derived using their public
 * key. With a public keytag (which can be sent over the network to the
 * receiver), the receiver can find out this symmetric key using their
 * secret key. No one else but the owner of the secret key is able to
 * recover this symmetric key. With the symmetric key, @randkey is 
 * symmetrically encrypted. The receiver of the message can now recover
 * this symmetric key using their secret key, and that way decrypt 
 * @randkey, which they then can use to decrypt the actual ciphertext.
 * 
 * As several encrypted keys are returned, a hash of the public key
 * (yes, it could be all the public key, but this is just longer than a
 * hash) is provided with each of them. So a receiver can hash their
 * public key and check which of the cipherkeys is "theirs", by checking
 * which of the hashes is identical to their hash. This avoids trial and
 * error, instead lets a receiver see at once which key they can decrypt.
 * 
 * For all encryption but message encryption with @randkey (or @symkey), 
 * cipherJS.asym.symEncrypt is used. cipherJS.asym.symEncryptAsync is 
 * used for message encryption, as messages can be extremely long and 
 * are better encrypted asynchronously.
 * cipherJS.sym.hashPublicKey is used to create public key hashes. 
 * ---------------------------------------------------------------------
 * @param   {Array<String>}   pubkeys     Array of receivers' public keys
 *                                        (encryption keys, elGamal)
 * @param   {String}          cleartext   Cleartext to encrypt
 * @param   {String}          symkey      Optional symmetric key, so the
 *                                        receivers can still decrypt
 *                                        using their private key, but 
 *                                        whoever already knows the @symkey
 *                                        can decrypt directly.
 * @carries {Object}          carry
 * @calls   {Function}                    function(Object enc, Object carrier)
 *                                           enc: String ciphertext
 *                                                Array enckeys
 *                                                   Attributes of each enckey:
 *                                                      String keyhash
 *                                                      String cipherkey
 *                                                      String keytag
 * */
this.encryptString = function(pubkeys, cleartext, callback, carry, symkey){
	var randkey;
	if(typeof symkey != "undefined"){
		randkey = symkey;
	}else{
		randkey = cipherJS.asym.randomKeyString(64);
	}
	var carrier = {"callback": callback, "outercarrier": carry,
	               "randkey": randkey, /*"ciphertext": ciphertext,*/
	               "pubkeys": pubkeys, "i": 0, "pklen": pubkeys.length,
	               "enckeys": new Array()};
	cipherJS.asym.symEncryptAsync(cleartext, randkey, function(enc, c){
		var carrier = c;
		carrier.ciphertext = enc;
		setTimeout(function(){
			cipherJS.asym.encryptStringLoop1(carrier);
		}, cipherJS.asym.asyncTimeout);
	}, carrier);
	//var ciphertext = cipherJS.asym.symEncrypt(cleartext, randkey);
};
this.encryptStringLoop1 = function(carrier){
	var pubkeys = carrier.pubkeys;
	var enckeys = carrier.enckeys;
	var i = carrier.i; var len = carrier.pklen;
	
	var pk_str = pubkeys[i];
	carrier.keyhash = cipherJS.asym.hashPublicKey(pk_str);
	var pk_json = JSON.parse(pk_str);
	if(pk_json.keytype!="elGamal"){
		// stop here, input invalid
		return;
	}
	var pk = cipherJS.asym.deserializePublicKey(pk_str, "elGamal");
	pk.kemAsync(10, function(symkeyobj, carrier){
		try{
			var test1 = pk._curve.fromBits(symkeyobj.tag);
			cipherJS.asym.encryptStringLoop2(symkeyobj, carrier);
		}catch(e1){
			pk = cipherJS.asym.deserializePublicKey(pk_str, "elGamal");
			pk.kemAsync(10, function(symkeyobj, carrier){
				try{
					var test2 = pk._curve.fromBits(symkeyobj.tag);
					cipherJS.asym.encryptStringLoop2(symkeyobj, carrier);
				}catch(e2){
					pk = cipherJS.asym.deserializePublicKey(pk_str, "elGamal");
					pk.kemAsync(10, function(symkeyobj, carrier){
						try{
							var test3 = pk._curve.fromBits(symkeyobj.tag);
							cipherJS.asym.encryptStringLoop2(symkeyobj, carrier);
						}catch(e3){
							//console.log("caught");
							cipherJS.asym.encryptStringLoop2(null, carrier);
						}
					}, carrier);
				}
			}, carrier);
		}
	}, carrier);
};
this.encryptStringLoop2 = function(symkeyobj, carrier){
	if(symkeyobj==null){
		setTimeout(function(){
			carrier.callback(null, carrier.outercarrier);
		}, cipherJS.asym.asyncTimeout);
	}
	var enckeys = carrier.enckeys;
	var i = carrier.i; var len = carrier.pklen;
	var keyhash = carrier.keyhash;
	var keytag = symkeyobj.tag;
	var symkey = symkeyobj.key;
	keytag = sjcl.codec.hex.fromBits(keytag);
	symkey = sjcl.codec.hex.fromBits(symkey);
	var randkey = carrier.randkey;
	var cipherkey = cipherJS.asym.symEncrypt(randkey, symkey);
	var enckey = {"cipherkey": cipherkey, "keyhash": keyhash, "keytag": keytag};
	enckeys.push(enckey);
	carrier.enckeys = enckeys;
	
	i=i+1;
	if(i<len){
		carrier.i = i; carrier.enckeys = enckeys;
		setTimeout(function(){
			cipherJS.asym.encryptStringLoop1(carrier);
		}, cipherJS.asym.asyncTimeout);
	}else{
		var cb = carrier.callback;
		var ciphertext = carrier.ciphertext;
		carrier = carrier.outercarrier;
		var enc = {"ciphertext": ciphertext, "enckeys": enckeys};
		setTimeout(function(){
			cb(enc, carrier);
		}, cipherJS.asym.asyncTimeout);
	}
};
//---END-ENCRYPT-STRING-------------------------------------------------

//---START-DECRYPT-STRING-----------------------------------------------
/**
 * Decrypt a given ciphertext using the receiver's private key.
 * ---------------------------------------------------------------------
 * @seckey is symmetrically decrypted using @pass. @cipherkey is 
 * asymmetrically decrypted using @keytag and the decrypted @seckey (for
 * symmetrical decryption). 
 * Using the decrypted symmetric @cipherkey, @ciphertext is symmetrically
 * decrypted, resulting in the actual cleartext.
 * ---------------------------------------------------------------------
 * @param   {String}   ciphertext     Encrypted text to decrypt 
 * @param   {String}   cipherkey      Cipherkey which can be decrypted 
 *                                    using @privkey
 * @param   {String}   keytag         Keytag needed for decryption of
 *                                    @cipherkey
 * @param   {String}   seckey         Receivers' secret key 
 *                                    (encryption key, elGamal)
 * @param   {String}   pass           Password for @seckey
 * @carries {Object}   carry  
 * @calls   {Function} callback       function(Object dec, Object carrier)
 *                                       dec:  String cleartext
 * */
this.decryptString = function(ciphertext, seckey, pass, cipherkey, keytag, callback, carry){
	//console.log(keytag);
	/**
	 * Broken strings after decryption happen in some browsers. If
	 * this does not appear to be valid JSON, try again.
	 * */
	try{
		seckey = cipherJS.asym.symDecrypt(seckey, pass);
		JSON.parse(seckey);
	}catch(e){
		try{
			seckey = cipherJS.asym.symDecrypt(seckey, pass);
			JSON.parse(seckey);
		}catch(e){
			try{
				seckey = cipherJS.asym.symDecrypt(seckey, pass);
				JSON.parse(seckey);
			}catch(e){
				seckey = cipherJS.asym.symDecrypt(seckey, pass);
			}
		}
	}
	var cb = cipherJS.asym.decryptString2;
	var carr = {"callback": cb, "cipherkey": cipherkey, "ciphertext": ciphertext, "outercallback": callback, "outercarrier": carry };
	cipherJS.asym.decryptSymKeyAsync(keytag, seckey, carr);
};
this.decryptSymKeyAsync = function(tagstr, secretstr, carrier){
	var tag = sjcl.codec.hex.toBits(tagstr);
	var sec = cipherJS.asym.deserializeSecretKey(secretstr, "elGamal");
	sec.unkemAsync(tag, function(sym, carrier){
		carrier.callback(sym, carrier);
	}, carrier);
};
this.decryptString2 = function(sym, carrier){
	var cipherkey = carrier.cipherkey; 
	var ciphertext = carrier.ciphertext;
	sym = sjcl.codec.hex.fromBits(sym);
	var deckey = cipherJS.asym.symDecrypt(cipherkey, sym);
	cipherJS.asym.symDecryptAsync(ciphertext, deckey, function(dec, c){
		var callback = c.outercallback;
		setTimeout(function(){
			callback({"cleartext": dec}, c.outercarrier);
		}, cipherJS.asym.asyncTimeout);
	}, carrier);
	
	//var dec = cipherJS.asym.symDecrypt(ciphertext, deckey);
	/*setTimeout(function(){
		callback({"cleartext": dec}, carrier.outercarrier);
	}, cipherJS.asym.asyncTimeout);*/
};
//---END-DECRYPT-STRING-------------------------------------------------

//---START-SIGN-STRING--------------------------------------------------
/**
 * Sign a cleartext using the sender's secret key.
 * ---------------------------------------------------------------------
 * A hash of the @cleartext is signed using the @seckey (after 
 * decrypting with @pass) via ECDSA: A signature is derived from the
 * secret key and the hash.
 * The signature can be verified with the sender's public key by a 
 * receiver if the cleartext is known to them as well. The signature
 * is unique to the @seckey and the @cleartext. So if verified with the
 * senders public key, it clearly was created using the sender's secret
 * key.
 * ---------------------------------------------------------------------
 * @param   {String}   cleartext      Cleartext to sign
 * @param   {String}   seckey         Senders' secret key (signing key, ECDSA)
 * @param   {String}   pass           Pass for @seckey
 * @param   {String}   pubkey         Sender's (!) public key (signing key, ECDSA)
 *                                    which will be used to check if the signature
 *                                    generated is valid.
 * @carries {Object}   carry
 * @calls   {Function} callback       function(Object signed, Object outercarrier)
 *                                       signed: String signature (null if valid signature could not be generated)
 *                                               String message (equals @cleartext)
 * */
this.signString = function(cleartext, seckey, pass, pubkey, callback, carry){
	try{
		seckey = cipherJS.asym.symDecrypt(seckey, pass);
		JSON.parse(seckey);
	}catch(e){
		try{
			seckey = cipherJS.asym.symDecrypt(seckey, pass);
			JSON.parse(seckey);
		}catch(e){
			try{
				seckey = cipherJS.asym.symDecrypt(seckey, pass);
				JSON.parse(seckey);
			}catch(e){
				seckey = cipherJS.asym.symDecrypt(seckey, pass);
			}
		}
	}
	var sec = cipherJS.asym.deserializeSecretKey(seckey, "ecdsa");
	var hash = cipherJS.asym.hashMessage(cleartext);
	var carrier={"pubkey": pubkey, "callback": callback, "outercarrier": carry, "cleartext": cleartext};
	sec.signAsync(hash, 0, function(signature, carrier){
		carrier.signature = sjcl.codec.hex.fromBits(signature);
		cipherJS.asym.verifySignature(carrier.cleartext, carrier.signature, carrier.pubkey, function(ver, carrier){
			if(ver.verified=="verified"){
				var signstr = carrier.signature;
				var cb = carrier.callback; 
				var cleartext = carrier.cleartext;
				cb({"message": cleartext, "signature": signstr}, carrier.outercarrier);
			}else{
				sec.signAsync(hash, 0, function(signature, carrier){
					carrier.signature = sjcl.codec.hex.fromBits(signature);
					cipherJS.asym.verifySignature(carrier.cleartext, carrier.signature, carrier.pubkey, function(ver, carrier){
						if(ver.verified=="verified"){
							var signstr = carrier.signature;
							var cb = carrier.callback; 
							var cleartext = carrier.cleartext;
							cb({"message": cleartext, "signature": signstr}, carrier.outercarrier);
						}else{
							sec.signAsync(hash, 0, function(signature, carrier){
								carrier.signature = sjcl.codec.hex.fromBits(signature);
								cipherJS.asym.verifySignature(carrier.cleartext, carrier.signature, carrier.pubkey, function(ver, carrier){
									if(ver.verified=="verified"){
										var signstr = carrier.signature;
										var cb = carrier.callback; 
										var cleartext = carrier.cleartext;
										cb({"message": cleartext, "signature": signstr}, carrier.outercarrier);
									}else{
										var signstr = null;
										var cb = carrier.callback; 
										var cleartext = carrier.cleartext;
										cb({"message": cleartext, "signature": signstr}, carrier.outercarrier);
									}
								}, carrier);
							}, carrier);
						}
					}, carrier); 
				}, carrier);
			}
		}, carrier);
	}, carrier);
};
//---END-SIGN-STRING----------------------------------------------------

//---START-VERIFY-SIGNATURE---------------------------------------------
/**
 * Verify a cleartext's signature using the sender's public key.
 * ---------------------------------------------------------------------
 * Using ECDSA, the @signature of the @cleartext (the cleartext's hash,
 * which is calculated from @cleartext) is verified with the sender's
 * @pubkey. If it was really signed with the sender's private key, it
 * will verify.
 * ---------------------------------------------------------------------
 * Browser related exceptions should be caught, though, have a retry
 * option in your application if trying to target mobile and smaller
 * browsers.
 * ---------------------------------------------------------------------
 * @param   {String}   cleartext      The cleartext 
 * @param   {String}   signature      The signature to @cleartext
 * @param   {String}   pubkey         The sender's public key
 * @carries {Object}   outercarrier   
 * @calls   {Function} callback       function(Object ver, Object carrier)
 *                                       ver: String verified ("verified" | "unverified")
 * */
this.verifySignature = function(cleartext, signature, pubkey, callback, carry){
	var hash = cipherJS.asym.hashMessage(cleartext);
	pubkey = cipherJS.asym.deserializePublicKey(pubkey, "ecdsa");
	signature = sjcl.codec.hex.toBits(signature);
	var carrier = {"callback": callback, "outercarrier": carry};
	/**
	 * Sometimes, hardly in Chrome and Firefox, more frequent in some
	 * other browsers, good signatures are rejected. We'll try up to 3 times
	 * here, and in your application, you may allow a user  to retry as
	 * well. This should not be necessary, as verification with retrying
	 * as done here behaved well in each of cipherJS' tests, but maybe
	 * you should still do so.
	 * */
	pubkey.verifyAsync(hash, signature, function(bool, carrier){
		if(!bool){
			pubkey.verifyAsync(hash, signature, function(bool, carrier){
				if(!bool){
					pubkey.verifyAsync(hash, signature, function(bool, carrier){
						if(!bool){
							pubkey.verifyAsync(hash, signature, function(bool, carrier){
								var verified = "unverified";
								if(bool==true) verified="verified";
								carrier.callback({"verified": verified}, carrier.outercarrier);
							}, carrier);
						}else{
							var verified = "unverified";
							if(bool==true) verified="verified";
							carrier.callback({"verified": verified}, carrier.outercarrier);
						}
					}, carrier);
				}else{
					var verified = "unverified";
					if(bool==true) verified="verified";
					carrier.callback({"verified": verified}, carrier.outercarrier);
				}
			}, carrier);
		}else{
			var verified = "unverified";
			if(bool==true) verified="verified";
			carrier.callback({"verified": verified}, carrier.outercarrier);
		}
	}, carrier);
};
//---END-VERIFY-SIGNATURE-----------------------------------------------

//---START-ENCRYPT-AND-SIGN-STRING--------------------------------------
/**
 * Encrypt a cleartext with the receivers' public keys, sign with 
 * sender's secret key.
 * ---------------------------------------------------------------------
 * Uses cipherJS.asym.encryptString and cipherJS.asym.signString
 * ---------------------------------------------------------------------
 * @param   {String}          cleartext   Cleartext to encrypt
 * @param   {Array<String>}   pubkeys     Array of receivers' public keys
 *                                        (encryption keys, elGamal)
 * @param   {String}          pubkey      Sender's public key used for signing
 *                                        (ECDSA) (secret key is for signing,
 *                                        public key for checking if signature
 *                                        is valid)
 * @param   {String}          seckey      Sender's secret key used for signing
 *                                        (ECDSA)
 * @param   {String}          pass        Pass for @seckey
 * 
 * @param   {String}          symkey      Optional symmetric key, so the
 *                                        receivers can still decrypt
 *                                        using their private key, but 
 *                                        whoever already knows the @symkey
 *                                        can decrypt directly.
 * @carries {Object}          carry
 * @calls   {Function}                    function(Object enc, Object carrier)
 *                                           enc: String ciphertext
 *                                                String signature
 *                                                Array enckeys
 *                                                   Attributes of each enckey:
 *                                                      String keyhash
 *                                                      String cipherkey
 *                                                      String keytag
 * */
this.encryptAndSignString = function(cleartext, pubkeys, pubkey, seckey, pass, callback, carry){
	cipherJS.asym.signString(cleartext, seckey, pass, pubkey, function(signed, carry){
		var signature = signed.signature;
		cipherJS.asym.encryptString(pubkeys, cleartext, function(enc, carry){
			enc.signature = signature;
			callback(enc, carry);
		}, carry);
	}, carry);
};
//---END-ENCRYPT-AND-SIGN-STRING----------------------------------------

//---START-DECRYPT-AND-VERIFY-STRING------------------------------------
/**
 * Decrypt and verify a string using the sender's public key and the
 * receiver's secret key.
 * ---------------------------------------------------------------------
 * Decrypt a string using cipherJS.asym.decryptString, then verify
 * signature using the decrypted cleartext and @pubkey using
 * cipherJS.asym.verifySignature.
 * ---------------------------------------------------------------------
 * @param   {String}   ciphertext   Ciphertext to decrypt
 * @param   {String}   seckey       Receiver's secret key (for decryption,
 *                                  elGamal)
 * @param   {String}   pass         Pass for @seckey
 * @param   {String}   cipherkey    Cipherkey to be used for decryption
 * @param   {String}   keytag       Keytag to be used for decryption
 * @param   {String}   signature    Signature
 * @param   {String}   pubkey       Sender's public key to verify signature
 *                                  (ECDSA)
 * @carries {Object}
 * @calls   {Function} callback
 * */
this.decryptAndVerifyString = function(ciphertext, seckey, pass, cipherkey, keytag, signature, pubkey, callback, carry){
	cipherJS.asym.decryptString(ciphertext, seckey, pass, cipherkey, keytag, function(dec, carry){
		carry = {"carrier": carry, "cleartext": dec.cleartext};
		cipherJS.asym.verifySignature(dec.cleartext, signature, pubkey, function(ver, carry){
			ver.cleartext = carry.cleartext;
			callback(ver, carry.carrier);
		}, carry);
	}, carry);
};
	//verify: cleartext, signature, pubkey
	//decrypt: enc.ciphertext, keys.encryption.sec, "testtest", enc.enckeys[0].cipherkey, enc.enckeys[0].keytag
//---END-DECRYPT-AND-VERIFY-STRING--------------------------------------

//---START-CHECK-KEYS---------------------------------------------------
this.checkKeypair = function(pub, sec, t){
	var v_pub = cipherJS.asym.checkPublicKey(pub, t);
	var v_sec = cipherJS.asym.checkSecretKey(sec, t);
	if(v_pub && v_sec){
		return true;
	}else{
		return false;
	}
};
this.checkPublicKey = function(pub){
	try{
		return pub._point.isValid();
	}catch(e){
		return false;
	}
};
this.checkSecretKey = function(sec, t){
	if(typeof sec == "String" || typeof sec == "string"){
		try{
			var dser = cipherJS.asym.deserializeSecretKey(sec, t);
			if((typeof dser == "object" || typeof dser == "Object") && dser != null){
				return true;
			}else{
				return false;
			}
		}catch(e){
			return false;
		}
	}else{
		try{
			var ser = cipherJS.asym.serializeSecretKey(sec, t);
			var dser = cipherJS.asym.deserializeSecretKey(ser, t);
			if((typeof dser == "object" || typeof dser == "Object") && dser != null){
				return true;
			}else{
				return false;
			}
		}catch(e){
			return false;
		}
	}
};
//---END-CHECK-KEYS-----------------------------------------------------

//---START-SERIALIZE-KEYS-----------------------------------------------
this.serializeSecretKey = function(sec, t){
	var exponent = sec._exponent.toBits();
	var curve = sec._curve.b.exponent;
	var keytype = t;
	var sec_json = {"exponent": exponent, "curve": curve, "keytype": keytype};
	var sec_str = JSON.stringify(sec_json);
	return sec_str;
};
this.deserializeSecretKey = function(sec, t){
	try{
		sec = JSON.parse(sec);
	}catch(e){
		console.log(sec);
		try{
			sec = JSON.parse(sec);
		}catch(e){
			sec = JSON.parse(sec);
		}
	}
	var exponent = sec.exponent;
	var curve = sec.curve;
	exponent = sjcl.bn.fromBits(exponent);
	if(t=="ecdsa"){
		var sec_obj = new sjcl.ecc.ecdsa.secretKey(sjcl.ecc.curves['c'+curve], exponent);
	}else{
		var sec_obj = new sjcl.ecc.elGamal.secretKey(sjcl.ecc.curves['c'+curve], exponent);
	}
	return sec_obj;
};
this.serializePublicKey = function(pub, t){
	var point = pub._point.toBits();
	var curve = pub._curve.b.exponent;
	var keytype = t;
	var pub_json = {"point": point, "curve": curve, "keytype": keytype};
	var pub_str = JSON.stringify(pub_json);
	return pub_str;
};
this.deserializePublicKey = function(pub, t){
	pub = JSON.parse(pub);
	var bits = pub.point;
	var curve = pub.curve;
	//var point = sjcl.ecc.curves['c'+curve].fromBits(bits);
	var point;
	try{
		point = sjcl.ecc.curves['c'+curve].fromBits(bits);
	}catch(e){
		try{
			point = sjcl.ecc.curves['c'+curve].fromBits(bits);
		}catch(e){
			try{
				point = sjcl.ecc.curves['c'+curve].fromBits(bits);
			}catch(e){
				point = sjcl.ecc.curves['c'+curve].fromBits(bits);
			}
		}
	}
	var val = point.isValid();
	if(t=="ecdsa"){
		var pubkey = new sjcl.ecc.ecdsa.publicKey(point.curve, point);
	}else{
		var pubkey = new sjcl.ecc.elGamal.publicKey(point.curve, point);
	}
	return pubkey;
};
//---END-SERIALIZE-KEYS-------------------------------------------------

//---START-SYM----------------------------------------------------------
/**
 * Symmetrically encrypt @data using @pass asynchronously. 
 * Use cipherJS.asym.symmetricAlgorithm as an algorithm. Internally
 * uses cipherJS.sym.encryptAsync, so settings in cipherJS.sym.encrypt affect
 * cipherJS.asym as well.
 * ---------------------------------------------------------------------
 * @param   {String}   data      Data string to encrypt
 * @param   {String}   pass      Password to use for encryption key derivation
 * @carries {Object}   carrier
 * @calls   {Function}           function(String enc, Object carrier)
 * */
this.symEncryptAsync = function(data, pass, callback, carrier){
	var algorithm = cipherJS.asym.symmetricAlgorithm;
	cipherJS.sym.encryptAsync(data, pass, algorithm, function(enc, c){
		callback(enc, c);
	}, carrier);
};
/**
 * Decrypt @data symmetrically using @pass. Internally uses 
 * cipherJS.sym.decryptAsync.
 * ---------------------------------------------------------------------
 * @param   {String}   data      Ciphertext to decrypt
 * @param   {String}   pass      Pass to use for decryption
 * @carries {Object}   carrier
 * @calls   {Function}           function(String dec, Object carrier)
 * */
this.symDecryptAsync = function(data, pass, callback, carrier){
	cipherJS.sym.decryptAsync(data, pass, function(dec, c){
		callback(dec, c);
	}, carrier);
};
/**
 * Symmetrically encrypt @data using @pass. 
 * Use cipherJS.asym.symmetricAlgorithm as an algorithm. Internally
 * uses cipherJS.sym.encrypt, so settings in cipherJS.sym.encrypt affect
 * cipherJS.asym as well.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Data string to encrypt
 * @param   {String}   pass   Password to use for encryption key derivation
 * @return  {String}
 * */
this.symEncrypt = function(data, pass){
	//return sjcl.encrypt(pass, data, {"ks": 256, "ts": 128, "mode": "ocb2"});
	var algorithm = cipherJS.asym.symmetricAlgorithm; 
	var enc = cipherJS.sym.encrypt(data, pass, algorithm);
	/*if(algorithm != "aes" && algorithm != "aes-twofish"){
		algorithm = "aes-twofish";
	}*/
	
	/*if(algorithm == "aes"){
		enc = cipherJS.sym.aesEncrypt(data, pass);
	}else if(algorithm == "rijndael"){
		enc = cipherJS.sym.rijndaelEncrypt(data, pass);
	}else if(algorithm == "twofish"){
		enc = cipherJS.sym.twofishEncrypt(data, pass);
	}else if(algorithm == "serpent"){
		enc = cipherJS.sym.serpentEncrypt(data, pass);
	}else if(algorithm == "aes-twofish"){
		enc = cipherJS.sym.aesTwofishEncrypt(data, pass);
		//alert(enc);
	}else{
		return null;
	}*/
	
	return enc;
};
/**
 * Decrypt @data symmetrically using @pass. Internally uses 
 * cipherJS.sym.decrypt.
 * ---------------------------------------------------------------------
 * @param   {String}   data   Ciphertext to decrypt
 * @param   {String}   pass   Pass to use for decryption
 * @return  {String}
 * */
this.symDecrypt = function(data, pass){
	var dec = cipherJS.sym.decrypt(data, pass);
	/*var algorithm = (JSON.parse(data)).cipher;*/
	/*console.log(algorithm);*/
	/*try{
		dec = sjcl.decrypt(pass, data);
	}catch(e1){
		try{
			sjcl.decrypt(pass, data);
		}catch(e2){
			sjcl.decrypt(pass, data);
		}
	}
	return dec;*/
	/*if(algorithm == "aes"){
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
		return null;
	}*/
	return dec;
};
//---END-SYM------------------------------------------------------------

//---START-HASH-PUBLIC-KEY----------------------------------------------
this.hashPublicKey = function(pk_str){
	var hash1 = sjcl.hash.sha1.hash(pk_str);
	hash1 = sjcl.codec.hex.fromBits(hash1);
	var hash2 = sjcl.hash.sha1.hash(pk_str);
	hash2 = sjcl.codec.hex.fromBits(hash2);
	if(hash1==hash2){
		return hash1;
	}else{
		hash1 = sjcl.hash.sha1.hash(pk_str);
		hash1 = sjcl.codec.hex.fromBits(hash1);
		hash2 = sjcl.hash.sha1.hash(pk_str);
		hash2 = sjcl.codec.hex.fromBits(hash2);
		return hash1;
	}
	//return hash;
};
//---END-HASH-PUBLIC-KEY------------------------------------------------

//---START-HASH-MESSAGE-------------------------------------------------
this.hashMessage = function(msg){
	var hash;
	hash = sjcl.hash.sha256.hash(msg);
	hash = sjcl.codec.hex.fromBits(hash);
	return hash;
};
//---END-HASH-MESSAGE---------------------------------------------------

//---START-GENERATE-RANDOM-KEY-STRING-----------------------------------
this.randomKeyString = function(len, enc) {
	if(len === undefined || len == "undefined"){
		len = 64;
	}
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if(enc=="hex"){
		chars = '012345678abcdef';
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
//---END-GENERATE-RANDOM-KEY-STRING-------------------------------------

}
cipherJS.asym = new cipher_js_asym();

function cipher_js_simple_asym(){

//---START-GENERATE-KEYSET----------------------------------------------
/**
 * Generate a keyset for a user, possible bitlength are 256 and 521 
 * (521 is recommended).
 * ---------------------------------------------------------------------
 * Two ECC keypairs (elGamal and ECDSA) are generated, both are of the
 * bitlength specified with @bits. All keys are serialized, and the
 * secret keys are symmetrically encrypted using @pass. The elGamal 
 * keypair can later be used for encryption and decryption, the ECDSA
 * keypair will be used for signing and verification. From these keys,
 * an XML-string for a full keyset (could be stored on a server if you
 * know what you do, as secret keys are only known to whoever knows 
 * @pass) and for a public keyset (should be public for everyone who wants
 * to send the owner a message, or wants to verify a signed message from
 * the owner) are generated. 
 * ---------------------------------------------------------------------
 * @param   {Integer}   bits       Bitlength of the keys. 256 and 521
 *                                 bit are possible here.
 *                                 A small comparison of key strength:
 *                                 ECC     |   RSA     |   AES
 *                                 192     |   1024    |    -
 *                                 224     |   2048    |    -
 *                                 256     |   3072    |   128
 *                                 384     |   7680    |   192
 *                                 521     |   15360   |   256
 *                                 Choose 256 if your data is "secret" only,
 *                                 but better default to 521 bit ("top secret")
 *                                 which is performant enough yet most
 *                                 secure.
 *                                 More information: http://www.keylength.com/
 * 
 * @param   {String}    pass       Password to symmetrically encrypt secret
 *                                 key strings with.
 * 
 * @carries {Object}    carry  
 * 
 * @calls   {Function}  callback   function(Object keys, Object carrier)
 *                                          keys:  String keyset
 *                                                 String publickeyset
 *                                             keys is null if generated keys were not valid
 * */
this.generateKeyset = function(bits, pass, callback, carry){
	if(bits!=256 && bits!=521){
		bits=521;
	}
	cipherJS.asym.generateKeys(bits, pass, function(keys, carry){
		setTimeout(function(){
			if(keys == null){
				callback(null, carry);
			}
			var enc_pub = keys.encryption.pub;
			var enc_sec = keys.encryption.sec;
			var sign_pub = keys.signing.pub;
			var sign_sec = keys.signing.sec;
			var id = enc_pub+sign_pub;
			id = sjcl.hash.sha256.hash(id);
			id = sjcl.codec.hex.fromBits(id);
			keys = "<keyset>"+
				   "<id>"+id+"</id>"+
				   "<encryption>"+
						"<pub>"+enc_pub+"</pub>"+
						"<sec>"+enc_sec+"</sec>"+
				   "</encryption>"+
				   "<signing>"+
						"<pub>"+sign_pub+"</pub>"+
						"<sec>"+sign_sec+"</sec>"+
				   "</signing>"+
				   "</keyset>";
			var publickeys = "<publickeyset>"+
							 "<id>"+id+"</id>"+
							 "<encryption>"+
								"<pub>"+enc_pub+"</pub>"+
							 "</encryption>"+
							 "<signing>"+
								"<pub>"+sign_pub+"</pub>"+
							 "</signing>"+
							 "</publickeyset>";
			callback({"keyset": keys, "publickeyset": publickeys}, carry);
		}, 1);
	}, carry);
};
//---END-GENERATE-KEYSET------------------------------------------------

//---START-PRINT-ID-----------------------------------------------------
/**
 * This function takes a keyset (full or public only) and generates its
 * ID. 
 * ---------------------------------------------------------------------
 * A keysets' ID, the SHA256-hash of the signing and encryption public 
 * key, can be used to check in a more human readable form if a keyset
 * has changed. If the ID stays the same, the keys are the same (very,
 * very, very likely - at least).
 * ---------------------------------------------------------------------
 * @param   {String}   keyset   XML string, representing a keyset (full
 *                              or public only)
 * @return  {String}   id       Hex string, representing the ID of the
 *                              keyset.
 * */
this.printId = function(keyset){
	var ks = cipherJS.asym.simple.parseKeyset(keyset);
	var enc_pub = ks.encryption.pub;
	var sign_pub = ks.signing.pub;
	var id = enc_pub+sign_pub;
	id = sjcl.hash.sha256.hash(id);
	id = sjcl.codec.hex.fromBits(id);
	return id;
};
//---END-PRINT-ID-------------------------------------------------------

//---START-ENCRYPT-MESSAGE----------------------------------------------
/**
 * Encrypt a message with the receivers public keysets.
 * ---------------------------------------------------------------------
 * @param   {Array<String>}   receiverkeysets   The receivers' public keysets
 * @param   {String}          cleartext         Cleartext to encrypt
 * @param   {String}          symkey            Optional symmetric key, so the
 *                                              receivers can still decrypt
 *                                              using their private key, but 
 *                                              whoever already knows the @symkey
 *                                              can decrypt calling
 *                                              cipherJS.asym.symDecryptAsync(msg.between("<ct>", "</ct>"), symkey, callback, carrier)
 *                                              Just don't provide it if all
 *                                              receivers will decrypt with their
 *                                              private keys, it is not necessary then.
 * @carries {Object}          carry
 * @calls   {Function}        callback          function(String msg, Object carrier)
 *                                                 msg is the encrypted message (XML string)
 * */
this.encryptMessage = function(receiverkeysets, cleartext, callback, carry, symkey){
	var pubkeys = new Array();
	for(var i=0; i<receiverkeysets.length; i++){
		var pk = cipherJS.asym.simple.parseKeyset(receiverkeysets[i]);
		pubkeys.push(pk.encryption.pub);
	}
	cipherJS.asym.encryptString(pubkeys, cleartext, function(enc, carry){
		var ciphertext = "<ct>"+enc.ciphertext+"</ct>";
		var eks = enc.enckeys;
		var eks_xml = ""; var ek;
		for(var j=0; j<eks.length; j++){
			ek = eks[j];
			eks_xml += "<ek id='"+j+"'>"+
						"<kh>"+ek.keyhash+"</kh>"+
						"<ck>"+ek.cipherkey+"</ck>"+
						"<kt>"+ek.keytag+"</kt>"+
					  "</ek>";
		}
		eks_xml = "<eks>"+eks_xml+"</eks>";
		var msg = "<message>"+
					"<type>encrypted</type>"+
					"<version>0.0.1</version>"+
					eks_xml+ciphertext+
				  "</message>";
	    callback(msg, carry);
	}, carry, symkey);
};
//---END-ENCRYPT-MESSAGE------------------------------------------------

//---START-DECRYPT-MESSAGE----------------------------------------------
/**
 * Decrypt a message using the receiver's keyset.
 * ---------------------------------------------------------------------
 * @param   {String}   message          Message to decrypt (XML string, type encrypted)
 * @param   {String}   receiverkeyset   Receiver's full keyset
 * @param   {String}   pass             Password for @receiverkeyset
 * @carries {Object}   carry
 * @calls   {Function} callback         function(String cleartext, Object carry)
 * */
this.decryptMessage = function(message, receiverkeyset, pass, callback, carry){
	var keyset = cipherJS.asym.simple.parseKeyset(receiverkeyset);
	var keyhash = cipherJS.asym.hashPublicKey(keyset.encryption.pub);
	var eks = message.between("<eks>", "</eks>");
	var ct = message.between("<ct>", "</ct>");
	var i = 0; var eks_parsed = false; var ek; var kh; var ck; var kt;
	while(!eks_parsed){
		ek = eks.between("<ek id='"+i+"'>", "</ek>");
		if(ek!=null){
			kh = ek.between("<kh>", "</kh>");
			if(kh==keyhash){
				ck = ek.between("<ck>", "</ck>");
				kt = ek.between("<kt>", "</kt>");
			}
		}else{
			eks_parsed = true;
		}
		i+=1;
	}
	/*if(kt==undefined || kt.length<1){
			console.log(message);
			console.log(receiverkeyset);
			console.log(keyset);
			console.log(keyhash);
			console.log(kt);
	}*/
	cipherJS.asym.decryptString(ct, keyset.encryption.sec, pass, ck, kt, function(enc, carry){
		callback(enc.cleartext, carry);
	}, carry);
};
//---END-DECRYPT-MESSAGE------------------------------------------------

//---START-SIGN-MESSAGE-------------------------------------------------
/**
 * Sign a message (cleartext) using the sender's keyset. 
 * ---------------------------------------------------------------------
 * @param   {String}   cleartext       Cleartext to sign
 * @param   {String}   senderskeyset   Sender's full keyset
 * @param   {String}   pass            Pass for @senderskeyset
 * @carries {Object}   carry
 * @calls   {Function} callback        function(String message, Object carry)
 *                                        message is an XML string, representing a signed message
 * */
this.signMessage = function(cleartext, senderkeyset, pass, callback, carry){
	var rks = cipherJS.asym.simple.parseKeyset(senderkeyset);
	cipherJS.asym.signString(cleartext, rks.signing.sec, pass, rks.signing.pub, function(signed, carry){
		var signature = signed.signature;
		var content = signed.message;
		var msg = "<message>"+
					"<type>signed</type>"+
					"<version>0.0.1</version>"+
					"<ct>"+content+"</ct>"+
					"<sig>"+signature+"</sig>"+
				  "</message>";
		callback(msg, carry);
	}, carry);
};
//---END-SIGN-MESSAGE---------------------------------------------------

//---START-VERIFY-MESSAGE-----------------------------------------------
/**
 * Verify a signed (not signed and encrypted) message using the senders'
 * public keyset.
 * ---------------------------------------------------------------------
 * @param   {String}   message         Message to verify (XML string)
 * @param   {String}   senderskeyset   Sender's public keyset
 * @carries {Object}   carry
 * @calls   {Function} callback        function(String ver, Object carry)
 *                                        ver is "verified" || "unverified" 
 * */
this.verifyMessage = function(message, senderkeyset, callback, carry){
	var ct = message.between("<ct>", "</ct>");
	var sg = message.between("<sig>", "</sig>");
	var sk = cipherJS.asym.simple.parseKeyset(senderkeyset);
	var pk = sk.signing.pub;
	cipherJS.asym.verifySignature(ct, sg, pk, function(ver, carry){
		callback(ver.verified, carry);
	}, carry);
};
//---END-VERIFY-MESSAGE-------------------------------------------------

//---START-ENCRYPT-AND-SIGN-MESSAGE-------------------------------------
/**
 * Encrypt a message using the receivers' public keysets, and
 * sign using the sender's full keyset.
 * ---------------------------------------------------------------------
 * @param   {Array<String>}   receiverkeysets   Receivers' public keysets
 * @param   {String}          senderkeyset      Sender's full keyset
 * @param   {String}          pass              Pass for @senderkeyset
 * @param   {String}          cleartext         Cleartext to sign and encrypt
 * @param   {String}          symkey            Optional symmetric key, so the
 *                                              receivers can still decrypt
 *                                              using their private key, but 
 *                                              whoever already knows the @symkey
 *                                              can decrypt calling
 *                                              cipherJS.asym.symDecryptAsync(msg.between("<ct>", "</ct>"), symkey, callback, carrier)
 *                                              Just don't provide it if all
 *                                              receivers will decrypt with their
 *                                              private keys.
 * @calls  {Function}         callback          function(String msg, Object carry)
 *                                                 msg is the XML string representation of 
 *                                                 the encrypted and signed message
 * */
this.encryptAndSignMessage = function(receiverkeysets, senderkeyset, pass, cleartext, callback, carry, symkey){
	var pubkeys = new Array();
	for(var i=0; i<receiverkeysets.length; i++){
		var pk = cipherJS.asym.simple.parseKeyset(receiverkeysets[i]);
		pubkeys.push(pk.encryption.pub);
	}
	var sk = cipherJS.asym.simple.parseKeyset(senderkeyset);
	cipherJS.asym.encryptAndSignString(cleartext, pubkeys, sk.signing.pub, sk.signing.sec, pass, function(enc, carry){
		var ciphertext = "<ct>"+enc.ciphertext+"</ct>";
		var signature = "<sig>"+enc.signature+"</sig>";
		var eks = enc.enckeys;
		var eks_xml = ""; var ek;
		for(var j=0; j<eks.length; j++){
			ek = eks[j];
			eks_xml += "<ek id='"+j+"'>"+
						"<kh>"+ek.keyhash+"</kh>"+
						"<ck>"+ek.cipherkey+"</ck>"+
						"<kt>"+ek.keytag+"</kt>"+
					  "</ek>";
		}
		eks_xml = "<eks>"+eks_xml+"</eks>";
		var msg = "<message>"+
					"<type>encrypted,signed</type>"+
					"<version>0.0.1</version>"+
					eks_xml+ciphertext+signature+
				  "</message>";
	    callback(msg, carry);
	}, carry, symkey);
};
//---END-ENCRYPT-AND-SIGN-MESSAGE---------------------------------------

//---START-DECRYPT-AND-VERIFY-MESSAGE-----------------------------------
/**
 * Decrypt a message using the receiver's full keyset and verify using
 * the sender's public keyset.
 * ---------------------------------------------------------------------
 * @param   {String}   message           Message to decrypt (XML string)
 * @param   {String}   receiverkeyset    Receiver's full keyset
 * @param   {String}   pass              Pass for @receiverkeyset
 * @param   {String}   senderkeyset      Sender's public keyset
 * @carries {Object}   carry
 * @calls   {Function} callback          function(Object dec, Object carry)
 *                                          dec: String verified ("verified" || "unverified")
 *                                               String cleartext
 * */
this.decryptAndVerifyMessage = function(message, receiverkeyset, pass, senderkeyset, callback, carry){
	var rk = cipherJS.asym.simple.parseKeyset(receiverkeyset);
	var keyhash = cipherJS.asym.hashPublicKey(rk.encryption.pub);
	var sk = cipherJS.asym.simple.parseKeyset(senderkeyset);
	var sk_p = sk.signing.pub;
	var ct = message.between("<ct>", "</ct>");
	var sig = message.between("<sig>", "</sig>");
	var eks = message.between("<eks>", "</eks>");
	var i = 0; var eks_parsed = false; var ek; var kh; var ck; var kt;
	while(!eks_parsed){
		ek = eks.between("<ek id='"+i+"'>", "</ek>");
		if(ek!=null){
			kh = ek.between("<kh>", "</kh>");
			if(kh==keyhash){
				ck = ek.between("<ck>", "</ck>");
				kt = ek.between("<kt>", "</kt>");
			}
		}else{
			eks_parsed = true;
		}
		i+=1;
	}
	cipherJS.asym.decryptAndVerifyString(ct, rk.encryption.sec, pass, ck, kt, sig, sk_p, function(dec, carry){
			callback(dec, carry);
	}, carry);
};
//---END-DECRYPT-AND-VERIFY-MESSAGE-------------------------------------

//----------------------------------------------------------------------
this.parseKeyset = function(str){
	var keyset = new Object();
	keyset.encryption = new Object();
	keyset.signing = new Object();
	var encryption = str.between("<encryption>", "</encryption>");
	var signing = str.between("<signing>", "</signing>");
	var enc_pub; var enc_sec; var sig_pub; var sig_sec;
	enc_pub = encryption.between("<pub>", "</pub>");
	sig_pub = signing.between("<pub>", "</pub>");
	keyset.encryption.pub = enc_pub;
	keyset.signing.pub = sig_pub;
	if(str.indexOf("<publickeyset>")<0){
		//if this is a complete keyset
		enc_sec = encryption.between("<sec>", "</sec>");
		sig_sec = signing.between("<sec>", "</sec>");
		keyset.encryption.sec = enc_sec;
		keyset.signing.sec = sig_sec;
	}
	/*
	 * Test if the ID is still valid.
	 * */
	var id_old = str.between("<id>", "</id>");
	var id = enc_pub+sig_pub;
	id = sjcl.hash.sha256.hash(id);
	id = sjcl.codec.hex.fromBits(id);
	if(id_old != id){
		return null;
	}
	return keyset;
};

}
cipherJS.asym.simple = new cipher_js_simple_asym();
