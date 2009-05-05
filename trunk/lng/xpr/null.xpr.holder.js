/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.holder = function(pos) {
	return Class.create(pos, {
		hold: true,
		/**
		 * Determines weither this set can be empty or not.
		 * If 'true', the set *CAN* be empty
		 * if 'false', the set contains at least one element for sure
		 */
		canBeEmpty: function() {
			//TODO: si belong, devient failable
/*
		switch(this.belong.length) {
		case 0: break;
		case 1:
			switch(this.belong[0].charact) {
			case '{}': if(this.belong[0].canBeEmpty()) flags.failable = true;
				break;
			case 'native': break;
			default: flags.failable = true; break;
			}
			break;
		default:
			flags.failable = true;
			break;
		}*/			
			
			for(var i=0; i<this.components.length; ++i)
				if(!this.components[i].flags.failable) return false;
			return true;
		},
		composed: function($super) {
			///	Removes empty fuzzy values
			for(var i = 0; i<this.components.length;)
				if(this.components[i].failed)
					this.components.splice(i,1);
				else ++i;
			return $super();
		},
		subRecursion: function(cb, kb) {
			var rv = [];
			while(this.components.length) {
				var c = this.components.shift();
				var klg = c.enter();
				if(kb) kb.unshift(klg);
				var trv;
				try { trv = cb.apply(c); }
				catch(err) {
					trv = null;
					if(nul.failure!= err) throw nul.exception.notice(err);
				} finally {
					trv = klg.leave(trv, c);
					if(kb) kb.shift();
				}
				if(trv && !trv.failed) rv.push(trv);
			}
			return this.compose(rv);
		},
	});
};

nul.xpr.holder.listed = nul.xpr.holder(nul.xpr.listed);
nul.xpr.holder.preceded = nul.xpr.holder(nul.xpr.preceded);
