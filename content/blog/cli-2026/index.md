+++
date = '2026-06-15T14:06:49+05:30'
draft = false
title = 'Building CLI for AI Agents'
+++
> 1990: Let's build a CLI 2026: Let's build a CLI

CLI applications made a huge comeback in 2026, and I couldn't be happier. I love CLI apps, I build CLI apps and promote them as much as possible. We won't talk much about my love for CLI (I'll try) in this article, but explore the state of CLI development in 2026.CLIs was go to application in the 90s when DOS and the entire operating system were in CLI mode. The invention and mass adoption of GUI and mouse controls shifted the focus and adoption/development of CLI applications in the 2000s, but Cloud computing, containers, and infra-as-code brought CLI back into the limelight.

**CLI and** its **Renaissance in 2026**
---------------------------------------

AI agents in 2026 gave CLIs their due respect and recognition. AI agents prefer CLI over GUI because it's extremely easy to execute commands, read standard I/O, parse outputs if it's JSON and of course, the best of all - chain commands to execute multiple operations.Consider doing that in a GUI, AI agents need to take a screenshot, parse pixels, understand where the CTA is (burn those GPUs) and then make a click and wait for an extremely unfamiliar response. No thanks, CLI is better.

AI Agents and CLI
-----------------

The new consumers of your CLI apps are AI agents. Most of the CLI apps were designed for humans with descriptive outputs and verbose responses.

> Human -> CLI

Changed to

> Human -> Agents -> CLI

The CLI in 2026 should be designed for humans and agents simultaneously.

> I believe many companies are over-investing in MCP servers and under-investing in their CLI experience. A clean CLI with structured output often delivers more value than a rushed MCP implementation.

Agent-friendly CLI
------------------

Surprisingly, we don't need to make tons of changes or re-engineer the entire CLI stack to make it Agent-friendly. Here are some tips to make your existing or new CLI app agent-friendly.

*   **Structured output over verbose text**: Agents hate verbose output. For example, consider this command.

```
cli-app deploy
```

and it outputs this.bash
```
Deploying...
Checking...
Working...
Done!
```

Agents prefer structured output. For example, consider JSON output in the same command with a flag.
```bash
cli-app deploy --json
```

and it outputs this:
```bash
{
  "status": "success",
  "deployment_id": "123"
}
```

So if your CLI app supports JSON output, it already is compatible and preferred for AI agents. Do ensure that errors are also structured. Instead of a text error, send back the error in JSON format. Agents will use it to make decisions on the next command or retry attempt.

*   **Make commands like endpoints:** This is an extremely useful hack I found to be very useful for Agents. Ensure your CLI commands are discoverable and predictable. What's the best approach to be predictable? follow standards. I tried using REST standards in building CLI apps and found that Agents are able to discover and execute commands based on decisions without much interference or explanation. For example, instead of having commands like this:

```bash
cli-app create-deployment
cli-app remove-deployment
cli-app show-deployment
```
Design it like this:
```bash
cli-app deployment new 
cli-app deployment remove deploymentId
cli-app deployment get deploymentId
cli-app deployment list
```

This is extremely useful for AI Agents.

*   **Exit Codes are non-negotiable:** AI agents love error codes, and this is non-negotiable. Your CLI app should return an error code and ensure it follows the standard error code.I follow the error code standard mentioned on this [page](https://tldp.org/LDP/abs/html/exitcodes.html). Generally, this code will suffice for your use case. You can also refer to [AWS error](https://docs.aws.amazon.com/cli/latest/topic/return-codes.html) codes.
    
*   **Idempotent Commands**: Agents retry commands upon failure, and this should be taken into account while building the CLI app. The retry attempts should not create unexpected side effects. The errors should be handled gracefully if they occur during retries rather than crashing.
    
*   **Consider streaming for a long-running task:** This is not mandatory, but it is one of the good-to-have features. Agents generally run long tasks, and sometimes those tasks take hours to complete. Instead of having Agent poll every few seconds, consider streaming your response and let Agent subscribe to the stream for updates. Streaming also provides a better user experience and helps the Agent monitor the progress of the task in a natural manner.
    
*   **Guardrails for dangerous commands:** Agents run commands automatically, and you should always have confirmation on commands that are going to change the system values, such as DELETE operations or DROP operations. Either allow them to use an extra flag, such as --yes or have the user confirm it (I prefer this)
    

Terminal user interfaces in CLI apps
------------------------------------

AI Agents have revived the terminal user interface, a.k.a TUIs. The rise of Claude Code and Codex within the developer community is proof of TUI adoption. I love TUI apps, in fact, my high school project was a TUI app in C++ called [multiworker](https://github.com/shaikh-shahid/multiworker). TUI now supports lots of good interfaces such as progress bar, tables, dashboards, etc.We have different TUI frameworks for different programming languages. I prefer Go while building CLIs, and Go has rich TUI frameworks.Claude Code and Codex are built in Typescript and use the Ink framework. Ink is really good if you know React and offers you a good framework to handle interfaces, states, etc.There are also frameworks available for the Go and Rust languages. In the Go space [Lipgloss](https://github.com/charmbracelet/lipgloss) library is very famous and useful. In Rust [RatatUI](https://ratatui.rs/) is a go-to framework for TUI apps.

CLI as an Integration Layer
---------------------------

CLI applications are now acting as an integration layer for the software systems. If your product exposes an Agent-friendly CLI, then you are already exposed to integration with 3rd party software and Agents.Lots of companies are asking whether they should build an SDK, MCP-Server, API or CLI. My take is they should focus on CLI first. Why, you ask? Because CLI offers way more value in a short span of development time. A well-designed CLI has the potential to become the foundation for everything else in the stack. APIs can power the CLI, MCP servers can wrap the CLI, and SDKs can be generated from the same backend capabilities. Starting with a CLI forces teams to think carefully about workflows, discoverability, and automation from day one.CLI provides you with an integration layer with pipeline support, a human interaction interface via TUI, and an agent-friendly interface via tool invocation. If you focus on CLI first, the ROI is greatest in my opinion.

Future of CLI Development
-------------------------

The next generation of CLI apps won't be just made for humans. They will be AI native platforms with different interfaces for different use cases. They will be Agent-friendly, interactive, and MCP compatible. The biggest shift in 2026 is not that AI agents can use CLIs. It’s that AI agents prefer CLIs. For the first time in decades, command-line applications are no longer a legacy interface—they are becoming the primary operating surface for humans, automation systems, and AI agents alike.
