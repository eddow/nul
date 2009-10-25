/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO D

nul.txt.flat = merge({
	drawing: [],
	all: function(ass) {
		return maf(ass, function() { return this.toFlat(); });
	},
	recurStr: '[recur]',
	wrap: function(txt) { return txt; },
	outp: function(xpr) { return xpr; },
	draw: {
		pair: function() { return nul.txt.flat.dispatchPair(this, this); },
		
		local: function() {
			if(nul.debug.assert) assert(this.dbgName, 'Local has name if debug enabled'); 
			return (this.dbgName||'') + '[' + this.klgRef + '|' + this.ndx + ']';
		},
		attribute: function() {
			return this.ofObject.toFlat() + '&rarr;' + this.attributeName;
		},
		operation: function() {
			return '(' + nul.txt.flat.all(this.operands).join(' '+this.operator+' ') + ')';
		},
		extension: function() {
			var attrs = [];
			for(var an in this.attr) if(cstmNdx(an, this.attr))
				attrs.push('::' + an + ' ' + this.attr[an].toFlat());
			return '[' + attrs.join(' ') + ']';
		},
		number: function() {
			if(pinf==this.value) return '+&infin;';
			if(ninf==this.value) return '-&infin;';
			return ''+this.value;
		},
		string: function() {
			return '"'+this.value+'"';
		},
		'boolean': function() {
			return this.value?'true':'false';
		},
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
		data: function() {
			return '['+this.source.context+':'+this.source.index+']';
		},
		other: function() {
			return this.expression;
		},
		
		lambda: function() {
			return this.point.toFlat() + ' &rArr; ' + this.image.toFlat();
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
		ior3: function() {
			return '(' + nul.txt.flat.all(this.possibles()).join(' &#9633; ') + ')';
		},
		
		eqCls: function() {
			var attr = [];
			for(var anm in this.attribs) if(anm)
				attr.push(anm+': '+this.attribs[anm].toFlat())
			attr = (attr.length)?('['+attr.join(', ')+']'):'';
			return '(' + attr + nul.txt.flat.all(this.equivls).join(' = ') + ')' +
				(this.belongs.length?(' &isin; ' + nul.txt.flat.all(this.belongs).join(', ')):'');
		},
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
		kior3: function() {
			return '('+nul.txt.flat.all(maf(this.choices)).join(' &or; ')+')';
		},
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