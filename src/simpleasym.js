
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
