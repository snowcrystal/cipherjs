
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
