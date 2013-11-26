
// util.js are adapted from 
// bitcoinjs-lib (github.com/bitcoinjs/bitcoinjs)
// https://raw.github.com/bitcoinjs/bitcoinjs-lib/master/src/util.js
// with the util_bytesToHex from 
// https://raw.github.com/bitcoinjs/bitcoinjs-lib/master/src/crypto-js/crypto.js
// which is adapted from CryptoJS.

// BigInteger monkey patching
BigInteger.valueOf = nbv;

/**
 * Returns a byte array representation of the big integer.
 *
 * This returns the absolute of the contained value in big endian
 * form. A value of zero results in an empty array.
 */
BigInteger.prototype.toByteArrayUnsigned = function () {
  var ba = this.abs().toByteArray();
  if (ba.length) {
    if (ba[0] == 0) {
      ba = ba.slice(1);
    }
    return ba.map(function (v) {
      return (v < 0) ? v + 256 : v;
    });
  } else {
    // Empty array, nothing to do
    return ba;
  }
};

/**
 * Turns a byte array into a big integer.
 *
 * This function will interpret a byte array as a big integer in big
 * endian notation and ignore leading zeros.
 */
BigInteger.fromByteArrayUnsigned = function (ba) {
  if (!ba.length) {
    return ba.valueOf(0);
  } else if (ba[0] & 0x80) {
    // Prepend a zero so the BigInteger class doesn't mistake this
    // for a negative integer.
    return new BigInteger([0].concat(ba));
  } else {
    return new BigInteger(ba);
  }
};

/**
 * Converts big integer to signed byte representation.
 *
 * The format for this value uses a the most significant bit as a sign
 * bit. If the most significant bit is already occupied by the
 * absolute value, an extra byte is prepended and the sign bit is set
 * there.
 *
 * Examples:
 *
 *      0 =>     0x00
 *      1 =>     0x01
 *     -1 =>     0x81
 *    127 =>     0x7f
 *   -127 =>     0xff
 *    128 =>   0x0080
 *   -128 =>   0x8080
 *    255 =>   0x00ff
 *   -255 =>   0x80ff
 *  16300 =>   0x3fac
 * -16300 =>   0xbfac
 *  62300 => 0x00f35c
 * -62300 => 0x80f35c
 */
BigInteger.prototype.toByteArraySigned = function () {
  var val = this.abs().toByteArrayUnsigned();
  var neg = this.compareTo(BigInteger.ZERO) < 0;

  if (neg) {
    if (val[0] & 0x80) {
      val.unshift(0x80);
    } else {
      val[0] |= 0x80;
    }
  } else {
    if (val[0] & 0x80) {
      val.unshift(0x00);
    }
  }

  return val;
};

/**
 * Parse a signed big integer byte representation.
 *
 * For details on the format please see BigInteger.toByteArraySigned.
 */
BigInteger.fromByteArraySigned = function (ba) {
  // Check for negative value
  if (ba[0] & 0x80) {
    // Remove sign bit
    ba[0] &= 0x7f;

    return BigInteger.fromByteArrayUnsigned(ba).negate();
  } else {
    return BigInteger.fromByteArrayUnsigned(ba);
  }
};

function util_bytesToHex(bytes){
	for (var hex = [], i = 0; i < bytes.length; i++) {
		hex.push((bytes[i] >>> 4).toString(16));
		hex.push((bytes[i] & 0xF).toString(16));
	}
	return hex.join("");
};

