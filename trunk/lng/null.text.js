/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.text = {
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
		var aLocals = '', aDeps = '', aDepsTtl = '', aShort = this.toString(),
			aFlags, aAttr, aAttrTtl;
		aShort = nul.text.js.tile('shortStr', this.toString(), 
			(('undefined'!= typeof this.x.lvl)?(this.x.lvl+'] '):'')+this.toString());
		aFlags = nul.text.js.tile('flags',
			isEmpty(this.flags)?'&phi;':keys(this.flags).join(', '),
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
		if(this.freedom && 0<this.locals.length) {
			aLocals = [];
			if(this.deps && this.deps[0] && this.deps[0][nul.lcl.slf])
				aLocals.push(nul.lcl.slf);
			for(var i=0; i<this.locals.length; ++i)
				aLocals.push(this.locals[i]);
			if(0<aLocals.length) aLocals = nul.text.js.tile('locals', aLocals.join(', '));
			else aLocals = '';
		}
		aAttrTtl = [];
		aAttr = [];
		for(var i in this.x.attributes) if(''!=i) {
			aAttr.push('<b>'+i+'</b>&nbsp;'+this.x.attributes[i].toString());
			aAttrTtl.push(i);
		}
		if(0>= aAttr.length) aAttr = '';
		else aAttr = nul.text.js.tile('attributes', aAttr.join('<hr />'), aAttrTtl.join(','));
		var rv = aShort+aLocals+aDeps+aFlags+aAttr+nul.text.js.tiled();
		if('undefined'!= typeof this.x.lvl)
			rv += '<div class="shortStr level" style="display: none;" >' +
				this.x.lvl + '</div>';
		if(this.key()) rv += this.key().toHTML() + '<span class="op">&lArr;</span>'; 
		rv += this.expressionHTML();
		var cls = this.freedom?' freedom':'';
		return '<span class="xpr'+cls+'">'+rv+'</span>';
	}.perform('nul.text->toHTML'),
	toString: function() {
		if(!this.key()) return this.expressionString();
		return this.key().toString() + ' :- ' + this.expressionString();
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