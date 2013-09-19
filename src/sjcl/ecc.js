sjcl.ecc = {};

sjcl.ecc.asyncDelay = 1;

/**
 * Represents a point on a curve in affine coordinates.
 * @constructor
 * @param {sjcl.ecc.curve} curve The curve that this point lies on.
 * @param {bigInt} x The x coordinate.
 * @param {bigInt} y The y coordinate.
 */
sjcl.ecc.point = function(curve,x,y) {
  if (x === undefined) {
    this.isIdentity = true;
  } else {
    this.x = x;
    this.y = y;
    this.isIdentity = false;
  }
  this.curve = curve;
};



sjcl.ecc.point.prototype = {
  toJac: function() {
    return new sjcl.ecc.pointJac(this.curve, this.x, this.y, new this.curve.field(1));
  },

  mult: function(k) {
    return this.toJac().mult(k, this).toAffine();
  },
  //---START-MULT-ASYNC-------------------------------------------------
  multAsync: function(k, callback, p, carrier){
	  var point = null;
	  if( (p != null ) && (( p!= undefined ) && (p != "undefined")) ){
		  point=p;
	  }
	  else{
		  point = this;
	  }
	  setTimeout(function(){sjcl.ecc.point.prototype.toJacAsync(k, callback, point, carrier);}, sjcl.ecc.asyncDelay);
  },
  toJacAsync: function(k, callback, point, carrier){
	  var jac = point.toJac();
	  setTimeout(function(){sjcl.ecc.point.prototype.multJacAsync(jac, k, callback, point, carrier);}, sjcl.ecc.asyncDelay);
  },
  multJacAsync: function(jac, k, callback, point, carrier){
	  var inner_callback = sjcl.ecc.point.prototype.multJacAsyncDone;
	  jac.multAsync(k, point, callback, point, carrier, inner_callback);
  },
  multJacAsyncDone: function(multiples, callback, carrier){
	  var i = carrier.i; var j= carrier.j; var k= carrier.k; var out= carrier.out;
	  carrier = carrier.transport_carrier;
	  for (i=k.length-1; i>=0; i--) {
      for (j=sjcl.bn.prototype.radix-4; j>=0; j-=4) {
        out = out.doubl().doubl().doubl().doubl().add(multiples[k[i]>>j & 0xF]);
      }
    }
    var multjac = out;
	setTimeout(function(){sjcl.ecc.point.prototype.toAffineAsync(multjac, callback, carrier);}, sjcl.ecc.asyncDelay);
  },
  toAffineAsync: function(multjac, callback, carrier){
	  var aff = multjac.toAffine();
	  setTimeout(function(){sjcl.ecc.point.prototype.multAsyncDone(aff, callback, carrier);}, sjcl.ecc.asyncDelay);
  },
  multAsyncDone: function(aff, callback, carrier){
	  callback(aff, carrier);
  },
  //---END-MULT-ASYNC---------------------------------------------------
  /**
   * Multiply this point by k, added to affine2*k2, and return the answer in Jacobian coordinates.
   * @param {bigInt} k The coefficient to multiply this by.
   * @param {bigInt} k2 The coefficient to multiply affine2 this by.
   * @param {sjcl.ecc.point} affine The other point in affine coordinates.
   * @return {sjcl.ecc.pointJac} The result of the multiplication and addition, in Jacobian coordinates.
   */
  mult2: function(k, k2, affine2) {
    return this.toJac().mult2(k, this, k2, affine2).toAffine();
  },
  //---START-MULT2-ASYNC------------------------------------------------
  mult2Async: function(k, k2, affine2, G, carrier){
	  var jac = G.toJac();
	  var innercarrier = {"callback": sjcl.ecc.point.prototype.multjac2AsyncDone };
	  setTimeout(function(){jac.mult2Async(k, G, k2, affine2, innercarrier, carrier);}, sjcl.ecc.asyncDelay);
  },
  multjac2AsyncDone: function(multjac, innercarrier, carrier){
	  var aff = multjac.toAffine();
	  setTimeout(function(){carrier.inner_callback(aff, carrier);}, sjcl.ecc.asyncDelay);
  },
  //---END-MULT2-ASYNC--------------------------------------------------
  multiples: function() {
    var m, i, j;
    if (this._multiples === undefined) {
      j = this.toJac().doubl();
      m = this._multiples = [new sjcl.ecc.point(this.curve), this, j.toAffine()];
      for (i=3; i<16; i++) {
        j = j.add(this);
        m.push(j.toAffine());
      }
    }
    return this._multiples;
  },
  //---START-MULTIPLES-ASYNC--------------------------------------------
  multiplesAsync: function(point, callback, carrier){
	var m, i, j;
    if (point._multiples === undefined) {
      j = point.toJac().doubl();
      m = point._multiples = [new sjcl.ecc.point(point.curve), point, j.toAffine()];
      i = 3;
      setTimeout(function(){sjcl.ecc.point.prototype.multiplesAsyncLoop(m, j, i, point, callback, carrier);}, sjcl.ecc.asyncDelay);
    }
    else{
		setTimeout(function(){callback(point._multiples, carrier);}, sjcl.ecc.asyncDelay);
	}
  },
  multiplesAsyncLoop: function(m, j, i, point, callback, carrier){
	  j = j.add(point);
      m.push(j.toAffine());
      point._multiples=m;
	  i=i+1;
	  if(i<16){
		  setTimeout(function(){sjcl.ecc.point.prototype.multiplesAsyncLoop(m, j, i, point, callback, carrier);}, sjcl.ecc.asyncDelay);
	  }
	  else{
		  setTimeout(function(){callback(point._multiples, carrier);}, sjcl.ecc.asyncDelay);
	  }
  },
  //---END-MULTIPLES-ASYNC----------------------------------------------
  isValid: function() {
    return this.y.square().equals(this.curve.b.add(this.x.mul(this.curve.a.add(this.x.square()))));
  },

  toBits: function() {
    return sjcl.bitArray.concat(this.x.toBits(), this.y.toBits());
  }
};

