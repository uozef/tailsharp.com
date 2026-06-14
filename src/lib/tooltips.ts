export const TOOLTIPS: Record<string, string> = {
  "Sharpe Ratio":
    "Risk-adjusted return. Measures excess return per unit of risk. Above 1.0 is good, above 2.0 is excellent.",
  "Sortino Ratio":
    "Like Sharpe but only penalizes downside volatility. Higher means better downside protection.",
  "Max Drawdown":
    "Largest peak-to-trough decline. Shows worst-case historical loss scenario.",
  "Kelly Criterion":
    "Mathematical formula for optimal bet sizing based on win rate and reward-to-risk ratio.",
  "Profit Factor":
    "Gross profits divided by gross losses. Above 2.0 means $2 earned for every $1 lost.",
  "Win Rate":
    "Percentage of trades that were profitable. Context matters — a 55% win rate with 3:1 reward is excellent.",
  ROI: "Return on Investment. Total percentage gain on invested capital.",
  "Trust Score":
    "Composite rating (0-100) weighing consistency (30%), risk management (30%), behavioral health (25%), and track record (15%).",
  "Disposition Effect":
    "Behavioral bias where traders sell winners too early and hold losers too long.",
  Martingale:
    "Dangerous strategy of doubling position size after each loss, hoping to recover.",
  Tilt: "Emotional state after losses causing larger, riskier trades. Common in discretionary traders.",
  FOMO: "Fear of Missing Out — entering trades based on hype rather than analysis.",
  "Revenge Trading":
    "Impulsive trading immediately after a loss, trying to 'win it back'.",
  Slippage:
    "Price difference between leader's execution and follower's execution due to timing delay. Typically 0.5-3%.",
  AUM: "Assets Under Management — total capital followers have allocated to this leader.",
  "Consistency Score":
    "Measures how stable and repeatable a trader's returns are over time.",
  "Risk Management":
    "How well the trader controls downside — position sizing, drawdown limits, diversification.",
  "Behavioral Health":
    "Absence of emotional trading patterns like tilt, revenge trading, and FOMO.",
  "Track Record":
    "Length and quality of trading history. More trades over longer periods = more reliable.",
  "Luck Score":
    "Statistical estimate of how much performance is explained by chance vs. skill. Lower is better (more skill).",
};
