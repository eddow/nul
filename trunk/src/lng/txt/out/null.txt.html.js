/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/lng/txt/out/null.txt
// css: src/lng/txt/out/null.txt.html

/**
 * Singleton
 * @class HTML expression building helper 
 */
html = {
	_attrd: function(a) {
		switch(typeof a) {
		case 'undefined': return {};
		case 'object': return a;
		case 'string': return {'class':a};
		}
		throw 'unknown attributes';
	},
	tagged: function(tag, attrs, cnt) {
		var rv = '<'+tag;
		for(var a in attrs) if(attrs[a]) rv += ' '+a+'="'+attrs[a]+'"';
		if(null=== cnt) return rv + ' />';
		return rv + '>' + cnt + '</'+tag+'>';
	},
	
	div: function(a, cnt) {
		return html.tagged('div', html._attrd(a), cnt);
	},
	span: function(a, cnt) {
		return html.tagged('span', html._attrd(a), cnt);
	},
	op: function(o) {
		return ' ' + html.span('op', o) + ' ';
	},
	table: function(cnt, a) {
		return html.tagged('table', html._attrd(a), cnt);
	},
	tr: function(cnt, a) {
		return html.tagged('tr', html._attrd(a), cnt);
	},
	th: function(cnt, a) {
		return html.tagged('th', html._attrd(a), cnt);
	},
	td: function(cnt, a) {
		return html.tagged('td', html._attrd(a), cnt);
	},

	tilesStr: function(knd, cnt, pos) {
		if(cnt.toFlat) {
			ttl = cnt.toFlat();
			cnt = cnt.toHtml();
		} else ttl = cnt;
		return ''+
			html.tagged('a', {
				'class': knd+' _nul_xpr_tile',
				//title: ttl,
		        style: 'margin-left: '+(5*pos)+'px;'
			}, html.div({}, cnt));
	}
};

/**
 * Singleton
 * @class Expression HTML description building helper 
 * @extends nul.txt
 */
