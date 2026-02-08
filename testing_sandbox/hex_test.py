"""
Simulates a magnetic stylus position tracking system using a hexagonal
grid of Hall effect sensors. Implements Gaussian peak fitting algorithm
for sub-grid precision localization.
"""

import pygame
import math
import numpy as np


# Display Configuration
SCREEN_WIDTH = 1400
SCREEN_HEIGHT = 700
FPS = 60

# Sensor Grid Configuration
GRID_ROWS = 7
GRID_COLS = 10
SENSOR_RADIUS_MM = 5.0
SENSOR_SPACING_MM = 0.0
PIXELS_PER_MM = 7.5

# Visual Constants
COLOR_BACKGROUND = (20, 20, 30)
COLOR_SENSOR_OUTLINE = (100, 100, 120)
COLOR_TEXT = (200, 200, 200)
COLOR_STYLUS = (255, 100, 255)
COLOR_CROSSHAIR = (0, 255, 255)

# Color map for magnetic field intensity (blue -> green -> red)
COLORMAP = {
    'low': (50, 50, 150),
    'mid': (0, 200, 0),
    'high': (255, 0, 0)
}


class Sensor:
    """Represents a single Hall effect sensor with position and reading."""
    
    def __init__(self, row, col, x_mm, y_mm):
        self.row = row
        self.col = col
        self.x = x_mm
        self.y = y_mm
        self.value = 0.0
    
    def distance_to(self, x, y):
        """Calculate Euclidean distance to a point."""
        dx = self.x - x
        dy = self.y - y
        return math.sqrt(dx * dx + dy * dy)


class HexagonalGrid:
    """
    Manages a hexagonal grid of sensors with magnetic field simulation
    and stylus position estimation.
    """
    
    def __init__(self, rows, cols, sensor_radius_mm, spacing_mm, pixels_per_mm):
        self.rows = rows
        self.cols = cols
        self.sensor_radius_mm = sensor_radius_mm
        self.spacing_mm = spacing_mm
        self.pixels_per_mm = pixels_per_mm
        
        # Visual parameters (in pixels)
        self.radius_px = sensor_radius_mm * pixels_per_mm
        self.center_distance_px = (sensor_radius_mm * 2 + spacing_mm) * pixels_per_mm
        self.offset_x = 100
        self.offset_y = 100
        
        # Field simulation parameters
        self.field_strength = 1.0
        self.field_decay_distance = 50  # pixels
        
        # IIR filter for position smoothing
        self.filter_alpha = 0.3
        self.estimated_position = None
        
        # Initialize sensor array
        self.sensors = self._create_sensors()
    
    def _create_sensors(self):
        """Create hexagonal grid of sensors with real-world coordinates in mm."""
        sensors = []
        dx = self.sensor_radius_mm * 2 + self.spacing_mm
        dy = dx * math.sqrt(3) / 2
        
        for row in range(self.rows):
            for col in range(self.cols):
                x = col * dx + (dx / 2 if row % 2 == 1 else 0)
                y = row * dy
                sensors.append(Sensor(row, col, x, y))
        
        return sensors
    
    def get_sensor(self, row, col):
        """Get sensor by grid coordinates."""
        idx = row * self.cols + col
        return self.sensors[idx] if 0 <= idx < len(self.sensors) else None
    
    def get_display_position(self, sensor):
        """Convert sensor mm coordinates to screen pixels for visualization."""
        dx = self.center_distance_px
        dy = dx * math.sqrt(3) / 2
        
        x = self.offset_x + sensor.col * dx + (dx / 2 if sensor.row % 2 == 1 else 0)
        y = self.offset_y + sensor.row * dy
        
        return (x, y)
    
    def update_magnetic_field(self, cursor_x, cursor_y):
        """
        Simulate magnetic field readings based on cursor position.
        Uses 1/r³ decay model (magnetic dipole approximation).
        """
        for sensor in self.sensors:
            display_x, display_y = self.get_display_position(sensor)
            distance = math.sqrt((display_x - cursor_x)**2 + (display_y - cursor_y)**2)
            
            # Prevent division by zero
            distance = max(distance, 1.0)
            
            # Magnetic dipole field: B ~ 1/r³
            normalized_dist = distance / self.field_decay_distance
            sensor.value = min(1.0, self.field_strength / (1.0 + normalized_dist**3))
    
    def find_local_sensors(self, top_n=9, threshold=0.01):
        """
        Find the N sensors with strongest readings around the field maximum.
        This reduces the problem from global to local estimation.
        """
        # Find sensors above threshold
        active_sensors = [s for s in self.sensors if s.value > threshold]
        
        if not active_sensors:
            return []
        
        # Find maximum
        max_sensor = max(active_sensors, key=lambda s: s.value)
        
        # Sort by distance from maximum and take closest N
        active_sensors.sort(key=lambda s: s.distance_to(max_sensor.x, max_sensor.y))
        
        return active_sensors[:top_n]
    
    def estimate_position_gaussian_fit(self, local_sensors):
        """
        Estimate stylus position using 2D Gaussian peak fitting.
        
        Model: B(x,y) ≈ A * exp(-(x-x₀)² + (y-y₀)²) / 2σ²)
        
        After log transform: ln(B) = a + b*x + c*y + d*(x² + y²)
        Solve linear regression for [a, b, c, d]
        Peak location: x₀ = -b/(2d), y₀ = -c/(2d)
        
        Returns (x, y) in mm or None if estimation fails.
        """
        if len(local_sensors) < 4:
            return None
        
        # Build regression matrices
        X = []  # Design matrix
        y = []  # Log measurements
        
        for sensor in local_sensors:
            if sensor.value < 0.001:  # Avoid log(0)
                continue
            
            X.append([1, sensor.x, sensor.y, sensor.x**2 + sensor.y**2])
            y.append(math.log(sensor.value))
        
        if len(X) < 4:
            return None
        
        # Solve least squares: X * params = y
        try:
            params = np.linalg.lstsq(np.array(X), np.array(y), rcond=None)[0]
            a, b, c, d = params
            
            # d must be negative for a maximum
            if d >= 0:
                return None
            
            x0 = -b / (2 * d)
            y0 = -c / (2 * d)
            
            return (x0, y0)
            
        except np.linalg.LinAlgError:
            return None
    
    def apply_iir_filter(self, new_position):
        """
        Apply 1st order IIR filter to smooth position estimates.
        Formula: x_t = x_{t-1} + α * (x_new - x_{t-1})
        
        This reduces jitter while maintaining low latency.
        """
        if new_position is None:
            return self.estimated_position
        
        if self.estimated_position is None:
            self.estimated_position = new_position
        else:
            x_new, y_new = new_position
            x_old, y_old = self.estimated_position
            
            x_t = x_old + self.filter_alpha * (x_new - x_old)
            y_t = y_old + self.filter_alpha * (y_new - y_old)
            
            self.estimated_position = (x_t, y_t)
        
        return self.estimated_position
    
    def get_grid_bounds_mm(self):
        """Get the physical extent of the sensor grid in mm."""
        min_x = min(s.x for s in self.sensors)
        max_x = max(s.x for s in self.sensors)
        min_y = min(s.y for s in self.sensors)
        max_y = max(s.y for s in self.sensors)
        return (min_x, max_x, min_y, max_y)


