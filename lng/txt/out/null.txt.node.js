/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//doing
/**
 * Expression HTML node description building 
 * @extends nul.txt
 * @class Singleton
 */
nul.txt.node = new JS.Singleton(nul.txt, /** @lends nul.txt.node */{
	
	drawing: [],
	/**
	 * Shortcut to make a table of string out of a table of expressions
	 * @param {nul.expression[]} ass
	 * @return {HTML[]}
	 */
	all: function(ass, glu, b4, a9, flwr) {
		var lst = maf(ass, function() { return this.toNode(); });
		var rv = b4||[];
		if(!$.isArray(rv)) rv = [rv];
		if(lst.length) {
			rv.push(lst[0]);
			for(var i=1; lst[i]; ++i) rv.pushs([glu.clone(), lst[i]]);
		}
		if(flwr && ass.follow) rv.pushs([flwr, ass.follow.toNode()]);
		if(a9) rv.push(a9);
		return rv;
	},
	/** @constant */
	recurStr: $('<span>[recur]</span>'),
	/**
	 * Called for each drawn expression to wrap it in common spans and add the tiles (for dependance, ...)
	 * @param {HTML} txt The text specific to this expression
	 * @param {nul.expression} xpr
	 * @return {HTML}
	 */
	wrap: function(txt, xpr) {
		function tilesNode(knd, cnt, pos) {
			if(cnt.toHtml) cnt = cnt.toHtml();
			return $('<a />').attr('class',knd+' _nul_xpr_tile').css('margin-left', (5*pos)+'px').append($('<div />').html(cnt));
		}
		
		var tiles = {};
		tiles.shortStr = xpr.toFlat();
		tiles.index = xpr.toString();
		if(xpr.selfRef) tiles.reference = xpr.selfRef;
		merge(tiles, txt);
		delete tiles[''];
		
		var deps = xpr.dependance();
		if(!isEmpty(deps.usages)) tiles['dependances'] = deps;

		var rv = $('<span />').addClass(xpr.expression).addClass('xpr');
		if(nul.debugged) nul.assert(xpr.origin, 'Each expression have an origin.');
		rv.append(tilesNode('explain', xpr.origin, 0).click(nul.txt.node.explain(xpr)));
				/*$('<a />')
				.attr({'class':'explain _nul_xpr_tile', title: 'Explain'})
				.css('margin-left', '0px')
				.click(nul.txt.node.explain(xpr)));*/
		var spos = 1;
		for(var t in tiles) rv.append(tilesNode(t, tiles[t], spos++));
		
		for(var i=0; i<txt[''].length; ++i)
			rv.append(txt[''][i]);
		return rv;
	},
	outp: function(xpr) { return xpr; },
	/** @namespace */
	draw: {
		/**
		 * @methodOf nul.obj.pair#
		 * @return {HTML}
		 */
		pair: function() { return nul.txt.node.dispatchPair(this); },
		
		/**
		 * @methodOf nul.obj.local#
		 * @return {HTML}
		 */
		local: function() {
			nul.assert(this.dbgName, 'Local has name if debug enabled');
			
			return {
				'': [this.dbgName, $('<span class="desc"/>')
						.append($('<span class="sup"/>').html(this.ndx))
						.append($('<span class="sub"/>').html(this.klgRef))]
                };
		},

		/**
		 * @methodOf nul.obj.operation#
		 * @return {HTML}
		 */
		operation: function() {
			return {'': nul.txt.node.all(this.operands, nul.txt.node.op(this.operator), nul.txt.node.op('('), nul.txt.node.op(')'))};
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
			return {'': '"'+this.value+'"'};	//TODO 3: html escape
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
			return {'': [ltr, $('<span class="desc" />')
			             .append($('<span class="sup" />').text((pinf==this.upper)?'&infin;':this.upper))
			             .append($('<span class="sub" />').text((ninf==this.lower)?'&infin;':this.lower))]
			};
		},
		/**
		 * @methodOf nul.obj.data#
		 * @return {HTML}
		 */
		data: function() {
			return {
				'': [nul.txt.node.op('&Dagger;'), $('<span class="desc"/>')
						.append($('<span class="sup"/>').html(this.source.index))
						.append($('<span class="sub"/>').html(this.source.context))]
                };
		},
		/**
		 * @methodOf nul.expression#
		 * @return {HTML}
		 */
		other: function() {
			return {'': [this.expression]};
		},
		
		/**
		 * @methodOf nul.obj.lambda#
		 * @return {HTML}
		 */
		lambda: function() {
			return {'': [this.point.toNode(), nul.txt.node.op('&rArr;'), this.image.toNode()]};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @return {HTML}
		 */
		singleton: function() {
			return {'': [nul.txt.node.op('{'), this.first.toNode(), nul.txt.node.op('}')]};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {HTML}
		 */
		list: function(flat) {
			return {'': nul.txt.node.all(flat, nul.txt.node.op(','), nul.txt.node.op('('), nul.txt.node.op(')'), nul.txt.node.op(',..'))};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {HTML}
		 */
		set: function(flat) {
			return {'': nul.txt.node.all(flat, nul.txt.node.op('&#9633;'), nul.txt.node.bigop('{'), nul.txt.node.bigop('}'), nul.txt.node.op('&cup;'))};
		},
		
		/**
		 * @methodOf nul.klg.eqClass#
		 * @return {HTML}
		 */
		eqCls: function() {
			var attrs = $('<table />');
			for(var an in ownNdx(this.attribs))
				attrs.append($('<tr />')
						.append($('<th />').html(an))
						.append($('<td />').append(this.attribs[an].toNode())));
			var b4 = [nul.txt.node.op('(')];
			if(attrs.children().length) b4.push(attrs);
			var lst = nul.txt.node.all(this.equivls, nul.txt.node.op('='), b4, nul.txt.node.op(')'));
			if(this.belongs.length) {
				lst.pushs(nul.txt.node.op('&isin;'), nul.txt.node.all(this.belongs, nul.txt.node.op(',')));
			}
			return {'': lst};
		},
		/**
		 * @methodOf nul.xpr.knowledge#
		 * @return {HTML}
		 */
		klg: function() {
			if(this.isA(nul.klg.ncndtnl)) return {'':[nul.txt.node.op(this.name)]};
			var rv = nul.txt.node.all(this.eqCls, nul.txt.node.op('&and;'));
			var ior3 = nul.txt.node.all(this.ior3, nul.txt.node.op('&and;'));
			var veto = nul.txt.node.all(this.veto, nul.txt.node.op('&or;'));
			
			if(rv.length && ior3.length) rv.pushs(nul.txt.node.op('&and;'), ior3);
			else if(ior3.length) rv = ior3;
			
			if(rv.length && veto.length) rv.pushs(nul.txt.node.op('&and;'), nul.txt.node.op('&not;'));
			else if(veto.length) rv = [nul.txt.node.op('&not;')];
			if(veto.length) rv.pushs(veto);
			
			return {
				'': rv.length?[nul.txt.node.op('(')].pushs(rv, nul.txt.node.op(')')):[],
				locals: this.name + (this.locals.length?(' : ' + this.locals.join(', ')):'')
			};
		},
		/**
		 * @methodOf nul.klg.ior3#
		 * @return {HTML}
		 */
		ior3: function() {
			return {'': nul.txt.node.all(this.choices, nul.txt.node.op('&or;'), nul.txt.node.op('('), nul.txt.node.op(')'))};
		},
		
		/**
		 * @methodOf nul.xpr.possible#
		 * @return {HTML}
		 */
		possible: function() {
			if(this===nul.xpr.failure) return { '': nul.txt.node.op('Failure') };
			if(this.knowledge===nul.klg.always) return { '': this.value.toNode() };
			return {
				'': [$('<table class="xpr freedom" />')
						.append($('<tr><td class="freedom" /></tr>').append(this.value.toNode()))
						.append($('<tr><th class="freedom" /></tr>').append(this.knowledge.toNode()))]
			};
		}
	},
	op: function(os) { return $('<span class="op" />').html(os); },
	bigop: function(os) { return $('<span class="big op" />').html(os); },
	
	explain: function(xpr) {
		return function() {
			nul.xpr.use(xpr);
			alert(xpr.toFlat());
		};
	}
});
