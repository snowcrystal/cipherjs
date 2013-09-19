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