function ec_keys(){

/**
 * Generate an ECC keypair, which can be used for ECDH, ElGamal and 
 * ECDSA. Please note that you should always generate two keypairs for a
 * user in a real application: One for encryption, one for signing. This
 * is more secure in ECC than using one keypair for both purposes.
 * ---------------------------------------------------------------------
 * @param   {String}      curvename   Name of the elliptic curve to use.
 *                                    Available:
 *                                    "secp128r1"
 *                                    "secp160k1
 *                                    "secp160r1"
 *                                    "secp192k1"
 *                                    "secp192r1"
 *                                    "secp224r1"
 *                                    "secp256r1"
 *                                    "brainpoolP160r1"
 *                                    "brainpoolP192r1"
 *                                    "brainpoolP224r1"
 *                                    "brainpoolP256r1"
 *                                    "brainpoolP320r1"
 *                                    "brainpoolP384r1"
 *                                    "brainpoolP512r1"
 *                                     Recommended: "brainpoolP256r1" to
 *                                    "brainpoolP512r1". ECC keys of 
 *                                     256 bit are about as secure as 
 *                                     3072 bit RSA keys, 512 bit are about
 *                                     as secure as 15360 bit RSA keys.
 * @carries   {Object}     carrier
 * @calls     {Function}   callback    function(Object keys, Object carrier)
 *                                     keys:
 *                                        String pub   Public key (serialized)
 *                                        String priv  Private key (serialized)
 * */
this.generateKeypairAsync = function(curvename, callback, carrier){
	var c = getCurveByName(curvename);
	var c_getCurve = c.getCurve();
	var q    = c_getCurve.getQ(); 
	var a    = c_getCurve.getA().toBigInteger();
	var b    = c_getCurve.getB().toBigInteger();
	var G_x  = c.getG().getX().toBigInteger();
	var G_y  = c.getG().getY().toBigInteger();
	var n    = c.getN();
	
	var curve = new ECCurveFp(q, a, b);
	var curve_G = new ECPointFp(curve, 
	                            curve.fromBigInteger(G_x), 
	                            curve.fromBigInteger(G_y) );
	var privateKey = ecHandler.keys.generateSecretValue(n);
	carrier = {"callback": callback, "outercarrier": carrier, "priv": privateKey,
				"curve": curvename};
	curve_G.multiplyAsync(privateKey, function(publicKey, c){
		var priv = c.priv;
		var pub = publicKey;  
		//console.log(publicKey.getX().toBigInteger().bitLength()); console.log(publicKey.getY().toBigInteger().bitLength());
		var curve = c.curve;
		var callback = c.callback;
		var carrier = c.outercarrier;
		var keypair = ecHandler.keys.serializeKeypair(priv, pub, curve);
		window.setTimeout(function(){
			callback(keypair, carrier);
		}, EC_async_timeout);
	}, carrier);
};

/**
 * Generate an ECC keypair, which can be used for ECDH, ElGamal and 
 * ECDSA. Please note that you should always generate two keypairs for a
 * user in a real application: One for encryption, one for signing. This
 * is more secure in ECC than using one keypair for both purposes.
 * ---------------------------------------------------------------------
 * @param   {String}      curvename   Name of the elliptic curve to use.
 *                                    Available:
 *                                    "secp128r1"
 *                                    "secp160k1
 *                                    "secp160r1"
 *                                    "secp192k1"
 *                                    "secp192r1"
 *                                    "secp224r1"
 *                                    "secp256r1"
 *                                    "brainpoolP160r1"
 *                                    "brainpoolP192r1"
 *                                    "brainpoolP224r1"
 *                                    "brainpoolP256r1"
 *                                    "brainpoolP320r1"
 *                                    "brainpoolP384r1"
 *                                    "brainpoolP512r1"
 *                                     Recommended: "brainpoolP256r1" to
 *                                    "brainpoolP512r1". ECC keys of 
 *                                     256 bit are about as secure as 
 *                                     3072 bit RSA keys, 512 bit are about
 *                                     as secure as 15360 bit RSA keys.
 * 
 * @return    {Object}   keys          String pub   Public key (serialized)
 *                                     String priv  Private key (serialized)
 * */
this.generateKeypair = function(curvename){
	/*
	 * Get curve by name and retrieve parameters. Takes about ~20ms,
	 * does not matter if this is done a few times.
	 * */
	var c = getCurveByName(curvename);
	var c_getCurve = c.getCurve();
	var q    = c_getCurve.getQ(); 
	var a    = c_getCurve.getA().toBigInteger();
	var b    = c_getCurve.getB().toBigInteger();
	var G_x  = c.getG().getX().toBigInteger();
	var G_y  = c.getG().getY().toBigInteger();
	var n    = c.getN();
	
	var curve = new ECCurveFp(q, a, b);
	var curve_G = new ECPointFp(curve, 
	                            curve.fromBigInteger(G_x), 
	                            curve.fromBigInteger(G_y) );
	/*
	 * Generate private value (random secret)
	 * */
	var privateKey = ecHandler.keys.generateSecretValue(n);
	
	/*
	 * Generate public point
	 * */
	//var start = (new Date()).getTime();
	
	var publicKey = curve_G.multiply(privateKey);
	var keypair = ecHandler.keys.serializeKeypair(privateKey, publicKey, curvename);
	return keypair;
};
this.serializeKeypair = function(priv, pub, curvename){
	priv = ecHandler.keys.serializePrivateKey(priv, curvename);
	pub = ecHandler.keys.serializePublicKey(pub, curvename);
	return {"priv": priv, "pub": pub};
};
this.deserializeKeypair = function(priv, pub){
	priv = ecHandler.keys.deserializePrivateKey(priv);
	pub = ecHandler.keys.deserializePublicKey(pub);
	return {"priv": priv, "pub": pub};
};
this.serializePublicKey = function(pub, curve){
	var pub_x = pub.getX().toBigInteger().toString();
	var pub_y = pub.getY().toBigInteger().toString();
	pub = {"x": pub_x, "y": pub_y, "curve": curve};
	pub = JSON.stringify(pub);
	return pub;
};
this.deserializePublicKey = function(pub){
	pub = JSON.parse(pub);
	var pub_x = pub.x;
	var pub_y = pub.y;
	pub_x = new BigInteger(pub_x);
	pub_y = new BigInteger(pub_y);
	var curvename = pub.curve;
	
	var c = getCurveByName(curvename);
	var c_getCurve = c.getCurve();
	var q    = c_getCurve.getQ(); 
	var a    = c_getCurve.getA().toBigInteger();
	var b    = c_getCurve.getB().toBigInteger();
	var curve = new ECCurveFp(q, a, b);
	pub = new ECPointFp(curve, curve.fromBigInteger(pub_x), curve.fromBigInteger(pub_y));
	return pub;
};
this.serializePrivateKey = function(priv, curve){
	priv = priv.toString();
	priv = {"secret": priv, "curve": curve};
	priv = JSON.stringify(priv);
	return priv;
};
this.deserializePrivateKey = function(priv){
	priv = JSON.parse(priv);
	priv = new BigInteger(priv.secret);
	return priv;
};
//---START-INNER-FUNCTIONS----------------------------------------------
this.generateSecretValue = function(n){
	var rng = new SecureRandom();
	var n1 = n.subtract(BigInteger.ONE);
	var r = new BigInteger(n.bitLength(), rng);
	return r.mod(n1).add(BigInteger.ONE);
}
//---END-INNER-FUNCTIONS------------------------------------------------

};
var ecHandler = new Object();
ecHandler.keys = new ec_keys();

