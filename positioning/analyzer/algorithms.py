"""Position estimation algorithms."""

import math
import numpy as np
from typing import Tuple, Set

from base_algorithm import PositionAlgorithm, AlgorithmRegistry
from grid import HexagonalGrid, SquareGrid, BaseGrid


@AlgorithmRegistry.register
class ExampleAlgorithm(PositionAlgorithm):
    """Example algorithm that returns the actual cursor position."""

    @property
    def name(self) -> str:
        return "ideal_algorithm"

    @property
    def description(self) -> str:
        return "Example algorithm that returns actual position (for testing)"

    @property
    def supported_grids(self) -> Set[str]:
        """This algorithm supports SquareGrid."""
        return {"SquareGrid"}

    def estimate(self, grid: SquareGrid) -> Tuple[float, float]:
        """Return the actual cursor position."""
        if grid.actual_cursor_position is None:
            raise ValueError("Grid has no actual cursor position data")
        return grid.actual_cursor_position


@AlgorithmRegistry.register
class GaussianFitAlgorithm(PositionAlgorithm):
    """Gaussian fit algorithm with hexagonal-aware neighbor selection.

    This algorithm:
    1. Finds the sensor with the peak value
    2. Selects the 7 hexagonal neighbors (center + 6 adjacent sensors)
    3. Respects hexagonal grid topology (even/odd row offsets)
    4. Fits a 2D Gaussian using weighted least squares
    5. Returns the center of the fitted Gaussian

    Key improvement: Uses proper hexagonal neighbor selection that respects
    the grid's topology, avoiding asymmetric sensor selection that can occur
    with pure Euclidean distance-based neighbor selection.
    """

    @property
    def name(self) -> str:
        return "gaussian_fit"

    @property
    def description(self) -> str:
        return "Gaussian fit with hexagonal neighbor selection"

    @property
    def supported_grids(self) -> Set[str]:
        """This algorithm only supports HexagonalGrid."""
        return {"HexagonalGrid"}

    def get_hex_neighbors(self, grid: HexagonalGrid, center_row: int, center_col: int):
        """Get the 6 immediate hexagonal neighbors + center (7 total).

        For hexagonal grids with offset rows:
        - Even rows (row % 2 == 0): normal
        - Odd rows (row % 2 == 1): shifted right by half spacing

        Hexagon neighbors:
        - Same row: col-1, col+1
        - Adjacent rows: depends on even/odd
        """
        neighbors = []

        # Always include center
        center = grid.get_sensor(center_row, center_col)
        if center:
            neighbors.append(center)

        # Same row neighbors (always col-1 and col+1)
        for dc in [-1, +1]:
            sensor = grid.get_sensor(center_row, center_col + dc)
            if sensor:
                neighbors.append(sensor)

        # Adjacent row neighbors depend on even/odd row
        if center_row % 2 == 0:
            # Even row: neighbors in odd rows are at col-1, col
            for dr in [-1, +1]:
                for dc in [-1, 0]:
                    sensor = grid.get_sensor(center_row + dr, center_col + dc)
                    if sensor:
                        neighbors.append(sensor)
        else:
            # Odd row: neighbors in even rows are at col, col+1
            for dr in [-1, +1]:
                for dc in [0, +1]:
                    sensor = grid.get_sensor(center_row + dr, center_col + dc)
                    if sensor:
                        neighbors.append(sensor)

        return neighbors

    def estimate(self, grid: BaseGrid) -> Tuple[float, float]:
        """Estimate position using Gaussian fit on local sensor readings."""
        if not isinstance(grid, HexagonalGrid):
            raise RuntimeError("Only HexagonalGrid supported")

        sensors = grid.sensors

        # Find the sensor with the peak value
        peak_sensor = max(sensors, key=lambda s: s.value)
        peak_x, peak_y = peak_sensor.x, peak_sensor.y

        # FIX: Use ONLY hexagonal neighbors (7 sensors) to maintain symmetry
        # The original used 9 sensors selected by Euclidean distance,
        # which breaks hexagonal symmetry and causes bias on odd rows
        local_sensors = self.get_hex_neighbors(grid, peak_sensor.row, peak_sensor.col)

        # If we got less than 7 (edge case), fall back to Euclidean
        if len(local_sensors) < 4:
            local_sensors = sorted(
                sensors, key=lambda s: (s.x - peak_x) ** 2 + (s.y - peak_y) ** 2
            )[:9]

        # Build matrices for weighted least squares fitting
        # We fit: ln(value) = a + bx*x + by*y + d*(x^2 + y^2)
        matrix_a = []
        vector_b = []
        weights = []

        for sensor in local_sensors:
            if sensor.value <= 1e-6:
                continue

            # Coordinates relative to peak
            rel_x = sensor.x - peak_x
            rel_y = sensor.y - peak_y

            matrix_a.append([1.0, rel_x, rel_y, rel_x * rel_x + rel_y * rel_y])
            vector_b.append(math.log(sensor.value))
            weights.append(sensor.value)  # SAME AS V1

        # Need at least 4 points to fit the model
        if len(matrix_a) < 4:
            return peak_x, peak_y

        matrix_a = np.asarray(matrix_a)
        vector_b = np.asarray(vector_b)
        weights = np.asarray(weights)

        try:
            # Apply weights and solve weighted least squares
            weighted_a = matrix_a * weights[:, None]
            weighted_b = vector_b * weights
            coefficients = np.linalg.lstsq(weighted_a, weighted_b, rcond=None)[0]

            coef_a, coef_bx, coef_by, coef_d = coefficients

            # If d >= 0, the fit is not concave (not a valid Gaussian peak)
            if coef_d >= 0:
                return peak_x, peak_y

            # Find the center of the Gaussian
            center_x = -coef_bx / (2.0 * coef_d)
            center_y = -coef_by / (2.0 * coef_d)

            return center_x + peak_x, center_y + peak_y

        except np.linalg.LinAlgError:
            # If the fit fails, fall back to peak position
            return peak_x, peak_y
