/*

	requires: jQuery
	
	xFrame ('Executive Frame') provides an iframe in the page 
	on which it is embedded that allows you to exec() serverside 
	GET requests without leaving the current page. By default it's
	hidden, but when a request is made it is made visible to
	show the result. 

	The resulting page (which is inside the iframe) can call
	parent.xFrame.success() or parent.xFrame.error() to
	finish the request and have the iframe hidden after 
	a small timeout.

	xFrame supports a queue, so multiple requests can
	be made in succession without interupting eachother.
	
	
*/


jQuery(document).ready(function() {
	xFrame.init();
});

var xFrame = {
	
	config	: {
		css						: '',
		defcontext		: window,
		defmethod			: 'GET',
		defsuccess		: function(code,msg) { },
		deferror			: function(code,msg) { },
		deftimeout		: 4000,
		interval			: 0,
		pauseonerr		: true,
		defwarn				: 'WARNING',
		init					: function() {}
	},
	
	timer		: null,
	warnTimer	: null ,
	
	todo		: [],
	
	current	: null,
	
	setup	: function(config) {
		var $ = jQuery;
		this.config = 	$.extend(this.config,config);
	},
	
	init	: function() {
		var $ = jQuery;
		
		if (this.config.init) this.config.init();
		
		if (this.config.css) {
			$('head').append('<link rel="stylesheet" type="text/css" href="'+this.config.css+'">');
		}
		
		if (!$('#xframe-warn').length) {
			$('body').append('<div id="xframe-warn" class="xframe-window"><div id="xframe-warn-content"></div></div>');	
		}
		$('#xframe-warn').on('click',function() { xFrame.unwarn(); });

		if (!$('#xframe').length) {
			$('body').append('<div id="xframe"  class="xframe-window"><header class="xframe-header"><div id="xframe-close"></div><div id="xframe-queue"></div><div id="xframe-status"></div></header><iframe name="xframe-content"></iframe></div>');	
		}
		$('#xframe').on('click',function() { xFrame.dismiss(); });
		
		xFrame.$xframe 	= $('#xframe');
		xFrame.$iframe 	= $('#xframe iframe');
		xFrame.$status 	= $('#xframe-status');
		xFrame.$queue 	= $('#xframe-queue');
		
	},
	
	exec	: function(link,onsuccess,onerror,method,context,timeout) {
		this.queue(link,onsuccess,onerror,method,context,timeout);
	},
	
	queue	: function(link,onsuccess,onerror,method,context,timeout) {
		if (link) {
			var action = {
				'link'			: link,
				'onsuccess'	: onsuccess?onsuccess:this.config.defsuccess,
				'onerror'		: onerror?onerror:this.config.deferror,
				'method'		: (method?method:this.config.defmethod).toUpperCase(),
				'context'		: context?context:this.config.defcontext,
				'timeout'		: timeout?timeout:this.config.deftimeout
			};
			this.todo.unshift(action);
			this.$queue.text('('+this.todo.length+')');
			if (!this.current) this.next();
		} else {
			this.warn('Error: xFrame called without a link');
		}
	},
	
	next	: function() {
		if (this.todo.length) {
			clearTimeout(this.timer);
			this.current = this.todo.pop();
			this.$queue.text(this.todo.length?'('+this.todo.length+')':'');
			if (this.current.method=='GET') this.$iframe.attr('src',this.current.link);
			else this.post(this.current.link);
			this.$xframe.removeClass('error success').addClass('pending');	
			this.$status.text('pending..');
			xFrame.show();
			// the page called should return
			// parent.xFrame.success() or
			// parent.xFrame.error()		
		} else {
			this.current=null;
		}
	},
	
	post : function(link) {
		var parts = link.split('?');
		var url = parts[0];
		var pp, inputs = '';
		if (parts[1]) {
			var params = parts[1].split('&');
			for(var i = 0, n = params.length; i < n; i++) {
					pp = params[i].split('=');
					inputs += '<input type="hidden" name="' + pp[0] + '" value="' + pp[1] + '" />';
			}
		}
		if (!$('#xframe-post').length) {
			$("body").append('<form method="post" id="xframe-post" target="xframe-content">');
		} 
		$('#xframe-post').attr('action',url).empty().append(inputs).submit();
	},
	
	success	: function(code,msg) {
		this.$xframe.removeClass('pending error').addClass('success');	
		this.$status.text('success');
		this.current.onsuccess.call(this.current.context,code,msg);
		if (this.current.timeout) {
			clearTimeout(this.timer);
			this.timer = setTimeout(function() {
				xFrame.hide();
			},this.current.timeout);
		}
		setTimeout(function() {
			xFrame.next();
		}, this.config.interval);
	},
	
	error		: function(code,msg) {
		this.$status.text('error');
		this.$xframe.removeClass('pending success').addClass('error');
		this.current.onerror.call(this.current.context,code,msg);
		if (this.config.pauseonerr) {
			// we dont timeout, and leave the queue. if they
			// click the close button, dismiss is called and
			// the queue continues
		} else {
			if (this.current.timeout) {
				clearTimeout(this.timer);
				this.timer = setTimeout(function() {
					xFrame.hide();
				},this.current.timeout);
			}
			setTimeout(function() {
				xFrame.next();
			}, this.config.interval);
		}
	},

	dismiss		: function() {
		this.$xframe.removeClass('pending success error');
		if (this.todo.length) {
			this.next();
		} else {
			this.current=null;
			this.hide();
		}
	},
	
	show			: function() {
		this.$xframe.show();
	},
	
	hide			: function() {
		this.$iframe.attr('src','');
		this.$xframe.hide();
	},

	
	warn			: function(msg,timeout) {
		var $ = jQuery;
		if (!msg) msg = this.config.defwarn;
		$('#xframe-warn-content').html(msg);
		$('#xframe-warn').show();
		if (timeout) {
			clearTimeout(this.warntimer);
			this.warnTimer = setTimeout(function() {
				xFrame.unwarn()
			},timeout);
		}
	},
	unwarn			: function(msg,timeout) {
		$('#xframe-warn').html('').hide();
	}
	

}
