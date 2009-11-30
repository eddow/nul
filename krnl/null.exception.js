/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.ex = new JS.Class(/** @lends nul.ex# */{
	/** @ignore */
	//include: [JS.Observable],
	/**
	 * Exception thrown by NUL
	 * @construct
	 */
	initialize: function(name, msg) {
		this.message = msg;
		this.code = name;
		//this.fire();
	},
	/**
	 * Throw this exception
	 */
	raise: function() { throw this; },
	extend: {
		be: function(x) {
			if(window.console && x.fileName && x.stack && 'number'== typeof x.lineNumber) {
				console.error(x);
				return new nul.ex.js('fbug', x.message, x.fileName, x.lineNumber);
			}
			if(!nul.ex.def(x)) return new nul.ex.unk(x);
			return x;
		},
		hook: function(wnd) {
			window.onerror = nul.ex.js.onerror;
		}, 
		/**
		 * When an exception function is called without 'new', just throw a new one
		 */
		initialize: function() {
			(new arguments.callee.caller(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6])).raise();
		}
	}
});

nul.ex.js = new JS.Class(nul.ex, /** @lends nul.ex.js# */{
	/**
	 * Exception thrown by JavaScript interpreter on JavaScript error.
	 * @extend nul.ex
	 * @construct
	 */
	initialize: function(name, msg, url, ln) {
		this.callSuper(name, msg);
		this.file = url;
		this.line = ln;
	},
	extend: /** @lends nul.ex.js */{
		/**
		 * window.onerror end-point
		 */
		onerror: function(msg, url, ln) {
			//if(window.console) return false;
			throw new nul.ex.js('auto', msg, url, ln);
		}
	},
	toString: function() { return 'JavaScript error'; }
});

nul.ex.hook(window);

nul.ex.semantic = new JS.Class(nul.ex, /** @lends nul.ex.semantic# */{
	/**
	 * Exception thrown by the NUL interpreter when the semantic of the NUL text is wrong
	 * @extend nul.ex
	 * @construct
	 */
	initialize: function(name, msg, xpr) {
		this.callSuper();
		this.xpr = xpr;
	},
	toString: function() { return 'Semantic error'; }
});

nul.ex.syntax = new JS.Class(nul.ex, /** @lends nul.ex.syntax# */{
	/**
	 * Exception thrown by the NUL interpreter when the syntax of the NUL text is wrong
	 * @extend nul.ex
	 * @construct
	 */
	initialize: function(name, msg, tknzr, type) {
		this.callSuper();
		this.token = tknzr.token;
		this.until = { line: tknzr.line, clmn: tknzr.clmn };
		this.type = type||'before';
	},
	select: function(editor) {
		switch(this.type) {
		case 'before': editor.selectLines(editor.nthLine(this.token.line+1), this.token.clmn); break;
		case 'token': editor.selectLines(editor.nthLine(this.token.line+1), this.token.clmn, editor.nthLine(this.until.line+1), this.until.clmn); break;
		}
	},
	toString: function() { return 'Syntax error'; }
});

nul.ex.unk = new JS.Class(nul.ex, /** @lends nul.ex.unk# */{
	/**
	 * Exception thrown by we don't know where 
	 * @extend nul.ex
	 * @construct
	 */
	initialize: function(obj) {
		this.callSuper('wtf', obj.toString());
		this.object = obj;
	},
	toString: function() { return 'Unknown error'; }
});

nul.ex.internal = new JS.Class(nul.ex, /** @lends nul.ex.internal# */{
	/**
	 * A bug in the NUL interpreter - ideally never raised
	 * @extend nul.ex
	 * @construct
	 */
	initialize: function(msg) {
		this.callSuper('bug', msg);
		if(window.console) console.error(msg);
	},
	toString: function() { return 'Internal error'; }
});

nul.ex.assert = new JS.Class(nul.ex, /** @lends nul.ex.assert# */{
	/**
	 * A bug in the NUL interpreter - ideally never raised
	 * @extend nul.ex
	 * @construct
	 */
	initialize: function(msg) {
		this.callSuper('assertion', msg);
	},
	toString: function() { return 'Assertion failure'; }
});

nul.ex.failure = new JS.Singleton(nul.ex, /** @lends nul.ex.failure# */{
	/**
	 * A failed evaluation
	 * @extend nul.ex
	 * @construct
	 */
	initialize: function(msg) {
		this.callSuper('failure');
	},
	toString: function() { return 'Failure'; }
});

