"""Base class for position estimation algorithms with automatic discovery."""

from abc import ABC, abstractmethod
from typing import Tuple, Set, Type


class PositionAlgorithm(ABC):
    """Base class for all position estimation algorithms.

    All algorithms should inherit from this class and implement the estimate method.
    The class name will be used for automatic discovery.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the display name of the algorithm."""
        pass

    @property
    def description(self) -> str:
        """Return a description of the algorithm (optional)."""
        return ""

    @property
    def supported_grids(self) -> Set[str]:
        """Return set of supported grid type names (e.g., {'HexagonalGrid'}).

        By default, returns empty set which means all grids are supported.
        Override to specify specific grid types.
        """
        return set()

    @abstractmethod
    def estimate(self, grid) -> Tuple[float, float]:
        """Estimate position based on sensor grid data.

        Args:
            grid: Grid object containing sensor data (e.g., HexagonalGrid)

        Returns:
            Tuple of (x, y) coordinates in millimeters
        """
        pass

    def __call__(self, grid) -> Tuple[float, float]:
        """Allow algorithm to be called as a function."""
        return self.estimate(grid)

    def supports_grid(self, grid_type: str) -> bool:
        """Check if algorithm supports a specific grid type.

        Args:
            grid_type: Name of the grid class (e.g., 'HexagonalGrid')

        Returns:
            True if supported, False otherwise
        """
        supported = self.supported_grids
        # Empty set means all grids are supported
        return len(supported) == 0 or grid_type in supported


class AlgorithmRegistry:
    """Registry for automatic algorithm discovery."""

    _algorithms = {}

    @classmethod
    def register(cls, algorithm_class):
        """Register an algorithm class."""
        if not issubclass(algorithm_class, PositionAlgorithm):
            raise TypeError(f"{algorithm_class} must inherit from PositionAlgorithm")

        instance = algorithm_class()
        cls._algorithms[instance.name] = instance
        return algorithm_class

    @classmethod
    def get_algorithm(cls, name: str) -> PositionAlgorithm:
        """Get an algorithm by name."""
        if name not in cls._algorithms:
            raise ValueError(f"Unknown algorithm: {name}")
        return cls._algorithms[name]

    @classmethod
    def get_all_algorithms(cls):
        """Get all registered algorithms."""
        return dict(cls._algorithms)

    @classmethod
    def list_names(cls):
        """List all registered algorithm names."""
        return list(cls._algorithms.keys())

    @classmethod
    def get_algorithms_for_grid(cls, grid_type: str):
        """Get all algorithms that support a specific grid type."""
        return {
            name: algo
            for name, algo in cls._algorithms.items()
            if algo.supports_grid(grid_type)
        }
