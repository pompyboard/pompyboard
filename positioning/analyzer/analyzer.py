"""Main analyzer module for position algorithm evaluation."""

import json
import math
import argparse
from pathlib import Path
from typing import Callable, List

from grid import HexagonalGrid, GridRegistry
from report import AnalysisReport, print_comparison_table
from base_algorithm import AlgorithmRegistry
import algorithms  # Import to trigger algorithm registration
import grid  # Import to trigger grid registration


class PositionAlgorithmAnalyzer:
    """Analyzer for position estimation algorithms."""

    def __init__(self, json_path: str):
        """Initialize analyzer with dataset from JSON file."""
        self.json_path = json_path
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.data = data
        self._validate_json_format()

        self.data_points = self.data["data_points"]
        self.estimations = []

    def _validate_json_format(self):
        """Validate JSON structure matches expected format.

        Expected format:
        {
            "metadata": {
                "version": 1,
                "grid_type": "hexagonal",
                "grid_rows": int,
                "grid_cols": int,
                "sensor_spacing_mm": float,
                "adc_precision_in_bits": int,
                "magnet": {
                    "shape": string,
                    "size": string,
                    "height_mm": float
                }
            },
            "data_points": [
                {
                    "timestamp_ns": int,
                    "cursor_x_mm": float,
                    "cursor_y_mm": float,
                    "sensors": [
                        {
                            "row": int,
                            "col": int,
                            "value": int
                        }
                    ]
                }
            ]
        }
        """
        # Validate top-level structure
        if not isinstance(self.data, dict):
            raise ValueError("JSON root must be a dictionary")

        if "metadata" not in self.data:
            raise ValueError("Missing required field: 'metadata'")

        if "data_points" not in self.data:
            raise ValueError("Missing required field: 'data_points'")

        metadata = self.data["metadata"]

        # Validate metadata structure
        if not isinstance(metadata, dict):
            raise ValueError("'metadata' must be a dictionary")

        required_metadata_fields = {
            "version": int,
            "grid_type": str,
            "grid_rows": int,
            "grid_cols": int,
            "sensor_spacing_mm": (int, float),
            "adc_precision_in_bits": int,
        }

        for field, expected_type in required_metadata_fields.items():
            if field not in metadata:
                raise ValueError(f"Missing required field in metadata: '{field}'")
            if not isinstance(metadata[field], expected_type):
                type_name = (
                    expected_type.__name__
                    if not isinstance(expected_type, tuple)
                    else " or ".join(t.__name__ for t in expected_type)
                )
                raise ValueError(
                    f"Field 'metadata.{field}' must be of type {type_name}, got {type(metadata[field]).__name__}"
                )

        if metadata["version"] != 1:
            raise ValueError("Only version 1 format is supported")

        supported_grids = "hexagonal"
        if metadata["grid_type"] not in supported_grids:
            raise ValueError(
                f"Wrong grid_type, currently only supported: {supported_grids}"
            )

        # Validate magnet structure
        if "magnet" not in metadata:
            raise ValueError("Missing required field in metadata: 'magnet'")

        magnet = metadata["magnet"]
        if not isinstance(magnet, dict):
            raise ValueError("'metadata.magnet' must be a dictionary")

        required_magnet_fields = {"shape": str, "size": str, "height_mm": (int, float)}

        for field, expected_type in required_magnet_fields.items():
            if field not in magnet:
                raise ValueError(
                    f"Missing required field in metadata.magnet: '{field}'"
                )
            if not isinstance(magnet[field], expected_type):
                type_name = (
                    expected_type.__name__
                    if not isinstance(expected_type, tuple)
                    else " or ".join(t.__name__ for t in expected_type)
                )
                raise ValueError(
                    f"Field 'metadata.magnet.{field}' must be of type {type_name}, got {type(magnet[field]).__name__}"
                )

        # Validate data_points structure
        data_points = self.data["data_points"]
        if not isinstance(data_points, list):
            raise ValueError("'data_points' must be a list")

        if len(data_points) == 0:
            raise ValueError("'data_points' list cannot be empty")

        grid_rows = metadata["grid_rows"]
        grid_cols = metadata["grid_cols"]
        adc_max_value = 1 << metadata["adc_precision_in_bits"]

        for idx, point in enumerate(data_points):
            if not isinstance(point, dict):
                raise ValueError(f"data_points[{idx}] must be a dictionary")

            # Validate required fields in each data point
            required_point_fields = {
                "timestamp_ns": int,
                "cursor_x_mm": (int, float),
                "cursor_y_mm": (int, float),
            }

            for field, expected_type in required_point_fields.items():
                if field not in point:
                    raise ValueError(
                        f"Missing required field in data_points[{idx}]: '{field}'"
                    )
                if not isinstance(point[field], expected_type):
                    type_name = (
                        expected_type.__name__
                        if not isinstance(expected_type, tuple)
                        else " or ".join(t.__name__ for t in expected_type)
                    )
                    raise ValueError(
                        f"Field 'data_points[{idx}].{field}' must be of type {type_name}, got {type(point[field]).__name__}"
                    )

            # Validate sensors array
            if "sensors" not in point:
                raise ValueError(
                    f"Missing required field in data_points[{idx}]: 'sensors'"
                )

            sensors = point["sensors"]
            if not isinstance(sensors, list):
                raise ValueError(f"Field 'data_points[{idx}].sensors' must be a list")

            expected_sensor_count = grid_rows * grid_cols
            if len(sensors) != expected_sensor_count:
                raise ValueError(
                    f"data_points[{idx}].sensors must contain exactly {expected_sensor_count} sensors "
                    f"(grid_rows * grid_cols = {grid_rows} * {grid_cols}), got {len(sensors)}"
                )

            for sensor_idx, sensor in enumerate(sensors):
                if not isinstance(sensor, dict):
                    raise ValueError(
                        f"data_points[{idx}].sensors[{sensor_idx}] must be a dictionary"
                    )

                required_sensor_fields = {"row": int, "col": int, "value": int}

                for field, expected_type in required_sensor_fields.items():
                    if field not in sensor:
                        raise ValueError(
                            f"Missing required field in data_points[{idx}].sensors[{sensor_idx}]: '{field}'"
                        )
                    if not isinstance(sensor[field], expected_type):
                        raise ValueError(
                            f"Field 'data_points[{idx}].sensors[{sensor_idx}].{field}' must be of type {expected_type.__name__}, got {type(sensor[field]).__name__}"
                        )

                # Validate sensor row and col are within grid bounds
                if not (0 <= sensor["row"] < grid_rows):
                    raise ValueError(
                        f"data_points[{idx}].sensors[{sensor_idx}].row must be in range [0, {grid_rows}), got {sensor['row']}"
                    )

                if not (0 <= sensor["col"] < grid_cols):
                    raise ValueError(
                        f"data_points[{idx}].sensors[{sensor_idx}].col must be in range [0, {grid_cols}), got {sensor['col']}"
                    )

                # Validate sensor value is within ADC range
                if not (0 <= sensor["value"] < adc_max_value):
                    raise ValueError(
                        f"data_points[{idx}].sensors[{sensor_idx}].value must be in range [0, {adc_max_value}), got {sensor['value']}"
                    )

    def analyze(
        self, algorithm_fn: Callable, algorithm_name: str = "", detailed: bool = False
    ):
        """Run analysis on dataset using specified algorithm.

        Args:
            algorithm_fn: Algorithm function that takes a grid and returns (x, y) position
            algorithm_name: Name of the algorithm (for detailed output)
            detailed: If True, print detailed output for each data point
        """
        data = self.data
        metadata = data["metadata"]
        magnet = metadata["magnet"]
        data_points = data["data_points"]

        grid = HexagonalGrid(metadata)

        if detailed:
            print("\n" + "=" * 80)
            print(f"  ALGORITHM: {algorithm_name}")
            print(f"  DATASET: {self.json_path}")
            print("=" * 80)
            grid.describe()
            print(
                f"Magnet: shape={magnet['shape']}, size={magnet['size']}, height={magnet['height_mm']}mm"
            )
            print(f"Total data points: {len(data_points)}")
            print("-" * 80)

        self.estimations = []
        for i, point in enumerate(data_points):
            grid.update_data(point)

            actual_x, actual_y = grid.actual_cursor_position
            estimated_x, estimated_y = algorithm_fn(grid)

            error_x = actual_x - estimated_x
            error_y = actual_y - estimated_y
            error_distance = math.sqrt(error_x**2 + error_y**2)

            result = {
                "error_distance": error_distance,
                "error_x": error_x,
                "error_y": error_y,
            }
            self.estimations.append(result)

            if detailed:
                status = (
                    "✓"
                    if error_distance < 1.0
                    else "✗"
                    if error_distance > 5.0
                    else "~"
                )
                print(f"\n[{status}] Data Point #{i + 1}/{len(data_points)}")
                print(f"    Actual:    ({actual_x:7.2f}, {actual_y:7.2f}) mm")
                print(f"    Estimated: ({estimated_x:7.2f}, {estimated_y:7.2f}) mm")
                print(
                    f"    Error:     Δx={error_x:+6.2f}mm  Δy={error_y:+6.2f}mm  Distance={error_distance:6.2f}mm"
                )

        if detailed:
            print("\n" + "-" * 80)


