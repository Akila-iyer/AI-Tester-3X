"""Configuration schema and loader for Visual UI Testing Platform."""

from dataclasses import dataclass, field
from typing import Optional
import yaml
import os


@dataclass
class ToleranceConfig:
    position: int = 2
    size: int = 2
    color_delta_e: float = 2.0
    font_size: int = 1
    font_weight: int = 100
    opacity: float = 0.05
    border_radius: int = 1
    line_height: int = 2
    letter_spacing: float = 0.5


@dataclass
class IgnoreConfig:
    dynamic_text: bool = True
    timestamps: bool = True
    advertisements: bool = True
    animations: bool = True
    selectors: list = field(default_factory=list)


@dataclass
class ViewportPreset:
    name: str = "Desktop"
    width: int = 1920
    height: int = 1080
    enabled: bool = True


@dataclass
class ComparisonCategories:
    typography: bool = True
    colors: bool = True
    layout: bool = True
    accessibility: bool = True
    images: bool = True
    components: bool = True
    responsive: bool = True


@dataclass
class ComparisonConfig:
    tolerance: ToleranceConfig = field(default_factory=ToleranceConfig)
    ignore: IgnoreConfig = field(default_factory=IgnoreConfig)
    viewports: list = field(default_factory=lambda: [
        ViewportPreset("Desktop", 1920, 1080, True),
        ViewportPreset("Laptop", 1440, 900, True),
        ViewportPreset("Tablet", 768, 1024, False),
        ViewportPreset("Mobile", 375, 667, False),
    ])
    categories: ComparisonCategories = field(default_factory=ComparisonCategories)


@dataclass
class AIConfig:
    enabled: bool = False
    provider: str = "openai"
    model: str = "gpt-4o-mini"


@dataclass
class UIConfig:
    theme: str = "system"
    language: str = "en"
    items_per_page: int = 25


@dataclass
class HistoryConfig:
    enabled: bool = True
    max_runs: int = 100


@dataclass
class ProjectConfig:
    name: str = "My Project"
    description: str = ""


@dataclass
class AppConfig:
    project: ProjectConfig = field(default_factory=ProjectConfig)
    comparison: ComparisonConfig = field(default_factory=ComparisonConfig)
    ai: AIConfig = field(default_factory=AIConfig)
    ui: UIConfig = field(default_factory=UIConfig)
    history: HistoryConfig = field(default_factory=HistoryConfig)


def load_config(path: Optional[str] = None) -> AppConfig:
    """Load configuration from YAML file, merging with defaults."""
    config = AppConfig()
    if path is None:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(base, "config", "default.yaml")
    if os.path.exists(path):
        with open(path, "r") as f:
            data = yaml.safe_load(f) or {}
        _merge_config(config, data)
    return config


def _merge_config(config: AppConfig, data: dict):
    """Deep-merge a loaded YAML dict into the dataclass config."""
    if "project" in data:
        for k, v in data["project"].items():
            if hasattr(config.project, k):
                setattr(config.project, k, v)
    if "comparison" in data:
        cmp = data["comparison"]
        if "tolerance" in cmp:
            for k, v in cmp["tolerance"].items():
                if hasattr(config.comparison.tolerance, k):
                    setattr(config.comparison.tolerance, k, v)
        if "ignore" in cmp:
            for k, v in cmp["ignore"].items():
                if hasattr(config.comparison.ignore, k):
                    setattr(config.comparison.ignore, k, v)
        if "viewports" in cmp:
            for i, vp in enumerate(cmp["viewports"]):
                if i < len(config.comparison.viewports):
                    for k in ("name", "width", "height", "enabled"):
                        if k in vp:
                            setattr(config.comparison.viewports[i], k, vp[k])
        if "categories" in cmp:
            for k, v in cmp["categories"].items():
                if hasattr(config.comparison.categories, k):
                    setattr(config.comparison.categories, k, v)
    if "ai" in data:
        for k, v in data["ai"].items():
            if hasattr(config.ai, k):
                setattr(config.ai, k, v)
    if "ui" in data:
        for k, v in data["ui"].items():
            if hasattr(config.ui, k):
                setattr(config.ui, k, v)
    if "history" in data:
        for k, v in data["history"].items():
            if hasattr(config.history, k):
                setattr(config.history, k, v)
