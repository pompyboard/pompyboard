"""Visual debugging tool for position estimation algorithms using Pygame.

Controls:
  Dropdowns         Select dataset, algorithm, point
  Arrow Keys/A/D    Navigate points
  Right-drag        Pan grid view
  Mouse wheel       Zoom grid
  H                 Toggle heatmap
  R                 Reset view
  Drag dividers     Resize panels
  ESC               Exit
"""

import pygame
import math
import json
from typing import List, Tuple, Optional, Dict
from pathlib import Path

from grid import HexagonalGrid
from base_algorithm import AlgorithmRegistry
import algorithms  # Import to trigger algorithm registration


# ═══════════════════════════════════════════════════════════════════════
#  COLORS & CONSTANTS
# ═══════════════════════════════════════════════════════════════════════


class Color:
    """Color constants for visualization (dark theme)."""

    BACKGROUND = (20, 20, 30)
    PANEL = (28, 30, 42)
    PANEL_HDR = (38, 40, 56)
    BORDER = (55, 58, 75)
    DIVIDER = (65, 68, 88)
    DIV_HOVER = (95, 100, 135)
    SENSOR_OUTLINE = (100, 100, 120)
    TEXT = (190, 195, 210)
    TEXT_DIM = (115, 120, 138)
    TEXT_BRIGHT = (235, 238, 250)
    ACCENT = (0, 185, 255)
    ACCENT2 = (255, 85, 195)
    GRID_RECT = (255, 255, 0)
    ACTUAL_POS = (0, 255, 0)  # Green
    ESTIMATED_POS = (0, 255, 255)  # Cyan
    ERROR_LINE = (255, 50, 50)  # Red
    BTN_BG = (48, 50, 65)
    BTN_HOVER = (62, 66, 88)
    BTN_ACTIVE = (65, 115, 185)
    BTN_TEXT = (210, 215, 225)
    DROPDOWN_BG = (40, 40, 60)
    # Heatmap colors: green/yellow/orange/red for error thresholds
    HEATMAP_GREEN = (0, 255, 0)  # <0.15mm - good
    HEATMAP_YELLOW = (255, 255, 0)  # 0.15-0.35mm - acceptable
    HEATMAP_ORANGE = (255, 165, 0)  # 0.35-0.7mm - too big
    HEATMAP_RED = (255, 0, 0)  # >0.7mm - terrible

    # Color map for magnetic field intensity
    COLORMAP_LOW = (50, 50, 150)
    COLORMAP_MID = (0, 200, 0)
    COLORMAP_HIGH = (255, 0, 0)


FPS = 60
INIT_WIDTH = 1400
INIT_HEIGHT = 800


def interpolate_color(
    value: float, max_value: float, midpoint: float
) -> Tuple[int, int, int]:
    """Interpolate RGB color based on sensor value."""
    value = max(0, min(max_value, value))

    if value <= midpoint:
        normalized = 0.0
    else:
        normalized = (value - midpoint) / (max_value - midpoint)

    if normalized < 0.5:
        t = normalized * 2
        c1, c2 = Color.COLORMAP_LOW, Color.COLORMAP_MID
    else:
        t = (normalized - 0.5) * 2
        c1, c2 = Color.COLORMAP_MID, Color.COLORMAP_HIGH

    r = int(c1[0] + (c2[0] - c1[0]) * t)
    g = int(c1[1] + (c2[1] - c1[1]) * t)
    b = int(c1[2] + (c2[2] - c1[2]) * t)

    return (r, g, b)


# ═══════════════════════════════════════════════════════════════════════
#  WIDGETS
# ═══════════════════════════════════════════════════════════════════════


class Button:
    """Simple button widget."""

    def __init__(
        self, rect: pygame.Rect, text: str, font: pygame.font.Font, callback=None
    ):
        self.rect = rect
        self.text = text
        self.font = font
        self.callback = callback
        self.hovered = False

    def draw(self, surface: pygame.Surface):
        """Draw the button."""
        bg = Color.BTN_HOVER if self.hovered else Color.BTN_BG

        pygame.draw.rect(surface, bg, self.rect, border_radius=4)
        pygame.draw.rect(surface, Color.BORDER, self.rect, 1, border_radius=4)

        text_surf = self.font.render(self.text, True, Color.BTN_TEXT)
        text_rect = text_surf.get_rect(center=self.rect.center)
        surface.blit(text_surf, text_rect)

    def handle_event(self, event: pygame.event.Event) -> bool:
        """Handle mouse events. Returns True if clicked."""
        if event.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos):
                if self.callback:
                    self.callback()
                return True
        return False