function ec_dh(){

/**
 * Do plain Diffie-Hellman with ECC keys. This only works if both keys
 * are on the same curve, and the resulting shared secret will always be
 * the same for two keys.
 * This is useful if you generate "one time keys" on the fly, and both
 * communication partners use keys on the same curve. When working with
 * persistent keys, use elGamal.
 * @param   {String}   localPriv   Serialized local private key
 * @param   {String}   remotePub   Serialized remote public key
 * @return  {String}               shared secret
 * */
this.getSharedSecret = function(localPriv, remotePub){
	//if((typeof localPriv).toLowerCase() == "string"){
		remotePub = ecHandler.keys.deserializePublicKey(remotePub);
	//}
	//if((typeof remotePub).toLowerCase() == "string"){
		localPriv = ecHandler.keys.deserializePrivateKey(localPriv);
	//}
	var secret = remotePub.multiply(localPriv);
	secret = ecHandler.dh.serializeSecret(secret);
	return secret;
};

/**
 * Do plain Diffie-Hellman with ECC keys. This only works if both keys
 * are on the same curve, and the resulting shared secret will always be
 * the same for two keys.
 * This is useful if you generate "one time keys" on the fly, and both
 * communication partners use keys on the same curve. For persistent
 * keys, use elGamal.
 * @param   {String}   localPriv   Serialized local private key
 * @param   {String}   remotePub   Serialized remote public key
 * @carries {Object}
 * @calls   {Function} callback    function(String shared_secret, Object carrier)
 * */
this.getSharedSecretAsync = function(localPriv, remotePub, callback, carrier){
	//if((typeof localPriv).toLowerCase() == "string"){
		remotePub = ecHandler.keys.deserializePublicKey(remotePub);
	//}
	//if((typeof remotePub).toLowerCase() == "string"){
		localPriv = ecHandler.keys.deserializePrivateKey(localPriv);
	//}
	remotePub.multiplyAsync(localPriv, function(secret, c){
		secret = ecHandler.dh.serializeSecret(secret);
		var callback = c.callback;
		var carrier = c.outercarrier;
		setTimeout(function(){
			callback(secret, carrier);
		}, EC_async_timeout);
	}, {"callback": callback, "outercarrier": carrier});
};

this.serializeSecret = function(sec){
	var x = sec.getX().toBigInteger().toString();
	var y = sec.getY().toBigInteger().toString();
	sec = {"x": x, "y": y};
	sec = JSON.stringify(sec);
	return sec;
};

};
ecHandler.dh = new ec_dh();

