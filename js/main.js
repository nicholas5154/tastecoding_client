angular.module('tastecodingApp', ['ngCookies'])
.controller('LecturesController', function($http, $cookies){
    var lc = this;
    
    //lecture list initialization
    $http.get('/data/lecture-list.json')
   .then(function(res){
      lc.list = res.data;
      //TODO: load user data from server
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
        lc.reference.setValue(lc.selectedRef.refText, -1);
        $cookies.put('lastRef', lc.selectedRef.id);
    };
    
    //EDITOR CONFIGURATIONS
    lc.editor = ace.edit("editor");
    editor = lc.editor;
    lc.selection = lc.editor.getSession().getSelection();
    sel = lc.selection;
    lc.editor.setTheme("ace/theme/monokai");
    //lc.editor.setKeyboardHandler("ace/keyboard/sublime");
    lc.editor.getSession().setMode("ace/mode/python");
    lc.editor.setShowPrintMargin(false);
    lc.editor.$blockScrolling = Infinity;
    lc.reference = ace.edit("reference");
    lc.reference.setTheme("ace/theme/monokai");
    lc.reference.getSession().setMode("ace/mode/python");
    lc.reference.getSession().setUseWrapMode(true);
    lc.reference.setShowPrintMargin(false);
    lc.reference.setReadOnly(true);
    lc.reference.setHighlightActiveLine(false);
    lc.reference.renderer.$cursorLayer.element.style.display = "none";
    lc.reference.setWrapBehavioursEnabled(true);
    lc.reference.$blockScrolling = Infinity;
    
    deltas = [];
    lc.slides = [];
    lc.activeSlide = {};
    lc.selectSlide = function(slide){
        lc.activeSlide = slide;
    };
    
    lc.edit = true;
    
    lc.enableEdit = function(){
        lc.edit = true;
        lc.editor.on("change", function(e){
            if(lc.edit){
                //remove
                if(deltas.length == 0)
                    lc.rec_start_time = new Date();
                deltas.push({
                    type: "editor",
                    time: new Date() - lc.rec_start_time,
                    delta: e,
                });
            }
        });
        lc.selection.on("changeSelection", function(){
            deltas.push({
                type: "selection",
                time: new Date() - lc.rec_start_time,
                range: lc.selection.getAllRanges(),
            });
        });
        
        lc.document = lc.editor.getSession().getDocument();
    
        play = function(index){
            if(index == 0){
                lc.editor.setReadOnly(true);
                lc.edit = false;
                play_delta = deltas.slice();
                lc.editor.setValue("");
            }
            switch(play_delta[index].type){
                case "editor": lc.document.applyDelta(play_delta[index].delta); break;
                case "selection":
                    lc.selection.clearSelection();
                    for(range of play_delta[index].range){
                        lc.selection.addRange(range);
                    }
                    break;
                case "runit": lc.runit(); break;
            }
            if(index < play_delta.length-1){
                setTimeout(play, play_delta[index+1].time-play_delta[index].time, index+1);
            }
        };
        
        lc.recStart = function(){
            lc.rec_start_time = new Date();
        };
    };
    lc.enableEdit();
    lc.recStart();
    
    lc.runit = function() {
        if(lc.edit){
            deltas.push({
                type: "runit",
                time: new Date() - lc.rec_start_time,
            });
        }
        
        var prog = lc.editor.getValue();
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
    };
    
    createPlayer = function(){
        var time = 0;
        var slides = [];
        var slidesTimeout;
        var editorEvents = [];
        var editorEventsTimeout;
        var audio;
        return {
            loadSlides: function(sl){
                slides = sl;
            },
            loadAudio: function(aud){
                audio = aud;
            },
            loadEditorEvents: function(edEv){
                editorEvents = edEv;
            },
            setTime: function(t){
                time = t;
            },
            play: function(t){
                if(t===null){
                        
                }
                else{
                    //play from t
                }
            },
            pause: function(){
                //pause everything
            },
        }
    };
    
    lc.player = createPlayer();
        
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