def interpolate_color(value, colormap=COLORMAP):
    """
    Interpolate RGB color based on normalized value (0-1).
    Uses three-point gradient: low -> mid -> high.
    """
    value = max(0, min(1, value))  # Clamp to [0, 1]
    
    if value < 0.5:
        # Interpolate between low and mid
        t = value * 2
        c1, c2 = colormap['low'], colormap['mid']
    else:
        # Interpolate between mid and high
        t = (value - 0.5) * 2
        c1, c2 = colormap['mid'], colormap['high']
    
    r = int(c1[0] + (c2[0] - c1[0]) * t)
    g = int(c1[1] + (c2[1] - c1[1]) * t)
    b = int(c1[2] + (c2[2] - c1[2]) * t)
    
    return (r, g, b)


class Renderer:
    """Handles all visualization rendering."""
    
    def __init__(self, screen, font_large, font_small):
        self.screen = screen
        self.font_large = font_large
        self.font_small = font_small
    
    def draw_sensor_grid(self, grid):
        """Draw hexagonal sensor grid with values."""
        for sensor in grid.sensors:
            x, y = grid.get_display_position(sensor)
            color = interpolate_color(sensor.value)
            
            # Draw filled circle
            pygame.draw.circle(self.screen, color, (int(x), int(y)), int(grid.radius_px))
            
            # Draw outline
            pygame.draw.circle(self.screen, COLOR_SENSOR_OUTLINE, 
                             (int(x), int(y)), int(grid.radius_px), 2)
            
            # Draw value text
            text = self.font_small.render(f"{sensor.value:.2f}", True, COLOR_TEXT)
            text_rect = text.get_rect(center=(int(x), int(y)))
            self.screen.blit(text, text_rect)
    
    def draw_stylus_panel(self, grid, panel_x=950, panel_y=50, 
                         panel_width=400, panel_height=280):
        """
        Draw the stylus position tracking panel showing:
        1. Hexagonal sensor layout with field intensity
        2. Estimated stylus position as crosshair
        """
        # Title
        title = self.font_large.render("Stylus Position Tracker", True, COLOR_TEXT)
        self.screen.blit(title, (panel_x, panel_y - 30))
        
        # Panel background
        panel_rect = pygame.Rect(panel_x, panel_y, panel_width, panel_height)
        pygame.draw.rect(self.screen, (40, 40, 50), panel_rect)
        pygame.draw.rect(self.screen, COLOR_SENSOR_OUTLINE, panel_rect, 2)
        
        # Calculate scaling to fit grid in panel
        min_x, max_x, min_y, max_y = grid.get_grid_bounds_mm()
        grid_width_mm = max_x - min_x + grid.sensor_radius_mm * 2
        grid_height_mm = max_y - min_y + grid.sensor_radius_mm * 2
        
        # Add padding
        padding = 20
        available_width = panel_width - 2 * padding
        available_height = panel_height - 2 * padding
        
        # Scale to fit
        scale_x = available_width / grid_width_mm
        scale_y = available_height / grid_height_mm
        scale = min(scale_x, scale_y)
        
        # Center the grid in panel
        scaled_width = grid_width_mm * scale
        scaled_height = grid_height_mm * scale
        offset_x = panel_x + (panel_width - scaled_width) / 2
        offset_y = panel_y + (panel_height - scaled_height) / 2
        
        # Draw hexagonal sensors
        sensor_radius_px = grid.sensor_radius_mm * scale
        
        for sensor in grid.sensors:
            # Convert sensor mm position to panel pixel position
            x = offset_x + (sensor.x - min_x + grid.sensor_radius_mm) * scale
            y = offset_y + (sensor.y - min_y + grid.sensor_radius_mm) * scale
            
            if sensor.value > 0.01:
                color = interpolate_color(sensor.value)
                pygame.draw.circle(self.screen, color, (int(x), int(y)), int(sensor_radius_px))
            
            # Sensor outline
            pygame.draw.circle(self.screen, (80, 80, 90), (int(x), int(y)), int(sensor_radius_px), 1)
        
        # Draw estimated stylus position
        if grid.estimated_position:
            self._draw_stylus_marker(grid, offset_x, offset_y, scale, min_x, min_y)
    
    def _draw_stylus_marker(self, grid, offset_x, offset_y, scale, min_x, min_y):
        """Draw crosshair marker for estimated stylus position."""
        x_mm, y_mm = grid.estimated_position
        
        # Convert mm to panel pixel coordinates using proper scaling
        stylus_x = offset_x + (x_mm - min_x + grid.sensor_radius_mm) * scale
        stylus_y = offset_y + (y_mm - min_y + grid.sensor_radius_mm) * scale
        
        crosshair_size = 15
        
        # Draw crosshair lines
        pygame.draw.line(self.screen, COLOR_CROSSHAIR,
                        (stylus_x - crosshair_size, stylus_y),
                        (stylus_x + crosshair_size, stylus_y), 3)
        pygame.draw.line(self.screen, COLOR_CROSSHAIR,
                        (stylus_x, stylus_y - crosshair_size),
                        (stylus_x, stylus_y + crosshair_size), 3)
        
        # Draw center point
        pygame.draw.circle(self.screen, COLOR_STYLUS, 
                         (int(stylus_x), int(stylus_y)), 8)
        pygame.draw.circle(self.screen, COLOR_CROSSHAIR, 
                         (int(stylus_x), int(stylus_y)), 8, 2)
        
        # Position label
        label = self.font_small.render(f"({x_mm:.1f}, {y_mm:.1f}) mm", 
                                       True, COLOR_TEXT)
        self.screen.blit(label, (stylus_x + 15, stylus_y - 10))
    
    def draw_info_panel(self, grid, fps, cursor_pos, local_sensors):
        """Draw information panel at bottom of screen."""
        panel_height = 120
        panel_rect = pygame.Rect(0, SCREEN_HEIGHT - panel_height, 
                                SCREEN_WIDTH, panel_height)
        
        pygame.draw.rect(self.screen, (30, 30, 40), panel_rect)
        pygame.draw.rect(self.screen, COLOR_SENSOR_OUTLINE, panel_rect, 2)
        
        # Prepare info lines
        max_value = max((s.value for s in grid.sensors), default=0)
        
        pos_text = "None"
        if grid.estimated_position:
            pos_text = f"({grid.estimated_position[0]:.2f}, {grid.estimated_position[1]:.2f}) mm"
        
        info_lines = [
            f"Grid: {grid.rows}x{grid.cols} sensors | Max Value: {max_value:.3f} | Active Sensors: {len(local_sensors)}",
            f"Cursor: ({cursor_pos[0]}, {cursor_pos[1]}) px | Estimated Position: {pos_text}",
            f"IIR Alpha: {grid.filter_alpha:.2f} | Field Decay: {grid.field_decay_distance:.0f}px | FPS: {fps:.1f}",
            "[UP/DOWN] Adjust filter  [Q] Quit"
        ]
        
        # Draw text
        y_offset = SCREEN_HEIGHT - panel_height + 15
        for line in info_lines:
            text = self.font_small.render(line, True, COLOR_TEXT)
            self.screen.blit(text, (20, y_offset))
            y_offset += 28
    
    def draw_debug_info(self, local_sensors, x=950, y=360):
        """Draw debug information about active sensors."""
        title = self.font_small.render("Active Sensors:", True, COLOR_TEXT)
        self.screen.blit(title, (x, y))
        
        y_offset = y + 25
        for sensor in local_sensors[:9]:  # Show max 9
            text = (f"S[{sensor.row},{sensor.col}]: {sensor.value:.3f} | "
                   f"({sensor.x:.1f}, {sensor.y:.1f}) mm")
            surface = self.font_small.render(text, True, COLOR_TEXT)
            self.screen.blit(surface, (x, y_offset))
            y_offset += 20


