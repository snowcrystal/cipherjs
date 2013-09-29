
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
