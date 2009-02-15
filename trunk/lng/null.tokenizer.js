/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.alphabets = {
	number:		'(\\d+(\\.\\d+)?)',
	alphanum:	'([_\\w@]+)',
	string:		'"([^"]*)"',
	space:		'\\s+',
	comm1:		'\\/\\/.*\n/',
	comm2:		'\\/\\*.*\\*\\/',
	oprtr:		'([\\~\\:\\+\\-\\>\\<\\=\\*\\/\\!\\&\\|\\\\\\/\\.\\?\\[\\]]+)'
};
nul.tokenizer = function(src)
{
	var rv = {
		txt: src,
		token: { type: '', value: '', raw: '' },
		next: function()
		{
			var match, alphabet;
			do
			{
				if(''== this.txt)
					return this.token = { value: '', type: 'eof' };
				for(alphabet in nul.alphabets)
					if(match = (new RegExp('^'+nul.alphabets[alphabet], 'g')).exec(this.txt))
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
		pop: function(accepted)
		{
			if('eof'== this.token.type) throw nul.syntaxException("End of file reached.");
			var rv = this.peek(accepted);
			if(rv) this.next();
			return rv;
		},
		take: function(value)
		{
			var rv = this.token.value == value;
			if( rv ) this.next();
			return rv;
		},
		expect: function(value, rv)
		{
			if(!this.take(value))
				throw nul.syntaxException('"'+value+'" expected');
			return rv;
		},
		rawTake: function(value)
		{
			var txt = this.token.raw + this.txt;
			if( txt.substr(0,value.length) != value ) return false;
			this.txt = txt.substr(value.length);
			this.next();
			return true;
		},
		rawExpect: function(value, rv)
		{
			if(!this.rawTake(value))
				throw nul.syntaxException('"'+value+'" expected');
			return rv;
		},
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