def visual_debug(dataset_paths: List[str]):
    """Start visual debugging tool.

    Args:
        dataset_paths: List of paths to dataset JSON files
    """
    try:
        from visualizer import start_visualizer

        start_visualizer(dataset_paths)
    except ImportError as e:
        print(
            f"Error: Could not import visualizer. Make sure pygame and pygame_gui are installed:"
        )
        print(f"  python -m pip install pygame pygame-gui")
        print(f"\nDetails: {e}")
    except Exception as e:
        print(f"Error starting visualizer: {e}")


def main():
    """Main entry point for CLI."""
    parser = argparse.ArgumentParser(
        description="Position Algorithm Analyzer - Evaluate magnetic position estimation algorithms"
    )

    parser.add_argument(
        "--list-algorithms",
        action="store_true",
        help="Print available algorithms and exit",
    )

    parser.add_argument(
        "--list-grids",
        action="store_true",
        help="Print supported grid types and exit",
    )

    parser.add_argument(
        "--list-algorithms-per-grid",
        type=str,
        metavar="GRID_TYPE",
        help="List algorithms that support a specific grid type",
    )

    parser.add_argument(
        "--dataset",
        type=str,
        help="Path to a single JSON file or folder containing JSON files",
    )

    parser.add_argument(
        "--algorithm",
        type=str,
        default="all",
        help="Algorithm(s) to run (use 'all' to run all algorithms, or comma-separated list like 'alg1,alg2', default: all)",
    )

    parser.add_argument(
        "--detailed", action="store_true", help="Enable detailed analysis output"
    )

    parser.add_argument(
        "--print-metric-guide",
        action="store_true",
        help="Print metric guide before results (default: False)",
    )

    parser.add_argument(
        "--visual-debug",
        action="store_true",
        help="Enable visual debugging",
    )

    args = parser.parse_args()

    # Handle --list-algorithms
    if args.list_algorithms:
        all_algorithms = AlgorithmRegistry.get_all_algorithms()
        print("Available algorithms:")
        for name, algorithm in all_algorithms.items():
            description = f" - {algorithm.description}" if algorithm.description else ""
            supported_grids = algorithm.supported_grids
            if supported_grids:
                grid_info = f" [Grids: {', '.join(sorted(supported_grids))}]"
            else:
                grid_info = " [All grids]"
            print(f"  - {name}{description}{grid_info}")
        return

    # Handle --list-grids
    if args.list_grids:
        all_grids = GridRegistry.get_all_grids()
        print("Supported grid types:")
        for grid_type_name, grid_class in all_grids.items():
            print(f"  - {grid_class.__name__}")
        return

    # Handle --list-algorithms-per-grid
    if args.list_algorithms_per_grid:
        grid_type = args.list_algorithms_per_grid
        algorithms_for_grid = AlgorithmRegistry.get_algorithms_for_grid(grid_type)
        print(f"Algorithms supporting '{grid_type}':")
        if algorithms_for_grid:
            for name, algorithm in algorithms_for_grid.items():
                description = (
                    f" - {algorithm.description}" if algorithm.description else ""
                )
                print(f"  - {name}{description}")
        else:
            print("  (none)")
        return

    # Collect dataset paths
    datasets = []
    if args.dataset:
        dataset_path = Path(args.dataset)
        if dataset_path.is_file():
            datasets = [str(dataset_path)]
        elif dataset_path.is_dir():
            datasets = [str(f) for f in dataset_path.glob("*.json")]
        else:
            print(f"Error: {args.dataset} is not a valid file or directory")
            return
    else:
        # No dataset specified - print help
        parser.print_help()
        return

    # Handle --visual-debug
    if args.visual_debug:
        visual_debug(datasets)
        return

    # Get algorithms to run
    all_algorithms = AlgorithmRegistry.get_all_algorithms()
    if args.algorithm == "all":
        algorithms_to_run = all_algorithms
    else:
        # Support comma-separated list of algorithms
        algorithm_names = [name.strip() for name in args.algorithm.split(",")]
        algorithms_to_run = {}

        for alg_name in algorithm_names:
            if alg_name not in all_algorithms:
                print(f"Error: Unknown algorithm '{alg_name}'")
                print("Available algorithms:")
                for name in all_algorithms.keys():
                    print(f"  - {name}")
                return
            algorithms_to_run[alg_name] = all_algorithms[alg_name]

    # Run analysis
    reports = []
    skipped = []  # Track skipped algorithm-dataset pairs

    for algorithm_name, algorithm_instance in algorithms_to_run.items():
        for dataset_path in datasets:
            analyzer = PositionAlgorithmAnalyzer(dataset_path)

            # Check grid compatibility
            dataset_grid_type = analyzer.data["metadata"]["grid_type"]
            # Map dataset grid type to class name
            grid_type_map = {
                "hexagonal": "HexagonalGrid",
                "square": "SquareGrid",
            }
            dataset_grid_class = grid_type_map.get(dataset_grid_type, dataset_grid_type)

            # Get supported grids from algorithm
            supported_grids = algorithm_instance.supported_grids

            # Check if algorithm supports this grid type (empty set means supports all)
            if supported_grids and dataset_grid_class not in supported_grids:
                skipped.append(
                    {
                        "algorithm": algorithm_name,
                        "dataset": Path(dataset_path).name,
                        "grid_type": dataset_grid_class,
                        "supported": ", ".join(sorted(supported_grids))
                        if supported_grids
                        else "All",
                    }
                )
                continue

            analyzer.analyze(
                algorithm_instance,
                algorithm_name=algorithm_name,
                detailed=args.detailed,
            )

            reports.append(
                AnalysisReport(
                    algorithm_name,
                    dataset_path,
                    analyzer.estimations,
                    analyzer.data_points,
                    failure_threshold=0.15,
                )
            )

    # Print skipped combinations if any
    if skipped:
        print("\nSkipped (grid type incompatibility):")
        for skip in skipped:
            print(
                f"  • {skip['algorithm']} × {skip['dataset']}: "
                f"Algorithm supports {skip['supported']}, dataset uses {skip['grid_type']}"
            )
        print()

    # Print metric guide if requested
    if args.print_metric_guide:
        AnalysisReport.print_metric_help()

    if reports:
        print_comparison_table(reports)
    elif not skipped:
        print("No results to display.")


if __name__ == "__main__":
    main()
