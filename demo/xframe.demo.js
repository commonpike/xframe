if (xFrame) {
	xFrame.setup({
		defwarn	: 'press <a href="javascript:window.location.reload()">reload</a> to see changes',
		init		: function() {
			var $ = jQuery;
			var $head = $('#table_id_manage_resource thead tr.rowHeaders');
			var numcols = $head.children().length
			$head.before('<tr id="xframe-warn"><td colspan="20" id="xframe-warn-content"></td></tr>')
		}
	});
}