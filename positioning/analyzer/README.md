# Position Algorithm Analyzer

A framework for evaluating magnetic position estimation algorithms using Hall effect sensor data.

## Features

- **Algorithm Registry System**: Automatic discovery and registration of algorithms via decorators
- **Grid Registry System**: Support for multiple sensor grid layouts (hexagonal, square, etc.)
- **Comprehensive Metrics**: MAE, RMS, percentiles, bias analysis, and quality scoring
- **Visual Debugger**: Interactive pygame-based tool with heatmaps and real-time comparison
- **Batch Processing**: Analyze entire directories of datasets at once
- **Flexible CLI**: List algorithms/grids, run single or all algorithms, detailed output modes

## Project Structure

```
analyzer/
├── analyzer.py           # Main analyzer and CLI entry point
├── base_algorithm.py     # Base class and registry for algorithms
├── algorithms.py         # Algorithm implementations
├── grid.py              # Grid and sensor classes with registry
├── report.py            # Analysis reporting and metrics
├── visualizer.py        # Visual debugging tool (requires pygame)
├── utils.py             # Legacy re-exports (for backward compatibility)
└── datasets/            # Test datasets in JSON format
```

## Registration System

**Algorithms** are automatically discovered using the `@AlgorithmRegistry.register` decorator. Add your algorithm class to `algorithms.py` and it will be available immediately.

**Grids** are automatically discovered using the `@GridRegistry.register("grid_type")` decorator. Add your grid class to `grid.py` and it will be available for all algorithms.

## Requirements

```bash
pip install -r requirements.txt
```

**Note:** pygame is optional and only required for the visual debugger.

## Quick Start

**List available algorithms:**
```bash
python analyzer.py --list-algorithms
```

**List available grid types:**
```bash
python analyzer.py --list-grids
```

**Run a specific algorithm:**
```bash
python analyzer.py --algorithm gaussian_fit --dataset datasets/test_new.json
```

**Run all algorithms:**
```bash
python analyzer.py --algorithm all --dataset datasets/test_new.json
```

**Enable detailed per-point output:**
```bash
python analyzer.py --algorithm gaussian_fit --dataset datasets/test_new.json --detailed
```

**Process entire directory:**
```bash
python analyzer.py --algorithm all --dataset datasets/
```

**Visual debugging:**
```bash
python analyzer.py --visual-debug --dataset datasets/test_new.json
```

**Visual Debugger Features:**
- Interactive dropdown menus for datasets, algorithms, and data points
- Sensor grid visualization with ADC-accurate color coding
- Position markers: Green crosshair (actual) vs Cyan X (estimated)
- Heatmap mode showing all data points with color-coded accuracy
- Navigation: Arrow keys, mouse clicks, H for heatmap, ESC to exit

## Creating Custom Algorithms

1. **Create algorithm class** in `algorithms.py`:
```python
from base_algorithm import PositionAlgorithm, AlgorithmRegistry
from grid import BaseGrid
from typing import Tuple, Set

@AlgorithmRegistry.register
class MyAlgorithm(PositionAlgorithm):
    @property
    def name(self) -> str:
        return "my_algorithm"
    
    @property
    def supported_grids(self) -> Set[str]:
        return {"HexagonalGrid"}  # or set() for all grids
    
    def estimate(self, grid: BaseGrid) -> Tuple[float, float]:
        # Access sensors via grid.sensors (each has: row, col, x, y, value)
        estimated_x = 0.0
        estimated_y = 0.0
        return estimated_x, estimated_y
```

2. **Done!** The algorithm is automatically registered and available.

## Creating Custom Grid Types

1. **Create grid class** in `grid.py`:
```python
from grid import BaseGrid, GridRegistry, Sensor

@GridRegistry.register("my_grid_type")
class MyCustomGrid(BaseGrid):
    @property
    def grid_type_name(self) -> str:
        return "my_grid_type"
    
    def _build_grid(self):
        # Create sensor layout
        pass
    
    def update_data(self, data: dict):
        # Update sensor values from data point
        pass
```

2. **Done!** The grid is automatically registered and available to all algorithms.

## Dataset Format

Datasets are JSON files with the following structure:

```json
{
  "metadata": {
    "version": 1,
    "grid_type": "hexagonal",
    "grid_rows": 7,
    "grid_cols": 10,
    "sensor_spacing_mm": 10.0,
    "adc_precision_in_bits": 12,
    "magnet": {
      "shape": "rounded",
      "size": "10x5mm",
      "height_mm": 10.0
    }
  },
  "data_points": [
    {
      "timestamp_ns": 1234567890,
      "cursor_x_mm": 24.73,
      "cursor_y_mm": 21.80,
      "sensors": [
        {
          "row": 0,
          "col": 0,
          "value": 1234
        }
      ]
    }
  ]
}
```

## Metrics

- **MAE**: Mean Absolute Error (average position error)
- **Median**: Typical error (robust to outliers)
- **RMS**: Root Mean Square (penalizes large errors)
- **P90/P95/P99**: Percentile values (95% of errors are below P95)
- **Max**: Worst case error
- **Fail%**: Percentage of points exceeding failure threshold
- **BiasX/BiasY**: Systematic directional bias (should be near 0)
- **Score**: Overall quality score (0-100, higher is better)

**Score calculation** (0-100): MAE (30%), RMS (25%), P95 (20%), Fail% (15%), Bias (10%)
