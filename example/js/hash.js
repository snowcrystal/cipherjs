
window.onerror = function(message, file, line){
	var reason = "Looks like a bug in browser, network or application.";
	var todo = "Retry, fill all forms correctly. Contact the admin if problems remain.";
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
	x$('#button_app').click(function(){
		hash();
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

function hash(){
	showOverlay();
	var cleartext = getText('input_app');
	if(cleartext.length<1){
		alert("It seems you haven't entered any text to hash!");
		hideOverlay();
		return;
	}
	var selectHash = document.getElementById('select_hash_app');
	var selectedIndex = selectHash.selectedIndex;
	var sha = selectHash.options[selectedIndex].value;
	var selectEnc = document.getElementById('select_enc_app');
	selectedIndex = selectEnc.selectedIndex;
	var enc = selectEnc.options[selectedIndex].value;
	var hashf;
	if(sha=="sha1"){
		hashf = cipherJS.hash.sha1;
	}else if(sha=="sha256"){
		hashf = cipherJS.hash.sha256;
	}else{
		hashf = cipherJS.hash.sha512;
	}
	var hash = hashf(cleartext, enc);
	x$('#output_app').inner(hash);
	var height = "innerHeight" in window 
               ? window.innerHeight
               : document.documentElement.offsetHeight; 
    if(height < 400){
		goTo('output_app');
	}else{}
	hideOverlay();
}
