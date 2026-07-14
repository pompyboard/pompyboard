"""Utility module - re-exports for backward compatibility.

This module re-exports classes from the new modular structure.
Direct imports from grid.py, report.py, and base_algorithm.py are preferred.
"""

from grid import Sensor, HexagonalGrid, SquareGrid, BaseGrid, GridRegistry
from report import AccuracySummary, AnalysisReport, print_comparison_table
from base_algorithm import PositionAlgorithm, AlgorithmRegistry

__all__ = [
    "Sensor",
    "HexagonalGrid",
    "SquareGrid",
    "BaseGrid",
    "GridRegistry",
    "AccuracySummary",
    "AnalysisReport",
    "print_comparison_table",
    "PositionAlgorithm",
    "AlgorithmRegistry",
]
