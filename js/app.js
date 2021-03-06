angular.module('tastecodingApp', ['ngCookies'])
.controller('LectureController', function($http, $cookies, $scope){
	var lc = this;

	lc.lectures = [];
	lc.selectedLecture = {};
	lc.nextLecture = {};
	lc.prevLecture = {};

	lc.editor = {};

	lc.slides = [];
	lc.selectedSlide = {};

	lc.editorEvents = [];

	lc.reference = {};
	lc.selectedReference = {};

	lc.audio = {};

	lc.isRecording = false;
	lc.isPlaying = false;

	//EDITOR CONFIGURATIONS
	lc.initACE = function(){
		lc.editor = ace.edit("editor");
		editor = lc.editor;
		lc.selection = lc.editor.getSession().getSelection();
		sel = lc.selection;
		lc.editor.setTheme("ace/theme/monokai");
		//lc.editor.setKeyboardHandler("ace/keyboard/sublime");
		lc.editor.getSession().setMode("ace/mode/python");
		lc.document = lc.editor.getSession().getDocument();
		lc.editor.setShowPrintMargin(false);
		lc.editor.$blockScrolling = Infinity;
		lc.reference = ace.edit("reference");
		lc.reference.setTheme("ace/theme/monokai");
		lc.reference.getSession().setMode("ace/mode/python");
		lc.reference.getSession().setUseWrapMode(true);
		lc.reference.setShowPrintMargin(false);
		lc.reference.setReadOnly(true);
		lc.reference.commands.readOnly = true;
		lc.reference.textInput.getElement().disabled = true;
		lc.reference.setHighlightActiveLine(false);
		lc.reference.renderer.$cursorLayer.element.style.display = "none";
		lc.reference.setWrapBehavioursEnabled(true);
		lc.reference.$blockScrolling = Infinity;
	};


	/////////////////////////////////LECTURE SELECT CONTROL//////////////////////////////
	lc.selectLecture = function(lec){
		lc.selectedLecture = lec;
		var idx = lc.lectures.indexOf(lec);
		lc.nextLecture = lc.lectures[idx+1];
		lc.prevLecture = lc.lectures[idx-1];

		$cookies.put('lastLec', lc.selectedLecture.id);

		//TODO: load audio
		lc.selectedLecture.audioURL = "data/sample.mp3";

		//TODO: load slides
		$http.get('data/slides_'+lc.selectedLecture.id+'.json')
		.then(function(res){
			lc.slides = res.data;
			lc.selectSlide(lc.slides[0]);
		}, function(rej){
			lc.slides = [{
				"text" : "강의를 찾지 못했습니다"
			}];
		});
		//TODO: load editorEvents
	};

	lc.selectNextLecture = function(){
		var idx = lc.lectures.indexOf(lc.selectedLecture);
		lc.selectLecture(lc.lectures[idx+1]);
	};

	lc.selectPrevLecture = function(){
		var idx = lc.lectures.indexOf(lc.selectedLecture);
		lc.selectLecture(lc.lectures[idx-1]);
	};

	//////////////////////////////EDITOR, OUTPUT CONTROL///////////////////////////////////
	lc.runit = function(){
		if(lc.isRecording){
			lc.editorEvents.push({
				type: "runit",
				time: new Date() - lc.rec_start_time,
			});
		}
		
		var prog = lc.editor.getValue();
		var mypre = document.getElementById("output");
		mypre.innerHTML = '';
		Sk.pre = "output";
		Sk.configure({output:lc.outf, read:lc.builtinRead});
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

	// output functions are configurable.  This one just appends some text
	// to a pre element.
	lc.outf = function(text) {
		var mypre = document.getElementById("output");
		mypre.innerHTML = mypre.innerHTML + text.replace('\n', '<br>');
	};
	
	lc.builtinRead = function(x) {
		if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
			throw "File not found: '" + x + "'";
		return Sk.builtinFiles["files"][x];
	};

	/////////////////////////////////EDITOR EVENT CONTROL//////////////////////////////
	lc.editorEventTimeout = {};

	lc.playEditorEvent = function(idx){
		if(!idx){
			lc.editor.setReadOnly(true);
			var now = lc.getTime();
			idx = lc.getNextTimedObjectIndex(lc.editorEvents, now) - 1;
		}
		else{
			lc.applyEditorEvent(lc.editorEvents[idx]);
		}
		now = lc.getTime();
		lc.editorEventTimeout = setTimeout(
			lc.playEditorEvent,
			lc.editorEvents[idx+1].time - now,
			idx+1
			);
	};
	//remove
	playEditorEvent = lc.playEditorEvent;

	lc.applyEditorEvent = function(editorEvent){
		switch(editorEvent.type){
			case "editor": lc.document.applyDelta(editorEvent.delta); break;
			case "selection":
			lc.selection.clearSelection();
			for(range of editorEvent.range){
				lc.selection.addRange(range);
			}
			break;
			case "runit": lc.runit(); break;
		}
	};

	lc.syncEditorEvent = function(){
		clearTimeout(lc.editorEventTimeout);
		var now = lc.getTime();
		var eventsUntilNow = $.grep(lc.editorEvents, function(e){
			return e.time <= now;
		});
		lc.editor.setValue("");
		for(editorEvent of eventsUntilNow){
			if(editorEvent.type != "runit"){
				lc.applyEditorEvent(editorEvent);
			}
		}
	};

	lc.slideTimeout = {};

	////////////////////////////////SLIDE CONTROL////////////////////////////////
	lc.playSlide = function(idx){
		if(!idx){
			var now = lc.getTime();
			idx = lc.getNextTimedObjectIndex(lc.slides, now)-1;
		}
		else{
			lc.selectedSlide = lc.slides[idx];
			$scope.$apply();
		}
		if(idx < lc.slides.length-1){
			now = lc.getTime();
				lc.slideTimeout = setTimeout(
					lc.playSlide,
					lc.slides[idx+1].time - now,
					idx+1
				);
		}
	};

	lc.syncSlide = function(){
		clearTimeout(lc.slideTimeout);
		var now = lc.getTime();
		var slideToSelect = {};
		for(slide of lc.slides){
			if(slide.time > now)
				break;
			slideToSelect = slide;
		}
		lc.selectedSlide = slideToSelect;
	};

	lc.selectSlide = function(slide){
		lc.selectedSlide = slide;
		lc.goTo(slide.time);
	};

	////////////////////////////////AUDIO CONTROL////////////////////////////////
	lc.playAudio = function(){
		lc.audio.play();
	};

	lc.pauseAudio = function(){
		lc.audio.pause();
	};

	lc.getTime = function(){
		return lc.audio.currentTime*1000;
	};

	//////////////////////////////LECTURE CONTROL////////////////////////////////

	lc.play = function(){
		lc.isPlaying = true;
		//TODO: play or resume audio
		lc.playAudio();
		//TODO: play slide
		lc.playSlide();
		//TODO: play editorEvents
		lc.playEditorEvent();
	};

	lc.pause = function(){
		lc.isPlaying = false;
		lc.pauseAudio();
		clearTimeout(lc.slideTimeout);
		clearTimeout(lc.editorEventTimeout);
	};

	lc.goTo = function(time_t){
		//TODO: Set audio time
		lc.audio.currentTime = time_t/1000;
		//TODO: sync editor events
		lc.syncEditorEvent();
		//TODO: sync slide
		lc.syncSlide();
		if(lc.isPlaying)
			lc.play();
		else
			lc.pause();
	};

	///////////////////////////////RECORD MODE//////////////////////////////////

	lc.record_auth = true;
	lc.startRecording = function(){
		lc.editorEvents = [];
		lc.rec_start_time = new Date();

		if(!lc.record_auth) return;

		lc.isRecording = true;

		lc.editor.on("change", function(e){
			if(lc.editorEvents.length == 0)
				lc.rec_start_time = new Date();
			lc.editorEvents.push({
				type: "editor",
				time: new Date() - lc.rec_start_time,
				delta: e,
			});
		});
		
		lc.selection.on("changeSelection", function(){
			lc.editorEvents.push({
				type: "selection",
				time: new Date() - lc.rec_start_time,
				range: lc.selection.getAllRanges(),
			});
		});
	};
	//REMOVE
	startRecording = lc.startRecording;


	lc.stopRecording = function(){
		lc.editor.on("change", function(e){});
		lc.selection.on("changeSelection", function(){});
	};

	stopRecording = lc.stopRecording;

	//////////////////////////////REFERENCE CONTROL/////////////////////////////
	lc.showReference = function(){
		if(lc.selectedReference){
			lc.reference.setValue(lc.selectedReference.refText, -1);
			$cookies.put('lastRef', lc.selectedReference.id);
		}
	};

	lc.selectNextReference = function(){
		var idx = lc.lectures.indexOf(lc.selectedReference);
		if(lc.lectures[idx+1])
			lc.selectedReference = lc.lectures[idx+1];
		lc.showReference();
	};

	lc.selectPrevReference = function(){
		var idx = lc.lectures.indexOf(lc.selectedReference);
		if(lc.lectures[idx-1])
			lc.selectedReference = lc.lectures[idx-1];
		lc.showReference();
	};

	////////////////////////////////UTILITY///////////////////////////////////
	lc.getNextTimedObjectIndex = function(arr, t){
		var idx = 0;
		for(item of arr){
			if(item.time > t)
				return idx;
			idx++;
		}
	};




	/////////////////////////////ON WEBSITE LOAD////////////////////////////////
	lc.initACE();

	lc.audio = document.getElementById("audioPlayer");
	audio = lc.audio;

	$http.get('data/lecture-list.json')
	.then(function(res){
		lc.lectures = res.data;
	
		//check cookies for user data
		var lastLec = $cookies.get('lastLec');
		if(lastLec){
			var lastLecObj =  $.grep(lc.lectures, function(e){
				return e.id === lastLec;
			});
			lc.selectLecture(lastLecObj[0]);
		}
		else{
			lc.selectLecture(lc.lectures[0]);
		}

		// last reference opened
		lastRef = $cookies.get('lastRef');
		var lastRefObj = $.grep(lc.lectures, function(e){
			return e.id === lastRef;
		});
		lc.selectedReference = lastRefObj[0];
		lc.showReference();
	
	}, function(rej){
		alert("강의 리스트를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.");
	});

	//////////////////////////////BIND KEYS//////////////////////////////////////
	Mousetrap.bind(['command+b', 'ctrl+b'], function(e){
		lc.runit();
	});

	lc.editor.commands.addCommand({
		name: "run",
		bindKey: {win: "Ctrl-B", mac: "Command-B"},
		exec: function(editor) {
			lc.runit();
		},
	});

	lc.reference.commands.addCommand({
		name: "run",
		bindKey: {win: "Ctrl-B", mac: "Command-B"},
		exec: function(editor) {
			lc.runit();
		},
	});

	Mousetrap.bind(['command+,', 'ctrl+,'], function(e){
		lc.selectPrevReference();
		$scope.$apply();
	});

	lc.editor.commands.addCommand({
		name: "selectPrevReference",
		bindKey: {win: "Ctrl-,", mac: "Command-,"},
		exec: function(editor) {
			lc.selectPrevReference();
			$scope.$apply();
		},
	});

	lc.reference.commands.addCommand({
		name: "selectPrevReference",
		bindKey: {win: "Ctrl-,", mac: "Command-,"},
		exec: function(editor) {
			lc.selectPrevReference();
			$scope.$apply();
		},
	});

	Mousetrap.bind(['command+.', 'ctrl+.'], function(e){
		lc.selectNextReference();
		$scope.$apply();
	});

	lc.editor.commands.addCommand({
		name: "selectNextReference",
		bindKey: {win: "Ctrl-.", mac: "Command-."},
		exec: function(editor) {
			lc.selectNextReference();
			$scope.$apply();
		},
	});

	lc.reference.commands.addCommand({
		name: "selectNextReference",
		bindKey: {win: "Ctrl-.", mac: "Command-."},
		exec: function(editor) {
			lc.selectNextReference();
			$scope.$apply();
		},
	});

});
