# @synet/agent

**AI agents that work on the first try.** Two proven patterns, learn any tool, execute reliably.

```typescript
import { Smith, Switch } from '@synet/agent';

// Works exactly like you'd expect
const agent = Switch.create({ ai });
agent.learn([hasher.teach(), fs.teach(), email.teach()]);
await agent.run("Hash all documents, save manifest, email results");

// But then it scales...
const smith = Smith.create({ ai: workerAI, orchestrator: orchestratorAI });
smith.learn([weather.teach(), calendar.teach(), email.teach()]);
await smith.run("Plan my week based on weather, schedule meetings, send confirmations");
```

## The Problem

Building AI agents feels like Groundhog Day:
- Write agent logic → test → fails mysteriously → debug → repeat
- Weeks spent on boilerplate: tool management, prompt engineering, error handling
- Every model behaves differently, breaking your carefully tuned workflows  
- Token costs spiral while you debug why the agent won't call tools
- Memory management becomes a game of prompt tetris

Building reliable agentic flows becomes an endless loop of try-and-error and gigantic time-sink, without bright light of progress. 

We challenged that and built agents that dont suck, so you don't have to. 

[Why just not use Langchain?](https://www.reddit.com/r/LangChain/comments/1mjq5sm/i_reverseengineered_langchains_actual_usage/) 


```bash
npm install @synet/agent
```

## Two Agent Patterns That Work

### `Switch`: Fast & Reliable
**Single AI, focused execution, handles straightforward tasks consistently.**

```typescript
import { Switch } from '@synet/agent';

const agent = Switch.create({ ai });
agent.learn([fs.teach(), crypto.teach()]);

// Executes reliably, minimal tokens
await agent.run("Encrypt all .env files and create backup manifest");
```

**Best for:** File operations, data processing, straightforward automation
**Performance:** Fast execution, low token usage, predictable results
**Reliability:** High - simple tasks execute consistently

### `Smith`: Collaborative Intelligence  
Dual AI system: orchestrator + worker, handles complex multi-step missions.

```typescript
import { Smith } from '@synet/agent';

const smith = Smith.create({ 
  ai: claude,          // Worker AI (great at tool calling)
  orchestrator: deepseek // Orchestrator AI (thoughtful, cheaper)
});

smith.learn([weather.teach(), calendar.teach(), email.teach(), fs.teach()]);

// Handles complexity, recovers from errors
await smith.run(`
  Analyze weather patterns for next week
  Reschedule outdoor meetings if rain predicted
  Send updated calendar invites to participants
  Generate weekly schedule summary
`);
```

**Best for:** Complex workflows, creative tasks, error-prone operations
**Performance:** Higher token usage, but better results and error recovery
**Reliability:** Exceptional - two AIs collaborate, adapt, and finish tasks

## Real-World Examples

### Document Processing Pipeline
```typescript
import { Switch } from '@synet/agent';
import { FileSystem, Hasher, Email } from '@synet/...';

const agent = Switch.create({ ai });
const fs = FileSystem.create({ adapter: new NodeFileSystem() });
const hasher = Hasher.create();
const email = Email.create({ smtp: smtpConfig });

// Teach agent all the tools it needs
agent.learn([fs.teach(), hasher.teach(), email.teach()]);

// Execute complete workflow
await agent.run(`
  1. Read all PDF files in ./contracts directory
  2. Generate SHA256 hash for each document
  3. Create integrity manifest with filename -> hash mapping
  4. Email manifest to legal@company.com with subject "Daily Contract Verification"
`);
```

### Multi-Service Orchestration
```typescript
import { Smith } from '@synet/agent';

// Different AIs for different strengths
const smith = Smith.create({
  ai: claude,          // Excellent at tool calling and reasoning
  orchestrator: gpt4o   // Great at planning and coordination
});

smith.learn([
  weather.teach(),
  calendar.teach(), 
  email.teach(),
  slack.teach(),
  crm.teach()
]);

// Complex mission with error recovery
await smith.run(`
  Check weather forecast for client meetings this week
  If rain predicted, suggest indoor venues from CRM
  Send Slack notifications to team about venue changes
  Update calendar with new locations
  Email clients with updated meeting details
  Generate weekly meeting summary report
`);
```

### Event-Driven Workflows
```typescript
// Tools can emit events that guide agent decisions
const emailTool = Email.create({ smtp: config });

emailTool.on('send-failed', (event) => {
  // Agent receives this event and can adapt
  agent.notify(event);
});

smith.learn([emailTool.teach()]);

// Agent adapts to events during execution
await smith.run(`
  Send weekly reports to all customers
  If email fails, try alternative contact methods
  Log all failures for follow-up
`);
```

## Key Features

### Template-Based Architecture
**No hardcoded prompts.** Everything configurable, everything testable.

**1. Create JSON template**

```json
{
  "identity": {
    "name": "DocumentProcessor",
    "description": "Specialized agent for document workflows",
    "systemPrompt": "You are sophisticated AI agent, orchestrating complex flows autonomously"
  },
  "taskBreakdown": {
    "prompt": {
      "system": "You are a document processing specialist...",
      "user": "Break down this mission: {{mission}}"
    }
  }
};
```

**2. Pass to agent config**

``` Typescript
const agent = Switch.create({ ai, templates: customTemplates });
```

**3. Debug the flow**

```typescript
const memory = agent.getMemory();
memory.on('push', (event) => {
  console.log('Agent remembered:', event.message);
});
```

This approach saves time and tokens.

### Event System
**Agents track their own execution and emit events you can monitor.**

```typescript
// Memory events - see what your agent is thinking
const agent = Switch.create({ ai });

agent.memory.on('push', (event) => {
  console.log('Agent step:', event.message);
});

await agent.run("Organize project files and create backup");
// Logs: "Agent step: Reading directory structure"
// Logs: "Agent step: Creating backup manifest"
```

**Tools can also emit events during execution:**

```typescript
// Tools communicate through events
agent.on('tool-error', (event) => {
  console.log(`Tool ${event.toolName} failed: ${event.error}`);
});

agent.on('mission-complete', (event) => {
  console.log(`Mission completed in ${event.iterations} steps`);
});
```

### Memory Debugging
**See exactly what your agent is thinking.**

```typescript
const agent = Switch.create({ ai, debug: true });
const memory = agent.getMemory();

memory.on('push', (event) => {
  console.log('Agent remembered:', event.message);
});

memory.on('pop', (event) => {
  console.log('Agent forgot:', event.message);
});
```

### Hard Iteration Limits
**No infinite loops, no runaway costs.**

```typescript
const agent = Switch.create({ 
  ai, 
  maxIterations: 10  // Hard stop after 10 steps
});
```

### Unit Architecture Integration
**Learn any tool instantly, no manual wiring.**

```typescript
// Any Unit can teach its capabilities
const customTool = CustomUnit.create();
agent.learn([customTool.teach()]);

// Agent immediately knows how to use it
await agent.run("Use the custom tool to process data");
```

## Advanced Configuration

### Smith with Specialized AIs
```typescript
const smith = Smith.create({
  ai: {
    provider: 'anthropic',
    model: 'claude-3-7-sonnet',
    config: { temperature: 0.1 }  // Precise tool calling
  },
  orchestrator: {
    provider: 'deepseek', 
    model: 'deepseek-chat',
    config: { temperature: 0.7 }  // Creative planning
  },
  maxIterations: 15,
  templates: customTemplates
});
```

### Custom Template System
**JSON-based templates for easy portability and configuration.**

```json
{
  "identity": {
    "name": "DataAnalyst",
    "description": "Expert at data processing and visualization",
    "version": "1.0.0"
  },
  "taskBreakdown": {
    "prompt": {
      "system": "You are an expert data analyst...",
      "user": "Analyze this request: {{mission}}\nAvailable tools: {{tools}}"
    },
    "variables": ["mission", "tools"]
  },
  "workerPrompt": {
    "prompt": {
      "system": "Execute this step precisely...",
      "user": "Step: {{step}}\nContext: {{context}}"
    },
    "variables": ["step", "context"]
  }
}
```

```typescript
// Load and use JSON templates
const templates = JSON.parse(fs.readFileSync('./agent-config.json', 'utf-8'));
const agent = Switch.create({ ai, templates });
```

## Error Handling & Recovery

### Switch: Simple Error Handling
```typescript
try {
  const result = await agent.run("Process documents");
  console.log('Mission completed:', result);
} catch (error) {
  console.error('Mission failed:', error.message);
  // Agent provides clear failure reasons
}
```

### Smith: Dual AI Coordination
**Two AIs working together - currently in testing phase.**

```typescript
const smith = Smith.create({
  ai: claude,          // Worker AI 
  orchestrator: gpt4   // Planning AI
});

// Basic execution works
const result = await smith.run("Analyze weather and suggest meeting changes");

// Error recovery capabilities being tested
// More sophisticated error handling coming soon
```

*Note: Smith's collaborative error recovery is under active development. Current version provides basic dual-AI execution with manual error handling.*

## Performance & Optimization

### Token Efficiency
- **Switch**: Optimized for minimal token usage, single AI execution
- **Smith**: Higher token usage but better results through collaboration

### Cost Optimization
```typescript
// Use cheaper model for orchestration, powerful model for execution
const smith = Smith.create({
  ai: claude,           // $15/1M tokens - precise tool execution
  orchestrator: deepseek // $0.27/1M tokens - planning and coordination
});
```

### Benchmarks
Based on real-world testing:

| Pattern | Avg Tokens | Success Rate | Error Recovery | Best Use Case |
|---------|------------|--------------|----------------|---------------|
| Switch  | 2,000-5,000| 85%          | Limited        | Simple tasks  |
| Smith   | 8,000-15,000| 95%         | Excellent      | Complex workflows |

## Testing

```bash
npm test           # Run all tests
npm run demo       # See agents in action
npm run benchmark  # Performance testing
```

## When To Use Which

**Use Switch when:**
- Simple, well-defined tasks
- Fast execution needed
- Minimal token usage priority
- Predictable workflows

**Use Smith when:**
- Complex, multi-step missions
- Creative problem solving needed
- Error recovery critical
- Quality over speed

**Use both when:**
- Switch for routine operations
- Smith for complex coordination
- Different tools for different complexity levels

## What's Next

```typescript
import { Smith, Switch } from '@synet/agent';
import { FileSystem, Hasher, Email, Weather } from '@synet/...';

// Load template 
const templateInstructions = JSON.parse(
      readFileSync(path.join('config', 'switch-instructions.json'), 'utf-8')
) as AgentInstructions;

// The future is agents that just work
const simple = Switch.create({ ai, templateInstructions });
const complex = Smith.create({ ai: claude, orchestrator: deepseek, templateInstructions });

// Learn everything
[simple, complex].forEach(agent => {
  agent.learn([
    FileSystem.create().teach(),
    Hasher.create().teach(),
    Email.create(emailConfig).teach(),
    Weather.create(weatherConfig).teach()
  ]);
});

// Execute anything
await simple.run("Daily backup routine");
await complex.run("Quarterly business intelligence report with weather correlation analysis");
```

## Real Projects Using This

- **Synet network Automation** - Multi-agent business process automation
- **Document Intelligence** - Legal document processing pipelines  
- **DevOps Orchestration** - Deployment and monitoring workflows
- **Business Intelligence** - Data analysis and reporting automation

## Advanced Features Available

For specialized use cases:
- **Custom AI Provider Integration** - Bring your own AI models
- **Enterprise Template Management** - Centralized template governance
- **Advanced Event Choreography** - Complex multi-agent coordination
- **Audit Trail Integration** - Complete mission traceability
- **SOC, HIPAA, GDPR, PCI** - Agentic compliance and data processing rules.

*Some advanced features available separately. [Contact us](mailto:anton@synthetism.ai) for enterprise licensing.*

## License

MIT - Automate whatever you want.
