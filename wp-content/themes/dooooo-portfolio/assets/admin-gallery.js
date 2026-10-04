jQuery(function ($) {
	function thumbUrl(att) {
		var s = att.get('sizes');
		return s && s.thumbnail ? s.thumbnail.url : att.get('url');
	}
	function renderGallery($f) {
		var ids = ($f.find('.dooooo-gallery-ids').val() || '').split(',').filter(Boolean);
		var $p = $f.find('.dooooo-gallery-preview').empty();
		ids.forEach(function (id) {
			var att = wp.media.attachment(id);
			var $img = $('<img alt="">');
			$p.append($img);
			att.fetch().done(function () { $img.attr('src', thumbUrl(att)); });
		});
	}
	function renderVideo($f) {
		var id = $f.find('.dooooo-video-id').val();
		var $p = $f.find('.dooooo-video-preview').empty();
		if (!id) return;
		var att = wp.media.attachment(id);
		att.fetch().done(function () { $p.append($('<video controls muted>').attr('src', att.get('url'))); });
	}

	$('.dooooo-gallery-field').each(function () { renderGallery($(this)); });
	$('.dooooo-video-field').each(function () { renderVideo($(this)); });

	$(document).on('click', '.dooooo-gallery-pick', function (e) {
		e.preventDefault();
		var $f = $(this).closest('.dooooo-gallery-field');
		var frame = wp.media({ title: '選擇圖片（可多選，按住 Ctrl 點選）', button: { text: '使用這些圖片' }, multiple: 'add', library: { type: 'image' } });
		frame.on('open', function () {
			var sel = frame.state().get('selection');
			($f.find('.dooooo-gallery-ids').val() || '').split(',').filter(Boolean).forEach(function (id) {
				var a = wp.media.attachment(id); a.fetch(); sel.add(a);
			});
		});
		frame.on('select', function () {
			var ids = frame.state().get('selection').map(function (a) { return a.id; });
			$f.find('.dooooo-gallery-ids').val(ids.join(','));
			renderGallery($f);
		});
		frame.open();
	});
	$(document).on('click', '.dooooo-gallery-clear', function (e) {
		e.preventDefault();
		var $f = $(this).closest('.dooooo-gallery-field');
		$f.find('.dooooo-gallery-ids').val('');
		$f.find('.dooooo-gallery-preview').empty();
	});

	$(document).on('click', '.dooooo-video-pick', function (e) {
		e.preventDefault();
		var $f = $(this).closest('.dooooo-video-field');
		var frame = wp.media({ title: '選擇影片', button: { text: '使用這支影片' }, multiple: false, library: { type: 'video' } });
		frame.on('select', function () {
			$f.find('.dooooo-video-id').val(frame.state().get('selection').first().id);
			renderVideo($f);
		});
		frame.open();
	});
	$(document).on('click', '.dooooo-video-clear', function (e) {
		e.preventDefault();
		var $f = $(this).closest('.dooooo-video-field');
		$f.find('.dooooo-video-id').val('');
		$f.find('.dooooo-video-preview').empty();
	});
});
