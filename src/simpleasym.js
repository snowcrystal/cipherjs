
function cipherjs_asym_simple(){

this.version = "0.0.2";

/**
 * Generate a full keyset and a public keyset for a user. In ECC, it is
 * more secure to have two keypairs - one only for signing, and one only
 * for encryption - per user. cipherJS generates two keypairs, and packs
 * all the keys (private and public for each keypair) in the full keyset,
 * and the two public keys only in the public keyset.
 * Treat the full keyset like a "private key" (as you know it from for
 * example PGP) and the public keyset like a "public key". 
 * Private keys are strongly symmetrically encrypted using @pass, however,
 * you should still be careful if storing them on servers. It is most 
 * safe never to publish a private key, and this is true for cipherJS'
 * full keysets as well.
 * Instead of a keysize (like 256 bit, or 512 bit or such) you can specify
 * a curvename here. This is because all ECC keys in fact represent points
 * on an elliptic curve. There are standards for these curves. For example,
 * the curve named "brainpoolP512r" represents a curve defined by the 
 * brainpool standard, with a bitlength of 512 bit (this means: the 
 * coordinates x and y which specify a point on the curve are 512 bit 
 * numbers - extremely large integer numbers). 
 * cipherJS at the moment only supports the brainpool standard, as several
 * other standards have been criticized pretty often and cipherJS will 
 * only use them when rumors about "cooked parameters" (there are "weak"
 * curves, where there is a mathematical trick to find out private keys from
 * public keys) are *proven* wrong.
 * ---------------------------------------------------------------------
 * @param   {String}   curve      Name of the curve the keys will be on.
 *                                The number (160, 192, 224, 256, 320,
 *                                384, 512) is the bitlength.
 *                                Available:
 *                                "brainpoolP160r1"
 *                                "brainpoolP192r1"
 *                                "brainpoolP224r1"
 *                                "brainpoolP256r1"
 *                                "brainpoolP320r1"
 *                                "brainpoolP384r1"
 *                                "brainpoolP512r1"
 *                                ECC keys provide higher security at 
 *                                small keylength compared to RSA. Here's
 *                                a comparison of the estimated security
 *                                by key size:
 *                                ECC   |   RSA   |   AES (symmetric, for comparison)
 *                                160      1024        -
 *                                192      1536        -
 *                                224      2048        -
 *                                256      3072        128
 *                                320      4096        -
 *                                384      7680        192
 *                                512      15360       256
 *                                As ECC is extremely performant, you should be able
 *                                to choose at least 256 bit keys. 512 is best and 
 *                                a reasonable default for most applications.
 * @param   {String}   pass       Password to encrypt the private keys with
 * @carries {Object}   carrier
 * @calls   {Function} callback   function(String full_keyset, String public_keyset, Object carrier)
 * 
 * 
 * 
 * */
this.generateKeyset = function(curve, pass, callback, carrier){
	carrier = {"callback": callback, "outercarrier": carrier};
	cipherJS.asym.generateKeys(curve, pass, function(full, pub, carrier){
		full = cipherJS.asym.simple.stringifyKeyset(full);
		pub = cipherJS.asym.simple.stringifyKeyset(pub);
        var cbfn = function(){
			carrier.callback(full, pub, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier);
};

/**
 * Encrypt a message using the receivers' public keyset.
 * ---------------------------------------------------------------------
 * @param   {Array<String>}   recv_keysets   Array of receiver keysets
 * @param   {String}          cleartext      Cleartext to encrypt
 * @param   {String}          symkey         Optional symmetric key, so the
 *                                           receivers can still decrypt
 *                                           using their private key, but 
 *                                           whoever already knows the @symkey
 *                                           can decrypt calling
 *                                           cipherJS.asym.symDecryptAsync(msg.between("<content>", "</content>"), symkey, callback, carrier)
 *                                           Just don't provide it if all
 *                                           receivers will decrypt with their
 *                                           private keys, it is not necessary then.
 * @carries {Object}          carrier
 * @calls   {Function}        callback       function(String message, Object carrier)
 * */
this.encryptMessage = function(recv_keysets, cleartext, callback, carrier, symkey){
	carrier = {"callback": callback, "outercarrier": carrier};
	var len = recv_keysets.length;
	for(var i=0; i<len; i++){
		recv_keysets[i] = cipherJS.asym.simple.parseKeyset(recv_keysets[i]);
	}
	cipherJS.asym.encryptString(recv_keysets, cleartext, function(msg, carrier){
		msg = cipherJS.asym.simple.stringifyMessage(msg);
		var cbfn = function(){
			carrier.callback(msg, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier, symkey);
};

/**
 * Decrypt a message using the receiver's full keyset.
 * ---------------------------------------------------------------------
 * @param   {String}   msg           Message to decrypt
 * @param   {String}   recv_keyset   Receiver's full keyset
 * @param   {String}   pass          Password for @recv_keyset
 * @carries {Object}   carrier
 * @calls   {Function} callback      function(String cleartext, Object carrier)
 * */
this.decryptMessage = function(msg, recv_keyset, pass, callback, carrier){
	carrier = {"callback": callback, "outercarrier": carrier};
	msg = cipherJS.asym.simple.parseMessage(msg);
	recv_keyset = cipherJS.asym.simple.parseKeyset(recv_keyset);
	cipherJS.asym.decryptString(msg, recv_keyset, pass, function(cleartext, carrier){
		var cbfn = function(){
			carrier.callback(cleartext, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier);
};

/**
 * Sign a message using the sender's full keyset. 
 * ---------------------------------------------------------------------
 * @param   {String}   sender_keyset   Sender's full keyset
 * @param   {String}   pass            Password for @sender_keyset
 * @param   {String}   cleartext       Message text to sign
 * @carries {Object}   carrier
 * @calls   {Function} callback        function(String signed_message, Object carrier)
 * */
this.signMessage = function(sender_keyset, pass, cleartext, callback, carrier){
	carrier = {"callback": callback, "outercarrier": carrier};
	sender_keyset = cipherJS.asym.simple.parseKeyset(sender_keyset);
	cipherJS.asym.signString(sender_keyset, pass, cleartext, function(signed, carrier){
		signed = cipherJS.asym.simple.stringifyMessage(signed);
		var cbfn = function(){
			carrier.callback(signed, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier);
};

/**
 * Verify a message using the sender's public keyset.
 * ---------------------------------------------------------------------
 * @param   {String}   sender_keyset   Sender's public keyset
 * @param   {String}   msg             Signed message
 * @carries {Object}   carrier
 * @calls   {Function} callback        function(Boolean verified, Object carrier)
 * */
this.verifyMessage = function(sender_keyset, msg, callback, carrier){
	carrier = {"callback": callback, "outercarrier": carrier};
	sender_keyset = cipherJS.asym.simple.parseKeyset(sender_keyset);
	msg = cipherJS.asym.simple.parseMessage(msg);
	cipherJS.asym.verifySignature(sender_keyset, msg.cleartext, msg.signature, function(ver, carrier){
		var cbfn = function(){
			carrier.callback(ver, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier);
};

/**
 * Encrypt a message using the receivers' public keyset. Sign with the
 * sender's full keyset.
 * ---------------------------------------------------------------------
 * @param   {Array<String>}   recv_keysets    Array of receiver keysets
 * @param   {String}          sender_keyset   Sender's full keyset
 * @param   {String}          pass            Password for @sender_keyset
 * @param   {String}          cleartext       Cleartext to encrypt
 * @param   {String}          symkey          Optional symmetric key, so the
 *                                            receivers can still decrypt
 *                                            using their private key, but 
 *                                            whoever already knows the @symkey
 *                                            can decrypt calling
 *                                            cipherJS.asym.symDecryptAsync(msg.between("<content>", "</content>"), symkey, callback, carrier)
 *                                            Just don't provide it if all
 *                                            receivers will decrypt with their
 *                                            private keys, it is not necessary then.
 * @carries {Object}          carrier
 * @calls   {Function}        callback        function(String message, Object carrier)
 * */
this.encryptAndSignMessage = function(recv_keysets, sender_keyset, pass, cleartext, callback, carrier, symkey){
	carrier = {"callback": callback, "outercarrier": carrier};
	var len = recv_keysets.length;
	for(var i=0; i<len; i++){
		recv_keysets[i] = cipherJS.asym.simple.parseKeyset(recv_keysets[i]);
	}
	sender_keyset = cipherJS.asym.simple.parseKeyset(sender_keyset);
	cipherJS.asym.encryptAndSignString(recv_keysets, sender_keyset, pass, cleartext, function(enc, carrier){
		enc = cipherJS.asym.simple.stringifyMessage(enc);
		var cbfn = function(){
			carrier.callback(enc, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier, symkey);
};

/**
 * Decrypt a message using the receiver's full keyset. Verify using the
 * sender's public keyset.
 * ---------------------------------------------------------------------
 * @param   {String}   msg             Message to decrypt
 * @param   {String}   recv_keyset     Receiver's full keyset
 * @param   {String}   pass            Password for @recv_keyset
 * @param   {String}   sender_keyset   Sender's full keyset
 * @carries {Object}   carrier
 * @calls   {Function} callback        function(String cleartext, Object carrier)
 * */
this.decryptAndVerifyMessage = function(msg, recv_keyset, pass, sender_keyset, callback, carrier){
	carrier = {"callback": callback, "outercarrier": carrier};
	msg = cipherJS.asym.simple.parseMessage(msg);
	recv_keyset = cipherJS.asym.simple.parseKeyset(recv_keyset);
	sender_keyset = cipherJS.asym.simple.parseKeyset(sender_keyset);
	cipherJS.asym.decryptAndVerify(msg, recv_keyset, pass, sender_keyset, function(dec, carrier){
		var cbfn = function(){
			carrier.callback(dec, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier);
};

/**
* This function takes a keyset (full or public only) and generates its
* ID. 
* ---------------------------------------------------------------------
* A keysets' ID, the SHA256-hash of the signing and encryption public 
* key, can be used to check in a more human readable form if a keyset
* has changed. If the ID stays the same, the keys are the same.
* ---------------------------------------------------------------------
* @param   {String}   keyset   XML string, representing a keyset (full
*                              or public only)
* @return  {String}   id       Hex string, representing the ID of the
*                              keyset.
*                              Returns null if the ID found in the @keyset
*                              doesn't belong to the public keys.
* */
this.printId = function(keyset){
	var old_id = keyset.between("<id>", "</id>");
	var enc_pub = (keyset.between("<encryption>", "</encryption>")).between("<pub>", "</pub>");
	var sig_pub = (keyset.between("<signing>", "</signing>")).between("<pub>", "</pub>");
	var id = cipherJS.hash.sha256((enc_pub+sig_pub), "hex");
	if(id!==old_id){
		id = cipherJS.hash.sha256((enc_pub+sig_pub), "hex");
		if(id!==old_id){
			id = cipherJS.hash.sha256((enc_pub+sig_pub), "hex");
			if(id!==old_id){
				return null;
			}
		}
	}
	return id;
};

this.stringifyMessage = function(msg){
	var message = "<message>"+
					"<version>"+cipherJS.asym.simple.version+"</version>";
	var is_signed = (typeof msg.signature != "undefined" && typeof msg.cleartext != "undefined");
	var is_encrypted = (typeof msg.ciphertext != "undefined" && typeof msg.signature == "undefined");
	var is_encrypted_and_signed = (typeof msg.ciphertext != "undefined" && typeof msg.signature != "undefined");
	if(is_signed){
		message += "<type>signed</type>";
		message += "<content>"+msg.cleartext+"</content>";
		message += "<signature>"+msg.signature+"</signature>";
	}else if(is_encrypted){
		message += "<type>encrypted</type>";
		message += cipherJS.asym.simple.stringifyEnckeys(msg.enckeys);
		message += "<content>"+msg.ciphertext+"</content>";
	}else if(is_encrypted_and_signed){
		message += "<type>encrypted,signed</type>";
		message += cipherJS.asym.simple.stringifyEnckeys(msg.enckeys);
		message += "<content>"+msg.ciphertext+"</content>";
		message += "<signature>"+msg.signature+"</signature>";
	}else{
	}
	message += "</message>";
	return message;
};

this.parseMessage = function(msg){
	var message = new Object();
	var msgtype = msg.between("<type>", "</type>");
	if(msgtype=="signed"){
		var cleartext = msg.between("<content>", "</content>");
		var signature = msg.between("<signature>", "</signature>");
		message.cleartext = cleartext;
		message.signature = signature;
	}else if(msgtype=="encrypted"){
		var ciphertext = msg.between("<content>", "</content>");
		var enckeys = cipherJS.asym.simple.parseEnckeys(msg.between("<enckeys>", "</enckeys>"));
		message.ciphertext = ciphertext;
		message.enckeys = enckeys;
	}else if(msgtype=="encrypted,signed"){
		var ciphertext = msg.between("<content>", "</content>");
		var enckeys = cipherJS.asym.simple.parseEnckeys(msg.between("<enckeys>", "</enckeys>"));
		message.ciphertext = ciphertext;
		message.enckeys = enckeys;
		var signature = msg.between("<signature>", "</signature>");
		message.signature = signature;
	}else{
	}
	return message;
};

this.stringifyKeyset = function(ks){
	var is_public_keyset = (typeof ks.encryption.priv == "undefined");
	if(is_public_keyset){
		// is public keyset
		var ks_enc_pub = ks.encryption.pub;
		var ks_sig_pub = ks.signing.pub;
		var old_id = ks.id;
		var id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
		if(old_id!==id){
			id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
			if(old_id!==id){
				id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
				if(old_id!==id){
					 return null; //FISH!!!!
				}
			}
		}
		var keyset = "<keyset>"+
					 "<version>"+cipherJS.asym.simple.version+"</version>"+
					 "<type>public</type>"+
					 "<id>"+id+"</id>"+
					 "<encryption>"+
						"<pub>"+ks_enc_pub+"</pub>"+
					 "</encryption>"+
					 "<signing>"+
						"<pub>"+ks_sig_pub+"</pub>"+
					 "</signing>"+
					 "</keyset>";
		return keyset;
	}else{
		// is full keyset
		var ks_enc_pub = ks.encryption.pub;
		var ks_enc_priv = ks.encryption.priv;
		var ks_sig_pub = ks.signing.pub;
		var ks_sig_priv = ks.signing.priv;
		var old_id = ks.id;
		var id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
		if(old_id!==id){
			id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
			if(old_id!==id){
				id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
				if(old_id!==id){
					 return null; //FISH!!!!
				}
			}
		}
		var keyset = "<keyset>"+
					 "<version>"+cipherJS.asym.simple.version+"</version>"+
					 "<type>full</type>"+
					 "<id>"+id+"</id>"+
					 "<encryption>"+
						"<pub>"+ks_enc_pub+"</pub>"+
						"<priv>"+ks_enc_priv+"</priv>"+
					 "</encryption>"+
					 "<signing>"+
						"<pub>"+ks_sig_pub+"</pub>"+
						"<priv>"+ks_sig_priv+"</priv>"+
					 "</signing>"+
					 "</keyset>";
	   return keyset;
	}
};

this.parseKeyset = function(ks){
	var type = ks.between("<type>", "</type>").trim();
	var old_id = ks.between("<id>", "</id>").trim();
	if(type=="full"){
		// full keyset
		var ks_enc = ks.between("<encryption>", "</encryption>");
		var ks_sig = ks.between("<signing>", "</signing>");
		var ks_enc_pub = ks_enc.between("<pub>", "</pub>");
		var ks_enc_priv = ks_enc.between("<priv>", "</priv>");
		var ks_sig_pub = ks_sig.between("<pub>", "</pub>");
		var ks_sig_priv = ks_sig.between("<priv>", "</priv>");
		var id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
		if(old_id!==id){
			id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
			if(old_id!==id){
				id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
				if(old_id!==id){
					 return null; //FISH!!!!
				}
			}
		}
		var keyset = {"id": id, "encryption": {"pub": ks_enc_pub, "priv": ks_enc_priv}, 
		              "signing": {"pub": ks_sig_pub, "priv": ks_sig_priv} };
		return keyset;
	}else{
		// public keyset
		var ks_enc = ks.between("<encryption>", "</encryption>");
		var ks_sig = ks.between("<signing>", "</signing>");
		var ks_enc_pub = ks_enc.between("<pub>", "</pub>");
		var ks_sig_pub = ks_sig.between("<pub>", "</pub>");
		var id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
		if(old_id!==id){
			id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
			if(old_id!==id){
				id = cipherJS.hash.sha256((ks_enc_pub+ks_sig_pub), "hex");
				if(old_id!==id){
					 return null; //FISH!!!!
				}
			}
		}
		var keyset = {"id": id, "encryption": {"pub": ks_enc_pub }, 
		              "signing": {"pub": ks_sig_pub } };
		return keyset;
	}
};

this.stringifyEnckeys = function(eks){
	var ek_len = eks.length;
	var enckeys = "<enckeys>";
	for(var i=0; i<ek_len; i++){
		var ek = eks[i];
		enckeys += '<enckey id="'+i+'>';
		enckeys += "<keyhash>"+ek.keyhash+"</keyhash>";
		enckeys += "<keytag>"+ek.keytag+"</keytag>";
		enckeys += "<enckeystr>"+ek.enckey+"</enckeystr>";
		enckeys += "</enckey>";
	}
	enckeys += "</enckeys>";
	return enckeys;
};

this.parseEnckeys = function(ekstr){
	var enckeys = new Array();
	var i = 0;
	var cur_ek = ekstr.between(('<enckey id="'+i+'>'), '</enckey>');
	while(typeof cur_ek == "string" || typeof cur_ek == "String"){
		
		var keyhash = cur_ek.between("<keyhash>", "</keyhash>");
		var keytag = cur_ek.between("<keytag>", "</keytag>");
		var enckey = cur_ek.between("<enckeystr>", "</enckeystr>");
		var ek = {"keyhash": keyhash, "keytag": keytag, "enckey": enckey};
		enckeys.push(ek);
		
		i += 1;
		cur_ek = ekstr.between(('<enckey id="'+i+'>'), '</enckey>');
	}
	return enckeys;
};

}
cipherJS.asym.simple = new cipherjs_asym_simple();
