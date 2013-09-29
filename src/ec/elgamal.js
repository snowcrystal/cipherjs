
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
