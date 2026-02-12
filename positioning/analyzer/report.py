"""Analysis reporting and metrics."""

import math
from dataclasses import dataclass
from typing import List, Optional

import numpy as np
from prettytable import PrettyTable


@dataclass
class AccuracySummary:
    """Summary of algorithm accuracy metrics."""

    n: int
    total_points: int

    mae: float
    median: float
    rms: float
    p90: float
    p95: float
    p99: float
    min_error: float
    max_error: float

    mean_bias_x: float
    mean_bias_y: float
    rms_x: float
    rms_y: float

    failure_rate: float  # Percentage above threshold
    score: float  # Overall algorithm score (0-100)

    METRIC_MAP = {
        "n": ("N", lambda s: s.n),
        "mae": ("MAE", lambda s: f"{s.mae:.2f}"),
        "median": ("Median (P50)", lambda s: f"{s.median:.2f}"),
        "rms": ("RMS", lambda s: f"{s.rms:.2f}"),
        "p90": ("P90", lambda s: f"{s.p90:.2f}"),
        "p95": ("P95", lambda s: f"{s.p95:.2f}"),
        "p99": ("P99", lambda s: f"{s.p99:.2f}"),
        "max": ("Max", lambda s: f"{s.max_error:.2f}"),
        "fail": ("Fail%", lambda s: f"{s.failure_rate:.1f}%"),
        "bias_x": ("BiasX", lambda s: f"{s.mean_bias_x:.2f}"),
        "bias_y": ("BiasY", lambda s: f"{s.mean_bias_y:.2f}"),
        "score": ("Score", lambda s: f"{s.score:.1f}"),
    }

    def as_row(
        self, name: str = "", dataset: str = "", metrics: Optional[List[str]] = None
    ) -> List:
        """Convert summary to a table row."""
        if metrics is None:
            metrics = ["n", "mae", "median", "rms", "p95", "max", "fail", "score"]

        row = [name, dataset]
        for metric in metrics:
            _, getter = self.METRIC_MAP[metric]
            row.append(getter(self))
        return row


