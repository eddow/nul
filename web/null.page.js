nul.page = function() {
	var elms = document.getElementsByTagName('nul:cnst');
	for(var e in elms) if(cstmNdx(e)) {
		var cnst = nul.html(elms[e].innerHTML);
		for(var n in cnst) if(cstmNdx(n)) {
			nul.xpr.use(cnst[n], nul.obj.node);
			if(nul.globals[cnst[n].tag])
				nul.page.error(cnst[n].tag + ' defined twice');
			else nul.globals[cnst[n].tag] = cnst[n];
		}
		//TODO: remove nul:cnst element
	}
};

nul.page.error = function(msg) {
	alert(msg);
};

new Event.observe(window, 'load', nul.page);
