
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
