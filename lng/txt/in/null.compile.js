/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO 3: parser les CDATA et <!-- -->

/**
 * Defines a set of compiled items
 * @class
 */
nul.compiled = {
	/**
	 * @name understand
	 * @function
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
		
	/**
	 * @param {String} oprtr
	 * @param {nul.compiled[]} oprnds
	 * @return {nul.compiled}
	 */
	expression: function(oprtr, oprnds) {
		return { operator: oprtr, operands: oprnds, understand: nul.understanding.expression };
	},
	/**
	 * @param {String} oprtr
	 * @param {nul.compiled} oprnd
	 * @return {nul.compiled}
	 */
	preceded: function(oprtr, oprnd) {
		return { operator: oprtr, operand: oprnd, understand: nul.understanding.preceded };
	},
	/**
	 * @param {String} oprtr
	 * @param {nul.compiled} oprnd
	 * @return {nul.compiled}
	 */
	postceded: function(oprtr, oprnd) {
		return { operator: oprtr, operand: oprnd, understand: nul.understanding.postceded };
	},
	/**
	 * @param {nul.compiled} item
	 * @param {nul.compiled} applied
	 * @return {nul.compiled}
	 */
	application: function(item, applied) {
		return { item: item, applied: applied, understand: nul.understanding.application };
	},
	/**
	 * @param {nul.compiled} item
	 * @param {nul.compiled} token
	 * @return {nul.compiled}
	 */
	taking: function(item, token) {
		return { item: item, token: token, understand: nul.understanding.taking };
	},
	/**
	 * @param {String} type
	 * @param {Litteral} value
	 * @return {nul.compiled}
	 */
	atom: function(type, value) {
		return { type: type, value: value, understand: nul.understanding.atom };
	},
	/**
	 * @param {String} decl
	 * @param {nul.compiled} value
	 * @return {nul.compiled}
	 */
	definition: function(decl, value) {
		return { decl: decl, value: value, understand: nul.understanding.definition };
	},
	/**
	 * @param {nul.compiled} content
	 * @param {String} selfRef
	 * @return {nul.compiled}
	 */
	set: function(content, selfRef) {
		return { content: content, selfRef: selfRef, understand: nul.understanding.set };
	},
	/**
	 * @param {String} node
	 * @param {nul.compiled[String]} attrs
	 * @param {nul.compiled[]} content
	 * @return {nul.compiled}
	 */
	xml: function(node, attrs, content) {
		return { node: node, attributes: attrs, content: content, understand: nul.understanding.xml };
	},
	/**
	 * @param {nul.compiled} obj
	 * @param {String} anm
	 * @param {nul.compiled} v
	 * @return {nul.compiled}
	 */
	composed: function(obj, anm, val) {
		return { object: obj, aName: anm, value: val, understand: nul.understanding.composed };
	},
	/**
	 * @param {nul.compiled} appl
	 * @param {String} lcl
	 * @return {nul.compiled}
	 */
	objectivity: function(appl, lcl) {
		return { applied: appl, lcl: lcl, understand: nul.understanding.objectivity };
	},
	/**
	 * @param {nul.xpr.object} val
	 * @return {nul.compiled}
	 */
	hardcode: function(val) {
		return { value: val, understand: nul.understanding.hardcode };
	}
};

