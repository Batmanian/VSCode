'use strict';
// import vscode
var vscode = require('vscode');
// constance
var NAME = 'blankLine';
var COMMAND = 'process';
var CONTEXT_SAVE = 'save';
var CONTEXT_COMMAND = 'command';
// default configuration
var config = {
    keepOneEmptyLine: true,
    triggerOnSave: true,
    languageIds: ['javascript', 'typescript', 'json']
};
// read extension configuration
function setDefaultConfig() {
    // vscode.workspace.getConfiguration('editor').
}
// read extension configuration
function readConfig() {
    var settings = vscode.workspace.getConfiguration(NAME);
    config = Object.assign({}, config, settings);
}
// check for language validity
function isValidLanguage(languageId) {
    if (config == undefined || !(config.languageIds instanceof Array) || config.languageIds.length === 0)
        return true;
    return config.languageIds.find(function (id) { return id.toLowerCase() === languageId.toLowerCase(); }) != undefined;
}
// remove empty lines
function processLines(lines) {
    return (lines || [])
        .reduce(function (a, line) {
        var prevLine = a.slice(-1)[0];
        if (prevLine && prevLine.isEmptyOrWhitespace && line.isEmptyOrWhitespace)
            return a;
        if (config.keepOneEmptyLine !== true && line.isEmptyOrWhitespace)
            return a;
        return a.concat([line]);
    }, [])
        .map(function (line) { return line.text; });
}
function selectLines(editor, start, end) {
    var lines = [];
    for (var lineIndex = start; lineIndex < end; lineIndex++) {
        lines.push(editor.document.lineAt(lineIndex));
    }
    return lines;
}
function doAction(event) {
    // get active text editor
    var editor = vscode.window.activeTextEditor;
    // do nothing if 'doAction' was triggered by save and 'removeOnSave' is set to false
    if (event === CONTEXT_SAVE && config.triggerOnSave !== true)
        return;
    // do nothing if no open text editor
    if (!editor)
        return;
    // do nothing if not valid language
    if (event !== CONTEXT_COMMAND && !isValidLanguage(editor.document.languageId))
        return;
    // select start and end lines
    var selection = editor.selection;
    var start = 1;
    var end = editor.document.lineCount;
    if (selection.start.line !== selection.end.line) {
        start = selection.start.line;
        end = selection.end.line;
    }
    // select text
    var lines = selectLines(editor, start, end);
    // this where magic happens
    var processedLines = processLines(lines);
    // do nothing if there is no change
    if (lines.map(function (line) { return line.text; }).join('\n') === processedLines.join('\n')) {
        return;
    }
    if (end != editor.document.lineCount) {
        processedLines.push('');
    }
    // format text
    editor.edit(function (edit) {
        edit.replace(new vscode.Range(start, 0, end, 0), processedLines.join('\n'));
    });
}
// when extension is activated
function activate(context) {
    // initialize configuration
    readConfig();
    // reload configuration on change
    vscode.workspace.onDidChangeConfiguration(readConfig);
    // register 'emptyLine.remove' command
    context.subscriptions.push(vscode.commands.registerCommand(NAME + "." + COMMAND, function () { return doAction(CONTEXT_COMMAND); }));
    // listen for save event
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(function () { return doAction(CONTEXT_SAVE); }));
}
exports.activate = activate;
// when extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map