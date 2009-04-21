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
		this.acNdx = '[' +
				nul.jsVal(jsValue).toString()
					.replace('[','[(]')
					.replace(']','[)]')
					.replace('|','[|]') +
				']';
		this.value = jsValue;
		$super();
	},
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
		this.acNdx = '['+lindx+'|'+ctxName+']';
		this.dbgName = dbgName;
		$super();
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