class Dropdown:
    """Simple dropdown menu widget with scroll support."""

    def __init__(
        self,
        rect: pygame.Rect,
        options: List[str],
        font: pygame.font.Font,
        on_select=None,
    ):
        self.rect = rect
        self.options = options
        self.font = font
        self.on_select = on_select
        self.selected_idx = 0
        self.expanded = False
        self.hovered = False
        self.hover_idx = -1
        self.scroll_offset = 0  # Scroll position in items
        self.max_visible_items = 10  # Maximum items visible at once

    @property
    def selected_option(self) -> str:
        """Get currently selected option."""
        if 0 <= self.selected_idx < len(self.options):
            return self.options[self.selected_idx]
        return ""

    def set_options(self, options: List[str], selected_idx: int = 0):
        """Update options list."""
        self.options = options
        self.selected_idx = max(0, min(selected_idx, len(options) - 1))
        self.expanded = False
        self.scroll_offset = 0

    def draw_button(self, surface: pygame.Surface):
        """Draw just the dropdown button (not the expanded menu)."""
        # Main button
        bg = Color.BTN_HOVER if self.hovered else Color.DROPDOWN_BG
        pygame.draw.rect(surface, bg, self.rect, border_radius=4)
        pygame.draw.rect(surface, Color.BORDER, self.rect, 1, border_radius=4)

        # Selected text
        text = self.selected_option
        text_surf = self.font.render(text, True, Color.TEXT)
        text_rect = text_surf.get_rect(midleft=(self.rect.x + 8, self.rect.centery))
        # Clip text if too long
        if text_rect.width > self.rect.width - 30:
            text_surf = self.font.render(text[:20] + "...", True, Color.TEXT)
            text_rect = text_surf.get_rect(midleft=(self.rect.x + 8, self.rect.centery))
        surface.blit(text_surf, text_rect)

        # Arrow indicator
        arrow = "▼" if not self.expanded else "▲"
        arrow_surf = self.font.render(arrow, True, Color.TEXT_DIM)
        arrow_rect = arrow_surf.get_rect(
            midright=(self.rect.right - 8, self.rect.centery)
        )
        surface.blit(arrow_surf, arrow_rect)

    def draw_menu(self, surface: pygame.Surface):
        """Draw the expanded menu as an overlay (call after everything else)."""
        if not self.expanded:
            return

        # Calculate visible items
        visible_items = min(len(self.options), self.max_visible_items)
        menu_h = visible_items * 28 + 8
        menu_rect = pygame.Rect(
            self.rect.x, self.rect.bottom + 2, self.rect.width, menu_h
        )
        pygame.draw.rect(surface, Color.DROPDOWN_BG, menu_rect, border_radius=4)
        pygame.draw.rect(surface, Color.BORDER, menu_rect, 1, border_radius=4)

        # Draw visible items with scroll offset
        y = menu_rect.y + 4
        end_idx = min(self.scroll_offset + visible_items, len(self.options))
        for idx in range(self.scroll_offset, end_idx):
            option = self.options[idx]
            item_rect = pygame.Rect(menu_rect.x + 2, y, menu_rect.width - 4, 24)

            if idx == self.hover_idx:
                pygame.draw.rect(surface, Color.BTN_HOVER, item_rect, border_radius=2)
            elif idx == self.selected_idx:
                pygame.draw.rect(surface, Color.BTN_ACTIVE, item_rect, border_radius=2)

            opt_surf = self.font.render(option, True, Color.TEXT)
            opt_rect = opt_surf.get_rect(midleft=(item_rect.x + 6, item_rect.centery))
            surface.blit(opt_surf, opt_rect)

            y += 28

        # Draw scroll indicator if needed
        if len(self.options) > self.max_visible_items:
            # Scrollbar background
            scrollbar_x = menu_rect.right - 8
            scrollbar_y = menu_rect.y + 4
            scrollbar_h = menu_rect.height - 8
            pygame.draw.rect(
                surface,
                Color.BORDER,
                pygame.Rect(scrollbar_x, scrollbar_y, 4, scrollbar_h),
                border_radius=2,
            )

            # Scrollbar thumb
            thumb_ratio = visible_items / len(self.options)
            thumb_h = max(20, int(scrollbar_h * thumb_ratio))
            scroll_ratio = self.scroll_offset / max(
                1, len(self.options) - visible_items
            )
            thumb_y = scrollbar_y + int((scrollbar_h - thumb_h) * scroll_ratio)
            pygame.draw.rect(
                surface,
                Color.ACCENT,
                pygame.Rect(scrollbar_x, thumb_y, 4, thumb_h),
                border_radius=2,
            )

    def draw(self, surface: pygame.Surface):
        """Draw the dropdown (button + menu if expanded)."""
        self.draw_button(surface)
        self.draw_menu(surface)

    def handle_event(self, event: pygame.event.Event) -> bool:
        """Handle mouse events. Returns True if selection changed."""
        if event.type == pygame.MOUSEMOTION:
            self.hovered = self.rect.collidepoint(event.pos)

            if self.expanded:
                visible_items = min(len(self.options), self.max_visible_items)
                menu_h = visible_items * 28 + 8
                menu_rect = pygame.Rect(
                    self.rect.x, self.rect.bottom + 2, self.rect.width, menu_h
                )
                if menu_rect.collidepoint(event.pos):
                    rel_y = event.pos[1] - menu_rect.y - 4
                    visible_idx = rel_y // 28
                    self.hover_idx = self.scroll_offset + visible_idx
                    # Clamp to valid range
                    if self.hover_idx >= len(self.options):
                        self.hover_idx = -1
                else:
                    self.hover_idx = -1

        elif event.type == pygame.MOUSEBUTTONDOWN:
            if event.button == 1:  # Left click
                if self.rect.collidepoint(event.pos):
                    self.expanded = not self.expanded
                    return False
                elif self.expanded:
                    visible_items = min(len(self.options), self.max_visible_items)
                    menu_h = visible_items * 28 + 8
                    menu_rect = pygame.Rect(
                        self.rect.x, self.rect.bottom + 2, self.rect.width, menu_h
                    )
                    if menu_rect.collidepoint(event.pos):
                        rel_y = event.pos[1] - menu_rect.y - 4
                        visible_idx = rel_y // 28
                        idx = self.scroll_offset + visible_idx
                        if 0 <= idx < len(self.options):
                            self.selected_idx = idx
                            self.expanded = False
                            if self.on_select:
                                self.on_select(self.selected_option, idx)
                            return True
                    else:
                        self.expanded = False

            elif event.button == 4:  # Mouse wheel up
                if self.expanded:
                    visible_items = min(len(self.options), self.max_visible_items)
                    menu_h = visible_items * 28 + 8
                    menu_rect = pygame.Rect(
                        self.rect.x, self.rect.bottom + 2, self.rect.width, menu_h
                    )
                    if menu_rect.collidepoint(event.pos):
                        self.scroll_offset = max(0, self.scroll_offset - 1)
                        return True  # Event consumed

            elif event.button == 5:  # Mouse wheel down
                if self.expanded:
                    visible_items = min(len(self.options), self.max_visible_items)
                    menu_h = visible_items * 28 + 8
                    menu_rect = pygame.Rect(
                        self.rect.x, self.rect.bottom + 2, self.rect.width, menu_h
                    )
                    if menu_rect.collidepoint(event.pos):
                        max_scroll = max(0, len(self.options) - visible_items)
                        self.scroll_offset = min(max_scroll, self.scroll_offset + 1)
                        return True  # Event consumed

        return False


