/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.atom = Class.create(nul.xpr.uncomposed, {
	failable: function() { return false; },
	initialize: function($super) { $super(); }
});

nul.xpr.value = Class.create(nul.xpr.primitive(nul.xpr.atom), {
	charact: 'value',
	finalRoot: function() { return true; },
	initialize: function($super, jsValue) {
		this.primitive = typeof jsValue;
		if('number'== this.primitive && nul.isJsInt(jsValue))
			this.primitive = 'integer';
		this.value = jsValue;
		//this.fuzze = {};
		this.composed();
		$super();
	},
	composed: function($super) {
		this.acNdx =
			'[' +
			this.jsValue().toString()
				.replace('[','[(]')
				.replace(']','[)]')
				.replace('|','[|]') +
			']';
		return $super();
	},
	jsValue: function() { return nul.jsVal(this.value); },
/////// String
	expressionHTML: function() {
		return '<span class="value">' + nul.jsVal(this.value) + '</span>';
	},
	expressionString: function() {
		return nul.jsVal(this.value);
	}
});

nul.xpr.local = Class.create(nul.xpr.atom, {
	charact: 'local',
	makeDeps: function() {
		return nul.lcl.dep.dep(this.ctxName, this.lindx);
	},
/////// Ctor
	initialize: function($super, ctxName, lindx, dbgName) {
		this.ctxName = ctxName;
		this.lindx = lindx;
		this.dbgName = dbgName;
		
		/*this.fuzze = {};
		this.fuzze[ctxName] = new nul.fuzze();*/
		this.composed();
		$super();
	},
	composed: function($super) {
		this.acNdx = nul.xpr.local.ndx(this.lindx, this.ctxName);
		return $super();
	},
/////// Strings
	expressionHTML: function() {
		return this.dbgName? (
			'<span class="local">'+this.dbgName+'<span class="desc"><span class="sup">'+this.lindx+'</span><span class="sub">'+this.ctxName+'</span></span></span>'
			) : (
			'<span class="local">'+this.lindx+'<span class="desc"><span class="sub">'+this.ctxName+'</span></span></span>'
			);
	},
	expressionString: function() {
		return (this.dbgName?this.dbgName:'')+ this.acNdx;
	}
});

nul.xpr.local.ndx = function(lindx, ctxName) {
	return '['+lindx+'|'+ctxName+']';
};