/**
 * Represents a point on a curve in Jacobian coordinates. Coordinates can be specified as bigInts or strings (which
 * will be converted to bigInts).
 *
 * @constructor
 * @param {bigInt/string} x The x coordinate.
 * @param {bigInt/string} y The y coordinate.
 * @param {bigInt/string} z The z coordinate.
 * @param {sjcl.ecc.curve} curve The curve that this point lies on.
 */
sjcl.ecc.pointJac = function(curve, x, y, z) {
  if (x === undefined) {
    this.isIdentity = true;
  } else {
    this.x = x;
    this.y = y;
    this.z = z;
    this.isIdentity = false;
  }
  this.curve = curve;
};

sjcl.ecc.pointJac.prototype = {
  /**
   * Adds S and T and returns the result in Jacobian coordinates. Note that S must be in Jacobian coordinates and T must be in affine coordinates.
   * @param {sjcl.ecc.pointJac} S One of the points to add, in Jacobian coordinates.
   * @param {sjcl.ecc.point} T The other point to add, in affine coordinates.
   * @return {sjcl.ecc.pointJac} The sum of the two points, in Jacobian coordinates. 
   */
  add: function(T) {
    var S = this, sz2, c, d, c2, x1, x2, x, y1, y2, y, z;
    if (S.curve !== T.curve) {
      throw("sjcl.ecc.add(): Points must be on the same curve to add them!");
    }

    if (S.isIdentity) {
      return T.toJac();
    } else if (T.isIdentity) {
      return S;
    }

    sz2 = S.z.square();
    c = T.x.mul(sz2).subM(S.x);

    if (c.equals(0)) {
      if (S.y.equals(T.y.mul(sz2.mul(S.z)))) {
        // same point
        return S.doubl();
      } else {
        // inverses
        return new sjcl.ecc.pointJac(S.curve);
      }
    }
    
    d = T.y.mul(sz2.mul(S.z)).subM(S.y);
    c2 = c.square();

    x1 = d.square();
    x2 = c.square().mul(c).addM( S.x.add(S.x).mul(c2) );
    x  = x1.subM(x2);

    y1 = S.x.mul(c2).subM(x).mul(d);
    y2 = S.y.mul(c.square().mul(c));
    y  = y1.subM(y2);

    z  = S.z.mul(c);

    return new sjcl.ecc.pointJac(this.curve,x,y,z);
  },
  
  /**
   * doubles this point.
   * @return {sjcl.ecc.pointJac} The doubled point.
   */
  doubl: function() {
    if (this.isIdentity) { return this; }

    var
      y2 = this.y.square(),
      a  = y2.mul(this.x.mul(4)),
      b  = y2.square().mul(8),
      z2 = this.z.square(),
      c  = this.x.sub(z2).mul(3).mul(this.x.add(z2)),
      x  = c.square().subM(a).subM(a),
      y  = a.sub(x).mul(c).subM(b),
      z  = this.y.add(this.y).mul(this.z);
    return new sjcl.ecc.pointJac(this.curve, x, y, z);
  },

  /**
   * Returns a copy of this point converted to affine coordinates.
   * @return {sjcl.ecc.point} The converted point.
   */  
  toAffine: function() {
    if (this.isIdentity || this.z.equals(0)) {
      return new sjcl.ecc.point(this.curve);
    }
    var zi = this.z.inverse(), zi2 = zi.square();
    return new sjcl.ecc.point(this.curve, this.x.mul(zi2).fullReduce(), this.y.mul(zi2.mul(zi)).fullReduce());
  },
  
  /**
   * Multiply this point by k and return the answer in Jacobian coordinates.
   * @param {bigInt} k The coefficient to multiply by.
   * @param {sjcl.ecc.point} affine This point in affine coordinates.
   * @return {sjcl.ecc.pointJac} The result of the multiplication, in Jacobian coordinates.
   */
  mult: function(k, affine) {
    if (typeof(k) === "number") {
      k = [k];
    } else if (k.limbs !== undefined) {
      k = k.normalize().limbs;
    }
    
    var i, j, out = new sjcl.ecc.point(this.curve).toJac(), multiples = affine.multiples();

    for (i=k.length-1; i>=0; i--) {
      for (j=sjcl.bn.prototype.radix-4; j>=0; j-=4) {
        out = out.doubl().doubl().doubl().doubl().add(multiples[k[i]>>j & 0xF]);
      }
    }
    
    return out;
  },
  multAsync: function(k, affine, callback, point, carrier, inner_callback){
	  if (typeof(k) === "number") {
      k = [k];
    } else if (k.limbs !== undefined) {
      k = k.normalize().limbs;
    }
    var i = new sjcl.ecc.point(this.curve).toJac();
    var j = new sjcl.ecc.point(this.curve).toJac();
    var out = new sjcl.ecc.point(this.curve).toJac();
	var carrier_new = {"transport_carrier": carrier, "transport_callback": callback, "callback": inner_callback, "i": i, "j": j, "k": k, "out": out };
	callback = sjcl.ecc.pointJac.prototype.multiplesAsyncDone;
    setTimeout(function(){affine.multiplesAsync(point, callback, carrier_new);}, sjcl.ecc.asyncDelay);
  },
  //---------------------------INNER FUNCTIONS--------------------------
  multiplesAsyncDone: function(multiples, carrier){
	  var callback = carrier.transport_callback;
	  var inner_callback = carrier.callback;
      inner_callback(multiples, callback, carrier);
  },
  //--------------------------------------------------------------------
  /**
   * Multiply this point by k, added to affine2*k2, and return the answer in Jacobian coordinates.
   * @param {bigInt} k The coefficient to multiply this by.
   * @param {sjcl.ecc.point} affine This point in affine coordinates.
   * @param {bigInt} k2 The coefficient to multiply affine2 this by.
   * @param {sjcl.ecc.point} affine The other point in affine coordinates.
   * @return {sjcl.ecc.pointJac} The result of the multiplication and addition, in Jacobian coordinates.
   */
  mult2: function(k1, affine, k2, affine2) {
    if (typeof(k1) === "number") {
      k1 = [k1];
    } else if (k1.limbs !== undefined) {
      k1 = k1.normalize().limbs;
    }
    
    if (typeof(k2) === "number") {
      k2 = [k2];
    } else if (k2.limbs !== undefined) {
      k2 = k2.normalize().limbs;
    }
    
    var i, j, out = new sjcl.ecc.point(this.curve).toJac(), m1 = affine.multiples(),
        m2 = affine2.multiples(), l1, l2;

    for (i=Math.max(k1.length,k2.length)-1; i>=0; i--) {
      l1 = k1[i] | 0;
      l2 = k2[i] | 0;
      for (j=sjcl.bn.prototype.radix-4; j>=0; j-=4) {
        out = out.doubl().doubl().doubl().doubl().add(m1[l1>>j & 0xF]).add(m2[l2>>j & 0xF]);
      }
    }
    
    return out;
  },
  //---START-MULT2-ASYNC------------------------------------------------
  mult2Async: function(k1, affine, k2, affine2, innercarrier, carrier){
	  if (typeof(k1) === "number") {
      k1 = [k1];
    } else if (k1.limbs !== undefined) {
      k1 = k1.normalize().limbs;
    }
    
    if (typeof(k2) === "number") {
      k2 = [k2];
    } else if (k2.limbs !== undefined) {
      k2 = k2.normalize().limbs;
    }
    
    var i=new sjcl.ecc.point(this.curve).toJac();
    var j=new sjcl.ecc.point(this.curve).toJac();
    var out=new sjcl.ecc.point(this.curve).toJac();
    
    var m1 = affine.multiples();
    
    var jaccarrier = {"k1": k1, "k2": k2, "affine": affine, "affine2": affine2, "i": i, "j": j, "out": out, "m1": m1 };
    var fname = sjcl.ecc.pointJac.prototype.mult2MultiplesAsync;
    setTimeout(function(){fname(jaccarrier, innercarrier, carrier);}, sjcl.ecc.asyncDelay);
  },
  mult2MultiplesAsync: function(jaccarrier, innercarrier, carrier){
	  var jc = jaccarrier;
	  var k1=jc.k1; var k2=jc.k2; 
	  var affine=jc.affine; var affine2=jc.affine2;
	  var i = jc.i; var j = jc.j; var out = jc.out; var m1 = jc.m1;
	  
	  var cb = sjcl.ecc.pointJac.prototype.mult2MultiplesAsyncDone;
	  var new_carrier = {"jaccarrier": jaccarrier, "innercarrier": innercarrier, "carrier": carrier };
	  setTimeout(function(){sjcl.ecc.point.prototype.multiplesAsync(affine2, cb, new_carrier);}, sjcl.ecc.asyncDelay);
  },
  mult2MultiplesAsyncDone: function(multiples, allcarrier){
	  var jaccarrier = allcarrier.jaccarrier;
	  var innercarrier = allcarrier.innercarrier;
	  var carrier = allcarrier.carrier;
	  var jc = jaccarrier;
	  var k1=jc.k1; var k2=jc.k2; 
	  var affine=jc.affine; var affine2=jc.affine2;
	  var i = jc.i; var j = jc.j; var out = jc.out; var m1 = jc.m1;
	  var m2 = multiples;
	  jaccarrier = {"k1": k1, "k2": k2, "affine": affine, "affine2": affine2, "i": i, "j": j, "out": out, "m1": m1, "m2": m2 };
	  var fname = sjcl.ecc.pointJac.prototype.mult2LoopAsync;
	  setTimeout(function(){fname(jaccarrier, innercarrier, carrier);}, sjcl.ecc.asyncDelay);
  },
  mult2LoopAsync: function(jaccarrier, innercarrier, carrier){
	var jc = jaccarrier;
	  var k1=jc.k1; var k2=jc.k2; 
	  var affine=jc.affine; var affine2=jc.affine2;
	  var i = jc.i; var j = jc.j; var out = jc.out; 
	  var m1 = jc.m1; var m2 = jc.m2;

	var l1; var l2;
	// rather long, ~600
    for (i=Math.max(k1.length,k2.length)-1; i>=0; i--) {
      l1 = k1[i] | 0;
      l2 = k2[i] | 0;
      for (j=sjcl.bn.prototype.radix-4; j>=0; j-=4) {
        out = out.doubl().doubl().doubl().doubl().add(m1[l1>>j & 0xF]).add(m2[l2>>j & 0xF]);
      }
    }
    var callback = innercarrier.callback; 
    setTimeout(function(){callback(out, innercarrier, carrier);}, sjcl.ecc.asyncDelay);
  },
  //---END-MULT2-ASYNC--------------------------------------------------

  isValid: function() {
    var z2 = this.z.square(), z4 = z2.square(), z6 = z4.mul(z2);
    return this.y.square().equals(
             this.curve.b.mul(z6).add(this.x.mul(
               this.curve.a.mul(z4).add(this.x.square()))));
  }
};

