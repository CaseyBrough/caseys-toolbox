# Casey's Toolbox

A small Claude Code mod from [Build Your Own Damn Website](https://buildyourowndamnwebsite.com).

- **`/reprompt`** rewrites whatever is in your prompt box into a clear prompt: the goal, the context, the limits, and what done looks like. It never invents requirements; if something important is missing, it adds an "Open questions" line. `/reprompt undo` puts your original back.
- **Auto model** reads each prompt before it's sent and switches to Haiku, Sonnet or Opus to fit the job, so you don't spend Opus on renaming a file. Turn it on or off with `/auto-model`.
- **`/toolbox`** opens a pane with both as buttons. A Reprompt and Auto button also sits just above the prompt box.

## Install

In a terminal session of Claude Code (run `claude`), type:

```
/plugin install caseys-toolbox --marketplace CaseyBrough/caseys-toolbox
```

Answer `y` to add the marketplace, then press Enter to install it for your user. That's it: it's on in that session and every one after.

From a shell instead:

```
claude plugin install caseys-toolbox --marketplace CaseyBrough/caseys-toolbox
```

In the Claude desktop app, where `/plugin` doesn't run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `CaseyBrough/caseys-toolbox`, then **Add plugin**.

## Try it

Type a rough idea into the prompt box, for example `make the about page better`, then run `/reprompt` (or press **Reprompt** above the prompt box). Read the rewrite, edit it if you like, and press Enter.
