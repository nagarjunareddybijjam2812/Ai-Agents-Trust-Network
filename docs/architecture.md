# AI Trust Architecture - System Architecture & LangGraph Design

## 1. System Overview

**AI Trust Architecture** is an AI answer verification and reliability platform designed around epistemic humility and empirical corroboration.

```mermaid
graph TD
    User([User / API Client]) -->|POST /api/questions| API[FastAPI / Express API Layer]
    API -->|Initialize Typed State| Orchestrator[LangGraph Workflow Engine]

    subgraph "Independent Parallel Stage"
        Orchestrator -->|Dispatch Question| Gemini[Gemini Answer Agent<br/>gemini-3.8-flash]
        Orchestrator -->|Dispatch Question| OpenAI[OpenAI Answer Agent<br/>gpt-4o / Test Double]
    end

    Gemini -->|Independent Answer + Claims| SharedState[(Typed Workflow State)]
    OpenAI -->|Independent Answer + Claims| SharedState

    subgraph "Evidence & Claim Corroboration"
        SharedState -->|Query Extraction| Evidence[Evidence Agent<br/>SSRF Protected Crawling]
        Evidence -->|Domain Authority & Provenance| SharedState
        SharedState -->|Cross-Claim Matching| Consistency[Consistency Agent<br/>Polarity & Contradiction Detection]
    end

    subgraph "Mathematical Trust Kernel"
        Consistency --> TrustEngine[Bayesian 4D Trust Kernel]
        TrustEngine -->|Beta-Binomial Posterior| TrustScores[Historical Accuracy 40%<br/>Evidence Quality 30%<br/>Consistency 20%<br/>Calibration 10%]
    end

    subgraph "Deterministic Policy & Routing"
        TrustScores --> DecisionRouter{Decision Policy Invariants}
        DecisionRouter -->|Sufficient Evidence & Risk Acceptable| ACCEPTED[ACCEPTED Status]
        DecisionRouter -->|Resolvable Uncertainty & Review Cap Remaining| BoundedReview[Bounded Review Pass]
        BoundedReview -->|Secondary Evidence Probe| TrustEngine
        DecisionRouter -->|Contradicted Claims or Severe Epistemic Clash| ABSTAINED[ABSTAINED Status]
        DecisionRouter -->|Incomplete Data or Margin Failure| NEEDS_REVIEW[NEEDS_REVIEW Status]
    end

    ACCEPTED --> Synthesis[Final Decision Agent]
    NEEDS_REVIEW --> Synthesis
    ABSTAINED --> Synthesis

    Synthesis --> Persist[(Persistence Repository)]
    Persist --> Dashboard([AI Trust Observability Dashboard])
```

---

## 2. LangGraph State Machine Topology

```mermaid
stateDiagram-v2
    [*] --> Initialize: Input Validation
    Initialize --> ParallelAgents: Dispatches Gemini & OpenAI concurrently
    ParallelAgents --> EvidenceRetrieval: SSRF-Safe Multi-Source Crawling
    EvidenceRetrieval --> ClaimEvaluation: Atomic Claim Decomposition
    ClaimEvaluation --> ConsistencyAnalysis: Polarity & Contradiction Detection
    ConsistencyAnalysis --> BayesianTrustScoring: Beta-Binomial & 4D Kernel
    BayesianTrustScoring --> DecisionRouting: Hard Safety Invariants Check

    DecisionRouting --> BoundedReview: if NEEDS_REVIEW and iterations < max
    BoundedReview --> EvidenceRetrieval: Secondary targeted probe
    DecisionRouting --> FinalSynthesis: if ACCEPTED or ABSTAINED or Max Iterations

    FinalSynthesis --> FinalizePersist: Atomic DB write & events
    FinalizePersist --> [*]
```

---

## 3. Core Component Roles

1. **Gemini Answer Agent**: Real Google GenAI integration utilizing `gemini-3.8-flash` via `@google/genai`. Receives only the user query to guarantee independence.
2. **OpenAI Answer Agent**: OpenAI frontier model integration. When external credentials are unconfigured, runs in explicit deterministic test double mode (`isTestDouble: true`) without fabricated telemetry.
3. **Evidence Agent**: Multi-source evidence crawler enforcing strict CIDR, loopback, and metadata blocking (SSRF defense). Scores domain authority (NIST, NASA, CDC, WHO, Nature, Reuters).
4. **Consistency Agent**: Compares claim sets across models. Detects polar opposite claims, conflicting dates/metrics, and flags unsupported consensus.
5. **Trust Kernel**: Pure mathematical engine calculating Beta-Binomial Bayesian accuracy, dynamic missing-dimension coverage, and empirical Brier score calibration.
6. **Decision Policy Engine**: Hard deterministic gatekeeper. Blocks `ACCEPTED` if high-severity contradictions or contradicted claims exist, even with high numerical scores.
7. **Final Decision Agent**: Synthesizes verified answer citing supported claims, attributing evidence sources, and formatting structured abstention explanations when withheld.
