/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.data.computer = new nul.data.context('Computer', -1);

nul.data.computer.able = Class.create(nul.data, {
	initialize: function($super, cb) {
		this.extract = cb;
		$super(nul.data.computer, 'index');
	}
});