class StylusTracker:
    """Main application controller."""
    
    def __init__(self):
        pygame.init()
        
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Hexagonal Stylus Position Tracker")
        
        self.clock = pygame.time.Clock()
        self.font_large = pygame.font.SysFont('Consolas', 16, bold=True)
        self.font_small = pygame.font.SysFont('Consolas', 10)
        
        self.grid = HexagonalGrid(GRID_ROWS, GRID_COLS, SENSOR_RADIUS_MM,
                                  SENSOR_SPACING_MM, PIXELS_PER_MM)
        
        self.renderer = Renderer(self.screen, self.font_large, self.font_small)
        self.running = True
    
    def handle_events(self):
        """Process user input."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    self.running = False
                
                elif event.key == pygame.K_UP:
                    self.grid.filter_alpha = min(1.0, self.grid.filter_alpha + 0.05)
                
                elif event.key == pygame.K_DOWN:
                    self.grid.filter_alpha = max(0.0, self.grid.filter_alpha - 0.05)
    
    def update(self, cursor_pos):
        """
        Main processing pipeline:
        1. Update sensor readings from magnetic field
        2. Find local sensors around maximum
        3. Estimate stylus position using Gaussian fit
        4. Apply IIR filter for smoothing
        """
        self.grid.update_magnetic_field(*cursor_pos)
        
        local_sensors = self.grid.find_local_sensors(top_n=9)
        
        raw_position = self.grid.estimate_position_gaussian_fit(local_sensors)
        
        self.grid.apply_iir_filter(raw_position)
        
        return local_sensors
    
    def render(self, cursor_pos, local_sensors):
        """Render all visual elements."""
        self.screen.fill(COLOR_BACKGROUND)
        
        # Left side: sensor grid
        title = self.font_large.render("Hexagonal Sensor Grid (Input)", 
                                       True, COLOR_TEXT)
        self.screen.blit(title, (self.grid.offset_x, 10))
        
        self.renderer.draw_sensor_grid(self.grid)
        
        # Right side: stylus position panel
        self.renderer.draw_stylus_panel(self.grid)
        
        # Debug info
        if local_sensors:
            self.renderer.draw_debug_info(local_sensors)
        
        # Bottom: info panel
        fps = self.clock.get_fps()
        self.renderer.draw_info_panel(self.grid, fps, cursor_pos, local_sensors)
        
        pygame.display.flip()
    
    def run(self):
        """Main application loop."""
        while self.running:
            cursor_pos = pygame.mouse.get_pos()
            
            self.handle_events()
            local_sensors = self.update(cursor_pos)
            self.render(cursor_pos, local_sensors)
            
            self.clock.tick(FPS)
        
        pygame.quit()


def main():
    app = StylusTracker()
    app.run()


if __name__ == "__main__":
    main()
