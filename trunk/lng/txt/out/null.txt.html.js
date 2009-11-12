/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * HTML expression building helper 
 * @class Singleton
 */
html = {
	tagged: function(tag, attrs, cnt) {
		var rv = '<'+tag;
		for(var a in attrs) if(attrs[a]) rv += ' '+a+'="'+attrs[a]+'"';
		if(null=== cnt) return rv + ' />';
		return rv + '>' + cnt + '</'+tag+'>';
	},
	span: function(cls, cnt) {
		return html.tagged('span', {'class': cls}, cnt);
	},
	op: function(o) {
		return ' ' + html.span('op', o) + ' ';
	},
	table: function(cnt, cls) {
		return html.tagged('table', {'class': cls}, cnt);
	},
	tr: function(cnt, cls) {
		return html.tagged('tr', {'class': cls}, cnt);
	},
	th: function(cnt, cls) {
		return html.tagged('th', {'class': cls}, cnt);
	},
	td: function(cnt, cls) {
		return html.tagged('td', {'class': cls}, cnt);
	},

	tilePopup: function(knd, cnt) {
		return ''+
			html.tagged('div', {
				'class': knd,
		        onmouseout: 'nul.txt.html.js.leave();',
		        style: 'display: none;'
			}, cnt);
	},
	tileSquare: function(knd, ttl, pos) {
        return ''+
			html.tagged('a', {
				'class': knd,
				title: ttl,
		        onmouseover: 'nul.txt.html.js.enter(this.parentNode, \''+knd+'\');',
		        style: 'left: '+(5*pos)+'px;'
			}, '');
	}
};

/**
 * Expression HTML description building helper 
 * @class Singleton
 */
nul.txt.html = merge(/** @lends nul.txt.html */{
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
		var tileSquares = '', tilePopups = '';
		var tiles = {};
		tiles.shortStr = xpr.toFlat();
		tiles.index = xpr.toString();
		if(xpr.selfRef) tiles.reference = xpr.selfRef;
		merge(tiles, txt);
		delete tiles[''];
		var spos = 0;
		for(var t in tiles) {
			tileSquares += html.tileSquare(t, tiles[t], spos++);
			tilePopups += html.tilePopup(t, tiles[t]);
		}
		
		var deps = xpr.dependance();
		var df = deps.toFlat();
		if(df) {
			tileSquares += html.tileSquare('dependances', df, spos++);
			tilePopups += html.tilePopup('dependances', deps.toHtml());
		}
		return html.span('xpr',
			tilePopups+tileSquares+
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
			if(nul.debug.assert) assert(this.dbgName, 'Local has name if debug enabled'); 
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
			for(var an in this.attribs) if(cstmNdx(an))
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
			if(nul.klg.ncndtnl.is(this)) return {'':html.op(this.name)};
			var rv = nul.txt.html.all(this.eqCls).join(html.op('&and;'));
			var ior3 = nul.txt.html.all(this.ior3).join(html.op('&and;'));
			var veto = nul.txt.html.all(this.veto).join(html.op('&or;'));
			if(rv && ior3) rv += html.op('&and;') + ior3;
			else if(ior3) rv = ior3;
			if(rv && veto) rv += html.op('&and;')+html.op('&not;') + veto;
			else if(veto) rv = html.op('&not;') + veto;
			rv = {
				'': rv?(html.op('(')+rv+html.op(')')):'',
				locals: this.name + (this.locals.length?(' : ' + this.locals.join(', ')):''),
				arbitre: nul.klg.unconditional(this).name
			};
			return rv;
		},
		/**
		 * @methodOf nul.klg.ior3#
		 * @return {HTML}
		 */
		ior3: function() {
			return {
				'': html.op('(')+nul.txt.html.all(maf(this.choices)).join(html.op('&or;'))+html.op(')')
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
	},
	
	/** @namespace Tiles managing events*/
	js: {
		/**
		 * Event occuring when the mouse enters a tile
		 * @event
		 * @param {HTMLElement} elm The element (expression span) this event applies to
		 * @param {String} knd The kind of tile the mouse interract with
		 */
		enter: function(elm, knd) {
			$(elm);
			if(this.entered && elm == this.entered[0] && knd == this.entered[1]) return;
			if(this.entered) this.leave();
			this.entered = [elm, knd];
			elm.addClassName('lined');
			elm.getElementsBySelector('a.'+knd).each(Element.hide);
			elm.getElementsBySelector('div.'+knd).each(Element.show);
			elm.getElementsBySelector('span a.'+knd).each(Element.show);
			elm.getElementsBySelector('span div.'+knd).each(Element.hide);
			//this.keepTimeOut = window.setTimeout('nul.txt.js.leave();',100);
		},
		/**
		 * Event occuring when the mouse leaves a tile
		 * @event
		 * @param {HTMLElement} elm The element (expression span) this event applies to
		 * @param {String} knd The kind of tile the mouse interract with
		 */
		leave: function(elm, knd) {
			if(!this.entered) return;
			elm = this.entered[0];
			knd = this.entered[1];
			delete this.entered;
			elm.removeClassName('lined');
			elm.getElementsBySelector('a.'+knd).each(Element.show);
			elm.getElementsBySelector('div.'+knd).each(Element.hide);
		}
	}
}, nul.txt);