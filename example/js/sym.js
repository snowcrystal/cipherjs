
window.onerror = function(message, file, line){
	var reason = "Wrong password, or bug.";
	var todo = "Just enter the correct password. If you're sure it was correct, try with some examples and if it looks like a bug, contact the admin ;).";
	var msg = "Sorry, but an error occured. \n\n"+
				"SUSPECTED REASON: \n"+reason+"\n\n"+
				"WHAT TO DO?: \n"+todo+"\n\n"+
				"TECHNICAL DETAILS: \n"+
				"Message: "+message+"\n"+
				"In file: "+file+"\n"+
				"In line: "+line;
	alert(msg);
	try{
		hideOverlay();
	}catch(e){}
}

init();

function init(){
	showOneDiv('init');
	if(typeof crypto.getRandomValues != "function"){
		/*
		 * if getRandomValues is available, mousemoving is not needed.
		 * The writing "Move your mouse ..." would appear and disappear
		 * extremely quickly while loading the page, confusing users.
		 * So only load it if it is needed and there will be time to
		 * read it.
		 * */
		x$('#entropy_info').inner("Move your mouse (or your finger on your touchpad/ touchscreen) as randomly as possible in this window until you see the application page.");
	}
	var elemEntropyId="entropy";
	var doneDOMObj = document.createElement('script');
	doneDOMObj.innerHTML = "initDone();"; //some javascript here
	var elemInfoId = "entropy_info";
	var infoDOMObj = document.createElement('span');
	infoDOMObj.innerHTML = "";
	cipherJS.init.init(elemEntropyId, doneDOMObj, elemInfoId, infoDOMObj);
}

function initDone(){
	showOneDiv('app');
	x$('textarea').attr('value', ''); x$('textarea').inner('');
	x$('textarea').click(function(){
		this.focus();
		this.select();
	});
	x$('#enc_app').click(function(){
		encrypt();
	});
	x$('#dec_app').click(function(){
		decrypt();
	});
}

function showOneDiv(id){
	if(!id.startsWith('#')) id = '#'+id;
	x$('div').setStyle('display', 'none');
	x$(id).setStyle('display', 'block');
	window.scrollTo(0,0);
	return true;
}
function showOverlay(){
	window.scrollTo(0,0);
	x$('#overlay').setStyle('display', 'block');
	disable_scroll();
}
function hideOverlay(){
	x$('#overlay').setStyle('display', 'none');
	enable_scroll();
}
function goTo(id){
	document.getElementById(id).scrollIntoView(true);
	return;
}
function getText(idOfTextarea){
	var txtarea = document.getElementById(idOfTextarea);
	return txtarea.value;
}

function encrypt(){
	showOverlay();
	var cleartext = getText('input_app');
	var pass = x$('#pass_app').attr('value')[0];
	if(cleartext.length<1 || pass.length<1){
		alert("You've forgot to fill some fields!");
		hideOverlay();
		return;
	}
	var ciphertext = cipherJS.sym.aesEncrypt(cleartext, pass);
	x$('#output_app').inner(ciphertext);
	var height = "innerHeight" in window 
               ? window.innerHeight
               : document.documentElement.offsetHeight; 
	if(height < 400){
		goTo('output_app');
	}else{}
	hideOverlay();
}

function decrypt(){
	showOverlay();
	var ciphertext = getText('input_app');
	var pass = x$('#pass_app').attr('value')[0];
	if(ciphertext.length<1 || pass.length<1){
		alert("You've forgot to fill some fields!");
		hideOverlay();
		return;
	}
	var cleartext = cipherJS.sym.aesDecrypt(ciphertext, pass);
	x$('#output_app').inner(cleartext);
	var height = "innerHeight" in window 
               ? window.innerHeight
               : document.documentElement.offsetHeight; 
	if(height < 400){
		goTo('output_app');
	}else{}
	hideOverlay();
}