nul.txt.html = new JS.Singleton(nul.txt, /** @lends nul.txt.html */{
	
	drawing: [],
	/**
	 * Shortcut to make a table of string out of a table of expressions
	 * @param {nul.expression[]} ass
	 * @return {HTML[]}
	 */
	all: function(ass) {
		return maf(ass, function() { return this.toHtml(); });
	},
	/** @constant */
	recurStr: '[recur]',
	/**
	 * Called for each drawn expression to wrap it in common spans and add the tiles (for dependance, ...)
	 * @param {HTML} txt The text specific to this expression
	 * @param {nul.expression} xpr
	 * @return {HTML}
	 */
	wrap: function(txt, xpr) {
		var tilesStr = '';
		var tiles = {};
		tiles.shortStr = xpr.toFlat();
		tiles.index = xpr.toString();
		if(xpr.selfRef) tiles.reference = xpr.selfRef;
		merge(tiles, txt);
		delete tiles[''];
		var spos = 0;
		for(var t in tiles) tilesStr += html.tilesStr(t, tiles[t], spos++);
		
		var deps = xpr.dependance();
		var df = deps.toFlat();
		if(df) tilesStr += html.tilesStr('dependances', deps, spos++);
		return html.span('xpr',
				tilesStr+
				html.span(xpr.expression, txt['']));
	},
	outp: function(xpr) { return xpr; },
	/** @namespace */
	draw: {
		/**
		 * @methodOf nul.obj.pair#
		 * @return {HTML}
		 */
		pair: function() { return nul.txt.html.dispatchPair(this); },
		
		/**
		 * @methodOf nul.obj.local#
		 * @return {HTML}
		 */
		local: function() {
			if(nul.debugged) nul.assert(this.dbgName, 'Local has name if debug enabled'); 
			return {
				'': this.dbgName? (
	                	this.dbgName+
	                	html.span('desc', html.span('sup',this.ndx)+
	                	html.span('sub',this.klgRef))
                	) : this.ndx+html.span('desc', html.span('sub',this.klgRef))
                };
		},

		/**
		 * @methodOf nul.obj.operation#
		 * @return {HTML}
		 */
		operation: function() {
			return {'': html.op('(') +
				nul.txt.html.all(this.operands)
					.join(html.op(this.operator)) +
				html.op(')')};
		},
		/**
		 * @methodOf nul.obj.litteral.number#
		 * @return {HTML}
		 */
		number: function() {
			if(pinf==this.value) return {'': '+&infin;'};
			if(ninf==this.value) return {'': '-&infin;'};
			return {'': ''+this.value};
		},
		/**
		 * @methodOf nul.obj.litteral.string#
		 * @return {HTML}
		 */
		string: function() {
			return {'': '"'+this.value+'"'};
		},
		/**
		 * @methodOf nul.obj.litteral.boolean#
		 * @return {HTML}
		 */
		'boolean': function() {
			return {'': this.value?'true':'false'};
		},
		/**
		 * @methodOf nul.obj.range#
		 * @return {HTML}
		 */
		range: function() {
			var ltr = 0> this.lower ?
				'&#x2124;':	//ℤ
				'&#x2115;';	//ℕ
			if(pinf==this.upper) {
				if(ninf==this.lower) return {'': ltr};
				if(0== this.lower) return {'': ltr};
			}
			return {'': ltr+html.span('desc',
				html.span('sup',(pinf==this.upper)?'&infin;':this.upper)+
                html.span('sub',(ninf==this.lower)?'&infin;':this.lower))};
		},
		/**
		 * @methodOf nul.obj.data#
		 * @return {HTML}
		 */
		data: function() {
			return {
				'': html.span('op','&Dagger;') +
	                	html.span('desc', html.span('sup',this.source.index)+
	                	html.span('sub',this.source.context))
                };
		},
		/**
		 * @methodOf nul.expression#
		 * @return {HTML}
		 */
		other: function() {
			return {'': this.expression};
		},
		
		/**
		 * @methodOf nul.obj.lambda#
		 * @return {HTML}
		 */
		lambda: function() {
			return {'': this.point.toHtml() + html.op('&rArr;') + this.image.toHtml()};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @return {HTML}
		 */
		singleton: function() {
			return {'': html.op('{') + this.first.toHtml() + html.op('}')};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {HTML}
		 */
		list: function(flat) {
			return {'': html.op('(') + nul.txt.html.all(flat).join(html.op(',')) +
				(flat.follow?(html.op(',.. ')+flat.follow.toHtml()):'')+ html.op(')')};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {HTML}
		 */
		set: function(flat) {
			return {
				'': html.span('big op','{') +
						nul.txt.html.all(flat).join(' &#9633; ') +
					html.span('big op','}') +
					(flat.follow?(html.op('&cup;')+flat.follow.toHtml()):'')
			};
		},
		
		/**
		 * @methodOf nul.klg.eqClass#
		 * @return {HTML}
		 */
		eqCls: function() {
			var attrs = [];
			for(var an in ownNdx(this.attribs))
				attrs.push(html.tr(html.th(an)+html.td(this.attribs[an].toHtml())));

			attrs = attrs.length?html.table(attrs.join(''),'attributes'):'';

			return {'': html.op('(') + attrs +
				nul.txt.html.all(this.equivls).join(html.op('=')) +
				html.op(')') +
				(this.belongs.length?
					(html.op('&isin;') + nul.txt.html.all(this.belongs).join(html.op(','))):
					'')};
		},
		/**
		 * @methodOf nul.xpr.knowledge#
		 * @return {HTML}
		 */
		klg: function() {
			if(this.isA(nul.klg.ncndtnl)) return {'':html.op(this.name)};
			var rv = nul.txt.html.all(this.eqCls).join(html.op('&and;'));
			var ior3 = nul.txt.html.all(this.ior3).join(html.op('&and;'));
			var veto = nul.txt.html.all(this.veto).join(html.op('&or;'));
			if(rv && ior3) rv += html.op('&and;') + ior3;
			else if(ior3) rv = ior3;
			if(rv && veto) rv += html.op('&and;')+html.op('&not;') + veto;
			else if(veto) rv = html.op('&not;') + veto;
			return {
				'': rv?(html.op('(')+rv+html.op(')')):'',
				locals: this.name + (this.locals.length?(' : ' + this.locals.join(', ')):''),
				arbitre: '['+this.minMult+((this.minMult==this.maxMult)?'':('-'+this.maxMult))+']'
			};
		},
		/**
		 * @methodOf nul.klg.ior3#
		 * @return {HTML}
		 */
		ior3: function() {
			return {
				'': html.op('(')+nul.txt.html.all(this.choices).join(html.op('&or;'))+html.op(')')
			};
		},
		
		/**
		 * @methodOf nul.xpr.possible#
		 * @return {HTML}
		 */
		possible: function() {
			if(this===nul.xpr.failure) return { '': html.op('Failure') };
			if(this.knowledge===nul.klg.always) return { '': this.value.toHtml() };
			return {
				'': html.table(
					html.tr(html.td(this.value.toHtml(),'freedom')) +
					html.tr(html.th(this.knowledge.toHtml(),'freedom')),
					'xpr freedom')
			};
		}
	}

});
