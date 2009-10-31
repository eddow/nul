/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Expression flat description building helper 
 * @class Singleton
 */
nul.txt.flat = merge(/** @lends nul.txt.flat */{
	drawing: [],
	/**
	 * Shortcut to make a table of string out of a table of expressions
	 * @param {nul.expression[]} ass
	 * @return {String[]}
	 */
	all: function(ass) {
		return maf(ass, function() { return this.toFlat(); });
	},
	recurStr: '[recur]',
	/**
	 * Called for each drawn expression to wrap it in common spans and add the tiles (for dependance, ...)
	 * @param {String} txt The text specific to this expression
	 * @param {nul.expression} xpr
	 * @return {String}
	 */
	wrap: function(txt) { return txt; },
	outp: function(xpr) { return xpr; },
	/** @namespace */
	draw: {
		/**
		 * @methodOf nul.obj.pair#
		 * @return {String}
		 */
		pair: function() { return nul.txt.flat.dispatchPair(this); },
		
		/**
		 * @methodOf nul.obj.local#
		 * @return {String}
		 */
		local: function() {
			if(nul.debug.assert) assert(this.dbgName, 'Local has name if debug enabled'); 
			return (this.dbgName||'') + '[' + this.klgRef + '|' + this.ndx + ']';
		},
		/**
		 * @methodOf nul.obj.operation#
		 * @return {String}
		 */
		operation: function() {
			return '(' + nul.txt.flat.all(this.operands).join(' '+this.operator+' ') + ')';
		},
		/**
		 * @methodOf nul.obj.litteral.number#
		 * @return {String}
		 */
		number: function() {
			if(pinf==this.value) return '+&infin;';
			if(ninf==this.value) return '-&infin;';
			return ''+this.value;
		},
		/**
		 * @methodOf nul.obj.litteral.string#
		 * @return {String}
		 */
		string: function() {
			return '"'+this.value+'"';
		},
		/**
		 * @methodOf nul.obj.litteral.boolean#
		 * @return {String}
		 */
		'boolean': function() {
			return this.value?'true':'false';
		},
		/**
		 * @methodOf nul.obj.range#
		 * @return {String}
		 */
		range: function() {
			var ltr = 0> this.lower ?
					'&#x2124;':	//ℤ
					'&#x2115;';	//ℕ			
			var rv = ltr+'[';
			if(ninf!= this.lower) rv += this.lower;
			rv += '..';
			if(pinf!= this.upper) rv += this.upper;
			return rv + ']';
		},
		/**
		 * @methodOf nul.obj.data#
		 * @return {String}
		 */
		data: function() {
			return '['+this.source.context+':'+this.source.index+']';
		},
		/**
		 * @methodOf nul.expression#
		 * @return {String}
		 */
		other: function() {
			return this.expression;
		},
		
		/**
		 * @methodOf nul.obj.lambda#
		 * @return {String}
		 */
		lambda: function() {
			return this.point.toFlat() + ' &rArr; ' + this.image.toFlat();
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @return {String}
		 */
		singleton: function() {
			return '{' + this.first.toFlat() + '}';
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {String}
		 */
		list: function(flat) {
			return '(' + nul.txt.flat.all(flat).join(', ') +
				(flat.follow?(',.. '+flat.follow.toFlat()):'')+ ')';
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {String}
		 */
		set: function(flat) {
			return '{' + nul.txt.flat.all(flat).join(' &#9633; ') + '}' +
				(flat.follow?(' &cup; '+flat.follow.toFlat()):'');
		},
		/**
		 * @methodOf nul.obj.ior3#
		 * @return {String}
		 */
		ior3: function() {
			return '(' + nul.txt.flat.all(this.possibles()).join(' &#9633; ') + ')';
		},
		
		/**
		 * @methodOf nul.xpr.knowledge.eqClass#
		 * @return {String}
		 */
		eqCls: function() {
			var attr = [];
			for(var anm in this.attribs) if(anm)
				attr.push(anm+': '+this.attribs[anm].toFlat())
			attr = (attr.length)?('['+attr.join(', ')+']'):'';
			return '(' + attr + nul.txt.flat.all(this.equivls).join(' = ') + ')' +
				(this.belongs.length?(' &isin; ' + nul.txt.flat.all(this.belongs).join(', ')):'');
		},
		/**
		 * @methodOf nul.xpr.knowledge#
		 * @return {String}
		 */
		klg: function() {
			if(this==nul.xpr.knowledge.never) return 'Never';
			if(this==nul.xpr.knowledge.always) return '';
			var rv = nul.txt.flat.all(this.eqCls).join(' &and; ');
			//var deps = this.usage();
			var kior3 = nul.txt.flat.all(this.ior3).join(' &and; ')
			if(rv && kior3) rv += ' &and; ' + kior3;
			else if(kior3) rv = kior3;
			return rv?'('+rv+')':'';
		},
		/**
		 * @methodOf nul.xpr.knowledge.ior3#
		 * @return {String}
		 */
		kior3: function() {
			return '('+nul.txt.flat.all(maf(this.choices)).join(' &or; ')+')';
		},
		/**
		 * @methodOf nul.xpr.possible#
		 * @return {String}
		 */
		possible: function() {
			if(this===nul.xpr.failure) return 'Failure';
			if(this.knowledge===nul.xpr.knowledge.always) return this.value.toFlat();
			var klgStr = this.knowledge.toFlat();
			var valStr = this.value.toFlat();
			if(!klgStr) return valStr;
			return valStr + '; ' + klgStr;
		}
	}
}, nul.txt);