function ec_elgamal(){

/*
 * This elGamal implementation is adapted from SJCL, as used in their
 * ECC implementation.
 * */

/**
 * Get a symmetric key from a remote public key. Only the owner of the
 * corresponding private key will be able to recover the resulting
 * key. Use the @key for symmetric encryption, and send the @tag to the
 * owner of the private key as  they need it to recover @key.
 * ---------------------------------------------------------------------
 * @param   {String}   remotePub   Serialized public key (public keys
 *                                 generated using ecHandler.keys are
 *                                 serialized already)
 * @return  {Object}               Object:
 *                                    String tag        : Public keytag that must
 *                                                        be sent to the owner
 *                                                        of the private key so they
 *                                                        can recover @key.
 *                                    Array<Integer> key: Secret key which can be 
 *                                                        recovered only using @tag in
 *                                                        combination with the  
 *                                                        corresponding private key to
 *                                                        @remotePub. Can be used to 
 *                                                        encrypt a message synchronously.
 *                                                        Calling
 *                                                        sjcl.codec.hex.fromBits(key)
 *                                                        will convert the bit array to a
 *                                                        string if you prefer to work
 *                                                        with a string instead of an
 *                                                        array.
 * */
this.kem = function(remotePub){
	var curvename = (JSON.parse(remotePub)).curve;
	var curve = getCurveByName(curvename);
	remotePub = ecHandler.keys.deserializePublicKey(remotePub);
	
	var n = curve.getN();
	var sec = ecHandler.keys.generateSecretValue(n);
	
	var tag = curve.getG().multiply(sec);
	
	tag = ecHandler.elgamal.serializeTag(tag, curvename);
	
	var key = remotePub.multiply(sec);
	
	key = ecHandler.keys.serializePublicKey(key);
	key = sjcl.hash.sha256.hash(key);
	
	return {"key": key, "tag": tag};
};

/**
 * Get a symmetric key from a remote public key. Only the owner of the
 * corresponding private key will be able to recover the resulting
 * key. This function works like ecHandler.elgamal.kem, but executes
 * long running calculations asynchronously.
 * ---------------------------------------------------------------------
 * @param   {String}   remotePub   Serialized public key (public keys
 *                                 generated using ecHandler.keys are
 *                                 serialized already)
 * @carries {Object}   carrier     
 * @calls   {Function} callback    function(Object symkeyobj, Object carrier)
 *                                 symkeyobj:
 *                                    String tag        : Public keytag that must
 *                                                        be sent to the owner
 *                                                        of the private key so they
 *                                                        can recover @key.
 *                                    Array<Integer> key: Secret key which can be 
 *                                                        recovered only using @tag in
 *                                                        combination with the  
 *                                                        corresponding private key to
 *                                                        @remotePub. Can be used to 
 *                                                        encrypt a message synchronously.
 *                                                        Calling
 *                                                        sjcl.codec.hex.fromBits(key)
 *                                                        will convert the bit array to a
 *                                                        string if you prefer to work
 *                                                        with a string instead of an
 *                                                        array.
 * */
this.kemAsync = function(remotePub, callback, carrier){
	var curvename = (JSON.parse(remotePub)).curve;
	var curve = getCurveByName(curvename);
	remotePub = ecHandler.keys.deserializePublicKey(remotePub);
	
	var n = curve.getN();
	var sec = ecHandler.keys.generateSecretValue(n);
	
	carrier = {"callback": callback, "outercarrier": carrier, 
				"curvename": curvename, "remotePub": remotePub,
				"sec": sec};
	
	curve.getG().multiplyAsync(sec, function(tag, c){
		var curvename = c.curvename;
		var remotePub = c.remotePub;
		var sec = c.sec;
		tag = ecHandler.elgamal.serializeTag(tag, curvename);
		c.tag = tag;
		remotePub.multiplyAsync(sec, function(key, c){
			key = ecHandler.keys.serializePublicKey(key);
			key = sjcl.hash.sha256.hash(key);
			var tag = c.tag;
			var callback = c.callback;
			var carrier = c.outercarrier;
			var symkey = {"key": key, "tag": tag};
			setTimeout(function(){
				callback(symkey, carrier);
			}, EC_async_timeout);
		}, c);
	}, carrier);
};

/**
 * Recover a symmetric key created using ecHandler.elgamal.kem or
 * ecHandler.elgamal.kemAsync with the public key tag and the local 
 * private key.
 * ---------------------------------------------------------------------
 * @param   {String}         localPriv   Serialized private key (keys as created
 *                                       using ecHandler.keys are already
 *                                       serialized).
 * @param   {String}         tag         Public key tag needed to recover the
 *                                       symmetric key.
 * @return  {Array<Integer>} key         Symmetric key (can be converted to a 
 *                                       string using 
 *                                       sjcl.codec.hex.fromBits(key)).
 * */
this.unkem = function(localPriv, tag){
	
	localPriv = ecHandler.keys.deserializePrivateKey(localPriv);
	
	tag = JSON.parse(tag);
	var cname = tag.curve;
	var c = getCurveByName(tag.curve);
	var tag_x = new BigInteger(tag.x);
	var tag_y = new BigInteger(tag.y);
	var c_getCurve = c.getCurve();
	var q    = c_getCurve.getQ(); 
	var a    = c_getCurve.getA().toBigInteger();
	var b    = c_getCurve.getB().toBigInteger();
	var curve = new ECCurveFp(q, a, b);
	var point = new ECPointFp(curve, curve.fromBigInteger(tag_x), curve.fromBigInteger(tag_y));
	tag = point;
	
	var key = tag.multiply(localPriv);
	key = ecHandler.keys.serializePublicKey(key);
	key = sjcl.hash.sha256.hash(key);
	
	return key;
};

/**
 * Recover a symmetric key created using ecHandler.elgamal.kem or
 * ecHandler.elgamal.kemAsync with the public key tag and the local 
 * private key. Works like ecHandler.elGamal.unkem, but executes long
 * running calculations asynchronously.
 * ---------------------------------------------------------------------
 * @param   {String}         localPriv   Serialized private key (keys as created
 *                                       using ecHandler.keys are already
 *                                       serialized).
 * @param   {String}         tag         Public key tag needed to recover the
 *                                       symmetric key.
 * @carries {Object}         carrier
 * @calls   {Function}       callback    function(Array<Integer> key, Object carrier)
 *                                       key:  Symmetric key (can be converted to a 
 *                                       string using 
 *                                       sjcl.codec.hex.fromBits(key)).
 * */
this.unkemAsync = function(localPriv, tag, callback, carrier){
	localPriv = ecHandler.keys.deserializePrivateKey(localPriv);
	tag = JSON.parse(tag);
	var cname = tag.curve;
	var c = getCurveByName(tag.curve);
	var tag_x = new BigInteger(tag.x);
	var tag_y = new BigInteger(tag.y);
	var c_getCurve = c.getCurve();
	var q    = c_getCurve.getQ(); 
	var a    = c_getCurve.getA().toBigInteger();
	var b    = c_getCurve.getB().toBigInteger();
	var curve = new ECCurveFp(q, a, b);
	var point = new ECPointFp(curve, curve.fromBigInteger(tag_x), curve.fromBigInteger(tag_y));
	tag = point;
	
	carrier = {"callback": callback, "outercarrier": carrier};
	
	tag.multiplyAsync(localPriv, function(key, c){
		key = ecHandler.keys.serializePublicKey(key);
		key = sjcl.hash.sha256.hash(key);
		var callback = c.callback;
		var carrier = c.outercarrier;
		setTimeout(function(){
			callback(key, carrier);
		}, EC_async_timeout);
	}, carrier);
};

this.serializeTag = function(tag, curve){
	var tag_ser = ecHandler.keys.serializePublicKey(tag, curve);
	return tag_ser;
};
this.deserializeTag = function(tag){
	var curve = getCurveByName((JSON.parse(tag)).curve);
	console.log(curve);
	tag = ecHandler.keys.deserializePublicKey(tag);
	console.log(tag);
	return {"curve": curve, "tag": tag};
};
  
}
ecHandler.elgamal = new ec_elgamal();

