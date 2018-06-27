/*

	requires: jQuery
	
	XFrame ('Executive Frame') provides an iframe in the page 
	on which it is embedded that allows you to exec() serverside 
	GET requests without leaving the current page. By default it's
	hidden, but when a request is made it is made visible to
	show the result. 

	The resulting page (which is inside the iframe) can call
	parent.XFrame.success() or parent.XFrame.error() to
	finish the request and have the iframe hidden after 
	a small timeout.

	XFrame supports a queue, so multiple requests can
	be made in succession without interupting eachother.
	
	
*/

jQuery(document).ready(function() {
	XFrame.init();
});

var XFrame = {
	
	config	: {
		defcontext		: window,
		defsuccess		: function(code,msg) { },
		deferror			: function(code,msg) { },
		deftimeout		: 4000,
		interval			: 0,
		pauseonerr		: true
	},
	
	timer		: null,
	warnTimer	: null ,
	
	todo		: [],
	
	current	: null,
	
	init	: function() {
		var $ = jQuery;
		$('head').append('<style type="text/css" id="xframe-css">'+this.config.css+'</style>');	
		$('body').append('<div id="xframe-warn">');	
		$('body').append('<div id="xframe"><header><div id="xframe-close"></div><div id="xframe-queue"></div><div id="xframe-status"></div></header><iframe></iframe></div>');	
		$('#xframe-warn').on('click',function() { XFrame.unwarn(); });
		$('#xframe').on('click',function() { XFrame.dismiss(); });
		this.$xframe 	= $('#xframe');
		this.$iframe 	= $('#xframe iframe');
		this.$status 	= $('#xframe-status');
		this.$queue 	= $('#xframe-queue');
	},
	
	exec	: function(link,onsuccess,onerror,context,timeout) {
		this.queue(link,onsuccess,onerror,context,timeout);
	},
	
	queue	: function(link,onsuccess,onerror,context,timeout) {
		if (link) {
			var action = {
				'link'			: link,
				'onsuccess'	: onsuccess?onsuccess:this.config.defsuccess,
				'onerror'		: onerror?onerror:this.config.deferror,
				'context'		: context?context:this.config.defcontext,
				'timeout'		: timeout?timeout:this.config.deftimeout
			};
			this.todo.unshift(action);
			this.$queue.text('('+this.todo.length+')');
			if (!this.current) this.next();
		} else {
			this.warn('Error: XFrame called without a link');
		}
	},
	
	next	: function() {
		if (this.todo.length) {
			clearTimeout(this.timer);
			this.current = this.todo.pop();
			this.$queue.text(this.todo.length?'('+this.todo.length+')':'');
			this.$iframe.attr('src',this.current.link);
			this.$xframe.removeClass('error success').addClass('pending');	
			this.$status.text('pending..');
			XFrame.show();
			// the page called should return
			// parent.XFrame.success() or
			// parent.XFrame.error()		
		} else {
			this.current=null;
		}
	},
	
	success	: function(code,msg) {
		this.$xframe.removeClass('pending error').addClass('success');	
		this.$status.text('success');
		this.current.onsuccess.call(this.current.context,code,msg);
		if (this.current.timeout) {
			clearTimeout(this.timer);
			this.timer = setTimeout(function() {
				XFrame.hide();
			},this.current.timeout);
		}
		setTimeout(function() {
			XFrame.next();
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
					XFrame.hide();
				},this.current.timeout);
			}
			setTimeout(function() {
				XFrame.next();
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
		$('#xframe-warn').html(msg).show();
		if (timeout) {
			clearTimeout(this.warntimer);
			this.warnTimer = setTimeout(function() {
				XFrame.unwarn()
			},timeout);
		}
	},
	unwarn			: function(msg,timeout) {
		$('#xframe-warn').html('').hide();
	}
	

}