class Divider:
    """Divider for resizing panels."""

    def __init__(self, orient: str):
        self.orient = orient  # 'h' or 'v'
        self.dragging = False
        self.hovered = False

    def hit_rect(self, x: int, y: int, length: int, thickness: int = 6) -> pygame.Rect:
        """Get hit rectangle for the divider."""
        if self.orient == "h":
            return pygame.Rect(x, y - thickness // 2, length, thickness)
        return pygame.Rect(x - thickness // 2, y, thickness, length)


# ═══════════════════════════════════════════════════════════════════════
#  VISUALIZER
# ═══════════════════════════════════════════════════════════════════════


class HexagonalGridVisualizer:
    """Visualizer for HexagonalGrid with Pygame."""

    def __init__(self, width: int = INIT_WIDTH, height: int = INIT_HEIGHT):
        """Initialize the visualizer."""
        pygame.init()

        # Set caption before creating window
        pygame.display.set_caption("Position Algorithm Visualizer")

        self.sw = width
        self.sh = height
        self.screen = pygame.display.set_mode((width, height), pygame.RESIZABLE)

        # Render background immediately to prevent flash
        self.screen.fill(Color.BACKGROUND)
        pygame.display.flip()

        self.clock = pygame.time.Clock()
        self._last_size = (width, height)

        # Fonts
        self.font_small = pygame.font.SysFont("Consolas", 14)
        self.font_medium = pygame.font.SysFont("Consolas", 16)
        self.font_large = pygame.font.SysFont("Consolas", 20, bold=True)

        # State
        self.datasets: List[str] = []
        self.current_dataset_idx: int = 0
        self.current_algorithm_idx: int = 0
        self.current_point_idx: int = 0
        self.show_heatmap: bool = True  # Enabled by default for visual-debug mode

        # Data
        self.grid: Optional[HexagonalGrid] = None
        self.data: Optional[dict] = None
        self.estimations: List[Dict] = []
        self.adc_max_value: int = 4095
        self.adc_midpoint: int = 2047

        # Pan & Zoom
        self.zoom = 1.0
        self.pan_x = 0.0
        self.pan_y = 0.0
        self.panning = False
        self.pan_start = (0, 0)
        self.pan_start_offset = (0.0, 0.0)

        # Layout - use split ratios like test_chad.py
        self.v_split = 0.75  # Not used in simple layout
        self.h_split = 0.70  # Top panel takes 70% of height (excluding bottom panel)
        self.top_panel_height = 80
        self.bottom_panel_height = 150

        # Dividers
        self.div_h = Divider("h")  # Top divider
        self.div_bottom = Divider("h")  # Bottom divider

        # UI widgets
        self.dataset_dropdown = Dropdown(
            pygame.Rect(0, 0, 250, 30),
            ["No datasets"],
            self.font_small,
            self._on_dataset_select,
        )
        self.algorithm_dropdown = Dropdown(
            pygame.Rect(0, 0, 250, 30),
            ["No algorithms"],
            self.font_small,
            self._on_algorithm_select,
        )
        self.point_dropdown = Dropdown(
            pygame.Rect(0, 0, 150, 30),
            ["No points"],
            self.font_small,
            self._on_point_select,
        )
        self.heatmap_button = Button(
            pygame.Rect(0, 0, 140, 30),
            "Toggle Heatmap",
            self.font_small,
            self._toggle_heatmap,
        )

        self._layout()

        self.running = True

    def _layout(self):
        """Calculate layout rectangles."""
        # Simple fixed layout
        self.viz_area = pygame.Rect(
            0,
            self.top_panel_height,
            self.sw,
            self.sh - self.top_panel_height - self.bottom_panel_height,
        )

        # Position widgets
        dropdown_y = 30
        x_pos = 20

        self.dataset_dropdown.rect = pygame.Rect(x_pos, dropdown_y, 250, 30)
        x_pos += 260

        self.algorithm_dropdown.rect = pygame.Rect(x_pos, dropdown_y, 250, 30)
        x_pos += 260

        self.point_dropdown.rect = pygame.Rect(x_pos, dropdown_y, 150, 30)
        x_pos += 160

        self.heatmap_button.rect = pygame.Rect(x_pos, dropdown_y, 140, 30)

    def _divider_rects(self) -> Tuple[pygame.Rect, pygame.Rect]:
        """Get divider hit rectangles."""
        top_div = self.div_h.hit_rect(0, self.top_panel_height, self.sw)
        bottom_div = self.div_bottom.hit_rect(
            0, self.sh - self.bottom_panel_height, self.sw
        )
        return top_div, bottom_div

    def _on_dataset_select(self, text: str, idx: int):
        """Handle dataset selection."""
        self.load_dataset(idx)

    def _on_algorithm_select(self, text: str, idx: int):
        """Handle algorithm selection."""
        self.current_algorithm_idx = idx
        self._update_estimations()

    def _on_point_select(self, text: str, idx: int):
        """Handle point selection."""
        self.current_point_idx = idx

    def _toggle_heatmap(self):
        """Toggle heatmap visibility."""
        self.show_heatmap = not self.show_heatmap

    def load_datasets(self, dataset_paths: List[str]):
        """Load datasets for visualization."""
        self.datasets = dataset_paths

        if not self.datasets:
            return

        # Update dataset dropdown
        dataset_names = [Path(p).name for p in dataset_paths]
        self.dataset_dropdown.set_options(dataset_names, 0)

        # Update algorithm dropdown
        algorithms = list(AlgorithmRegistry.get_all_algorithms().keys())
        if algorithms:
            self.algorithm_dropdown.set_options(algorithms, 0)

        # Load first dataset
        self.load_dataset(0)

    def load_dataset(self, idx: int):
        """Load a specific dataset."""
        if not self.datasets or idx < 0 or idx >= len(self.datasets):
            return

        self.current_dataset_idx = idx
        dataset_path = self.datasets[idx]

        with open(dataset_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

        metadata = self.data["metadata"]
        self.grid = HexagonalGrid(metadata)

        # Get ADC precision
        adc_bits = metadata.get("adc_precision_in_bits", 12)
        self.adc_max_value = (1 << adc_bits) - 1
        self.adc_midpoint = self.adc_max_value // 2

        # Update point dropdown
        num_points = len(self.data["data_points"])
        point_options = [f"Point {i + 1}" for i in range(num_points)]
        self.point_dropdown.set_options(point_options, 0)

        # Reset view
        self.current_point_idx = 0
        self._reset_view()
        self._update_estimations()

    def _update_estimations(self):
        """Calculate estimations for current algorithm."""
        if not self.grid or not self.data:
            return

        algorithms = list(AlgorithmRegistry.get_all_algorithms().items())
        if not algorithms:
            return

        if self.current_algorithm_idx >= len(algorithms):
            self.current_algorithm_idx = 0

        algo_name, algo_instance = algorithms[self.current_algorithm_idx]

        self.estimations = []
        for point in self.data["data_points"]:
            self.grid.update_data(point)
            actual_x, actual_y = self.grid.actual_cursor_position

            try:
                estimated_x, estimated_y = algo_instance(self.grid)
                error_x = actual_x - estimated_x
                error_y = actual_y - estimated_y
                error_distance = math.sqrt(error_x**2 + error_y**2)

                self.estimations.append(
                    {
                        "actual": (actual_x, actual_y),
                        "estimated": (estimated_x, estimated_y),
                        "error_distance": error_distance,
                        "error_x": error_x,
                        "error_y": error_y,
                    }
                )
            except Exception as e:
                self.estimations.append(
                    {
                        "actual": (actual_x, actual_y),
                        "estimated": (actual_x, actual_y),
                        "error_distance": 0,
                        "error_x": 0,
                        "error_y": 0,
                        "error": str(e),
                    }
                )

    def _reset_view(self):
        """Reset pan and zoom to fit grid."""
        self.zoom = 1.0
        self.pan_x = 0.0
        self.pan_y = 0.0

    def _grid_transform(self) -> Tuple[float, float, float, float, float]:
        """Calculate grid transformation parameters."""
        if not self.grid:
            return 1.0, self.viz_area.centerx, self.viz_area.centery, 0.0, 0.0

        # Find grid bounds
        min_x = min(s.x for s in self.grid.sensors)
        max_x = max(s.x for s in self.grid.sensors)
        min_y = min(s.y for s in self.grid.sensors)
        max_y = max(s.y for s in self.grid.sensors)

        # Add padding
        padding = self.grid.spacing if hasattr(self.grid, "spacing") else 10
        grid_width = (max_x - min_x) + padding * 2
        grid_height = (max_y - min_y) + padding * 2

        if grid_width <= 0 or grid_height <= 0:
            return 1.0, self.viz_area.centerx, self.viz_area.centery, 0.0, 0.0

        # Calculate base scale
        scale_x = (self.viz_area.width - 60) / grid_width
        scale_y = (self.viz_area.height - 60) / grid_height
        base_scale = min(scale_x, scale_y)

        # Grid center
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2

        return (
            base_scale,
            self.viz_area.centerx,
            self.viz_area.centery,
            center_x,
            center_y,
        )

    def mm_to_screen(self, mx: float, my: float) -> Tuple[int, int]:
        """Convert world coordinates (mm) to screen coordinates (pixels)."""
        base_scale, cx, cy, gcx, gcy = self._grid_transform()
        eff_scale = base_scale * self.zoom
        screen_x = cx + (mx - gcx + self.pan_x) * eff_scale
        screen_y = cy + (my - gcy + self.pan_y) * eff_scale
        return (int(screen_x), int(screen_y))

    def screen_to_mm(self, sx: int, sy: int) -> Tuple[float, float]:
        """Convert screen coordinates to world coordinates."""
        base_scale, cx, cy, gcx, gcy = self._grid_transform()
        eff_scale = base_scale * self.zoom
        if eff_scale == 0:
            return (0.0, 0.0)
        world_x = (sx - cx) / eff_scale + gcx - self.pan_x
        world_y = (sy - cy) / eff_scale + gcy - self.pan_y
        return (world_x, world_y)

    def navigate_to_point(self, new_idx: int):
        """Navigate to a specific point."""
        if not self.data or "data_points" not in self.data:
            return

        num_points = len(self.data["data_points"])
        if num_points == 0:
            return

        new_idx = max(0, min(new_idx, num_points - 1))

        if new_idx != self.current_point_idx:
            self.current_point_idx = new_idx
            self.point_dropdown.selected_idx = new_idx

    def draw_grid_boundary(self):
        """Draw boundary around the sensor grid."""
        if not self.grid or not self.data:
            return

        # Get all sensor screen positions
        positions = [self.mm_to_screen(s.x, s.y) for s in self.grid.sensors]
        xs = [p[0] for p in positions]
        ys = [p[1] for p in positions]

        # Calculate sensor radius in screen space
        base_scale, _, _, _, _ = self._grid_transform()
        eff_scale = base_scale * self.zoom
        spacing = self.grid.spacing if hasattr(self.grid, "spacing") else 10
        sensor_radius_screen = max(3, int(spacing / 2 * eff_scale))

        # Find bounds with sensor radius
        min_x = min(xs) - sensor_radius_screen
        max_x = max(xs) + sensor_radius_screen
        min_y = min(ys) - sensor_radius_screen
        max_y = max(ys) + sensor_radius_screen

        rect = pygame.Rect(min_x, min_y, max_x - min_x, max_y - min_y)
        pygame.draw.rect(self.screen, Color.GRID_RECT, rect, 3)

    def draw_sensors(self):
        """Draw all sensors as circles."""
        if not self.grid or not self.data:
            return

        # Update grid with current point data
        if self.current_point_idx < len(self.data["data_points"]):
            point = self.data["data_points"][self.current_point_idx]
            self.grid.update_data(point)

        base_scale, _, _, _, _ = self._grid_transform()
        eff_scale = base_scale * self.zoom
        spacing = self.grid.spacing if hasattr(self.grid, "spacing") else 10
        # Sensor radius is exactly spacing/2 so sensors touch each other
        sensor_radius = max(3, int(spacing / 2 * eff_scale))

        for sensor in self.grid.sensors:
            screen_x, screen_y = self.mm_to_screen(sensor.x, sensor.y)

            # Skip if outside visible area
            if not self.viz_area.collidepoint(screen_x, screen_y):
                continue

            # Color based on value
            color = interpolate_color(
                sensor.value, self.adc_max_value, self.adc_midpoint
            )

            pygame.draw.circle(self.screen, color, (screen_x, screen_y), sensor_radius)
            pygame.draw.circle(
                self.screen,
                Color.SENSOR_OUTLINE,
                (screen_x, screen_y),
                sensor_radius,
                1,
            )

            # Draw sensor value if large enough
            if sensor.value > self.adc_midpoint and sensor_radius > 10:
                value_text = self.font_small.render(
                    f"{int(sensor.value)}", True, Color.TEXT
                )
                text_rect = value_text.get_rect(center=(screen_x, screen_y))
                self.screen.blit(value_text, text_rect)

    def draw_positions(self):
        """Draw actual and estimated positions."""
        if not self.estimations or self.current_point_idx >= len(self.estimations):
            return

        estimation = self.estimations[self.current_point_idx]
        actual_x, actual_y = estimation["actual"]
        estimated_x, estimated_y = estimation["estimated"]

        actual_screen = self.mm_to_screen(actual_x, actual_y)
        estimated_screen = self.mm_to_screen(estimated_x, estimated_y)

        # Draw error line
        pygame.draw.line(
            self.screen, Color.ERROR_LINE, actual_screen, estimated_screen, 3
        )

        # Draw actual position (green circle with cross)
        pygame.draw.circle(self.screen, Color.ACTUAL_POS, actual_screen, 10, 3)
        pygame.draw.line(
            self.screen,
            Color.ACTUAL_POS,
            (actual_screen[0] - 12, actual_screen[1]),
            (actual_screen[0] + 12, actual_screen[1]),
            3,
        )
        pygame.draw.line(
            self.screen,
            Color.ACTUAL_POS,
            (actual_screen[0], actual_screen[1] - 12),
            (actual_screen[0], actual_screen[1] + 12),
            3,
        )

        # Draw estimated position (cyan circle with X)
        pygame.draw.circle(self.screen, Color.ESTIMATED_POS, estimated_screen, 10, 3)
        pygame.draw.line(
            self.screen,
            Color.ESTIMATED_POS,
            (estimated_screen[0] - 8, estimated_screen[1] - 8),
            (estimated_screen[0] + 8, estimated_screen[1] + 8),
            3,
        )
        pygame.draw.line(
            self.screen,
            Color.ESTIMATED_POS,
            (estimated_screen[0] - 8, estimated_screen[1] + 8),
            (estimated_screen[0] + 8, estimated_screen[1] - 8),
            3,
        )

    def draw_heatmap_overlay(self):
        """Draw heatmap showing all data points with error coloring.

        Color thresholds:
        - Green: <0.15mm (good)
        - Yellow: 0.15-0.35mm (acceptable)
        - Orange: 0.35-0.7mm (too big)
        - Red: >0.7mm (terrible)
        """
        if not self.show_heatmap or not self.estimations:
            return

        for idx, estimation in enumerate(self.estimations):
            actual_x, actual_y = estimation["actual"]
            error_dist = estimation["error_distance"]

            # Color based on error thresholds
            if error_dist < 0.15:
                # Green - good
                color = Color.HEATMAP_GREEN
            elif error_dist < 0.35:
                # Interpolate green to yellow
                t = (error_dist - 0.15) / (0.35 - 0.15)
                r = int(
                    Color.HEATMAP_GREEN[0]
                    + (Color.HEATMAP_YELLOW[0] - Color.HEATMAP_GREEN[0]) * t
                )
                g = int(
                    Color.HEATMAP_GREEN[1]
                    + (Color.HEATMAP_YELLOW[1] - Color.HEATMAP_GREEN[1]) * t
                )
                b = int(
                    Color.HEATMAP_GREEN[2]
                    + (Color.HEATMAP_YELLOW[2] - Color.HEATMAP_GREEN[2]) * t
                )
                color = (r, g, b)
            elif error_dist < 0.7:
                # Interpolate yellow to orange to red
                if error_dist < 0.525:  # Mid-point between 0.35 and 0.7
                    # Yellow to orange
                    t = (error_dist - 0.35) / (0.525 - 0.35)
                    r = int(
                        Color.HEATMAP_YELLOW[0]
                        + (Color.HEATMAP_ORANGE[0] - Color.HEATMAP_YELLOW[0]) * t
                    )
                    g = int(
                        Color.HEATMAP_YELLOW[1]
                        + (Color.HEATMAP_ORANGE[1] - Color.HEATMAP_YELLOW[1]) * t
                    )
                    b = int(
                        Color.HEATMAP_YELLOW[2]
                        + (Color.HEATMAP_ORANGE[2] - Color.HEATMAP_YELLOW[2]) * t
                    )
                else:
                    # Orange to red
                    t = (error_dist - 0.525) / (0.7 - 0.525)
                    r = int(
                        Color.HEATMAP_ORANGE[0]
                        + (Color.HEATMAP_RED[0] - Color.HEATMAP_ORANGE[0]) * t
                    )
                    g = int(
                        Color.HEATMAP_ORANGE[1]
                        + (Color.HEATMAP_RED[1] - Color.HEATMAP_ORANGE[1]) * t
                    )
                    b = int(
                        Color.HEATMAP_ORANGE[2]
                        + (Color.HEATMAP_RED[2] - Color.HEATMAP_ORANGE[2]) * t
                    )
                color = (r, g, b)
            else:
                # Red - terrible
                color = Color.HEATMAP_RED

            pos = self.mm_to_screen(actual_x, actual_y)

            # Highlight current point
            radius = 8 if idx == self.current_point_idx else 6
            outline_width = 2 if idx == self.current_point_idx else 1

            pygame.draw.circle(self.screen, color, pos, radius)
            pygame.draw.circle(self.screen, Color.TEXT, pos, radius, outline_width)

    def find_heatmap_point_at_pos(self, screen_pos: Tuple[int, int]) -> Optional[int]:
        """Find heatmap point index at given screen position."""
        if not self.show_heatmap or not self.estimations:
            return None

        click_threshold = 10  # pixels
        closest_idx = None
        closest_dist = float("inf")

        for idx, estimation in enumerate(self.estimations):
            actual_x, actual_y = estimation["actual"]
            pos = self.mm_to_screen(actual_x, actual_y)

            dx = pos[0] - screen_pos[0]
            dy = pos[1] - screen_pos[1]
            dist = math.sqrt(dx * dx + dy * dy)

            if dist < click_threshold and dist < closest_dist:
                closest_dist = dist
                closest_idx = idx

        return closest_idx

    def draw_top_panel(self):
        """Draw top panel with controls."""
        panel_rect = pygame.Rect(0, 0, self.sw, self.top_panel_height)
        pygame.draw.rect(self.screen, Color.PANEL, panel_rect)
        pygame.draw.rect(self.screen, Color.BORDER, panel_rect, 2)

        # Labels above dropdowns
        label_y = 10
        labels = ["Dataset:", "Algorithm:", "Point:"]
        x_positions = [20, 280, 540]

        for label, x in zip(labels, x_positions):
            text = self.font_small.render(label, True, Color.TEXT_DIM)
            self.screen.blit(text, (x, label_y))

        # Draw widgets (buttons only - expanded menus drawn later as overlay)
        self.dataset_dropdown.draw_button(self.screen)
        self.algorithm_dropdown.draw_button(self.screen)
        self.point_dropdown.draw_button(self.screen)
        self.heatmap_button.draw(self.screen)

    def draw_bottom_panel(self):
        """Draw bottom info panel."""
        if not self.data or not self.estimations:
            return

        panel_y = self.sh - self.bottom_panel_height
        panel_rect = pygame.Rect(0, panel_y, self.sw, self.bottom_panel_height)
        pygame.draw.rect(self.screen, Color.PANEL, panel_rect)
        pygame.draw.rect(self.screen, Color.BORDER, panel_rect, 2)

        # Current point info
        if self.current_point_idx < len(self.estimations):
            estimation = self.estimations[self.current_point_idx]
            actual_x, actual_y = estimation["actual"]
            estimated_x, estimated_y = estimation["estimated"]
            error_dist = estimation["error_distance"]
            error_x = estimation["error_x"]
            error_y = estimation["error_y"]

            info_y = panel_y + 15
            lines = [
                f"Actual Position:      ({actual_x:7.2f}, {actual_y:7.2f}) mm",
                f"Estimated Position:   ({estimated_x:7.2f}, {estimated_y:7.2f}) mm",
                f"Error:                Δx={error_x:+7.2f}mm  Δy={error_y:+7.2f}mm  Distance={error_dist:7.2f}mm",
            ]

            for i, line in enumerate(lines):
                text = self.font_medium.render(line, True, Color.TEXT)
                self.screen.blit(text, (20, info_y + i * 25))

        # Legend
        legend_x = self.sw - 280
        legend_y = panel_y + 20

        # Green circle (actual)
        pygame.draw.circle(self.screen, Color.ACTUAL_POS, (legend_x, legend_y), 8, 2)
        pygame.draw.line(
            self.screen,
            Color.ACTUAL_POS,
            (legend_x - 10, legend_y),
            (legend_x + 10, legend_y),
            2,
        )
        pygame.draw.line(
            self.screen,
            Color.ACTUAL_POS,
            (legend_x, legend_y - 10),
            (legend_x, legend_y + 10),
            2,
        )
        text = self.font_small.render("= Actual Position", True, Color.TEXT)
        self.screen.blit(text, (legend_x + 15, legend_y - 8))

        # Cyan X (estimated)
        legend_y += 30
        pygame.draw.circle(self.screen, Color.ESTIMATED_POS, (legend_x, legend_y), 8, 2)
        pygame.draw.line(
            self.screen,
            Color.ESTIMATED_POS,
            (legend_x - 6, legend_y - 6),
            (legend_x + 6, legend_y + 6),
            2,
        )
        pygame.draw.line(
            self.screen,
            Color.ESTIMATED_POS,
            (legend_x - 6, legend_y + 6),
            (legend_x + 6, legend_y - 6),
            2,
        )
        text = self.font_small.render("= Estimated Position", True, Color.TEXT)
        self.screen.blit(text, (legend_x + 15, legend_y - 8))

        # Red line (error)
        legend_y += 30
        pygame.draw.line(
            self.screen,
            Color.ERROR_LINE,
            (legend_x - 10, legend_y),
            (legend_x + 10, legend_y),
            3,
        )
        text = self.font_small.render("= Position Error", True, Color.TEXT)
        self.screen.blit(text, (legend_x + 15, legend_y - 8))

        # Controls help
        help_y = panel_y + 100
        help_parts = [
            "Controls:",
            "Arrow/A/D=Navigate",
            "Right-Drag=Pan",
            "Wheel=Zoom",
            "H=Heatmap",
            "R=Reset",
            "Drag dividers=Resize",
            "ESC=Exit",
        ]
        help_text = "  |  ".join(help_parts)
        text = self.font_small.render(help_text, True, Color.TEXT_DIM)
        self.screen.blit(text, (20, help_y))

        # Zoom info
        zoom_text = f"Zoom: {self.zoom:.2f}x"
        text = self.font_small.render(zoom_text, True, Color.TEXT_DIM)
        self.screen.blit(text, (self.sw - 120, help_y))

    def draw_dividers(self):
        """Draw dividers between panels."""
        top_div, bottom_div = self._divider_rects()

        # Top divider
        color = (
            Color.DIV_HOVER
            if (self.div_h.hovered or self.div_h.dragging)
            else Color.DIVIDER
        )
        pygame.draw.rect(self.screen, color, top_div)

        # Bottom divider
        color = (
            Color.DIV_HOVER
            if (self.div_bottom.hovered or self.div_bottom.dragging)
            else Color.DIVIDER
        )
        pygame.draw.rect(self.screen, color, bottom_div)

    def draw_dropdown_overlays(self):
        """Draw expanded dropdown menus as overlays on top of everything."""
        # Draw in order so later dropdowns can overlap earlier ones if needed
        self.dataset_dropdown.draw_menu(self.screen)
        self.algorithm_dropdown.draw_menu(self.screen)
        self.point_dropdown.draw_menu(self.screen)

    def draw(self):
        """Draw everything."""
        self.screen.fill(Color.BACKGROUND)

        # Draw visualization area
        pygame.draw.rect(self.screen, (35, 35, 45), self.viz_area)

        if self.grid:
            # Clip to viz area
            self.screen.set_clip(self.viz_area)
            self.draw_grid_boundary()
            self.draw_sensors()

            if self.show_heatmap:
                self.draw_heatmap_overlay()

            self.draw_positions()
            self.screen.set_clip(None)

        # Draw panels on top
        self.draw_top_panel()
        self.draw_bottom_panel()
        self.draw_dividers()

        # Draw dropdown menus last as overlays (so they don't affect layout)
        self.draw_dropdown_overlays()

        pygame.display.flip()

    def handle_events(self):
        """Handle all events."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            elif event.type == pygame.VIDEORESIZE:
                # NEVER call set_mode() here - use the surface we got
                surf = pygame.display.get_surface()
                if surf is not None:
                    self.screen = surf
                    nw, nh = surf.get_size()
                else:
                    nw, nh = event.w, event.h

                if (nw, nh) != self._last_size:
                    self.sw, self.sh = nw, nh
                    self._last_size = (nw, nh)
                    self._layout()

            elif event.type == pygame.MOUSEBUTTONDOWN:
                # Check dividers first
                top_div, bottom_div = self._divider_rects()
                mx, my = event.pos

                if event.button == 1:
                    if top_div.collidepoint(mx, my):
                        self.div_h.dragging = True
                        continue
                    elif bottom_div.collidepoint(mx, my):
                        self.div_bottom.dragging = True
                        continue

                # Handle UI widgets
                if self.dataset_dropdown.handle_event(event):
                    continue
                if self.algorithm_dropdown.handle_event(event):
                    continue
                if self.point_dropdown.handle_event(event):
                    continue
                if self.heatmap_button.handle_event(event):
                    continue

                # Handle grid interactions
                if self.viz_area.collidepoint(event.pos):
                    if event.button == 1:  # Left click
                        heatmap_idx = self.find_heatmap_point_at_pos(event.pos)
                        if heatmap_idx is not None:
                            self.navigate_to_point(heatmap_idx)
                        elif self.data:
                            self.navigate_to_point(self.current_point_idx + 1)
                    elif event.button == 3:  # Right click - start panning
                        self.panning = True
                        self.pan_start = event.pos
                        self.pan_start_offset = (self.pan_x, self.pan_y)

            elif event.type == pygame.MOUSEBUTTONUP:
                if event.button == 1:
                    self.div_h.dragging = False
                    self.div_bottom.dragging = False
                elif event.button == 3:  # Right click release
                    self.panning = False

            elif event.type == pygame.MOUSEMOTION:
                mx, my = event.pos

                # Update divider hover states
                top_div, bottom_div = self._divider_rects()
                self.div_h.hovered = top_div.collidepoint(mx, my)
                self.div_bottom.hovered = bottom_div.collidepoint(mx, my)

                # Handle divider dragging
                if self.div_h.dragging:
                    self.top_panel_height = max(
                        60, min(my, self.sh - self.bottom_panel_height - 100)
                    )
                    self._layout()
                elif self.div_bottom.dragging:
                    self.bottom_panel_height = max(
                        100, min(self.sh - my, self.sh - self.top_panel_height - 100)
                    )
                    self._layout()

                # Handle UI hovers
                self.dataset_dropdown.handle_event(event)
                self.algorithm_dropdown.handle_event(event)
                self.point_dropdown.handle_event(event)
                self.heatmap_button.handle_event(event)

                # Handle panning
                if self.panning:
                    base_scale, _, _, _, _ = self._grid_transform()
                    eff_scale = base_scale * self.zoom
                    if eff_scale > 0:
                        dx = event.pos[0] - self.pan_start[0]
                        dy = event.pos[1] - self.pan_start[1]
                        self.pan_x = self.pan_start_offset[0] + dx / eff_scale
                        self.pan_y = self.pan_start_offset[1] + dy / eff_scale

                # Update cursor
                if (
                    self.div_h.hovered
                    or self.div_h.dragging
                    or self.div_bottom.hovered
                    or self.div_bottom.dragging
                ):
                    pygame.mouse.set_cursor(pygame.SYSTEM_CURSOR_SIZENS)
                elif self.panning:
                    pygame.mouse.set_cursor(pygame.SYSTEM_CURSOR_HAND)
                else:
                    pygame.mouse.set_cursor(pygame.SYSTEM_CURSOR_ARROW)

            elif event.type == pygame.MOUSEWHEEL:
                mouse_pos = pygame.mouse.get_pos()

                # Check if any dropdown is expanded and mouse is over it
                dropdown_handled = False
                for dropdown in [
                    self.dataset_dropdown,
                    self.algorithm_dropdown,
                    self.point_dropdown,
                ]:
                    if dropdown.expanded:
                        visible_items = min(
                            len(dropdown.options), dropdown.max_visible_items
                        )
                        menu_h = visible_items * 28 + 8
                        menu_rect = pygame.Rect(
                            dropdown.rect.x,
                            dropdown.rect.bottom + 2,
                            dropdown.rect.width,
                            menu_h,
                        )
                        if menu_rect.collidepoint(mouse_pos):
                            # Scroll the dropdown
                            if event.y > 0:  # Scroll up
                                dropdown.scroll_offset = max(
                                    0, dropdown.scroll_offset - 1
                                )
                            else:  # Scroll down
                                max_scroll = max(
                                    0, len(dropdown.options) - visible_items
                                )
                                dropdown.scroll_offset = min(
                                    max_scroll, dropdown.scroll_offset + 1
                                )
                            dropdown_handled = True
                            break

                # Only handle zoom if dropdown didn't consume the event
                if not dropdown_handled and self.viz_area.collidepoint(mouse_pos):
                    old_world = self.screen_to_mm(mouse_pos[0], mouse_pos[1])

                    # Zoom
                    factor = 1.15 if event.y > 0 else 1 / 1.15
                    self.zoom = max(0.1, min(30, self.zoom * factor))

                    # Adjust pan to keep mouse position fixed
                    new_world = self.screen_to_mm(mouse_pos[0], mouse_pos[1])
                    self.pan_x += new_world[0] - old_world[0]
                    self.pan_y += new_world[1] - old_world[1]

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT or event.key == pygame.K_a:
                    self.navigate_to_point(self.current_point_idx - 1)
                elif event.key == pygame.K_RIGHT or event.key == pygame.K_d:
                    self.navigate_to_point(self.current_point_idx + 1)
                elif event.key == pygame.K_h:
                    self.show_heatmap = not self.show_heatmap
                elif event.key == pygame.K_r:
                    self._reset_view()
                elif event.key == pygame.K_ESCAPE:
                    self.running = False

    def run(self):
        """Main visualization loop."""
        while self.running:
            self.handle_events()
            self.draw()
            self.clock.tick(FPS)

        pygame.quit()


def start_visualizer(dataset_paths: List[str]):
    """Start the visualization tool.

    Args:
        dataset_paths: List of paths to JSON dataset files
    """
    visualizer = HexagonalGridVisualizer()
    visualizer.load_datasets(dataset_paths)
    visualizer.run()
