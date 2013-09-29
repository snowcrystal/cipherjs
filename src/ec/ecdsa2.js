
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
