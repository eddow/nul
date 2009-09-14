/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.txt.flat = {
	all: function(ass) {
		var txtr = this;
		return maf(ass, function() { return this.toFlat(); });
	},
	prototype: nul.txt,
	recurStr: '[recur]',
	wrap: function(txt) { return txt; },
	outp: function(xpr) { return xpr; },
	draw: {
		pair: function() { return nul.txt.flat.dispatchPair(this, this); },
		
		local: function() {
			return (this.dbgName?this.dbgName:'') + '[' + this.fznsName + '|' + this.lclNdx + ']';
		},
		attribute: function() {
			return this.ofObject.toFlat() + '&rarr;' + this.attributeName;
		},
		operation: function() {
			return '(' + nul.txt.flat.all(this.operands).join(' '+this.operator+' ') + ')';
		},
		extension: function() {
			//TODO
		},
		number: function() {
			return ''+this.value;
		},
		string: function() {
			return this.value;
		},
		'boolean': function() {
			return this.value?'true':'false';
		},
		range: function() {
			//TODO2: draw real range  
			return '&#x2124;';
		},
		other: function() {
			return this.type;
		},
		
		dotted: function() {
			return this.first.toFlat() + ' &rarr; ' + this.second.toFlat();
		},
		singleton: function() {
			return '{' + this.first.toFlat() + '}';
		},
		list: function(flat) {
			return '(' + nul.txt.flat.all(flat).join(', ') +
				(flat.follow?(',.. '+flat.follow.toFlat()):'')+ ')';
		},
		set: function(flat) {
			return '{' + nul.txt.flat.all(flat).join(' &#9633; ') + '}' +
				(flat.follow?(' &cup; '+flat.follow.toFlat()):'');
		},
		
		eqCls: function() {
			return '(' + nul.txt.flat.all(this.equivalents()).join(' = ') + ')' +
				(this.belongs.length?(' &in; ' + nul.txt.flat.all(this.belongs).join(', ')):'');
		},
		klg: function() {
			return nul.txt.flat.all(this.eqCls).join('; ');
		},
		fuzzy: function() {
			var klgStr = nul.txt.flat.klg.apply(this);
			var valStr = this.value.toFlat();
			if(!klgStr.length) return valStr;
			return valStr + '; ' + klgStr;
		}
	}
};