/**
 * Recognised operators sorted by precedance
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
	['=>','r'],								//lambda
	['!','p'],
	['?','l'],
	['=','m'], ['!=','r'],					//unify
	['<','r'], ['>','r'], ['<=','r'], ['>=','r'],
	['+','m'], ['-','l'],
	['-','p'], ['#','p'], ['$','p'],
	['*','m'], ['/','l'], ['%','l'],
	['..','l'],
	[',.','s']				 				//list singleton
];

nul.compiler = Class.create(/** @lends nul.compiler# */{
	/**
	 * Compilation information
	 * @constructs
	 * @param {String} txt Text to compile
	 */
	initialize: function(txt) {
		this.tknzr = new nul.tokenizer(txt);
	},
	/**
	 * Requires the next token to be an alphanumeric
	 * @return {String} The alphanumeric value
	 * @throw {nul.syntaxException}
	 */
	alphanum: function() {
		var rv = this.tknzr.pop(['alphanum']);
		if(!rv)
			throw nul.syntaxException('IDE', 'Identifier expected');
		return rv.value;
	},
	/**
	 * Requires the next token to be a number
	 * @return {Number} The number value
	 * @throw {nul.syntaxException}
	 */
	number: function() {
		var rv = this.tknzr.pop(['number']);
		if(!rv)
			throw nul.syntaxException('IDE', 'Number expected');
		return rv.value;
	},
	/**
	 * Takes the list of operands for an expression on the n-th operator level
	 * @param {nul.compiled} firstOp The already-red operand
	 * @param {String} oprtr The expected operator
	 * @param {Number} oprtrLvl tThe operator-level : index in {@link nul.operators}
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.syntaxException}
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
			default: throw nul.internalException('Bad operator type');
		}
		return rv;
	},
	/**
	 * Gets the compiled expressionon the sepcified operator-level
	 * @param {Number} oprtrLvl tThe operator-level : index in {@link nul.operators}
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.syntaxException}
	 */
	expression: function(oprtrLvl) {
		if(Object.isUndefined(oprtrLvl)) oprtrLvl = 0; 
		if(nul.operators.length <= oprtrLvl) return this.applied();
		var oprtr = nul.operators[oprtrLvl];
		var firstOp = this.expression(1+oprtrLvl);
		if('p'== oprtr[1]) return firstOp;	//don't manage preceders here but in .item
		var rv = [firstOp];
		do
		{
			rv = this.list(firstOp, oprtr, 1+oprtrLvl);
			if(0== rv.length) throw nul.internalException('No components and an operator');
			if(1== rv.length && !rv.follow) return rv[0];
			if('ceded'== rv[1]) firstOp = nul.compiled.postceded(oprtr[0], rv[0]);
			else firstOp = nul.compiled.expression(oprtr[0], rv);
		} while('l'== oprtr[1]);
		return firstOp;
	},
	/**
	 * Gather a compiled value and all its post-fixes 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.syntaxException}
	 */	
	applied: function(lax) {
		var rv = this.item(lax);
		if(!rv) return;
		do
		{
			var tst;
			if(this.tknzr.take('.')) rv = nul.compiled.objectivity(rv, this.alphanum()); 
			else if('[]'!= this.tknzr.token.value && this.tknzr.take('['))
				rv = nul.compiled.taking(rv, this.tknzr.rawExpect(']', this.expression())); 				
			else if(tst = this.applied('lax')) rv = nul.compiled.application(rv, tst);
			else if(this.tknzr.take('::')) {
				var anm = this.tknzr.rawTake('(') ?
					this.tknzr.rawExpect(')', this.tknzr.fly(')')) :
					this.alphanum();
				rv = nul.compiled.composed(rv, anm, this.item());					
			}
			
			else return rv;
		} while(true);
	},
	/**
	 * Read inside an XML node 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.syntaxException}
	 */	
	innerXML: function() {
		var comps = [];
		do
		{
			var aTxt = this.tknzr.fly('<');
			if(null=== aTxt) throw nul.syntaxException('XML', 'XML node not closed');
			if(''!== aTxt) comps.push(nul.compiled.atom('string', aTxt.replace(/\uffff/g, '\n')));
			if(this.tknzr.rawTake('<(')) comps.push(this.tknzr.rawExpect(')>',this.expression()));
			else if(this.tknzr.rawTake('</')) return comps;
			else if(this.tknzr.rawTake('<')) comps.push(this.xml());
			else throw nul.syntaxException('UEI', "Don't know what to do with '"+this.tknzr.token.value+"'");
		} while(true);
	},
	/**
	 * Read an XML node 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.syntaxException}
	 */	
	xml: function() {
		var node = this.alphanum(), attr, attrs = {};
		while(attr = this.tknzr.pop(['alphanum']))
		{
			this.tknzr.expect('=');
			attrs[attr.value] = this.item();
		}
		if(this.tknzr.rawTake('/>')) return nul.compiled.xml(node, attrs, []);
		this.tknzr.rawExpect('>');
		var comps = this.innerXML();
		this.tknzr.expect(node);
		return this.tknzr.rawExpect('>', nul.compiled.xml(node, attrs, comps));
	},
	/**
	 * Read an item without precedance
	 * @param {Boolean} lax Prevent to read an item that should be understood as an operation
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.syntaxException}
	 */	
	item: function(lax) {
		var rv;
		if('eof'!= this.tknzr.token.type) {
			//hard-code
			if(this.tknzr.rawTake('<{')) return nul.compiled.hardcode(eval(this.tknzr.rawExpect('}>', this.tknzr.fly('}>'))));
			
			//declaration
			if(this.tknzr.take('\\/')) return nul.compiled.definition(this.alphanum(), this.expression());
			//Singletons
			if(this.tknzr.take('{')) {
				if(this.tknzr.take('}')) return nul.compiled.set();
				var sr;
				if(this.tknzr.take(':')) sr = this.alphanum();
				return this.tknzr.expect('}', nul.compiled.set(this.expression(), sr));
			}
			//Global' attribute
			if(this.tknzr.take('.')) return nul.compiled.objectivity(nul.compiled.atom('alphanum', ''), this.alphanum());
			//Parenthesis
			if(this.tknzr.take('(')) return this.tknzr.expect(')', this.expression());
			if(!lax) {
				if(this.tknzr.take('<')) return this.xml();
				for(var p= 0; p<nul.operators.length; ++p) {
					var oprtr = nul.operators[p];
					if('p'== oprtr[1] && this.tknzr.take(oprtr[0]))
						return nul.compiled.preceded(oprtr[0], this.expression(1+p));
				}
			}
			rv = this.tknzr.pop(['alphanum', 'number', 'string']);
		}
		if(!rv && !lax) throw nul.syntaxException('ITE', 'Item expected');
		if(rv) return nul.compiled.atom(rv.type, rv.value);
	}
});

/**
 * Make a compiled value out of a text.
 * @param {String} txt
 * @return {nul.compiled}
 * @throw {nul.syntaxException}
 */
nul.compile = function(txt)
{
	var rv = new nul.compiler(txt+'\n');
	var ev = rv.expression();
	if(rv.tknzr.token.type != 'eof') throw nul.syntaxException('TOE', 'Unexpected: "'+rv.tknzr.token.value+"'.");
	return ev;
};

/**
 * Make a compiled value out of an XML content.
 * @param {XML} txt
 * @return {nul.compiled}
 * @throw {nul.syntaxException}
 */
nul.compile.xml = function(txt)
{
	var rv = new nul.compiler(txt+'</');
	var ev = rv.innerXML();
	if(rv.tknzr.token.type != 'eof') throw nul.syntaxException('TOE', 'Unexpected: "'+rv.tknzr.token.value+"'.");
	return ev;
};