// ecdsa.js and ecdsa2.js are adapted from 
// bitcoinjs-lib (github.com/bitcoinjs/bitcoinjs)
// https://raw.github.com/bitcoinjs/bitcoinjs-lib/master/src/ecdsa.js

function integerToBytes(i, len) {
  var bytes = i.toByteArrayUnsigned();

  if (len < bytes.length) {
    bytes = bytes.slice(bytes.length-len);
  } else while (len > bytes.length) {
    bytes.unshift(0);
  }

  return bytes;
};

ECFieldElementFp.prototype.getByteLength = function () {
  return Math.floor((this.toBigInteger().bitLength() + 7) / 8);
};

ECPointFp.prototype.getEncoded = function (compressed) {
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();

  // Get value as a 32-byte Buffer
  // Fixed length based on a patch by bitaddress.org and Casascius
  var enc = integerToBytes(x, 32);

  if (compressed) {
    if (y.isEven()) {
      // Compressed even pubkey
      // M = 02 || X
      enc.unshift(0x02);
    } else {
      // Compressed uneven pubkey
      // M = 03 || X
      enc.unshift(0x03);
    }
  } else {
    // Uncompressed pubkey
    // M = 04 || X || Y
    enc.unshift(0x04);
    enc = enc.concat(integerToBytes(y, 32));
  }
  return enc;
};

ECPointFp.decodeFrom = function (curve, enc) {
  var type = enc[0];
  var dataLen = enc.length-1;

  // Extract x and y as byte arrays
  var xBa = enc.slice(1, 1 + dataLen/2);
  var yBa = enc.slice(1 + dataLen/2, 1 + dataLen);

  // Prepend zero byte to prevent interpretation as negative integer
  xBa.unshift(0);
  yBa.unshift(0);

  // Convert to BigIntegers
  var x = new BigInteger(xBa);
  var y = new BigInteger(yBa);

  // Return point
  return new ECPointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
};

