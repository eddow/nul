/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/lng/txt/in/null.compiled, src/lng/txt/in/null.tokenizer

//TODO 3: parser les CDATA et <!-- -->

/**
 * Recognised operators sorted by precedence
 * @type [String,String][]
 * @constant
 */
//l => left built ((a . b) . c)
//r => right built (a . (b . c))
//m => multi (a , b , c)
//p => preceder (- a)
//s => postceder (a !)
//k => kept (a , b , c ,.. d)
nul.operators = [
	['[]','m'],								//booleans:meta OR
	[';','m'],								//booleans:meta AND
	[',','k'],				 				//list
	[',.','s'],				 				//list singleton
	['=>','r'],								//lambda
	['!','p'],
	['?','l'],
	['=','m'], ['!=','r'],					//unify
	['<','r'], ['>','r'], ['<=','r'], ['>=','r'],
	['+','m'], ['-','l'],
	['-','p'], ['#','p'], ['$','p'],
	['*','m'], ['/','l'], ['%','l'],
	['..','l']
];

nul.compiler = new JS.Class(/** @lends nul.compiler# */{
	/**
	 * @constructs
	 * @class The object managing compilation of a text
	 * @param {String} txt Text to compile
	 */
	initialize: function(txt) {
		this.tknzr = new nul.tokenizer(txt);
		this.compiled = new nul.compiled.factory;
	},
	/**
	 * Requires the next token to be an alphanumeric
	 * @return {String} The alphanumeric value
	 * @throw {nul.ex.syntax}
	 */
	alphanum: function() {
		var rv = this.tknzr.pop(['alphanum']);
		if(!rv) nul.ex.syntax('IDE', 'Identifier expected', this.tknzr);
		return rv.value;
	},
	/**
	 * Requires the next token to be a number
	 * @return {Number} The number value
	 * @throw {nul.ex.syntax}
	 */
	number: function() {
		var rv = this.tknzr.pop(['number']);
		if(!rv) nul.ex.syntax('IDE', 'Number expected', this.tknzr);
		return rv.value;
	},
	/**
	 * Takes the list of operands for an expression on the n-th operator level
	 * @param {nul.compiled} firstOp The already-red operand
	 * @param {String} oprtr The expected operator
	 * @param {Number} oprtrLvl tThe operator-level : index in {@link nul.operators}
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */
	list: function(firstOp, oprtr, oprtrLvl) {
		var rv = [firstOp];
		switch(oprtr[1])
		{
			case 'k':
				while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
				if(this.tknzr.take(oprtr[0]+'..')) rv.follow = this.expression(oprtrLvl);
				break;
			case 'm':
				while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
				break;
			case 'l':
				if( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
				break;
			case 'r':
				if( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl-1));
				break;
			case 's':
				if( this.tknzr.take(oprtr[0]) ) rv.push('ceded');
				break;
			default: nul.ex.internal('Bad operator type');
		}
		return rv;
	},
	/**
	 * Gets the compiled expression on the sepcified operator-level
	 * @param {Number} oprtrLvl tThe operator-level : index in {@link nul.operators}
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */
	expression: function(oprtrLvl, firstOp) {
		if('undefined'== typeof oprtrLvl) oprtrLvl = 0; 
		if(nul.operators.length <= oprtrLvl) return firstOp || this.applied();
		var oprtr = nul.operators[oprtrLvl];
		if(!firstOp) firstOp = this.expression(1+oprtrLvl);
		else firstOp = this.expression(1+oprtrLvl, firstOp);
		if('p'== oprtr[1]) return firstOp;	//don't manage preceders here but in .item
		var rv = [firstOp];
		do
		{
			rv = this.list(firstOp, oprtr, 1+oprtrLvl);
			if(0== rv.length) nul.ex.internal('No components and an operator');
			if(1== rv.length && !rv.follow) return rv[0];
			if('ceded'== rv[1]) firstOp = 
				this.expression(0, this.compiled.postceded(oprtr[0], rv[0]));
			else firstOp = this.compiled.expression(oprtr[0], rv);
		} while('l'== oprtr[1]);
		return firstOp;
	},
	/**
	 * Gather a compiled value and all its post-fixes 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */	
	applied: function(lax) {
		var rv = this.item(lax);
		if(!rv) return;
		do
		{
			var tst;
			if(this.tknzr.take('.')) rv = this.compiled.objectivity(rv, this.alphanum()); 
			else if('[]'!= this.tknzr.token.value && this.tknzr.take('['))
				rv = this.compiled.taking(rv, this.tknzr.rawExpect(']', this.expression())); 				
			else if(tst = this.applied('lax')) rv = this.compiled.application(rv, tst);
			else if(this.tknzr.take('::')) {
				var anm = this.tknzr.rawTake('(') ?
					this.tknzr.rawExpect(')', this.tknzr.fly(')')) :
					this.alphanum();
				rv = this.compiled.composed(rv, anm, this.item());					
			}
			
			else return rv;
		} while(true);
	},
	/**
	 * Read inside an XML node 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */	
	innerXML: function() {
		var comps = [];
		do
		{
			var aTxt = this.tknzr.fly('<');
			if(null=== aTxt) nul.ex.syntax('XML', 'XML node not closed', this.tknzr);
			if(''!== aTxt) comps.push(this.compiled.atom('string', aTxt.replace(/\uffff/g, '\n')));
			if(this.tknzr.rawTake('<(')) comps.push(this.tknzr.rawExpect(')>',this.expression()));
			else if(this.tknzr.rawTake('</')) return comps;
			else if(this.tknzr.rawTake('<')) comps.push(this.xml());
			else nul.ex.syntax('UEI', "Don't know what to do with '"+this.tknzr.token.value+"'", this.tknzr, 'token');
		} while(true);
	},
	/**
	 * Read an XML node 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */	
	xml: function() {
		var node = this.alphanum(), attr, attrs = {};
		while(attr = this.tknzr.pop(['alphanum']))
		{
			this.tknzr.expect('=');
			attrs[attr.value] = this.item();
		}
		if(this.tknzr.rawTake('/>')) return this.compiled.xml(node, attrs, []);
		this.tknzr.rawExpect('>');
		var comps = this.innerXML();
		this.tknzr.expect(node);
		return this.tknzr.rawExpect('>', this.compiled.xml(node, attrs, comps));
	},
	/**
	 * Read an item without precedance
	 * @param {Boolean} lax Prevent to read an item that should be understood as an operation
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */	
	item: function(lax) {
		var rv;
		if('eof'!= this.tknzr.token.type) {
			//hard-code
			if(this.tknzr.rawTake('<{')) return this.compiled.hardcode(eval(this.tknzr.rawExpect('}>', this.tknzr.fly('}>'))));
			
			//declaration
			if(this.tknzr.take('\\/')) return this.compiled.definition(this.alphanum(), this.expression());
			//Singletons
			if(this.tknzr.take('{')) {
				if(this.tknzr.take('}')) return this.compiled.set();
				var sr;
				if(this.tknzr.take(':')) sr = this.alphanum();
				return this.tknzr.expect('}', this.compiled.set(this.expression(), sr));
			}
			//Global' attribute
			if(this.tknzr.take('.')) return this.compiled.objectivity(this.compiled.atom('alphanum', ''), this.alphanum());
			//Parenthesis
			if(this.tknzr.take('(')) return this.tknzr.expect(')', this.expression());
			if(!lax) {
				if(this.tknzr.take('<')) return this.xml();
				for(var p= 0; p<nul.operators.length; ++p) {
					var oprtr = nul.operators[p];
					if('p'== oprtr[1] && this.tknzr.take(oprtr[0]))
						return this.compiled.preceded(oprtr[0], this.expression(1+p));
				}
			}
			rv = this.tknzr.pop(['alphanum', 'number', 'string']);
		}
		if(!rv && !lax) nul.ex.syntax('ITE', 'Item expected', this.tknzr);
		if(rv) return this.compiled.atom(rv.type, rv.value);
	}
});

/**
 * Make a compiled value out of a text.
 * @param {String} txt
 * @return {nul.compiled}
 * @throw {nul.ex.syntax}
 */
nul.compile = function(txt)
{
	var rv = new nul.compiler(txt+'\n');
	var ev = rv.expression();
	if(rv.tknzr.token.type != 'eof') nul.ex.syntax('TOE', 'Unexpected: "'+rv.tknzr.token.value+"'.", rv.tknzr, 'token');
	return ev;
};

/**
 * Make a compiled value out of an XML content.
 * @param {XML} txt
 * @return {nul.compiled}
 * @throw {nul.ex.syntax}
 */
nul.compile.xml = function(txt)
{
	var rv = new nul.compiler(txt+'</');
	var ev = rv.innerXML();
	if(rv.tknzr.token.type != 'eof') nul.ex.syntax('TOE', 'Unexpected: "'+rv.tknzr.token.value+"'.", this.tknzr, 'token');
	return ev;
};
