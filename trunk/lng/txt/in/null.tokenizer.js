/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.tokenizer = function(src)
{
	var rv = {
		txt: src,
		token: { type: '', value: '', raw: '' },
		/**
		 * Take next token
		 */
		next: function()
		{
			var match, alphabet;
			do
			{
				if(''== this.txt)
					return this.token = { value: '', type: 'eof' };
				for(alphabet in nul.tokenizer.alphabets)
					if(match = nul.tokenizer.isAB(this.txt, alphabet))
					{
						this.token = {
							value: (1< match.length) ? match[1]: null,
							type: alphabet,
							raw: match[0]};
						this.txt = this.txt.substr(match[0].length);
						break;
					}
				if(!match)
				{
					this.token = this.txt.substr(0,1);
					this.token = { value: this.token, type: 'other', raw:this.token };
					this.txt = this.txt.substr(1);
				}
			} while(!this.token.value && 'string'!= this.token.type);
			
			return this.token;
		},
		/**
		 * Compare and return next token
		 * @param {array(string)} accepted A list of accepted token type
		 * @return next token if accepted or null
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
		 * @param {array(string)} accepted A list of accepted token type
		 * @return next token if accepted or null
		 */
		pop: function(accepted)
		{
			if('eof'== this.token.type) throw nul.syntaxException('EOF', 'End of file reached.');
			var rv = this.peek(accepted);
			if(rv) this.next();
			return rv;
		},
		/**
		 * Gets next token and advance if accepted.
		 * @param {string} value The only accepted token value
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
		 * @param {string} value The expected value of the next token
		 * @param {any} rv The return value of this function
		 * @return the parameter 'rv'
		 * @throws nul.synthaxException if the token is not the one expected.
		 */
		expect: function(value, rv)
		{
			if(!this.take(value))
				throw nul.syntaxException('EXP', '"'+value+'" expected');
			return rv;
		},
		/**
		 * Gets next characters and advance if accepted.
		 * @param {string} value The characters expected to de found
		 * @return true if the characters were found
		 */
		rawTake: function(value)
		{
			var txt = this.token.raw + this.txt;
			if( txt.substr(0,value.length) != value ) return false;
			this.txt = txt.substr(value.length);
			this.next();
			return true;
		},
		/**
		 * Take some characters, asserts their value
		 * @param {string} value The expected string to find
		 * @param {any} rv The return value of this function
		 * @return the parameter 'rv'
		 * @throws nul.synthaxException if the characters were not found exactly
		 */
		rawExpect: function(value, rv)
		{
			if(!this.rawTake(value))
				throw nul.syntaxException('EXP', '"'+value+'" expected');
			return rv;
		},
		/**
		 * Get a string until some character
		 * @param {string} seeked The bound for seeking
		 * @return the string until the bound.
		 */
		fly: function(seeked)
		{
			var txt = this.token.raw + this.txt;
			var n = txt.indexOf(seeked);
			if(-1== n) return null;
			var rv = txt.substr(0, n);
			this.txt = txt.substr(n);
			this.next();
			return rv;
		}
	};
	rv.next();
	return rv;
};

nul.tokenizer.isAB = function(v, alphabet) {
	return (new RegExp('^'+nul.tokenizer.alphabets[alphabet], 'g')).exec(v);
};

nul.tokenizer.alphabets = {
		number:		'(\\d+(\\.\\d+)?)',
		alphanum:	'([_\\w@]+)',
		string:		'"([^"]*)"',
		space:		'\\s+',
		comm1:		'\\/\\/.*\n',
		comm2:		'\\/\\*.*\\*\\/',
		oprtr:		'([\\~\\:\\+\\-\\>\\<\\=\\*\\/\\!\\&\\|\\\\\\/\\.\\?\\[\\]\\,]+)'
	};
