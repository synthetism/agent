# Changelog

All notable changes to the `@synet/agent` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.0.0] - 2025-08-14

### Added
- Initial release of `@synet/agent` package
- Two agents `Smith` - multi agent orchestrator for complex and creative tasks and `Switch` - single-agent flow, for simple jobs.
- Support all major AI providers and tool calling through unified interface `@synet/ai`
- Events can be passed to agent from tools informing about the success and errors
- `Switch` Memory can be monitored through event emitter
- Full control of agent identity and prompts for each execution step are located in the templates. No hardcoding.
- **Key assumptions confirmed** 

- Multiple demo that validates key assumptions. 
- Agents with just list of tools on initialization can breakdown mission into steps
- Execute each step calling tools, 
- Recover from tool errors, trying different strategies
- Identify when the mission is complete and exit the loop.
- Saving collected results in files or sending emails. 

Overall, this is a universal solution for both simple tasks and complex, multi-step and creative tasks.