/**
 * Construct an elliptic curve. Most users will not use this and instead start with one of the NIST curves defined below.
 *
 * @constructor
 * @param {bigInt} p The prime modulus.
 * @param {bigInt} r The prime order of the curve.
 * @param {bigInt} a The constant a in the equation of the curve y^2 = x^3 + ax + b (for NIST curves, a is always -3).
 * @param {bigInt} x The x coordinate of a base point of the curve.
 * @param {bigInt} y The y coordinate of a base point of the curve.
 */
sjcl.ecc.curve = function(Field, r, a, b, x, y) {
  this.field = Field;
  this.r = Field.prototype.modulus.sub(r);
  this.a = new Field(a);
  this.b = new Field(b);
  this.G = new sjcl.ecc.point(this, new Field(x), new Field(y));
};

sjcl.ecc.curve.prototype.fromBits = function (bits) {
  var w = sjcl.bitArray;
  var l = this.field.prototype.exponent + 7 & -8;
  var p = new sjcl.ecc.point(this, this.field.fromBits(w.bitSlice(bits, 0, l)),
                             this.field.fromBits(w.bitSlice(bits, l, 2*l)));
  if (!p.isValid()) {
	//debugJS.log( printStackTrace().join('\n\n'));
	//console.trace();

    throw new sjcl.exception.corrupt("not on the curve!");
  }
  return p;
};

