# AI Analysis SOP

## Purpose
After all deterministic comparisons complete, the AI engine adds intelligence: explaining *why* something failed in human terms, estimating severity, and suggesting fixes.

## Best-Effort Rule
AI analysis is OPTIONAL and NEVER overrides deterministic PASS/FAIL. If AI provider is unavailable or returns garbage, the report proceeds with empty AI fields.

## Provider Abstraction

```python
class AIAnalyzer:
    @staticmethod
    def analyze(figma_element, web_element, failed_checks, config):
        provider = AIProviderFactory.get_provider(config)
        return provider.explain(figma_element, web_element, failed_checks)
```

### Supported Providers
| Provider | Class | Package |
|----------|-------|---------|
| OpenAI | `OpenAIProvider` | `openai` |
| Ollama | `OllamaProvider` | `requests` |
| None | `NullProvider` | — |

### Prompt Template (OpenAI/Ollama)

```
You are a UI/UX quality engineer analyzing a visual regression failure.

Element: {element_name} ({element_type})
Figma (expected): {expected_values}
Website (actual): {actual_values}
Failed properties: {failed_properties}

For each failure, provide:
1. A brief description of the issue
2. The most likely root cause
3. A suggested fix
4. A confidence score (0.0-1.0)

Respond in JSON format:
{
  "description": "...",
  "root_cause": "...",
  "suggested_fix": "...",
  "confidence": 0.85
}
```

### Error Handling
- API key missing → skip (no crash)
- Network timeout → log warning, return empty explanations
- Invalid JSON response → try to parse, if fails return empty
- All failures in batch → return partial results (whatever succeeded)
