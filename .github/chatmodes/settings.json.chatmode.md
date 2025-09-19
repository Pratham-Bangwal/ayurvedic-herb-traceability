---
description: 'Description of the custom chat mode.'
tools: ['runCommands', 'runTasks', 'edit', 'runNotebooks', 'search', 'new', 'extensions', 'todos', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'getPythonEnvironmentInfo', 'getPythonExecutableCommand', 'installPythonPackage', 'configurePythonEnvironment', 'configureNotebook', 'listNotebookPackages', 'installNotebookPackages']
---
Define the purpose of this chat mode and how AI should behave: response style, available tools, focus areas, and any mode-specific instructions or constraints.
{
  // Copilot Chat Modes
  "github.copilot.chat.modes": {
    "agent": {
      "enabled": true,
      "default": true
    },
    "ask": {
      "enabled": false
    },
    "edit": {
      "enabled": true
    }
  },

  // Keyboard shortcuts for switching modes
  "keybindings": [
    {
      "key": "ctrl+alt+a",
      "command": "github.copilot.chat.setMode",
      "args": "agent",
      "when": "editorTextFocus"
    },
    {
      "key": "ctrl+alt+e",
      "command": "github.copilot.chat.setMode",
      "args": "edit",
      "when": "editorTextFocus"
    }
  ]
}