sjcl.ecc.curves = {
  c192: new sjcl.ecc.curve(
    sjcl.bn.prime.p192,
    "0x662107c8eb94364e4b2dd7ce",
    -3,
    "0x64210519e59c80e70fa7e9ab72243049feb8deecc146b9b1",
    "0x188da80eb03090f67cbf20eb43a18800f4ff0afd82ff1012",
    "0x07192b95ffc8da78631011ed6b24cdd573f977a11e794811"),

  c224: new sjcl.ecc.curve(
    sjcl.bn.prime.p224,
    "0xe95c1f470fc1ec22d6baa3a3d5c4",
    -3,
    "0xb4050a850c04b3abf54132565044b0b7d7bfd8ba270b39432355ffb4",
    "0xb70e0cbd6bb4bf7f321390b94a03c1d356c21122343280d6115c1d21",
    "0xbd376388b5f723fb4c22dfe6cd4375a05a07476444d5819985007e34"),

  c256: new sjcl.ecc.curve(
    sjcl.bn.prime.p256,
    "0x4319055358e8617b0c46353d039cdaae",
    -3,
    "0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b",
    "0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296",
    "0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"),

  c384: new sjcl.ecc.curve(
    sjcl.bn.prime.p384,
    "0x389cb27e0bc8d21fa7e5f24cb74f58851313e696333ad68c",
    -3,
    "0xb3312fa7e23ee7e4988e056be3f82d19181d9c6efe8141120314088f5013875ac656398d8a2ed19d2a85c8edd3ec2aef",
    "0xaa87ca22be8b05378eb1c71ef320ad746e1d3b628ba79b9859f741e082542a385502f25dbf55296c3a545e3872760ab7",
    "0x3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f"),
    
  c521: new sjcl.ecc.curve(
    sjcl.bn.prime.p521, 
   "0x5AE79787C40D069948033FEB708F65A2FC44A36477663B851449048E16EC79BF6", 
   -3, 
   "0x051953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00", 
   "0xc6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66", 
   "0x11839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650")
};


