$ ->
	if window.localStorage
		alert 'This browser supports localStorage'
	else
		alert 'This browser does NOT support localStorage'
	localStorage.a = "123456"
	b = localStorage.a
	alert b
