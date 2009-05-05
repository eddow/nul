/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.text = {
	drawing: [],
	beginDraw: function(xpr) {
		if(nul.text.drawing.contains(xpr)) return false;
		nul.text.drawing.push(xpr);
		return true;
	},
	endDraw: function(xpr) {
		if(nul.debug.assert) assert(xpr==nul.text.drawing.pop(), 'Drawing consistency');
		else nul.text.drawing.pop();
	},
	tblHTML: function(tbl, glue) {
		if(isArray(tbl)) return map(tbl, function() {
			return this.dbgHTML();
		}).join(glue || ' and ');
		return tbl.dbgHTML();
	},
	js: {
		tilement: '',
		tilePos: 0,
		tiled: function() {
			var rv = this.tilement;
			this.tilement = '';
			this.tilePos = 0;
			return rv;
		},
		tile: function(knd, cnt, ttl) {
			var aCnt = '';
			if(isArray(ttl)) {
				for(var i=0; i<ttl.length; ++i) aCnt +=
					'<div class="'+ttl[i].toLowerCase()+'"></div>'
				ttl = null;
			}
			if(!ttl) ttl = cnt;
			this.tilement += '<a class="'+knd+'" '+
				'title="'+ttl+'" '+
				'onmouseover="nul.text.js.enter(this.parentNode, \''+knd+'\');" '+
				'style="left: '+((this.tilePos++)*5)+'px;" '+
				'>'+aCnt+'</a>' ;
			return '<div class="'+knd+'" '+
				'onmouseout="nul.text.js.leave();" '+
				'onmouseover="nul.text.js.keepIn();" '+
				'style="display: none;" '+
				'>'+ cnt + '</div>';
		},
		keepIn: function() {
			if(this.keepTimeOut) {
				window.clearTimeout(this.keepTimeOut);
				delete this.keepTimeOut;
			}
		},
		enter: function(elm, knd) {
			if(this.entered && elm == this.entered[0] && knd == this.entered[1]) return;
			if(this.entered) this.leave();
			this.entered = [elm, knd];
			elm.addClassName('lined');
			elm.getElementsBySelector('a.'+knd).each(Element.hide);
			elm.getElementsBySelector('div.'+knd).each(Element.show);
			elm.getElementsBySelector('span a.'+knd).each(Element.show);
			elm.getElementsBySelector('span div.'+knd).each(Element.hide);
			//this.keepTimeOut = window.setTimeout('nul.text.js.leave();',100);
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
	expressionHTML: function(oprtr, oprnds) {
		var strings = [];
		for(var i=0; i<oprnds.length; ++i)
			strings.push(oprnds[i].toHTML());
		return strings.join(' '+oprtr+' ');
	},
	expressionString: function(oprtr, oprnds) {
		var strings = [];
		for(var i=0; i<oprnds.length; ++i)
			strings.push(oprnds[i].toString());
		return strings.join(' '+(oprtr?(oprtr+' '):''));
	},
	toHTML: function() {
		//if(!this.toHTML.cache) {
			var aShort = this.toString();
			if(!nul.text.beginDraw(this)) return '<span class="failure">Self contained!</span>';
			var aLocals = '', aDeps = '', aDepsTtl = '',
				aFlags, aBlngs = '', aAutoRef = '', aFuzze = '';
			aShort = nul.text.js.tile('shortStr', aShort);
			if(this.ctxDef) aAutoRef = nul.text.js.tile('autoRef', this.ctxDef);
			aFlags = 
				(this.x?this.x.primitive:'free') + ' : ' +
				(isEmpty(this.flags)?'&phi;':keys(this.flags).join(', '));
			aFlags = nul.text.js.tile('flags',
				aFlags,
				keys(this.flags));
			if(this.deps && !isEmpty(this.deps)) {
				for(var i in this.deps) {
					var ds = [];
					for(var j in this.deps[i])
						ds.push(j+':'+this.deps[i][j]);
					aDeps += '<tr><th>'+i+'</th><td>'+ds.join('</td><td>')+'</td></tr>';
					aDepsTtl += i+'['+ds.join(',')+']';
				}
				aDeps = nul.text.js.tile('dependances', '<table>'+aDeps+'</table>', aDepsTtl);
			}
			var cls = '';
			if(this.ctxName && 'local'!= this.charact) {
				aLocals = [];
				if(this.locals && this.locals.length)
					aLocals = nul.text.js.tile('locals', this.ctxName + ': ' + this.locals.join(', '));
				else aLocals = nul.text.js.tile('locals', this.ctxName);
				cls=' freedom'
			}
			if(this.belong.length) {
				aBlngs = map(this.belong, function() { return this.toString(); });
				aBlngs = nul.text.js.tile('belongs',
					'<table><tr><td>'+aBlngs.join('</td><td>')+'</td></tr></table>',
					aBlngs.join(' | '));
			}
			if(!isEmpty(this.fuzze)) {
				aFuzze = keys(this.fuzze);
				aFuzze = nul.text.js.tile('fuzze',
					'<table><tr><td>'+aFuzze.join('</td><td>')+'</td></tr></table>',
					aFuzze.join(' | '));
			}
			var rv = aShort+aAutoRef+aLocals+aDeps+aFlags+aBlngs+aFuzze+
				nul.text.js.tiled();
			rv += this.expressionHTML();
			nul.text.endDraw(this);
			this.toHTML.cache = '<span class="xpr'+cls+'">'+rv+'</span>';
		//}
		return this.toHTML.cache;
	}.perform('nul.text->toHTML'),
	toString: function() {
		//if(!this.toString.cache) {
			if(!nul.text.beginDraw(this)) return '&lt;Self contained!&gt;';
			var rv = '';
			if(this.ctxDef) rv += this.ctxDef+':';
			rv += this.expressionString();
			nul.text.endDraw(this);
			this.toString.cache = rv;
		//}
		return this.toString.cache;
	},
	clpsSstm : function(table, uc, lcFct) {
		return table ? table.clpsSstm = {
			table: table,
			uc: uc,
			collapsing: {},
			toPair: [],
			lineCount: lcFct || function() { return this.table.rows.length-('up'==this.uc?0:1); },
			collapser: function(html) {
				this.toPair.push(this.lineCount());
				return '<span class="collapser start"><a class="collapser" ' +
					'onclick="nul.text.collapse(this, '+this.lineCount()+');">&darr;</a></span>'+
					'<span class="uncollapser start"><a class="collapser" ' +
					'onclick="nul.text.uncollapse(this, '+this.lineCount()+');">+</a></span>'+
					html;
			},
			endCollapser: function(opnd, clsd) {
				var plc = this.toPair.pop();
				if('undefined'== typeof clsd) clsd = opnd;
				if('undefined'!= typeof this.collapsing[plc]) return '';	//Collaper was not drawn
				this.collapsing[plc] = this.lineCount();
				return '<span class="collapser end">' +
					'<a class="collapser" ' +
					'onclick="nul.text.collapse(this, '+plc+');">&uarr;</a>' + opnd +
					'</span><span class="uncollapser end">' +
					'<a class="collapser" ' +
					'onclick="nul.text.uncollapse(this, '+plc+');">+</a>' + clsd +
					'</span>';
			},
			//'collapsed' class name is added once for each collapsement : this is not a bug if it appears
			// several time on an item
			collapse: function(lc) {
				assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
				var r;
				for(r=lc; r<this.collapsing[lc]; ++r)
					$(this.table.rows[r]).className = 'collapsed ' + $(this.table.rows[r]).className;
				this.table.rows[r].addClassName('uncollapsing');
				if('up'==this.uc && 0<lc) this.table.rows[lc-1].addClassName('unsubcollapsing');
			},
			uncollapse: function(lc) {
				assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
				var r;
				for(r=lc; r<this.collapsing[lc]; ++r)
					$(this.table.rows[r]).className = $(this.table.rows[r]).className.substr('collapsed '.length);
				this.table.rows[r].removeClassName('uncollapsing');
				if('up'==this.uc && 0<lc) this.table.rows[lc-1].removeClassName('unsubcollapsing');
			}			
		} : {
			collapser: function(html) {},
			endCollapser: function(opnd, clsd) {}
		};
	},
	//'collapsed' class name is added once for each collapsement : this is not a bug if it appears
	// several time on an item
	collapse: function(tbl, lc) {
		while(tbl && !tbl.clpsSstm) tbl = tbl.parentNode;
		assert(tbl,'No orphan collapsers');
		return tbl.clpsSstm.collapse(lc);
	},
	uncollapse: function(tbl, lc) {
		while(tbl && !tbl.clpsSstm) tbl = tbl.parentNode;
		assert(tbl,'No orphan collapsers');
		return tbl.clpsSstm.uncollapse(lc);
	}	
};