/* Diffie-Hellman-like public-key system */
sjcl.ecc._dh = function(cn) {
  sjcl.ecc[cn] = {
    /** @constructor */
    publicKey: function(curve, point) {
      this._curve = curve;
      this._curveBitLength = curve.r.bitLength();
      if (point instanceof Array) {
        this._point = curve.fromBits(point);
      } else {
        this._point = point;
      }

      this.get = function() {
        var pointbits = this._point.toBits();
        var len = sjcl.bitArray.bitLength(pointbits);
        var x = sjcl.bitArray.bitSlice(pointbits, 0, len/2);
        var y = sjcl.bitArray.bitSlice(pointbits, len/2);
        return { x: x, y: y };
      }
    },

    /** @constructor */
    secretKey: function(curve, exponent) {
      this._curve = curve;
      this._curveBitLength = curve.r.bitLength();
      this._exponent = exponent;

      this.get = function() {
        return this._exponent.toBits();
      }
    },

    /** @constructor */
    generateKeys: function(curve, paranoia, sec) {
      if (curve === undefined) {
        curve = 256;
      }
      if (typeof curve === "number") {
        curve = sjcl.ecc.curves['c'+curve];
        if (curve === undefined) {
          throw new sjcl.exception.invalid("no such curve");
        }
      }
      if (sec === undefined) {
        var sec = sjcl.bn.random(curve.r, paranoia);
      }
      var pub = curve.G.mult(sec);
      return { pub: new sjcl.ecc[cn].publicKey(curve, pub),
               sec: new sjcl.ecc[cn].secretKey(curve, sec) };
    },
    generateKeysAsync: function(curve, paranoia, callback, outercarrier){
	    if (curve === undefined) {
	        curve = 521;
	    }
	    if (typeof curve === "number") {
	        curve = sjcl.ecc.curves['c' + curve];
	        if (curve === undefined) {
	            throw new sjcl.exception.invalid("no such curve");
	        }
	    }
	    var carrier = {"callback": callback, "curve": curve, "outercarrier": outercarrier};
	    
	    setTimeout(function(){
			sjcl.ecc.elGamal.asyncSecretCurve(curve.r, paranoia, carrier);
		}, sjcl.ecc.asyncDelay);
	},
	//-------------------------INNER FUNCTIONS--------------------------
		asyncSecretCurve: function(cr, par, carrier){
			var sec = sjcl.bn.random(cr, par);
			setTimeout(function(){
				sjcl.ecc.elGamal.asyncPublicCurve(sec, carrier);
			}, sjcl.ecc.asyncDelay);
		},
		asyncPublicCurve: function(sec, carrier){
			var cb = this.asyncPublicCurveDone;
			var carrier_new = {"callback": carrier.callback, "curve": carrier.curve, "sec": sec, "outercarrier": carrier.outercarrier };
			if(carrier.curve.G._multiples !== undefined){
				carrier.curve.G._multiples = undefined;
			}
			carrier.curve.G.multAsync(sec, cb, null, carrier_new);
		},
		asyncPublicCurveDone: function(pub, carrier){
			setTimeout(function(){sjcl.ecc.elGamal.asyncFinalizeCurve(pub, carrier.sec, carrier);}, sjcl.ecc.asyncDelay);
		},
		asyncFinalizeCurve: function(pub, sec, carrier){
			pub = new sjcl.ecc[cn].publicKey(carrier.curve, pub);
			sec = new sjcl.ecc[cn].secretKey(carrier.curve, sec);
			carrier.callback({ "pub": pub, "sec": sec }, carrier.outercarrier);
		}
	//------------------------------------------------------------------
  }; 
};

