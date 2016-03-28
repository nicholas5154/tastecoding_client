angular.module('tastecodingApp', ['ngCookies'])
.controller('LecturesController', function($http, $cookies){
    var lc = this;
    
    $http.get('/data/lecture-list.json')
   .then(function(res){
      lc.list = res.data;
      lc.loadCookies();
    });
    
    lc.loadCookies = function(){
        //last lecture opened
        var lastLec = $cookies.get('lastLec');
        if(lastLec){
            var lastLecObj =  $.grep(lc.list, function(e){
                return e.id === lastLec;
            });
            lc.selectLec(lastLecObj[0]);
        }
        else{
            lc.selectLec(lc.list[0]);
        }
        
        // last reference opened
        var lastRef = $cookies.get('lastRef');
        var lastRefObj = $.grep(lc.list, function(e){
            return e.id === lastRef;
        });
        lc.selectedRef = lastRefObj[0];
        lc.updateRef();
    };
    
    lc.selectedRef = {};
    lc.selectedLec = {};
    lc.nextLec = {};
    lc.prevLec = {};
    
    lc.selectLec = function(lec){
        lc.selectedLec = lec;
        $cookies.put('lastLec', lec.id);
        lc.nextLec = lc.list[lc.list.indexOf(lec)+1];
        lc.prevLec = lc.list[lc.list.indexOf(lec)-1];
    }
    
    lc.toNextLec = function(){
        lc.selectLec(lc.nextLec);
    };
    
    lc.toPrevLec = function(){
        lc.selectLec(lc.prevLec);
    };
    
    lc.updateRef = function(){
        reference.setValue(lc.selectedRef.refText, -1);
        $cookies.put('lastRef', lc.selectedRef.id);
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

