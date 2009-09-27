/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

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
		        style: 'display: none;',
			}, cnt);
	},
	tileSquare: function(knd, ttl, pos) {
        return ''+
			html.tagged('a', {
				'class': knd,
				title: ttl,
		        onmouseover: 'nul.txt.html.js.enter(this.parentNode, \''+knd+'\');',
		        style: 'left: '+(5*pos)+'px;',
			}, '');
	},
};

nul.txt.html = merge({
	drawing: [],
	all: function(ass) {
		return maf(ass, function() { return this.toHtml(); });
	},
	recurStr: '[recur]',
	wrap: function(txt, xpr) {
		var tileSquares = '', tilePopups = '';
		var tiles = {};
		tiles.shortStr = xpr.toFlat();
		tiles.index = xpr.toString();
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
	draw: {
		pair: function() { return nul.txt.html.dispatchPair(this, this); },
		
		local: function(ctx) {
			return {
				'': this.dbgName? (
                	this.dbgName+
                	html.span('desc', html.span('sup',this.ndx)+
                	html.span('sub',this.klgRef))
                ) : this.ndx+html.span('desc', html.span('sub',this.klgRef))};
		},
		attribute: function() {
			return {'': this.ofObject.toHtml() + html.op('&rarr;' + this.attributeName)};
		},
		operation: function() {
			return {'': html.op('(') +
				nul.txt.html.all(this.operands)
					.join(html.op(this.operator)) +
				html.op(')')};
		},
		extension: function() {
			//TODO2
		},
		number: function() {
			return {'': ''+this.value};
		},
		string: function() {
			return {'': this.value};
		},
		'boolean': function() {
			return {'': this.value?'true':'false'};
		},
		range: function() {
			//TODO2: draw real range  
			return {'': '&#x2124;'};
		},
		other: function() {
			return {'': this.expression};
		},
		
		lambda: function() {
			return {'': this.point.toHtml() + html.op('&rArr;') + this.image.toHtml()};
		},
		dotted: function() {
			return {'': this.first.toHtml() + html.op('|') + this.second.toHtml()};
		},
		singleton: function() {
			return {'': html.op('{') + this.first.toHtml() + html.op('}')};
		},
		list: function(flat) {
			return {'': html.op('(') + nul.txt.html.all(flat).join(html.op(',')) +
				(flat.follow?(html.op(',.. ')+flat.follow.toHtml()):'')+ html.op(')')};
		},
		set: function(flat) {
			return {
				'': html.span('big op','{') +
						nul.txt.html.all(flat).join(' &#9633; ') +
					html.span('big op','}') +
					(flat.follow?(html.op('&cup;')+flat.follow.toHtml()):'')
			};
		},
		ior3: function() {
			return {'': html.op('(') +
				nul.txt.html.all(this.possibles(ctx)).join(html.op('&#9633;')) +
				html.op(')')};
		},
		
		eqCls: function() {
			return {'': html.op('(') +
				nul.txt.html.all(this.equivalents).join(html.op('=')) +
				html.op(')') +
				(this.belongs.length?
					(html.op('&isin;') + nul.txt.html.all(this.belongs).join(html.op(','))):
					'')};
		},
		klg: function() {	//TODO3: draw ior3s ?
			return {
				'': nul.txt.html.all(this.eqCls).join(html.op(';')),
				locals: this.name + (this.locals.length?(' : ' + this.locals.join(', ')):''),
			};
		},
		possible: function() {
			return {
				'': html.table(
					html.tr(html.td(this.value.toHtml(),'freedom')) +
					html.tr(html.th(this.knowledge.toHtml(),'freedom')),
					'xpr freedom'),
			};
		},
	},
	
	js: {
		enter: function(elm, knd) {
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
		leave: function(elm, knd) {
			if(!this.entered) return;
			elm = this.entered[0];
			knd = this.entered[1];
			delete this.entered;
			elm.removeClassName('lined');
			elm.getElementsBySelector('a.'+knd).each(Element.show);
			elm.getElementsBySelector('div.'+knd).each(Element.hide);
		}
	},
}, nul.txt)