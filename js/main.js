angular.module('tastecodingApp', [])
.controller('ReferenceController', function(){
	var refList = this;
	refList.refs = [
		{id: "1", content: "abc"},
		{id: "2", content: "abcd"},
		{id: "3", content: "abce"},
		{id: "4", content: "abcf"}
	];
	refList.selectedRef = {content:"이곳은 빠른 참조입니다. 이전 페이지에서 배웠던 내용을 빠르게 찾아볼 수 있습니다."};
});


// output functions are configurable.  This one just appends some text
// to a pre element.
function outf(text) {
	var mypre = document.getElementById("output");
	mypre.innerHTML = mypre.innerHTML + text.replace('\n', '<br>');
}
function builtinRead(x) {
	if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
		throw "File not found: '" + x + "'";
	return Sk.builtinFiles["files"][x];
}

// Here's everything you need to run a python program in skulpt
// grab the code from your textarea
// get a reference to your pre element for output
// configure the output function
// call Sk.importMainWithBody()
function runit() {
	var prog = editor.getValue();
	var mypre = document.getElementById("output");
	mypre.innerHTML = '';
	Sk.pre = "output";
	Sk.configure({output:outf, read:builtinRead});
	(Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'mycanvas';
	var myPromise = Sk.misceval.asyncToPromise(function() {
		return Sk.importMainWithBody("<stdin>", false, prog, true);
	});
	myPromise.then(function(mod) {
		console.log('success');
        mypre.scrollTop = mypre.scrollHeight;
	},
	function(err) {
		mypre.innerHTML = err.toString();
        mypre.scrollIntoView(false);
	});
}

