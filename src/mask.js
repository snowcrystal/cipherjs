
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
