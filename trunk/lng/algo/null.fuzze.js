/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.fuzze = Class.create({
	initialize: function(min, max, set) {
		if(set) this.set = set;
		if('undefined'== typeof max || 'inf'== min) max = 'inf';
		if('undefined'== typeof min) min = 0
		if(set && '{}'== set.charact) {
			if(nul.debug.assert) assert(!set.ctxDef,
				'A fuzze set cannot define a context');
				//TODO: expliquer POURQUOI (et concevoir)
				//Si le set définit un contexte, essayer d'en tirer un a-contextuel?
			max = (max=='inf'||max<set.components.length)?
				max:set.components.length;
		}
		min = (max!='inf'&&max<min)?max:min;
		
		if(max===0) nul.fail('No possible values');
		this.min = min;
		this.max = max;
	}
});

/**
 * arguments: some fuzzes
 */
nul.fuzze.tight = function(args) {
	var rv = {min: 0, max: 'inf'};
	if(1< arguments.length) args = arrg(arguments);
	map(args, function() {
		if('inf'!= this.max && ('inf'== rv.max || this.max < rv.max))
			rv.max = this.max;
		if('inf'== this.min || ('inf'!= rv.min || this.min > rv.min))
			rv.min = this.min;
	});
	return rv;
}

/**
 * arguments: some fuzzes
 */
nul.fuzze.sum = function(args) {
	var rv = {min: 0, max: 0};
	if(1< arguments.length) args = arrg(arguments);
	map(args, function() {
		if('inf'== this.max) rv.max = 'inf';
		else if('inf'!= rv.max) rv.max += this.max;
		if('inf'== this.min) rv.min = 'inf';
		else if('inf'!= rv.min) rv.min += this.min;
	});
	return rv;
}

/**
 * arguments: some fuzzes
 */
nul.fuzze.mul = function(args) {
	var rv = {min: 0, max: 0};
	if(1< arguments.length) args = arrg(arguments);
	map(args, function() {
		if('inf'== this.max) rv.max = 'inf';
		else if('inf'!= rv.max) rv.max *= this.max;
		if('inf'== this.min) rv.min = 'inf';
		else if('inf'!= rv.min) rv.min *= this.min;
	});
	return rv;
}

/**
 * arguments: some numbers
 */
nul.fuzze.min = function() {
	var rv = 'inf';
	var args = beArrg(arguments);
	for(var i=0; i<args.length; ++i)
		if('inf'!= args[i] && ('inf'== rv || arg[i] < rv))
			rv = arg[i];
	return rv;
}

/**
 * arguments: some numbers
 */
nul.fuzze.max = function() {
	var rv = 0;
	var args = beArrg(arguments);
	for(var i=0; i<args.length; ++i)
		if('inf'== args[i] || ('inf'!= rv || arg[i] > rv))
			rv = arg[i];
	return rv;
}

nul.fuzze.mix = function(cs, cb) {
	var fzCtxs = {}
	var fzs = map(cs, function() {
		for(var ctx in this.fuzze) fzCtxs[ctx] = true;
		return this.fuzze;
	});
	return (cb||nul.fuzze.mix.compose)( );
};

nul.fuzze.mix.compose = function(fs) {
	//TODO: rv contient une liste de fuzze des sous-composants
};