sjcl.ecc._dh("elGamal");

sjcl.ecc.elGamal.publicKey.prototype = {
  kem: function(paranoia) {
    var sec = sjcl.bn.random(this._curve.r, paranoia),
        tag = this._curve.G.mult(sec).toBits(),
        key = sjcl.hash.sha256.hash(this._point.mult(sec).toBits());
    return { key: key, tag: tag };
  },
  //---START-KEM-ASYNC--------------------------------------------------
  kemAsync: function(paranoia, callback, outercarrier){
	  var sec = sjcl.bn.random(this._curve.r, paranoia);
	  var cb = this.kemAsyncTagDone;
	  var curveG = this._curve.G;
	  var carrier = { "point": this._point, "sec": sec, "callback": callback, "outercarrier": outercarrier };
	  setTimeout(function(){curveG.multAsync(sec, cb, null, carrier);}, sjcl.ecc.asyncDelay);
  },
  kemAsyncTagDone: function(multdone, carrier){
	  var sec = carrier.sec;
	  var point = carrier.point;
	  carrier = {"callback": carrier.callback, "outercarrier": carrier.outercarrier };
	  var tag = multdone.toBits();
	  setTimeout(function(){sjcl.ecc.elGamal.publicKey.prototype.kemAsyncDone(point, sec, tag, carrier);}, sjcl.ecc.asyncDelay);
  },
  kemAsyncDone: function(point, sec, tag, carrier){
	  var callbackfunction = carrier.callback;
	  var outercarrier = carrier.outercarrier;
	  var key = sjcl.hash.sha256.hash(point.mult(sec).toBits());
	  setTimeout(function(){callbackfunction({"key": key, "tag": tag}, outercarrier);}, sjcl.ecc.asyncDelay);
  }
  //---END-KEM-ASYNC----------------------------------------------------
};

