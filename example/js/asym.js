
window.onerror = function(message, file, line){
	var reason = "Wrong passwords, broken message- or keyblocks (broken formatting?), decrypting messages not addressed to you, network- and server errors or an application bug.";
	var todo = "Try to enter valid input, maybe retry and if this doesn't work, retry after reloading the page. However, it could be a bug. If you think so, contact the admin.";
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
	if(typeof window.crypto.getRandomValues != "function"){
		/*
		 * if getRandomValues is available, mousemoving is not needed.
		 * The writing "Move your mouse ..." would appear and disappear
		 * extremely quickly while loading the page, confusing users.
		 * So only load it if it is needed and there will be time to
		 * read it.
		 * */
		x$('#entropy_info').inner("Move your mouse (or your finger on your touchpad/ touchscreen) as randomly as possible in this window until you see the navigation page.");
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
	showOneDiv('nav');
	x$('textarea').attr('value', ''); x$('textarea').inner('');
	x$('textarea').click(function(){
		this.focus();
		this.select();
	});
	x$('span.main.asym.backlink').click(function(){
		showOneDiv('nav');
	});
	/*
	 * NAV
	 * */
	x$('#nav_gen').click(function(){
		showOneDiv('generate');
	});
	x$('#nav_enc').click(function(){
		showOneDiv('encrypt');
	});
	x$('#nav_dec').click(function(){
		showOneDiv('decrypt');
	});
	x$('#nav_sig').click(function(){
		showOneDiv('sign');
	});
	x$('#nav_ver').click(function(){
		showOneDiv('verify');
	});
	x$('#nav_enc_sig').click(function(){
		showOneDiv('encryptsign');
	});
	x$('#nav_dec_ver').click(function(){
		showOneDiv('decryptverify');
	});
	x$('#nav_info').click(function(){
		showOneDiv('info');
	});
	/*
	 * GENERATE
	 * */
	x$('#button_generate').click(function(){
		generate();
	});
	/*
	 * ENCRYPT
	 * */
	x$('#button_encrypt').click(function(){
		encrypt();
	});
	/*
	 * DECRYPT
	 * */
	x$('#button_decrypt').click(function(){
		decrypt();
	});
	/*
	 * SIGN
	 * */
	 x$('#button_sign').click(function(){
		 sign();
	 });
	 /*
	  * VERIFY
	  * */
	 x$('#button_verify').click(function(){
		 verify();
	 });
	 /*
	  * ENCRYPTSIGN
	  * */
	 x$('#button_encryptsign').click(function(){
		 encryptSign();
	 });
	 /*
	  * DECRYPTVERIFY
	  * */
	 x$('#button_decryptverify').click(function(){
		 decryptVerify();
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

function generate(){
	var pass1 = x$('#pass_generate1').attr('value')[0]; pass1 = pass1.removeWhitespace();
	var pass2 = x$('#pass_generate2').attr('value')[0]; pass2 = pass2.removeWhitespace();
	if(pass1 != pass2){
		alert("Sorry, passwords do not match!");
		return;
	}
	var pass = pass1;
	if(pass.length<12) alert("Passwords must be at least 12 characters long!");
	var selectGenerate = document.getElementById('select_generate');
	var selectedIndex = selectGenerate.selectedIndex;
	var val = selectGenerate.options[selectedIndex].value;
	var bits = parseInt(val);
	if(bits==512){
		var curve = "brainpoolP512r1";
	}else{
		var curve = "brainpoolP256r1";
	}
	cipherJS.asym.simple.generateKeyset(curve, pass, function(full, pub, carrier){
		x$('#keyset_generate').inner(full);
		x$('#publickeyset_generate').inner(pub);
		hideOverlay();
		goTo("anchor_generate_done");
	}, null);
	showOverlay();
}

function encrypt(){
	var cleartext = getText('cleartext_encrypt');
	cleartext = cipherJS.mask.mask(cleartext);
	var pubkeys = getText('pubkeys_encrypt');
	pubkeys = pubkeys.trim();
	pubkeys = pubkeys.allTrim();
	pubkeys = pubkeys.split('<keyset>');
	if(cleartext.length<1 || pubkeys.length<1){
		alert("It seems you forgot to fill some fields!");
		return;
	}
	var pks = new Array();
	for(var i=0; i<pubkeys.length; i++){
		var pk = pubkeys[i];
		if(pk.removeWhitespace().removeWhitespaceAndLinebreaks() != ""){
			pks.push('<keyset>'+pk);
		}
	}
	cipherJS.asym.simple.encryptMessage(pks, cleartext, function(enc, c){
		x$('#message_encrypt').inner(enc);
		hideOverlay();
		goTo('anchor_encrypt_done');
	}, null);
	showOverlay();
}

function decrypt(){
	var message = getText('message_decrypt');
	message = message.trim();
	var keyset = getText('keyset_decrypt');
	keyset = keyset.trim();
	var pass = x$('#pass_decrypt').attr('value')[0].removeWhitespace();
	if(message.length<1 || keyset.length<1 || pass.length<1){
		alert("It seems you forgot to fill some fields!");
		return;
	}
	cipherJS.asym.simple.decryptMessage(message, keyset, pass, function(dec, c){
		x$('#cleartext_decrypt').inner(cipherJS.mask.unmask(dec));
		hideOverlay();
		goTo('anchor_decrypt_done');
	}, null);
	showOverlay();
}

function sign(){
	var cleartext = getText('cleartext_sign');
	cleartext = cipherJS.mask.mask(cleartext);
	var keyset = getText('keyset_sign');
	keyset = keyset.trim();
	var pass = x$('#pass_sign').attr('value')[0].removeWhitespace();
	if(cleartext.length<1 || keyset.length<1 || pass.length<1){
		alert("It seems you forgot to fill some fields!");
		return;
	}
	cipherJS.asym.simple.signMessage(keyset, pass, cleartext, function(signed, c){
		x$('#message_sign').inner(signed);
		hideOverlay();
		goTo('anchor_sign_done');
	}, null);
	showOverlay();
}

function verify(){
	var message = getText('message_verify').trim();
	var cleartext = message.between('<content>', '</content>');
	var keyset = getText('publickeyset_verify');
	if(message.length<1 || keyset.length<1){
		alert("It seems you forgot to fill some fields!");
		return;
	}
	cipherJS.asym.simple.verifyMessage(keyset, message, function(ver, c){
		x$('#cleartext_verify').inner(cipherJS.mask.unmask(cleartext));
		x$('#verified_verify').attr('value', ver);
		hideOverlay();
		goTo('anchor_verify_done');
	}, null);
	showOverlay();
}

function encryptSign(){
	var cleartext = getText('cleartext_encryptsign');
	cleartext = cipherJS.mask.mask(cleartext);
	var pubkeys = getText('pubkeys_encryptsign');
	pubkeys = pubkeys.trim();
	pubkeys = pubkeys.allTrim();
	pubkeys = pubkeys.split('<keyset>');
	var pks = new Array();
	for(var i=0; i<pubkeys.length; i++){
		var pk = pubkeys[i];
		if(pk.removeWhitespace().removeWhitespaceAndLinebreaks() != ""){
			pks.push('<keyset>'+pk);
		}
	}
	var keyset = getText('keyset_encryptsign').trim();
	var pass = x$('#pass_encryptsign').attr('value')[0].removeWhitespace();
	if(cleartext.length<1 || pubkeys.length<1 || keyset.length<1 || pass.length<1){
		alert("It seems you forgot to fill some fields!");
		return;
	}
	cipherJS.asym.simple.encryptAndSignMessage(pks, keyset, pass, cleartext, function(enc, c){
		x$('#message_encryptsign').inner(enc);
		hideOverlay();
		goTo('anchor_encryptsign_done');
	}, null);
	showOverlay();
}

function decryptVerify(){
	var pks = getText('publickeyset_decryptverify');
	var ks = getText('keyset_decryptverify');
	var pass = x$('#pass_decryptverify').attr('value')[0].removeWhitespace();
	var msg = getText('message_decryptverify');
	if(pks.length<1 || ks.length<1 || pass.length<1 || msg.length<1){
		alert("It seems you forgot to fill some fields!");
		return;
	}
	cipherJS.asym.simple.decryptAndVerifyMessage(msg, ks, pass, pks, function(dec, c){
		var ver = dec.verified;
		var cltxt = cipherJS.mask.unmask(dec.cleartext);
		x$('#cleartext_decryptverify').inner(cltxt);
		x$('#verified_decryptverify').attr('value', ver);
		hideOverlay();
		goTo('anchor_decryptverify_done');
	}, null);
	showOverlay();
}
