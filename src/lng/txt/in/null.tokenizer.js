/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO 2: "8x" should be an error, not "8 x" ... or not ?

nul.tokenizer = new JS.Class(/** @lends nul.tokenizer# */{
	/**
	 * @class Text reader helper
	 * @constructs
	 * @param {String} src The text content
	 */
	initialize: function(src) {
		this.txt = src.replace(/\n\r/g,'\uffff').replace(/\n/g,'\uffff').replace(/\r/g,'\uffff');
		this.line = 0;
		this.clmn = 0;
		this.next();
	},
	/**
	 * The next token to consider
	 */
	token: /** @lends nul.tokenizer#token# */{
		/** The alphabet that recognised this token */
		type: '',
		/** The computed token value */
		value: '',
		/** The text that produced this token */
		raw: '',
		/** Line coordinate */
		line: 0,
		/** Row coordinate*/
		clmn: 0
	},
	
	/**
	 * Consider the next token
	 */
	next: function()
	{
		var match, alphabet;
		do
		{
			if(''== this.txt)
				return this.token = { value: '', type: 'eof', clmn: this.clmn, line:this.line };
			for(alphabet in nul.tokenizer.alphabets)
				if(match = nul.tokenizer.isAB(this.txt, alphabet))
				{
					this.token = {
						value: (1< match.length) ? match[1]: null,
						type: alphabet,
						raw: match[0],
						line: this.line,
						clmn: this.clmn};
					this.advance(match[0].length);
					break;
				}
			if(!match)
			{
				this.token = this.txt.substr(0,1);
				this.token = { value: this.token, type: 'other', raw:this.token, cl: this.token.cl, ln:this.token.ln };
				this.advance(1);
			}
		} while(null=== this.token.value);
		
		return this.token;
	},
	/**
	 * Compare and return next token
	 * @param {String[]} accepted A list of accepted token type or nothing if any token accepted
	 * @return {token} next token if accepted or null
	 */
	peek: function(accepted)
	{
		if(accepted)	//if specified
		{
			var argx;
			for(argx=0; argx<accepted.length; ++argx)
				if(accepted[argx]== this.token.type)
					break;
			if( argx >= accepted.length )
				return null;
		}
		return this.token;
	},
	/**
	 * Gets next token and advance if accepted.
	 * @param {String[]} accepted A list of accepted token type
	 * @return next token if accepted or null
	 */
	pop: function(accepted)
	{
		if('eof'== this.token.type) nul.ex.syntax('EOF', 'End of file reached.', this);
		var rv = this.peek(accepted);
		if(rv) this.next();
		return rv;
	},
	/**
	 * Gets next token and advance if accepted.
	 * @param {String} value The only accepted token value
	 * @return true if token was token, false if nothing changed
	 */
	take: function(value)
	{
		var rv = this.token.value == value;
		if( rv ) this.next();
		return rv;
	},
	/**
	 * Take next token, asserts its value
	 * @param {String} value The expected value of the next token
	 * @param {any} rv The return value of this function
	 * @return the parameter 'rv'
	 * @throws {nul.ex.syntax} if the token is not the one expected.
	 */
	expect: function(value, rv)
	{
		if(!this.take(value)) nul.ex.syntax('EXP', '"'+value+'" expected', this);
		return rv;
	},
	/**
	 * Gets next characters and advance if accepted.
	 * @param {String} value The characters expected to de found
	 * @return true if the characters were found and taken
	 */
	rawTake: function(value)
	{
		var txt = this.token.raw + this.txt;
		if( txt.substr(0,value.length) != value ) return false;
		this.advance(value.length, txt);
		this.next();
		return true;
	},
	/**
	 * Take some characters, asserts their value
	 * @param {String} value The expected string to find
	 * @param {any} rv The return value of this function
	 * @return the parameter 'rv'
	 * @throws {nul.ex.syntax} if the characters were not found exactly
	 */
	rawExpect: function(value, rv)
	{
		if(!this.rawTake(value)) nul.ex.syntax('EXP', '"'+value+'" expected', this);
		return rv;
	},
	/**
	 * Get a string until some character
	 * @param {String} seeked The bound for seeking
	 * @return {String} the string until the bound, null if the bound is not found.
	 */
	fly: function(seeked)
	{
		var txt = this.token.raw + this.txt;
		var n = txt.indexOf(seeked);
		if(-1== n) return null;
		var rv = txt.substr(0, n);
		this.advance(n, txt);
		this.next();
		return rv;
	},
	/**
	 * Advance the token position
	 */
	advance: function(n, txt) {
		if(!txt) txt = this.txt;
		var advanced = txt.substr(0, n);
		this.txt = txt.substr(n);
		
		advanced = advanced.split('\uffff');
		if(1>= advanced.length) this.clmn += n;
		else if(this.txt) {
			this.line += advanced.length-1;
			this.clmn = advanced.pop().length;
		}
	}
});

/**
 * Try to recognize the string as from an alphabet
 * @param {String} v The string to recognise
 * @param {String} alphabet The alphabet name
 */
nul.tokenizer.isAB = function(v, alphabet) {
	return (new RegExp('^'+nul.tokenizer.alphabets[alphabet], 'g')).exec(v);
};

/**
 * Alphabets used by the tokenizer given by name
 * @type RegExp[String]
 */
nul.tokenizer.alphabets = {
		number:		'(\\d+(\\.\\d+)?)',
		alphanum:	'([\\w@]+)',
		string:		'"([^"\\uffff]*)"',
		space:		'[\\s\\uffff]+',
		comm1:		'\\/\\/.*?\\uffff',
		comm2:		'\\/\\*.*?\\*\\/',
		oprtr:		[',..', '{', '}', '::', '[', ']', '(', ')', '\\/', '.']
	};
/**
 * Load the operators defined in the compiler to create an alphabet
 */
nul.load.operators = function() {
	var escaper = function(n, s) { return '\\' + s.split('').join('\\'); };
	var ops = map(nul.operators, function() { return this[0];});
	ops.pushs(nul.tokenizer.alphabets.oprtr);
	ops.sort(function(a,b){ return b.length-a.length; });
	nul.tokenizer.operators = ops;	//Useful for outer use, like editArea
	nul.tokenizer.alphabets.oprtr = '(' + map(ops,escaper).join('|') + ')';
};