sjcl.ecc.elGamal.secretKey.prototype = {
  unkem: function(tag) {
    return sjcl.hash.sha256.hash(this._curve.fromBits(tag).mult(this._exponent).toBits());
  },
  //---START-UNKEM-ASYNC------------------------------------------------
  unkemAsync: function(tag, callback, outercarrier){
	  var curveFromBits = this._curve.fromBits(tag);
	  var carrier = { "callback": callback, "outercarrier": outercarrier };
	  var exp = this._exponent;
	  curveFromBits.multAsync(exp, sjcl.ecc.elGamal.secretKey.prototype.unkemAsyncMultDone, null, carrier);
  },
  unkemAsyncMultDone: function(multed, carrier){
	  var tohash = multed.toBits();
	  setTimeout(function(){sjcl.ecc.elGamal.secretKey.prototype.umkemAsyncHash(tohash, carrier);}, sjcl.ecc.asyncDelay);
  },
  umkemAsyncHash: function(tohash, carrier){
	  var hashed = sjcl.hash.sha256.hash(tohash);
	  setTimeout(function(){sjcl.ecc.elGamal.secretKey.prototype.unkemAsyncDone(hashed, carrier.callback, carrier);}, sjcl.ecc.asyncDelay);
  },
  unkemAsyncDone: function(hashed, callback, carrier){
	  callback(hashed, carrier.outercarrier);
  },
  //---END-UNKEM-ASYNC--------------------------------------------------
  dh: function(pk) {
    return sjcl.hash.sha256.hash(pk._point.mult(this._exponent).toBits());
  },
  //---START-DH-ASYNC---------------------------------------------------
  dhAsync: function(pk, callback){
	  var carrier = {"callback": callback };
	  pk._point.multAsync(this._exponent, sjcl.ecc.elGamal.secretKey.prototype.dhAsyncMultDone, null, carrier);
  },
  dhAsyncMultDone: function(multed, carrier){
	  var tohash = multed.toBits();
	  setTimeout(function(){sjcl.ecc.elGamal.secretKey.prototype.dhAsyncHash(tohash, carrier);}, sjcl.ecc.asyncDelay);
  },
  dhAsyncHash: function(tohash, carrier){
	  var hashed = sjcl.hash.sha256.hash(tohash);
	  setTimeout(function(){sjcl.ecc.elGamal.secretKey.prototype.dhAsyncDone(hashed, carrier.callback);}, sjcl.ecc.asyncDelay);
  },
  dhAsyncDone: function(hashed, callback){
	  callback(hashed);
  }
  //---END-DH-ASYNC-----------------------------------------------------
};

sjcl.ecc._dh("ecdsa");

sjcl.ecc.ecdsa.secretKey.prototype = {
  sign: function(hash, paranoia, fakeLegacyVersion, fixedKForTesting) {
    if (sjcl.bitArray.bitLength(hash) > this._curveBitLength) {
      hash = sjcl.bitArray.clamp(hash, this._curveBitLength);
    }
    var R  = this._curve.r,
        l  = R.bitLength(),
        k  = fixedKForTesting || sjcl.bn.random(R.sub(1), paranoia).add(1),
        r  = this._curve.G.mult(k).x.mod(R),
        ss = sjcl.bn.fromBits(hash).add(r.mul(this._exponent)),
        s  = fakeLegacyVersion ? ss.inverseMod(R).mul(k).mod(R)
             : ss.mul(k.inverseMod(R)).mod(R);
    return sjcl.bitArray.concat(r.toBits(l), s.toBits(l));
  },
  //---START-SIGN-ASYNC-------------------------------------------------
  signAsync: function(hash, paranoia, callback, outercarrier){
	  var R = this._curve.r;
	  var l = R.bitLength();
	  var k = sjcl.bn.random(R.sub(1), paranoia).add(1);
	  
	  var G = this._curve.G;
	  var exp = this._exponent;
	  var carrier = {"callback": callback, "R": R, "l": l, "k": k, "exp": exp, "hash": hash, "outercarrier": outercarrier};
	  setTimeout(function(){G.multAsync(k, sjcl.ecc.ecdsa.secretKey.prototype.signAsyncMultDone, null, carrier);}, sjcl.ecc.asyncDelay);
  },
  signAsyncMultDone: function(r, carrier){
	  r = r.x.mod(carrier.R);
	  var s = sjcl.bn.fromBits(carrier.hash).add(r.mul(carrier.exp)).inverseMod(carrier.R).mul(carrier.k).mod(carrier.R);
	  carrier = {"callback": carrier.callback, "l": carrier.l, "s": s, "r": r, "outercarrier": carrier.outercarrier};
	  setTimeout(function(){sjcl.ecc.ecdsa.secretKey.prototype.signAsyncConcat(carrier);}, sjcl.ecc.asyncDelay);
  },
  signAsyncConcat: function(carrier){
	  var l = carrier.l; var s = carrier.s; var r = carrier.r;
	  var arrConcat = sjcl.bitArray.concat(r.toBits(l), s.toBits(l));
	  setTimeout(function(){sjcl.ecc.ecdsa.secretKey.prototype.signAsyncDone(arrConcat, carrier.callback, carrier.outercarrier);}, sjcl.ecc.asyncDelay);
  },
  signAsyncDone: function(retArray, callback, outercarrier){
	  callback(retArray, outercarrier);
  }
  //---END-SIGN-ASYNC---------------------------------------------------
};

