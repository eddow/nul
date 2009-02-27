/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.text = {
	tblHTML: function(tbl, glue) {
		if(isArray(tbl)) return map(tbl, function(c) {
			return c.toHTML();
		}).join(glue || ' and ');
		return tbl.toHTML();
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
	toString: function(oprtr, oprnds) {
		var strings = [];
		for(var i=0; i<oprnds.length; ++i)
			strings.push(oprnds[i].toString());
		return '('+strings.join(' '+oprtr+' ')+')';
	},
	toHTML: function() {
		var aLocals = '', aDeps = '', aDepsTtl = '', aShort = this.toString(),
			aFlags, aAttr = '', aAttrTtl = '';
		aShort = nul.text.js.tile('shortStr', this.toString(), 
			(('undefined'!= typeof this.locals.lvl)?(this.locals.lvl+'] '):'')+this.toString());
		aFlags = nul.text.js.tile('flags',
			is_empty(this.flags)?'&phi;':keys(this.flags).join(', '),
			keys(this.flags));
		if(this.deps && !is_empty(this.deps)) {
			for(var i in this.deps) {
				var ds = [];
				for(var j in this.deps[i])
					ds.push(j+':'+this.deps[i][j]);
				aDeps += '<tr><th>'+i+'</th><td>'+ds.join('</td><td>')+'</td></tr>';
				aDepsTtl += i+'['+ds.join(',')+']';
			}
			aDeps = nul.text.js.tile('dependances', '<table>'+aDeps+'</table>', aDepsTtl);
		}
		if((0<this.locals.length) || (this.deps && this.deps[0])) {
			aLocals = [];
			if(this.deps && this.deps[0] && this.deps[0][nul.lcl.slf])
				aLocals.push(nul.lcl.slf);
			for(var i=0; i<this.locals.length; ++i)
				if(this.locals[i])
					aLocals.push(this.locals[i]);
			if(0<aLocals.length) aLocals = nul.text.js.tile('locals', aLocals.join(', '));
			else aLocals = '';
		}
		if(!is_empty(this.attributes)) {
			aAttrTtl = [];
			aAttr = [];
			for(var i in this.attributes) {
				aAttr.push('<b>'+i+'</b>&nbsp;'+this.attributes[i].toString());
				aAttrTtl.push(i);
			}
			aAttr = nul.text.js.tile('attributes', aAttr.join('<hr />'), aAttrTtl.join(','));
		}
		var str = aShort+aLocals+aDeps+aFlags+aAttr+nul.text.js.tiled();
		if('undefined'!= typeof this.locals.lvl)
			str += '<div class="shortStr level" style="display: none;" >' +
				this.locals.lvl + '</div>';
		var es = this.expressionHTML();
		var brn = ('<ul'== es.substr(0,3) || '<table'== es.substr(0,6)) ? 'div' : 'span';
		str += es;
		return 'span'==brn?('<span class="xpr">'+str+'</span>'):str;
	}.perform('nul.text->toHTML'),
};