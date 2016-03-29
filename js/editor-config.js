editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/python");
editor.setShowPrintMargin(false);
reference = ace.edit("reference");
reference.setTheme("ace/theme/monokai");
reference.getSession().setMode("ace/mode/python");
reference.getSession().setUseWrapMode(true);
reference.setShowPrintMargin(false);
reference.setReadOnly(true);
reference.setHighlightActiveLine(false);
reference.renderer.$cursorLayer.element.style.display = "none";
reference.setWrapBehavioursEnabled(true);
deltas = [];
editor.on("change", function(e){
    deltas.push(e);
});
