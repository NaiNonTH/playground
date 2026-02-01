import './style.css';

import { basicSetup, EditorView } from "codemirror";
import { html } from "@codemirror/lang-html"
import { css } from "@codemirror/lang-css";
import { javascript, javascriptLanguage, scopeCompletionSource } from "@codemirror/lang-javascript";

import { keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { expandAbbreviation, abbreviationTracker } from "@emmetio/codemirror6-plugin";

const parser = new DOMParser();

const htmlView = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [
      basicSetup,
      html(),
      abbreviationTracker(),
      keymap.of([{
        key: 'Tab',
        run: expandAbbreviation
      }]),
      // EditorView.updateListener.of(handleUpdateListener),
    ],
  }),
  parent: document.querySelector('#html')
});

const cssView = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [
      basicSetup,
      css(),
      // EditorView.updateListener.of(handleUpdateListener),
    ],
  }),
  parent: document.querySelector('#css')
});

const jsView = new EditorView({
  state: EditorState.create({
    doc: '',
    extensions: [
      basicSetup,
      javascript(),
      javascriptLanguage.data.of({autocomplete: scopeCompletionSource(globalThis)}),
      // EditorView.updateListener.of(handleUpdateListener),
    ],
  }),
  parent: document.querySelector('#js')
});

function handleUpdateListener() {
  const outputElement = document.querySelector('#output');

  const newOutputElement = outputElement.cloneNode();
  outputElement.replaceWith(newOutputElement);

  const iframeDoc = newOutputElement.contentDocument || newOutputElement.contentWindow.content;

  const styleElement = document.createElement('style');
  styleElement.innerHTML = cssView.state.doc.toString();

  const jsElement = document.createElement('script');
  jsElement.innerHTML = jsView.state.doc.toString();

  const html = parser.parseFromString(htmlView.state.doc.toString(), 'text/html');
  html.head.insertAdjacentElement('afterbegin', styleElement);
  html.body.appendChild(jsElement);

  iframeDoc.open();
  iframeDoc.writeln('<!DOCTYPE html>' + html.documentElement.outerHTML);
  iframeDoc.close();
}

let panelInUsed = 0;
const tabPanels = [
  {
    tabName: 'html',
    view: htmlView
  },
  {
    tabName: 'css',
    view: cssView
  },
  {
    tabName: 'js',
    view: jsView
  },
];

document.querySelectorAll('[role="tab"]').forEach(tab => {
  tab.addEventListener('click', event => {
    document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
      panel.hidden = !(panel === event.currentTarget.ariaControlsElements[0]);
    });

    document.querySelectorAll('[role="tab"]').forEach(t => {
      t.ariaSelected = t === event.currentTarget;
    });

    tabPanels.forEach((panel, index) => {
      if (event.currentTarget.ariaControlsElements[0] === panel.view.dom.parentElement) {
        panelInUsed = index;
        panel.view.focus();
      }
    });
  });
});

window.addEventListener("keydown", event => {
  if (event.altKey) {
    event.preventDefault();

    switch (event.code) {
      case 'Digit1':
        panelInUsed = 0;
        break;
      case 'Digit2':
        panelInUsed = 1;
        break;
      case 'Digit3':
        panelInUsed = 2;
        break;
      case 'Comma':
        if (--panelInUsed < 0)
          panelInUsed = tabPanels.length - 1;
        break;
      case 'Period':
        if (++panelInUsed > tabPanels.length - 1)
          panelInUsed = 0;
        break;
      default:
        return;
    }
    
    const { tabName, view } = tabPanels[panelInUsed];
    
    document.querySelector(`button[aria-controls="${tabName}"]`).click();
    view.focus();
  }
  else if (event.ctrlKey && event.code === "KeyS") {
    event.preventDefault();
    handleUpdateListener();
  }
});

document.getElementById("run").addEventListener("click", handleUpdateListener);

document.getElementById("help-btn").addEventListener("click", function() {
  document.getElementById("help").showModal();
});

document.getElementById("close-help").addEventListener("click", function() {
  /**
   * @type {HTMLDialogElement}
   */
  const dialog = document.getElementById("help");
  dialog.close();
});

window.addEventListener("load", function() {
  this.requestAnimationFrame(() => this.document.getElementById("loading").remove());
});