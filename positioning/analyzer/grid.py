"""Grid classes for sensor layouts."""

import math
from abc import ABC, abstractmethod
from typing import Tuple, Dict, Optional, Type, List


class Sensor:
    """Represents a single Hall effect sensor with position and reading."""

    def __init__(self, row: int = 0, col: int = 0, x_mm: float = 0, y_mm: float = 0):
        self.row = row
        self.col = col
        self.x = x_mm
        self.y = y_mm
        self.value = 0.0

    def distance_to(self, x: float, y: float) -> float:
        """Calculate Euclidean distance to a point."""
        dx = self.x - x
        dy = self.y - y
        return math.sqrt(dx * dx + dy * dy)


class BaseGrid(ABC):
    """Base class for all grid types."""

    def __init__(self, metadata: dict):
        """Initialize base grid attributes."""
        self.metadata = metadata
        self.actual_cursor_position: Optional[Tuple[float, float]] = None
        self.sensors: List[Sensor] = []

    @property
    @abstractmethod
    def grid_type_name(self) -> str:
        """Return the grid type identifier used in JSON metadata."""
        pass

    @property
    @abstractmethod
    def display_name(self) -> str:
        """Return the display name of the grid type."""
        pass

    @property
    def description(self) -> str:
        """Return a description of the grid type (optional)."""
        return ""

    @abstractmethod
    def _build_grid(self):
        """Build the grid of sensors."""
        pass

    @abstractmethod
    def update_data(self, data: dict):
        """Update sensor values from data point."""
        pass

    @abstractmethod
    def describe(self):
        """Print grid information."""
        pass


class GridRegistry:
    """Registry for automatic grid type discovery."""

    _grids: Dict[str, Type[BaseGrid]] = {}

    @classmethod
    def register(cls, grid_type_name: str):
        """Decorator to register a grid class.

        Args:
            grid_type_name: The grid type identifier (from JSON metadata)
        """

        def decorator(grid_class: Type[BaseGrid]):
            if not issubclass(grid_class, BaseGrid):
                raise TypeError(f"{grid_class} must inherit from BaseGrid")
            cls._grids[grid_type_name] = grid_class
            return grid_class

        return decorator

    @classmethod
    def get_grid_class(cls, grid_type_name: str) -> Type[BaseGrid]:
        """Get grid class by type name."""
        if grid_type_name not in cls._grids:
            raise ValueError(f"Unknown grid type: {grid_type_name}")
        return cls._grids[grid_type_name]

    @classmethod
    def get_all_grids(cls) -> Dict[str, Type[BaseGrid]]:
        """Get all registered grid types."""
        return dict(cls._grids)

    @classmethod
    def list_types(cls) -> List[str]:
        """List all registered grid type names."""
        return list(cls._grids.keys())

    @classmethod
    def create_grid(cls, metadata: dict) -> BaseGrid:
        """Factory method to create appropriate grid from metadata."""
        grid_type = metadata.get("grid_type")
        if not grid_type:
            raise ValueError("Missing 'grid_type' in metadata")

        grid_class = cls.get_grid_class(grid_type)
        return grid_class(metadata)


@GridRegistry.register("hexagonal")
class HexagonalGrid(BaseGrid):
    """Hexagonal sensor grid layout with offset rows."""
    """
    Example:
      ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
      ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
      ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
      ( )( )( )( )( )( )( )( )( )( )
    """

    @property
    def grid_type_name(self) -> str:
        return "hexagonal"

    @property
    def display_name(self) -> str:
        return "Hexagonal Grid"

    @property
    def description(self) -> str:
        return "Hexagonal layout with alternating row offsets"

    def __init__(self, metadata: dict):
        super().__init__(metadata)
        self.rows = metadata["grid_rows"]
        self.cols = metadata["grid_cols"]
        self.spacing = metadata["sensor_spacing_mm"]

        self._build_grid()
        self.sensor_map: Dict[Tuple[int, int], Sensor] = {
            (s.row, s.col): s for s in self.sensors
        }

    def get_sensor(self, row: int, col: int) -> Optional[Sensor]:
        """Get sensor at specific row and column."""
        return self.sensor_map.get((row, col))

    def _build_grid(self):
        """Build the hexagonal grid of sensors."""
        self.sensors = []

        for row in range(self.rows):
            for col in range(self.cols):
                sensor_radius = self.spacing / 2

                # Hexagonal layout: even rows are offset
                if row % 2 == 0:
                    sensor_x = sensor_radius + self.spacing * col
                else:
                    sensor_x = self.spacing * (col + 1)

                sensor_y = sensor_radius + row * self.spacing * (math.sqrt(3) / 2)

                sensor = Sensor(row, col, sensor_x, sensor_y)
                self.sensors.append(sensor)

    def update_data(self, data: dict):
        """Update sensor values from data point."""
        self.actual_cursor_position = (data["cursor_x_mm"], data["cursor_y_mm"])

        for sensor_data in data["sensors"]:
            sensor_row = sensor_data["row"]
            sensor_col = sensor_data["col"]

            sensor = self.get_sensor(sensor_row, sensor_col)
            if sensor:
                sensor.value = sensor_data["value"]

    def describe(self):
        """Print grid information."""
        grid_type = self.metadata["grid_type"]
        grid_size = f"{self.metadata['grid_rows']}x{self.metadata['grid_cols']}"
        spacing = self.metadata["sensor_spacing_mm"]
        print(f"Grid data: grid_type={grid_type} | {grid_size} | spacing: {spacing}mm")


@GridRegistry.register("square")
class SquareGrid(BaseGrid):
    """Square sensor grid layout (not yet implemented)."""
    """
    Example:
        ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
        ( )( )( )( )( )( )( )( )( )( )
    """

    @property
    def grid_type_name(self) -> str:
        return "square"

    @property
    def display_name(self) -> str:
        return "Square Grid"

    @property
    def description(self) -> str:
        return "Square/rectangular layout (not yet implemented)"

    def __init__(self, metadata: dict):
        raise NotImplementedError("SquareGrid is not yet implemented")

    def _build_grid(self):
        raise NotImplementedError("SquareGrid is not yet implemented")

    def update_data(self, data: dict):
        raise NotImplementedError("SquareGrid is not yet implemented")

    def describe(self):
        raise NotImplementedError("SquareGrid is not yet implemented")