sjcl.ecc.ecdsa.publicKey.prototype = {
  verify: function(hash, rs, fakeLegacyVersion) {
    if (sjcl.bitArray.bitLength(hash) > this._curveBitLength) {
      hash = sjcl.bitArray.clamp(hash, this._curveBitLength);
    }
    var w = sjcl.bitArray,
        R = this._curve.r,
        l = this._curveBitLength,
        r = sjcl.bn.fromBits(w.bitSlice(rs,0,l)),
        ss = sjcl.bn.fromBits(w.bitSlice(rs,l,2*l)),
        s = fakeLegacyVersion ? ss : ss.inverseMod(R),
        hG = sjcl.bn.fromBits(hash).mul(s).mod(R),
        hA = r.mul(s).mod(R),
        r2 = this._curve.G.mult2(hG, hA, this._point).x;
    if (r.equals(0) || ss.equals(0) || r.greaterEquals(R) || ss.greaterEquals(R) || !r2.equals(r)) {
      if (fakeLegacyVersion === undefined) {
        return this.verify(hash, rs, true);
      } else {
        //throw (new sjcl.exception.corrupt("signature didn't check out"));
        // cipherJS:
        // an unverified signature is not a bug, it just means that signature
        // could not be verified.
        return false;
      }
    }
    return true;
  },
  //---START-VERIFY-ASYNC-----------------------------------------------
  verifyAsync: function(hash, rs, callback, outercarrier){
	  var w = sjcl.bitArray;
      var R = this._curve.r;
      var l = R.bitLength();
      var r = sjcl.bn.fromBits(w.bitSlice(rs,0,l));
      var s = sjcl.bn.fromBits(w.bitSlice(rs,l,2*l));
      var hG = sjcl.bn.fromBits(hash).mul(s).mod(R);
      var hA = r.mul(s).mod(R);
      
	  var tp = this._point; var G = this._curve.G;
	  var cb = sjcl.ecc.ecdsa.publicKey.prototype.verifyAsyncMult2Done;
	  var carrier = {"callback": callback, "inner_callback": cb, "w": w, "R": R, "l": l, "r": r, "s": s, "hG": hG, "hA": hA, "point": tp, "G": G, "outercarrier": outercarrier };
	  
	  var fname = sjcl.ecc.ecdsa.publicKey.prototype.verifyAsyncMult2;
	  setTimeout(function(){fname(carrier);}, sjcl.ecc.asyncDelay);
  },
  verifyAsyncMult2: function(carrier){
	  var w = carrier.w; var R = carrier.R; var l = carrier.l;
	  var r = carrier.r; var s = carrier.s; var hG = carrier.hG;
	  var hA = carrier.hA; var point = carrier.point; var G = carrier.G;
	  var cb = carrier.inner_callback;
	  setTimeout(function(){G.mult2Async(hG, hA, point, G, carrier);}, sjcl.ecc.asyncDelay);
  },
  verifyAsyncMult2Done: function(aff, carrier){
	  var r2 = aff.x;
	  var w = carrier.w; var R = carrier.R; var l = carrier.l; 
	  var r = carrier.r; var s = carrier.s;
	  var hG = carrier.hG; var hA = carrier.hA; 
	  var callback = carrier.callback;
		if (r.equals(0) || s.equals(0) || r.greaterEquals(R) || s.greaterEquals(R) || !r2.equals(r)) {
			callback(false, carrier.outercarrier);
		}else{
			callback(true, carrier.outercarrier);
		}
  }
  //---END-VERIFY-ASYNC-------------------------------------------------
};