ECPointFp.prototype.add2D = function (b) {
  if(this.isInfinity()) return b;
  if(b.isInfinity()) return this;

  if (this.x.equals(b.x)) {
    if (this.y.equals(b.y)) {
      // this = b, i.e. this must be doubled
      return this.twice();
    }
    // this = -b, i.e. the result is the point at infinity
    return this.curve.getInfinity();
  }

  var x_x = b.x.subtract(this.x);
  var y_y = b.y.subtract(this.y);
  var gamma = y_y.divide(x_x);

  var x3 = gamma.square().subtract(this.x).subtract(b.x);
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.twice2D = function () {
  if (this.isInfinity()) return this;
  if (this.y.toBigInteger().signum() == 0) {
    // if y1 == 0, then (x1, y1) == (x1, -y1)
    // and hence this = -this and thus 2(x1, y1) == infinity
    return this.curve.getInfinity();
  }

  var TWO = this.curve.fromBigInteger(BigInteger.valueOf(2));
  var THREE = this.curve.fromBigInteger(BigInteger.valueOf(3));
  var gamma = this.x.square().multiply(THREE).add(this.curve.a).divide(this.y.multiply(TWO));

  var x3 = gamma.square().subtract(this.x.multiply(TWO));
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.multiply2D = function (k) {
  if(this.isInfinity()) return this;
  if(k.signum() == 0) return this.curve.getInfinity();

  var e = k;
  var h = e.multiply(new BigInteger("3"));

  var neg = this.negate();
  var R = this;

  var i;
  for (i = h.bitLength() - 2; i > 0; --i) {
    R = R.twice();

    var hBit = h.testBit(i);
    var eBit = e.testBit(i);

    if (hBit != eBit) {
      R = R.add2D(hBit ? this : neg);
    }
  }

  return R;
};

ECPointFp.prototype.isOnCurve = function () {
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  var a = this.curve.getA().toBigInteger();
  var b = this.curve.getB().toBigInteger();
  var n = this.curve.getQ();
  var lhs = y.multiply(y).mod(n);
  var rhs = x.multiply(x).multiply(x)
    .add(a.multiply(x)).add(b).mod(n);
  return lhs.equals(rhs);
};

ECPointFp.prototype.toString = function () {
  return '('+this.getX().toBigInteger().toString()+','+
    this.getY().toBigInteger().toString()+')';
};

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
ECPointFp.prototype.validate = function () {
  var n = this.curve.getQ();

  // Check Q != O
  if (this.isInfinity()) {
    throw new Error("Point is at infinity.");
  }

  // Check coordinate bounds
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  if (x.compareTo(BigInteger.ONE) < 0 ||
      x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('x coordinate out of bounds');
  }
  if (y.compareTo(BigInteger.ONE) < 0 ||
      y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('y coordinate out of bounds');
  }

  // Check y^2 = x^3 + ax + b (mod n)
  if (!this.isOnCurve()) {
    throw new Error("Point is not on the curve.");
  }

  // Check nQ = 0 (Q is a scalar multiple of G)
  if (this.multiply(n).isInfinity()) {
    // TODO: This check doesn't work - fix.
    throw new Error("Point is not a scalar multiple of G.");
  }

  return true;
};

function dmp(v) {
  if (!(v instanceof BigInteger)) v = v.toBigInteger();
  //return Crypto.util.bytesToHex(v.toByteArrayUnsigned());
  var hex_from_bytes = util_bytesToHex(v.toByteArrayUnsigned());
  return hex_from_bytes;
};

// ecdsa.js and ecdsa2.js are adapted from 
// bitcoinjs-lib (github.com/bitcoinjs/bitcoinjs)
// https://raw.github.com/bitcoinjs/bitcoinjs-lib/master/src/ecdsa.js

var P_OVER_FOUR = null;
function ec_ecdsa(){

this.ecparams = getCurveByName("brainpoolP512r1");
this.rng = new SecureRandom();

this.setCurve = function(name){
	ecHandler.ecdsa.ecparams = getCurveByName(name);
	return true;
};

this.getBigRandom = function (limit){
  return new BigInteger(limit.bitLength(), ecHandler.ecdsa.rng)
	.mod(limit.subtract(BigInteger.ONE))
	.add(BigInteger.ONE);
};

/**
 * Sign a message hash using a senders private key (serialized).
 * ---------------------------------------------------------------------
 * @param   {Array<Integer>}   hash   Bit array, hash of a message
 * @param   {String}           priv   Serialized private key
 * @return  {Array<Integer>}          Signature
 * */
this.sign = function (hash, priv) {
	if(typeof priv == "string" || typeof priv == "String"){
		ecHandler.ecdsa.setCurve((JSON.parse(priv)).curve);
		priv = ecHandler.keys.deserializePrivateKey(priv);
	}
	var d = priv;
	var n = ecHandler.ecdsa.ecparams.getN();
	var e = BigInteger.fromByteArrayUnsigned(hash);
	
	do {
		var k = ecHandler.ecdsa.getBigRandom(n);
		var G = ecHandler.ecdsa.ecparams.getG();
		var Q = G.multiply(k);
		var r = Q.getX().toBigInteger().mod(n);
	} while (r.compareTo(BigInteger.ZERO) <= 0);

	var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);

	return ecHandler.ecdsa.serializeSig(r, s);
};

/**
 * Sign a message hash using a senders private key (serialized). Execute
 * long running calculations asynchronously.
 * ---------------------------------------------------------------------
 * @param   {Array<Integer>}   hash       Bit array, hash of a message
 * @param   {String}           priv       Serialized private key
 * @carries {Object}           carrier  
 * @calls   {Function}         callback   function(Array<Integer> signature, Object carrier)
 * */
this.signAsync = function(hash, priv, callback, carrier){
	if(typeof priv == "string" || typeof priv == "String"){
		ecHandler.ecdsa.setCurve((JSON.parse(priv)).curve);
		priv = ecHandler.keys.deserializePrivateKey(priv);
	}
	var d = priv;
	var n = ecHandler.ecdsa.ecparams.getN();
	var e = BigInteger.fromByteArrayUnsigned(hash);
	
	carrier = {"callback": callback, "outercarrier": carrier, "d": d, 
				"n": n, "e": e, "k": null, "G": null, "Q": null,
				"r": null };
	ecHandler.ecdsa.signAsyncLoop(carrier);
};
this.signAsyncLoop = function(carrier){
	carrier.k = ecHandler.ecdsa.getBigRandom(carrier.n);
	carrier.G = ecHandler.ecdsa.ecparams.getG();
	carrier.Q = carrier.G.multiply(carrier.k);
	carrier.r = carrier.Q.getX().toBigInteger().mod(carrier.n);
	if(carrier.r.compareTo(BigInteger.ZERO) <= 0){
		setTimeout(function(){
			ecHandler.ecdsa.signAsyncLoop(carrier);
		}, EC_async_timeout);
	}else{
		var k = carrier.k; var n = carrier.n; var e = carrier.e;
		var d = carrier.d; var r = carrier.r;
		var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);
		var sig = ecHandler.ecdsa.serializeSig(r, s);
		
		var fn = function(){
			carrier.callback(sig, carrier.outercarrier);
		};
		setTimeout(fn, EC_async_timeout);
	}
};

/**
 * Verify a signature with the senders public key. 
 * ---------------------------------------------------------------------
 * @param   {Array<Integer>}   hash     Hash of the signed message
 * @param   {Array<Integer>}   sig      Signature 
 * @param   {String}           pubkey   (Serialized) public key
 * @return  {Boolean}        
 * */
this.verify = function(hash, sig, pubkey){
	if(typeof pubkey == "string" || typeof pubkey == "String"){
		ecHandler.ecdsa.setCurve((JSON.parse(pubkey)).curve);
		pubkey = ecHandler.keys.deserializePublicKey(pubkey);
	}
	var obj = ecHandler.ecdsa.parseSig(sig);
	var r = obj.r;
	var s = obj.s;
	var Q = pubkey;
	var e = BigInteger.fromByteArrayUnsigned(hash);
	return ecHandler.ecdsa.verifyRaw(e, r, s, Q);
};
/**
 * Verify a signature with the senders public key. 
 * ---------------------------------------------------------------------
 * @param   {Array<Integer>}   hash       Hash of the signed message
 * @param   {Array<Integer>}   sig        Signature 
 * @param   {String}           pubkey     (Serialized) public key
 * @carries {Object}           carrier
 * @calls   {Function}         callback   function(boolean ver, Object carrier)
 * */
this.verifyAsync = function(hash, sig, pubkey, callback, carrier) {
	if(typeof pubkey == "string" || typeof pubkey == "String"){
		ecHandler.ecdsa.setCurve((JSON.parse(pubkey)).curve);
		pubkey = ecHandler.keys.deserializePublicKey(pubkey);
		//console.log(pubkey);
	}
	var obj = ecHandler.ecdsa.parseSig(sig);
	var r = obj.r;
	var s = obj.s;
	var Q = pubkey;
	var e = BigInteger.fromByteArrayUnsigned(hash);
	
	var n = ecHandler.ecdsa.ecparams.getN();
	var G = ecHandler.ecdsa.ecparams.getG();

	if (r.compareTo(BigInteger.ONE) < 0 || r.compareTo(n) >= 0){
		//return false;
		callback(false, carrier);
	}

	if (s.compareTo(BigInteger.ONE) < 0 || s.compareTo(n) >= 0){
		//return false;
		callback(false, carrier);
	}

	var c = s.modInverse(n);

	var u1 = e.multiply(c).mod(n);
	var u2 = r.multiply(c).mod(n);

	/*var point = G.multiply(u1).add(Q.multiply(u2));
	var v = point.getX().toBigInteger().mod(n);
	return v.equals(r);*/
	carrier = {"callback": callback, "outercarrier": carrier, "Q": Q,
	           "u2": u2, "r": r, "n": n};
	G.multiplyAsync(u1, function(point, c){
		c.point = point;
		c.Q.multiplyAsync(u2, function(point, c){
			point = (c.point).add(point);
			var v = point.getX().toBigInteger().mod(c.n);
			var verified = v.equals(c.r);
			var fn = function(){
				c.callback(verified, c.outercarrier);
			};
			setTimeout(fn, EC_async_timeout);
		}, c);
	}, carrier);
};

//---START-INNER-FUNCTIONS----------------------------------------------
this.verifyRaw = function(e, r, s, Q){
	var n = ecHandler.ecdsa.ecparams.getN();
	var G = ecHandler.ecdsa.ecparams.getG();

	if (r.compareTo(BigInteger.ONE) < 0 ||
	  r.compareTo(n) >= 0)
	return false;

	if (s.compareTo(BigInteger.ONE) < 0 ||
	  s.compareTo(n) >= 0)
	return false;

	var c = s.modInverse(n);

	var u1 = e.multiply(c).mod(n);
	var u2 = r.multiply(c).mod(n);

	// TODO(!!!): For some reason Shamir's trick isn't working with
	// signed message verification!? Probably an implementation
	// error!
	//var point = implShamirsTrick(G, u1, Q, u2);
	var point = G.multiply(u1).add(Q.multiply(u2));

	var v = point.getX().toBigInteger().mod(n);

	return v.equals(r);
};
this.serializeSig = function (r, s) {
	  var rBa = r.toByteArraySigned();
	  var sBa = s.toByteArraySigned();
	  var sequence = [];
	  sequence.push(0x02); // INTEGER
	  sequence.push(rBa.length);
	  sequence = sequence.concat(rBa);
	  sequence.push(0x02); // INTEGER
	  sequence.push(sBa.length);
	  sequence = sequence.concat(sBa);
	  sequence.unshift(sequence.length);
	  sequence.unshift(0x30); // SEQUENCE
	  return sequence;
};
this.parseSig = function (sig) {
	var cursor;
	if (sig[0] != 0x30)
	throw new Error("Signature not a valid DERSequence");

	cursor = 2;
	if (sig[cursor] != 0x02)
	throw new Error("First element in signature must be a DERInteger");;
	var rBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

	cursor += 2+sig[cursor+1];
	if (sig[cursor] != 0x02)
	throw new Error("Second element in signature must be a DERInteger");
	var sBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

	cursor += 2+sig[cursor+1];

	//if (cursor != sig.length)
	//  throw new Error("Extra bytes in signature");

	var r = BigInteger.fromByteArrayUnsigned(rBa);
	var s = BigInteger.fromByteArrayUnsigned(sBa);

	return {r: r, s: s};
};
this.implShamirsTrick = function(P, k, Q, l)
{
	var m = Math.max(k.bitLength(), l.bitLength());
	var Z = P.add2D(Q);
	var R = P.curve.getInfinity();

	for (var i = m - 1; i >= 0; --i) {
	  R = R.twice2D();

	  R.z = BigInteger.ONE;

	  if (k.testBit(i)) {
		if (l.testBit(i)) {
		  R = R.add2D(Z);
		} else {
		  R = R.add2D(P);
		}
	  } else {
		if (l.testBit(i)) {
		  R = R.add2D(Q);
		}
	  }
	}

	return R;
};
//---END-INNER-FUNCTIONS------------------------------------------------

}
ecHandler.ecdsa = new ec_ecdsa();

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
	var dec = sjcl.decrypt(pass, enc);
	if(dec!=data){
		enc = sjcl.encrypt(pass, data, {
			"ks": cipherJS.sym.aesKeysize,
			"ts": cipherJS.sym.aesAuthStrength,
			"iter": cipherJS.sym.aesIter,
			"mode": cipherJS.sym.aesMode
		});
		dec = sjcl.decrypt(pass, enc);
		if(dec!=data){
			enc = sjcl.encrypt(pass, data, {
				"ks": cipherJS.sym.aesKeysize,
				"ts": cipherJS.sym.aesAuthStrength,
				"iter": cipherJS.sym.aesIter,
				"mode": cipherJS.sym.aesMode
			});
			dec = sjcl.decrypt(pass, enc);
			if(dec!=data){
				throw new cipherJS.sym.decryptError("Error while encrypting: Bug or browser incompatibility or invalid input.");
			}
		}
	}
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
