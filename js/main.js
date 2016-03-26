angular.module('tastecodingApp', [])
.controller('LecturesController', function($http){
    var lec_controller = this;
    
    $http.get('/data/lecture-list.json')
   .then(function(res){
      lec_controller.list = res.data;                
    });
    
    lec_controller.selectedRef = {};
    lec_controller.selectedLec = {};
    
    lec_controller.selectLecture = function(lecID){
        selectedLec = lec_controller.list[lecID];
    };
    
    lec_controller.selectReference = function(refID){
        selectedRef = lec_controller.list[refID];
    };
    
    lec_controller.updateRef = function(){
        reference.setValue(lec_controller.selectedRef.refText, -1);
    };
    
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