class AnalysisReport:
    """Report for algorithm performance analysis."""

    def __init__(
        self,
        algorithm_name: str,
        dataset_path: str,
        estimations: List[dict],
        data_points: List[dict],
        failure_threshold: float = 0.15,
    ):
        """Initialize analysis report.

        Args:
            algorithm_name: Name of the algorithm
            dataset_path: Path to the dataset
            estimations: List of estimation results with error_distance, error_x, error_y
            data_points: Original data points
            failure_threshold: Threshold in mm for considering an estimation failed
        """
        self.dataset_path = dataset_path
        self.algorithm_name = algorithm_name
        self.estimations = estimations
        self.data_points = data_points
        self.failure_threshold = failure_threshold

    def calculate_score(
        self,
        mae: float,
        rms: float,
        p95: float,
        failure_rate: float,
        bias_x: float,
        bias_y: float,
    ) -> float:
        """Calculate overall algorithm score (0-100).

        Scoring formula:
        - Lower MAE, RMS, P95 is better (inverse relationship)
        - Lower failure rate is better
        - Lower absolute bias is better
        - Score of 100 = perfect (0 error)
        - Score of 0 = very poor performance

        Args:
            mae: Mean absolute error
            rms: Root mean square error
            p95: 95th percentile error
            failure_rate: Percentage of failed estimations
            bias_x: Mean bias in X direction
            bias_y: Mean bias in Y direction

        Returns:
            Score from 0 to 100
        """
        # Reference values for normalization (adjust based on your domain)
        # These represent "acceptable" performance thresholds
        # Updated to match new stricter acceptance criteria
        reference_mae = 0.35  # mm (yellow threshold)
        reference_rms = 0.5  # mm
        reference_p95 = 0.7  # mm (orange/red boundary)
        reference_bias = 0.15  # mm (green threshold)

        # Component scores (each 0-1, higher is better)
        mae_score = max(0, 1 - mae / (2 * reference_mae))
        rms_score = max(0, 1 - rms / (2 * reference_rms))
        p95_score = max(0, 1 - p95 / (2 * reference_p95))
        failure_score = max(0, 1 - failure_rate / 100.0)

        # Bias penalty (combined X and Y)
        total_bias = math.sqrt(bias_x**2 + bias_y**2)
        bias_score = max(0, 1 - total_bias / (2 * reference_bias))

        # Weighted combination
        weights = {
            "mae": 0.30,  # 30% - Most important metric
            "rms": 0.25,  # 25% - Penalizes outliers
            "p95": 0.20,  # 20% - Worst case performance
            "failure": 0.15,  # 15% - Reliability
            "bias": 0.10,  # 10% - Systematic error
        }

        weighted_score = (
            weights["mae"] * mae_score
            + weights["rms"] * rms_score
            + weights["p95"] * p95_score
            + weights["failure"] * failure_score
            + weights["bias"] * bias_score
        )

        # Convert to 0-100 scale
        return weighted_score * 100.0

    def summarize(self) -> Optional[AccuracySummary]:
        """Calculate accuracy summary metrics."""
        if not self.estimations:
            return None

        distances = np.array([est["error_distance"] for est in self.estimations])
        errors_x = np.array([est["error_x"] for est in self.estimations])
        errors_y = np.array([est["error_y"] for est in self.estimations])

        mae = np.mean(distances)
        median = np.median(distances)
        rms = math.sqrt(np.mean(distances**2))

        p90 = np.percentile(distances, 90)
        p95 = np.percentile(distances, 95)
        p99 = np.percentile(distances, 99)

        min_error = float(np.min(distances))
        max_error = float(np.max(distances))
        mean_bias_x = float(np.mean(errors_x))
        mean_bias_y = float(np.mean(errors_y))

        rms_x = math.sqrt(np.mean(errors_x**2))
        rms_y = math.sqrt(np.mean(errors_y**2))

        failures = np.sum(distances > self.failure_threshold)
        failure_rate = 100.0 * failures / len(distances)

        # Calculate overall score
        score = self.calculate_score(
            float(mae),
            float(rms),
            float(p95),
            float(failure_rate),
            mean_bias_x,
            mean_bias_y,
        )

        return AccuracySummary(
            n=len(distances),
            total_points=len(self.data_points),
            mae=float(mae),
            median=float(median),
            rms=float(rms),
            p90=float(p90),
            p95=float(p95),
            p99=float(p99),
            min_error=min_error,
            max_error=max_error,
            mean_bias_x=mean_bias_x,
            mean_bias_y=mean_bias_y,
            rms_x=float(rms_x),
            rms_y=float(rms_y),
            failure_rate=float(failure_rate),
            score=float(score),
        )

    @staticmethod
    def print_metric_help():
        """Print explanation of metrics."""
        print("\nMetric guide:")
        print("N       → Number of samples.")
        print("MAE     → Average position error. Lower is better.")
        print("Median  → Typical error (robust to outliers).")
        print("RMS     → Penalizes large errors strongly.")
        print("P95     → 95% of errors are below this value.")
        print("P99     → Worst realistic case.")
        print("Max     → Absolute worst case.")
        print("Fail%   → % of points above failure threshold.")
        print("BiasX/Y → Systematic shift on axis (should be ~0).")
        print("Score   → Overall quality score (0-100, higher is better).")
        print("")
        print("Good signs:")
        print("• Median ≈ MAE")
        print("• RMS slightly above MAE")
        print("• P95 not >> MAE")
        print("• Bias near 0")
        print("• Low Fail%")
        print("• High Score (>70)")
        print("")


def print_comparison_table(
    reports: List[AnalysisReport], metrics: Optional[List[str]] = None
):
    """Print comparison table for multiple algorithm reports."""
    if metrics is None:
        metrics = [
            "n",
            "mae",
            "rms",
            "median",
            "p90",
            "p95",
            "p99",
            "max",
            "bias_x",
            "bias_y",
            "fail",
            "score",
        ]

    table = PrettyTable()

    headers = ["Algorithm", "Data"]
    for metric in metrics:
        header_name, _ = AccuracySummary.METRIC_MAP[metric]
        headers.append(header_name)

    table.field_names = headers

    for report in reports:
        summary = report.summarize()
        if summary:
            table.add_row(
                summary.as_row(report.algorithm_name, report.dataset_path, metrics)
            )

    print(table)
