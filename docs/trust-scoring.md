# Mathematical Trust Engine & Calibration Formulation

The AI Trust Architecture implements an auditable, Bayesian statistical model rather than heuristic or arbitrary weights.

---

## 1. The Four Dimension Architecture

The baseline model defines four explainable dimensions:

| Dimension | Default Weight ($w_i$) | Core Objective |
| :--- | :--- | :--- |
| **Historical Accuracy** | 40% (0.40) | Empirical Beta-Binomial posterior from verified evaluation records |
| **Evidence Quality** | 30% (0.30) | Institutional domain authority, direct relevance, and corroboration ratio |
| **Cross-Agent Consistency** | 20% (0.20) | Semantic agreement, polar contradiction penalty, independence discounting |
| **Uncertainty Calibration** | 10% (0.10) | Empirical Brier Score / Expected Calibration Error (ECE) from forecasts |

---

## 2. Beta-Binomial Bayesian Updating

Point estimates of model accuracy fail on small sample sizes. A model that scored 2/2 is not 100% reliable; a model that scored 0/1 is not 0% reliable.

We model binary accuracy $\theta \in [0, 1]$ using a Beta conjugate prior:

$$\theta \sim \text{Beta}(\alpha_0, \beta_0)$$

Default prior: $\alpha_0 = 2, \beta_0 = 2$ (weakly informative, prior mean 50%).

Given $n$ independently verified evaluation observations with $k$ correct answers:

$$\alpha_{\text{post}} = \alpha_0 + k$$
$$\beta_{\text{post}} = \beta_0 + (n - k)$$

### Posterior Expected Accuracy:
$$\mathbb{E}[\theta] = \frac{\alpha_0 + k}{\alpha_0 + \beta_0 + n}$$

### Posterior Epistemic Variance:
$$\text{Var}(\theta) = \frac{\alpha_{\text{post}} \beta_{\text{post}}}{(\alpha_{\text{post}} + \beta_{\text{post}})^2 (\alpha_{\text{post}} + \beta_{\text{post}} + 1)}$$

### 95% Bayesian Credible Interval:
$$\text{CI}_{95\%} \approx \left[ \max(0, \mathbb{E}[\theta] - 1.96 \sqrt{\text{Var}}), \min(1, \mathbb{E}[\theta] + 1.96 \sqrt{\text{Var}}) \right]$$

### Status Flags:
- If $n = 0$: Flagged as `PRIOR_ESTIMATE` (unobserved performance, high epistemic variance).
- If $n < 5$: Flagged as `INSUFFICIENT_HISTORY` (low sample warning).
- If $n \ge 5$: Flagged as `MEASURED`.

---

## 3. Dynamic Missing-Dimension Normalization

When a dimension is missing (e.g. search offline, zero historical evaluations), naive static weighting deflates scores artificially.

Let $A$ be the set of available, eligible dimensions, where each dimension $i \in A$ has score $s_i \in [0, 100]$ and configured weight $w_i$.

$$T = \frac{\sum_{i \in A} w_i s_i}{\sum_{i \in A} w_i}$$

$$\text{Coverage} = \frac{\sum_{i \in A} w_i}{\sum_{\text{all}} w_i}$$

### Coverage States:
- $\text{Coverage} \ge 0.95$: `FULL`
- $0.60 \le \text{Coverage} < 0.95$: `PARTIAL`
- $\text{Coverage} < 0.60$: `INSUFFICIENT_DATA` (Enforces policy abstention)

---

## 4. Empirical Brier Score Calibration

Self-reported confidence from LLMs is notoriously uncalibrated and overconfident.

For agents with verified historical probabilistic forecasts:

$$\text{Brier Score} = \frac{1}{N} \sum_{j=1}^N (p_j - y_j)^2$$

Where:
- $p_j \in [0, 1]$ is the agent's reported probability
- $y_j \in \{0, 1\}$ is the verified ground truth outcome

If sample size $N < 5$, the dimension status is strictly flagged as `UNCALIBRATED` rather than assigning a fabricated score.
