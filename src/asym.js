
function cipherjs_asym(){

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

//---START-GENERATING-KEYS----------------------------------------------

/**
* Generate a set of keys for encryption and signing. You'll receive a 
* full keyset (treat it like you treat a PGP private key) and a public
* keyset (treat it like you treat a PGP public key).
* ---------------------------------------------------------------------
* ECC works somewhat different compared to RSA. It is best, most secure,
* not to have one keypair (2 keys) but two keypairs (4 keys) for a user.
* One keypair is used exclusively for encryption purposes (i.e. for
* key agreement via elGamal), while the other one will only be used for
* signing purposes (ECDSA).
* cipherJS generates the two keypairs on a certain curve, and 
* encrypts each of the two private keys symmetrically using @pass. All
* keys are serialized. This makes them pretty portable.
* Key generation does happen asynchronously, so it should not hit
* browser limits.
* ---------------------------------------------------------------------
* @param   {String}    curve       Elliptic curve the points representing
*                                  the keys will be on.
*                                  There are several standards for ECC
*                                  parameters. One of the most strict and
*                                  secure is the brainpool standard. If you
*                                  are not sure what to use, choose 
*                                  "brainpoolP256r1", "brainpoolP512r1"
*                                  or one between the two (320 or 384). 
*                                  At the moment, cipherJS only supports the
*                                  brainpool standard, as there are a lot
*                                  of rumors about several other standards.
*                                  If rumors about "cooked" parameters and
*                                  such should prove wrong, cipherJS will
*                                  add some more curve parameters.
*                                  At the moment you can choose from the
*                                  following:
*                                  "brainpoolP160r1"
*                                  "brainpoolP192r1"
*                                  "brainpoolP224r1"
*                                  "brainpoolP256r1"
*                                  "brainpoolP320r1"
*                                  "brainpoolP384r1"
*                                  "brainpoolP512r1"
*  
*                                  A small comparison of the security level
*                                  ECC and RSA keys of a certain bitlength
*                                  are assumed to provide may show you which
*                                  curve is the right one for your purposes.
*                                  
*                                  Security Level / Bitlength
*                                    ECC     |  RSA     | AES (symmetric)
*                                  --------------------------------------
*                                    160        1024       -
*                                    192        1536       -
*                                    224        2048       -
*                                    256        3072       128
*                                    320        4096       -
*                                    384        7680       192
*                                    512        15360      256
*                                
*                                 Working with ECC keys with a 512 bit keysize
*                                 is still extremely performant. Choose this
*                                 if possible, and 256, 320 or 384 if encryption
*                                 needs to be super fast or work on more-than-just-
*                                 weak devices.
*                                
* 
* @param   {String}    pass       Password to symmetrically encrypt secret
*                                 key strings with.
* 
* @carries {Object}    carrier    
* 
* @calls   {Function}  callback   function(Object full, Object public, Object carrier)
*                                          full  :   Object encryption 
*                                                       encryption:   String pub
*                                                                     String priv
*                                                    Object signing
*                                                       signing:      String pub
*                                                                     String priv
*                                          public:   Object encryption
*                                                                     String pub
*                                                    Object signing   
*                                                                     String pub
* */
this.generateKeys = function(curve, pass, callback, carrier){
	ecHandler.keys.generateKeypairAsync(curve, function(keys, c){
		keys.priv = cipherJS.asym.symEncrypt(keys.priv, c.pass);
		c.keys_enc = keys;
		var fn = function(){
			ecHandler.keys.generateKeypairAsync(c.curve, function(keys, c){
				keys.priv = cipherJS.asym.symEncrypt(keys.priv, c.pass);
				var keys_enc = c.keys_enc;
				var keys_sign = keys;
				var id = cipherJS.hash.sha256((keys_enc.pub+keys_sign.pub), "hex");
				var full = {"id": id, "encryption": keys_enc, "signing": keys_sign };
				var pub_ks = {"id": id, "encryption": {"pub": keys_enc.pub}, "signing": {"pub": keys_sign.pub}};
				var cbfn = function(){
					c.callback(full, pub_ks, c.outercarrier);
				};
				setTimeout(cbfn, cipherJS.asym.asyncTimeout);
			}, c);
		};
		setTimeout(fn, cipherJS.asym.asyncTimeout);
	}, {"callback": callback, "outercarrier": carrier, "curve": curve, "pass": pass}); 
};

//---END-GENERATING-KEYS------------------------------------------------

//---START-ENCRYPT-STRING-----------------------------------------------

/**
 * Encrypt a cleartext using the receivers' public keys. 
 * ---------------------------------------------------------------------
 * For each public key, a symmetric key is derived which can only be 
 * recovered using the corresponding private key, i.e. using the 
 * receiver's private key.
 * A random key is created, and the cleartext is symmetrically encrypted
 * using it.
 * The random key is encrypted with each of the public keys, and each of
 * these encrypted keys will be appended to the message.
 * A receiver now can now recover their symmetric key using their private
 * key, decrypt their encrypted version of the random key and use this
 * to decrypt the encrypted text.
 * That way, only the owner of corresponding private keys to one of the
 * public keys will be able to read the message.
 * cipherJS uses elGamal for derivation of private keys, adapting SJCL's
 * implementation.
 * ---------------------------------------------------------------------
 * @param   {Array<Object>}   public_keys   Array of public key objects
 * @param   {String}          cleartext     Cleartext to encrypt
 * @param   {String}          symkey        Optional symmetric key, so the
 *                                          receivers can still decrypt
 *                                          using their private key, but 
 *                                          whoever already knows the @symkey
 *                                          can decrypt calling
 *                                          cipherJS.asym.symDecryptAsync(msg.between("<content>", "</content>"), symkey, callback, carrier)
 *                                          Just don't provide it if all
 *                                          receivers will decrypt with their
 *                                          private keys, it is not necessary then.
 * @carries {Object}          carrier
 * @calls   {Function}        callback      function(Object enc, Object carrier)
 *                                              enc:
 *                                                 Array enckeys
 *                                                    Object enckey:
 *                                                       String enckey  (encrypted random key)
 *                                                       String keytag  (tag needed to recover 
 *                                                                       the symmetric key
 *                                                                       using the private key)
 *                                                       String keyhash (hash of the public key,
 *                                                                       so the owner of the 
 *                                                                       private key can more easily
 *                                                                       find out which enckey is
 *                                                                       "theirs")
 *                                                  String ciphertext
 * */
this.encryptString = function(public_keys, cleartext, callback, carrier, symkey){
	var len = public_keys.length; var i = 0;
	
	var randkey = "";
	if(typeof symkey == "string" || typeof symkey == "String"){
		randkey = symkey;
	}else{
		randkey = cipherJS.asym.randomKeyString();
	}
	
	var enckeys = new Array();
	carrier = {"callback": callback, "outercarrier": carrier, "cleartext": cleartext,
	           "pks": public_keys, "len": len, "i": i, "randkey": randkey, "eks": enckeys};
	setTimeout(function(){
		cipherJS.asym.encryptStringLoop(carrier);
	}, cipherJS.asym.asyncTimeout);
};
this.encryptStringLoop = function(carrier){
	if(carrier.i < carrier.len){
		var pk = carrier.pks[carrier.i];
		var pk_enc = pk.encryption.pub;
		ecHandler.elgamal.kemAsync(pk_enc, function(symkeyobj, carrier){
			var key = sjcl.codec.hex.fromBits(symkeyobj.key);
			var tag = symkeyobj.tag;
			var enckey = cipherJS.asym.symEncrypt(carrier.randkey, key);
			var keyhash = cipherJS.asym.hashPublicKey(carrier.pks[carrier.i].encryption.pub);
			enckey = {"enckey": enckey, "keytag": tag, "keyhash": keyhash};
			carrier.eks.push(enckey);
			carrier.i += 1;
			setTimeout(function(){
				cipherJS.asym.encryptStringLoop(carrier);
			}, cipherJS.asym.asyncTimeout);
		}, carrier);
	}else{
		cipherJS.asym.symEncryptAsync(carrier.cleartext, carrier.randkey, function(ciphertext, carrier){
			var msg = {"enckeys": carrier.eks, "ciphertext": ciphertext};
			var cbfn = function(){
				carrier.callback(msg, carrier.outercarrier);
			};
			setTimeout(cbfn, cipherJS.asym.asyncTimeout);
		}, carrier);
	}
};
//---END-ENCRYPT-STRING-------------------------------------------------

//---START-DECRYPT-STRING-----------------------------------------------

/**
 * Decrypt a message using the receiver's (full) keyset.
 * ---------------------------------------------------------------------
 * The receivers public encryption key is hashed and it is checked which
 * object in msg.enckeys contains the cipherkey to decrypt. Using the
 * keytag and the receiver's private key, the symmetric key is recovered
 * and the encrypted key is decrypted. This decrypted symmetric key is
 * used to decrypt the ciphertext.
 * ---------------------------------------------------------------------
 * @param   {Object}   msg           Message object such as found in the
 *                                   output of cipherJS.asym.encryptString.
 * @param   {Object}   recv_keyset   Receiver's full keyset
 * @param   {String}   pass          Password for @recv_keyset
 * @carries {Object}   carrier
 * @calls   {Function} callback      function(String cleartext, Object carrier)
 *                                     (cleartext will be null if the message
 *                                      was not adressed to the owner of 
 *                                      @recv_keyset, or if you passed a wrong
 *                                      @pass)
 * */
this.decryptString = function(msg, recv_keyset, pass, callback, carrier){
	try{
		recv_keyset.encryption.priv = cipherJS.asym.symDecrypt(recv_keyset.encryption.priv, pass);
	}catch(e){
		callback(null, carrier);
	}
	var eks = msg.enckeys; var i = 0; var len = eks.length; var found = false;
	var keyhash = cipherJS.asym.hashPublicKey(recv_keyset.encryption.pub);
	var keytag = ""; var enckey = "";
	for(i=0; i<len; i++){
		var cur_keyhash = eks[i].keyhash;
		if(keyhash == cur_keyhash){
			keytag = eks[i].keytag;
			enckey = eks[i].enckey;
			found = true;
			break;
		}
	}
	if(found){
		var carrier = {"callback": callback, "outercarrier": carrier, 
		               "msg": msg, "enckey": enckey, "keyhash": keyhash};
		ecHandler.elgamal.unkemAsync(recv_keyset.encryption.priv, keytag, function(key, carrier){
			key = sjcl.codec.hex.fromBits(key);
			var dec_key = cipherJS.asym.symDecrypt(carrier.enckey, key);
			cipherJS.asym.symDecryptAsync(msg.ciphertext, dec_key, function(cleartext, carrier){
				var cbfn = function(){
					carrier.callback(cleartext, carrier.outercarrier);
				};
				setTimeout(cbfn, cipherJS.asym.asyncTimeout);
			}, carrier);
		}, carrier);
	}else{
		callback(null, carrier);
	}
};

//---END-DECRYPT-STRING-------------------------------------------------

//---START-SIGN-STRING--------------------------------------------------
/**
 * Sign a cleartext message with using the senders full keyset. 
 * ---------------------------------------------------------------------
 * Using ECDSA, a signature unique to the cleartext and the senders 
 * private signing key will be created. This signature can be verified 
 * with the corresponding public signing key.
 * ---------------------------------------------------------------------
 * @param   {Object}   sender_keyset   Sender's full keyset
 * @param   {String}   pass            Password for @sender_keyset
 * @param   {String}   cleartext       Cleartext to sign
 * @carries {Object}   carrier
 * @calls   {Function} callback        function(Object signed, Object carrier)
 *                                        signed:
 *                                           String signature
 *                                           String cleartext
 * */
this.signString = function(sender_keyset, pass, cleartext, callback, carrier){
	try{
		sender_keyset.signing.priv = cipherJS.asym.symDecrypt(sender_keyset.signing.priv, pass);
	}catch(e){
		/*console.log(e);
		console.log(e.stack);*/
		callback(null, carrier);
	}
	carrier = {"callback": callback, "outercarrier": carrier, "cleartext": cleartext };
	var hash = cipherJS.asym.hashMessage(cleartext);
	ecHandler.ecdsa.signAsync(hash, sender_keyset.signing.priv, function(sig, carrier){
		sig = sjcl.codec.base64.fromBits(sig);
		var cbfn = function(){
			carrier.callback({"cleartext": carrier.cleartext, "signature": sig }, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier);
};
//---END-SIGN-STRING----------------------------------------------------

//---START-VERIFY-SIGNATURE---------------------------------------------
/**
 * Verify a signature for a cleartext using the sender's public keyset.
 * ---------------------------------------------------------------------
 * A hash of the cleartext is used to verify whether the signature 
 * actually was created with the private signing key corresponding to the
 * public signing key present in the sender's public keyset.
 * ---------------------------------------------------------------------
 * @param   {Object}   sender_keyset   Sender's public keyset
 * @param   {String}   cleartext       Cleartext @signature was created with
 * @param   {String}   signature       Signature to verify
 * @carries {Object}   carrier
 * @calls   {Function} callback        function(Boolean verified, Object carrier)
 * */
this.verifySignature = function(sender_keyset, cleartext, signature, callback, carrier){
	carrier = {"callback": callback, "outercarrier": carrier};
	var hash = cipherJS.asym.hashMessage(cleartext);
	signature = sjcl.codec.base64.toBits(signature);
	ecHandler.ecdsa.verifyAsync(hash, signature, sender_keyset.signing.pub, function(ver, carrier){
		var cbfn = function(){
			carrier.callback(ver, carrier.outercarrier);
		};
		setTimeout(cbfn, cipherJS.asym.asyncTimeout);
	}, carrier);
};
//---END-VERIFY-SIGNATURE-----------------------------------------------

//---START-ENCRYPT-AND-SIGN-STRING--------------------------------------
/**
 * Encrypt a string using the receivers' public keysets, and sign it 
 * using the sender' full keysets.
 * ---------------------------------------------------------------------
 * The message is first signed using cipherJS.asym.signString and then
 * encrypted using cipherJS.asym.encryptString.
 * ---------------------------------------------------------------------
 * @param   {Array<Object>}   recv_keysets   Receivers' public keysets
 * @param   {String}          sender_keyset  Sender's full keyset
 * @param   {String}          pass           Password for @sender_keyset
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
 * @calls   {Function}        callback       function(Object enc, Object carrier)
 *                                              enc:
 *                                                 Array enckeys
 *                                                    Object enckey:
 *                                                       String enckey  (encrypted random key)
 *                                                       String keytag  (tag needed to recover 
 *                                                                       the symmetric key
 *                                                                       using the private key)
 *                                                       String keyhash (hash of the public key,
 *                                                                       so the owner of the 
 *                                                                       private key can more easily
 *                                                                       find out which enckey is
 *                                                                       "theirs")
 *                                                  String ciphertext
 *                                                  String signature
 * */
this.encryptAndSignString = function(recv_keysets, sender_keyset, pass, cleartext, callback, carrier, symkey){
	carrier = { "callback": callback, "outercarrier": carrier, 
	            "cleartext": cleartext, "recv_keysets": recv_keysets };
	carrier.symkey = symkey;
	cipherJS.asym.signString(sender_keyset, pass, cleartext, function(signed, carrier){
		carrier.signature = signed.signature;
		cipherJS.asym.encryptString(carrier.recv_keysets, carrier.cleartext, function(enc, carrier){
			enc.signature = carrier.signature;
			var cbfn = function(){
				carrier.callback(enc, carrier.outercarrier);
			};
			setTimeout(cbfn, cipherJS.asym.asyncTimeout);
		}, carrier, carrier.symkey);
	}, carrier);
};
//---END-ENCRYPT-AND-SIGN-STRING----------------------------------------

//---START-DECRYPT-AND-VERIFY-STRING------------------------------------
/**
 * Decrypt a message using the receiver's full keyset and the sender's
 * public keyset.
 * ---------------------------------------------------------------------
 * First the message is decrypted using cipherJS.asym.decryptString, 
 * and then verified using cipherJS.asym.verifySignature.
 * ---------------------------------------------------------------------
 * @param   {Object}   enc             Encrypted and signed message object
 * @param   {Object}   recv_keyset     Receiver's full keyset
 * @param   {String}   pass            Pass for @recv_keyset
 * @param   {Object}   sender_keyset   Sender's full keyset
 * @carries {Object}   carrier
 * @calls   {Function} callback        function(Object dec, Object carrier)
 *                                        dec:
 *                                           String  cleartext
 *                                           Boolean verified
 * */
this.decryptAndVerify = function(enc, recv_keyset, pass, sender_keyset, callback, carrier){
	carrier = {"callback": callback, "outercarrier": carrier, 
	           "sender_keyset": sender_keyset, "signature": enc.signature };
	cipherJS.asym.decryptString(enc, recv_keyset, pass, function(cleartext, carrier){
		if(cleartext!==null){
			carrier.cleartext = cleartext;
			cipherJS.asym.verifySignature(carrier.sender_keyset, cleartext, carrier.signature, function(ver, carrier){
				var cbfn = function(){
					carrier.callback({"cleartext": carrier.cleartext, "verified": ver}, carrier.outercarrier);
				};
				setTimeout(cbfn, cipherJS.asym.asyncTimeout);
			}, carrier);
		}else{
			var cbfn = function(){
				carrier.callback(null, carrier.outercarrier);
			};
			setTimeout(cbfn, cipherJS.asym.asyncTimeout);
		}
	}, carrier);
};
//---END-DECRYPT-AND-VERIFY-STRING--------------------------------------

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
	var algorithm = cipherJS.asym.symmetricAlgorithm; 
	var enc = cipherJS.sym.encrypt(data, pass, algorithm);
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
};
//---END-HASH-PUBLIC-KEY------------------------------------------------

//---START-HASH-MESSAGE-------------------------------------------------
this.hashMessage = function(msg){
	var hash;
	hash = sjcl.hash.sha512.hash(msg);
	hash = sjcl.hash.sha256.hash(msg);
	//hash = sjcl.codec.hex.fromBits(hash);
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
cipherJS.asym = new cipherjs_asym();
